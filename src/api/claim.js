import Joi from 'joi';
import Boom from 'boom';
import mongoose from 'mongoose';
import moment from 'moment';
import os  from 'os';
import Fabric_Client from 'fabric-client';
import path          from 'path';
import { LogUserClaim, User, EmployeeCompany, Role, BenefitPlan } from '../models';

const getClaimListCompany = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const aggregatorOpts = [
      { $match: { company: user.company.detail }},
      {
        $group: {
          _id: { type: '$type', user: '$user', detail: '$detail', status: '$status', claimNumber: '$claimNumber', claimId: '$_id', date: '$updatedAt', reason: '$reason' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.type',
          user: { $push: '$_id.user' },
          status: { $push: '$_id.status' },
          detail: { $push: '$_id.detail' },
          reason: { $push: '$_id.reason' },
          amountOfClaim: { $sum: '$count' },
          claimNumber: { $push: '$_id.claimNumber' },
          claimId: { $push: '$_id.claimId' },
          date: { $push: '$_id.date' },
        },
      },
      {
        $sort: { _id: 1 }
      }
    ];
    LogUserClaim.aggregate(aggregatorOpts)
    .exec((err, claims) => {
      if(err) reply(err);
      User.populate(claims, {path: 'user', select: 'detail.name detail.lastname'}, (err, result) => {
        if(err) reply(err);
        const haveHealth = result.findIndex(element => element._id === 'health') !== -1;
        const haveGeneral = result.findIndex(element => element._id === 'general') !== -1;
        const haveInsurance = result.findIndex(element => element._id === 'insurance') !== -1;
        if(!haveHealth) {
          result.push({ _id: 'health', amountOfClaim: 0 });
        }
        if(!haveGeneral) {
          result.push({ _id: 'general', amountOfClaim: 0 });
        }
        if(!haveInsurance) {
          result.push({ _id: 'insurance', amountOfClaim: 0 });
        }
        LogUserClaim.count({ company: user.company.detail }, (err, total) => {
          const claims = result.map(element => {
            if(element.amountOfClaim > 0) {
              const claims = element.claimId.map((claim, index) => {
                element.detail[index].date = element.date[index];
                return Object.assign({}, {
                  userId: element.user[index]._id,
                  name: element.user[index].detail.name + ' ' + element.user[index].detail.lastname,
                  detail: element.detail[index],
                  status: element.status[index],
                  reason: element.reason[index],
                  claimNumber: element.claimNumber[index],
                  claimId: claim,
                });
              });
              return { type: element._id, claims, amountOfClaim: element.amountOfClaim };
            }
            else return { type: element._id, amountOfClaim: element.amountOfClaim };
          });
          const newClaim = [];
          claims.map((claim) => {
            if(claim.type === 'general') {
              newClaim[0] = claim;
            } else if(claim.type === 'health') {
              newClaim[1] = claim;
            } else {
              newClaim[2] = claim;
            }
          });
          reply({ claims: newClaim, total });
        });
      });
    });
  },
};

const companyClaim = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      reason: Joi.string().allow(null),
    },
    params: {
      status: Joi.string().valid('approve','reject').required(),
      claimId: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { claimId, status } = request.params;
    const { user } = request.auth.credentials;
    const { reason } = request.payload;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        LogUserClaim.findOne({ _id: claimId, company: user.company.detail }).exec((err, claim) => {
          if(err) reply(err);
          claim.status = status;
          if (status === 'reject') {
            claim.reason = reason;
          }
          claim.save().then((claim) => {
            reply(claim);
          });
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const claimAllCompany = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const today = new Date();
    const aggregatorOpts = [
      {$match: { insurerCompany: user.company.detail,
        effectiveDate: { $lte: today},
        expiredDate: { $gte: today},
      }},
      {$project:{"_id":1, "company": 1, "createdAt": 1}}, 
      {$sort:{"createdAt": -1}},
      {
        $group: {
          _id: "$company", 
          lastPlan: { $first: "$_id" }
        },
      },
    ];
    BenefitPlan.aggregate(aggregatorOpts)
    .exec((err, result) => {
      const companyList = result.map(result => result._id);
      const aggregatorOpts = [
        { $match: { company: { $in: companyList }, status: 'pending' , type: 'insurance'}},
        {
          $group: {
            _id: '$company',
            amount: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 }
        }
      ];
      LogUserClaim.aggregate(aggregatorOpts)
      .exec((err, claims) => {
        if(claims.length > 0) {
          EmployeeCompany.populate(claims, {path: '_id', select: 'companyName startInsurance expiredInsurance logo.link numberOfEmployees'}, (err, companys) => {
            const test = companys.map(company => {
              const { startInsurance, expiredInsurance } = company._id;
              const today = Date.now();
              let start, end;
              if (moment(today).isBetween(startInsurance, expiredInsurance, null, "[]")) {
                start = new Date(startInsurance);
                start.setFullYear(start.getFullYear() + 1);
                end = expiredInsurance;
              } else {
                start = startInsurance;
                end = new Date(expiredInsurance);
                end.setFullYear(end.getFullYear() - 1);
              }
              return Object.assign({}, {
                companyId: company._id._id,
                companyName: company._id.companyName,
                logo: company._id.logo.link,
                numberOfEmployees: company._id.numberOfEmployees,
                expiredOldInsurance: end,
                startNewInsurance: start,
                amount: company.amount,
              });
            });
            reply(test);
          });
        } else {
          EmployeeCompany.populate(result, {path: '_id', select: 'companyName startInsurance expiredInsurance logo.link numberOfEmployees'}, (err, companys) => {
            const test = companys.map(company => {
              const { startInsurance, expiredInsurance } = company._id;
              const today = Date.now();
              let start, end;
              if (moment(today).isBetween(startInsurance, expiredInsurance, null, "[]")) {
                start = new Date(startInsurance);
                start.setFullYear(start.getFullYear() + 1);
                end = expiredInsurance;
              } else {
                start = startInsurance;
                end = new Date(expiredInsurance);
                end.setFullYear(end.getFullYear() - 1);
              }
              return Object.assign({}, {
                companyId: company._id._id,
                companyName: company._id.companyName,
                logo: company._id.logo.link,
                numberOfEmployees: company._id.numberOfEmployees,
                expiredOldInsurance: end,
                startNewInsurance: start,
                amount: 0,
              });
            });
            reply(test);
          });
        }
      });
    });
  },
};

const getClaim = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      companyId: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { companyId } = request.params;
    const aggregatorOpts = [
      { $match: { company: mongoose.Types.ObjectId(companyId) , type: 'insurance'}},
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }
      },
    ];
    LogUserClaim.find({ company: companyId, type: 'insurance' }, 'detail status claimNumber _id updatedAt reason')
    .exec((err, claims) => {
      EmployeeCompany.findOne({ _id: companyId }, 'logo.link companyName startInsurance expiredInsurance numberOfEmployees', (err, com) => {
        const { startInsurance, expiredInsurance } = com;
        const today = Date.now();
        let start, end;
        if (moment(today).isBetween(startInsurance, expiredInsurance, null, "[]")) {
          start = new Date(startInsurance);
          start.setFullYear(start.getFullYear() + 1);
          end = expiredInsurance;
        } else {
          start = startInsurance;
          end = new Date(expiredInsurance);
          end.setFullYear(end.getFullYear() - 1);
        }
        const company = {
          numberOfEmployees: com.numberOfEmployees,
          startInsurance: start,
          expiredInsurance: end,
          logo: com.logo.link,
          companyName: com.companyName,
        };
        LogUserClaim.aggregate(aggregatorOpts)
        .exec((err, result) => {
          const approve = result.findIndex(element => element._id === 'approve');
          const reject = result.findIndex(element => element._id === 'reject');
          const pending = result.findIndex(element => element._id === 'pending');
          const count = {
            approve: approve !== -1 ? result[approve].count : 0,
            reject: reject !== -1 ? result[reject].count : 0,
            pending: pending !== -1 ? result[pending].count : 0,
          };
          count.total = count.approve + count.reject + count.pending;
          claims = claims.map((claim) => {
            claim.detail.date = claim.updatedAt;
            return Object.assign({}, {
              detail: claim.detail,
              status: claim.status,
              reason: claim.reason,
              claimNumber: claim.claimNumber,
              _id: claim._id,
            });
          });
          reply({
            claims,
            company,
            count,
          });
        });
      });
    });
  },
};

const insurerClaim = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      reason: Joi.string().allow(null),
    },
    params: {
      status: Joi.string().valid('approve','reject').required(),
      claimId: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { claimId, status } = request.params;
    const { user } = request.auth.credentials;
    const { reason } = request.payload;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'Insurer'){
        LogUserClaim.findOne({ _id: claimId, type: 'insurance' }).exec((err, claim) => {
          if(err) reply(err);
          claim.status = status;
          if (status === 'reject') {
            claim.reason = reason;
            claim.save().then((claim) => {
              reply(claim);
            });
          } else {
            console.log("submit recording of a claim: " + claim);
            
            var Key = claim.logUserClaimId;
            var Name = claim.detail.name;
            var Hospital = claim.detail.hospital;
            var ICD10 = claim.detail.ICD10;
            var DateClaim = claim.detail.date;
            var Price = claim.detail.amount;
            var Status = claim.status;
            var fabric_client = new Fabric_Client();
  
            // setup the fabric network
            var channel = fabric_client.newChannel('mychannel');
            var peer = fabric_client.newPeer('grpc://localhost:7051');
            channel.addPeer(peer);
            var order = fabric_client.newOrderer('grpc://localhost:7050')
            channel.addOrderer(order);
  
            var member_user = null;
            var store_path = path.join(os.homedir(), '.hfc-key-store');
            console.log('Store path:'+store_path);
            var tx_id = null;
  
            // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
            Fabric_Client.newDefaultKeyValueStore({ path: store_path
            }).then((state_store) => {
              // assign the store to the fabric client
              fabric_client.setStateStore(state_store);
              var crypto_suite = Fabric_Client.newCryptoSuite();
              // use the same location for the state store (where the users' certificate are kept)
              // and the crypto store (where the users' keys are kept)
              var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
              crypto_suite.setCryptoKeyStore(crypto_store);
              fabric_client.setCryptoSuite(crypto_suite);
  
              // get the enrolled user from persistence, this user will sign all requests
              return fabric_client.getUserContext('user1', true);
            }).then((user_from_store) => {
              if (user_from_store && user_from_store.isEnrolled()) {
                  console.log('Successfully loaded user1 from persistence');
                  member_user = user_from_store;
              } else {
                  throw new Error('Failed to get user1.... run registerUser.js');
              }
  
              // get a transaction id object based on the current user assigned to fabric client
              tx_id = fabric_client.newTransactionID();
              console.log("Assigning transaction_id: ", tx_id._transaction_id);
  
              // recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'], 
              // send proposal to endorser
              const request = {
                //targets : --- letting this default to the peers assigned to the channel
                chaincodeId: 'tuna-app',
                fcn: 'recordTuna',
                args: [Key, Name, Hospital, ICD10, DateClaim, Price, Status],
                chainId: 'mychannel',
                txId: tx_id
              };
  
              // send the transaction proposal to the peers
              return channel.sendTransactionProposal(request);
            }).then((results) => {
              var proposalResponses = results[0];
              var proposal = results[1];
              let isProposalGood = false;
              console.log('result====>'+results);
              if (proposalResponses && proposalResponses[0].response &&
                proposalResponses[0].response.status === 200) {
                  isProposalGood = true;
                  console.log('Transaction proposal was good');
                } else {
                  console.error('Transaction proposal was bad');
                }
              if (isProposalGood) {
                console.log(util.format(
                  'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
                  proposalResponses[0].response.status, proposalResponses[0].response.message));
  
                // build up the request for the orderer to have the transaction committed
                var request = {
                  proposalResponses: proposalResponses,
                  proposal: proposal
                };
  
                // set the transaction listener and set a timeout of 30 sec
                // if the transaction did not get committed within the timeout period,
                // report a TIMEOUT status
                var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
                var promises = [];
  
                var sendPromise = channel.sendTransaction(request);
                promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
  
                // get an eventhub once the fabric client has a user assigned. The user
                // is required bacause the event registration must be signed
                let event_hub = fabric_client.newEventHub();
                event_hub.setPeerAddr('grpc://localhost:7053');
  
                // using resolve the promise so that result status may be processed
                // under the then clause rather than having the catch clause process
                // the status
                let txPromise = new Promise((resolve, reject) => {
                  let handle = setTimeout(() => {
                    event_hub.disconnect();
                    resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
                  }, 3000);
                  event_hub.connect();
                  event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
                    // this is the callback for transaction event status
                    // first some clean up of event listener
                    clearTimeout(handle);
                    event_hub.unregisterTxEvent(transaction_id_string);
                    event_hub.disconnect();
  
                    // now let the application know what happened
                    var return_status = {event_status : code, tx_id : transaction_id_string};
                    if (code !== 'VALID') {
                      console.error('The transaction was invalid, code = ' + code);
                      res.send("Error: holder duplicate");
                        resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
                      } else {
                        console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
                        resolve(return_status);
                    }
                  }, (err) => {
                    //this is the callback if something goes wrong with the event registration or processing
                    reject(new Error('There was a problem with the eventhub ::'+err));
                  });
                });
                promises.push(txPromise);
  
                return Promise.all(promises);
              } else {
              console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
              res.send("Error: holder duplicate");
                throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
              }
            }).then((results) => {
              console.log('Send transaction promise and event listener promise have completed');
              // check the results in the order the promises were added to the promise all list
              if (results && results[0] && results[0].status === 'SUCCESS') {
                console.log('Successfully sent transaction to the orderer.');
                claim.save().then((claim) => {
                  reply(claim);
                });
                // res.send(tx_id.getTransactionID());
              } else {
                console.error('Failed to order the transaction. Error code: ' + response.status);
              }
  
              if(results && results[1] && results[1].event_status === 'VALID') {
                console.log('Successfully committed the change to the ledger by the peer');
                claim.save().then((claim) => {
                  reply(claim);
                });
                // res.send(tx_id.getTransactionID());
              } else {
                console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
              }
            }).catch((err) => {
              console.error('Failed to invoke successfully-->add :: ' + err);
              claim.reason = "Claim duplicate";
              claim.save().then((claim) => {
                reply(claim);
              });
            });
          }
        });
      }else{
        reply(Boom.badData('This page for Insurer only'));
      }
    });
  },
};

const userClaim = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      userId: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { userId } = request.params;
    LogUserClaim.find({ user: userId })
    .sort({ createdAt: -1 })
    .exec((err, claims) => {
      if(err) reply(err);
      reply(claims);
    });
  },
};

const queryClaim = {
  tags: ['api'],
  handler: (request, reply) => {
    console.log("getting all tuna from database: ");
    var fabric_client = new Fabric_Client();

    // setup the fabric network
    var channel = fabric_client.newChannel('mychannel');
    var peer = fabric_client.newPeer('grpc://localhost:7051');
    channel.addPeer(peer);

    //
    var member_user = null;
    var store_path = path.join(os.homedir(), '.hfc-key-store');
    console.log('Store path:'+store_path);
    var tx_id = null;

    // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      var crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      // get the enrolled user from persistence, this user will sign all requests
      return fabric_client.getUserContext('user1', true);
    }).then((user_from_store) => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded user1 from persistence');
        member_user = user_from_store;
      } else {
        throw new Error('Failed to get user1.... run registerUser.js');
      }

      // queryAllTuna - requires no arguments , ex: args: [''],
      const request = {
        chaincodeId: 'tuna-app',
        txId: tx_id,
        fcn: 'queryAllTuna',
        args: ['']
      };

      // send the query proposal to the peer
      return channel.queryByChaincode(request);
    }).then((query_responses) => {
      console.log("Query has completed, checking results");
      // query_responses could have more than one  results if there multiple peers were used as targets
      if (query_responses && query_responses.length == 1) {
        if (query_responses[0] instanceof Error) {
          console.error("error from query = ", query_responses[0]);
        } else {
          console.log("Response is ", query_responses[0].toString());
          reply(JSON.parse(query_responses[0].toString()));
        }
      } else {
        console.log("No payloads were returned from query");
      }
    }).catch((err) => {
      console.error('Failed to query successfully :: ' + err);
    });
  },
};

export default function(app) {
  app.route([
    { method: 'GET', path: '/company/get-claim-list', config: getClaimListCompany },
    { method: 'PUT', path: '/company/claim/{status}/{claimId}', config: companyClaim },
    { method: 'GET', path: '/company/claim-user/{userId}', config: userClaim },
    { method: 'GET', path: '/insurer/claim-all-company', config: claimAllCompany },
    { method: 'GET', path: '/insurer/get-claim/{companyId}', config: getClaim },
    { method: 'PUT', path: '/insurer/claim/{status}/{claimId}', config: insurerClaim },
    { method: 'GET', path: '/query-claim', config: queryClaim },
  ]);
}
