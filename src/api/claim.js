import Joi from 'joi';
import Boom from 'boom';
import mongoose from 'mongoose';
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
          _id: { type: '$type', user: '$user', detail: '$detail', status: '$status', claimNumber: '$claimNumber', claimId: '$_id' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.type',
          user: { $push: '$_id.user' },
          status: { $push: '$_id.status' },
          detail: { $push: '$_id.detail' },
          amountOfClaim: { $sum: '$count' },
          claimNumber: { $push: '$_id.claimNumber' },
          claimId: { $push: '$_id.claimId' },
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
              const claims = element.claimId.map((claim, index) => Object.assign({}, {
                userId: element.user[index]._id,
                name: element.user[0].detail.name + ' ' + element.user[0].detail.lastname,
                detail: element.detail[index],
                status: element.status[index],
                claimNumber: element.claimNumber[index],
                claimId: claim,
              }));
              return { type: element._id, claims, amountOfClaim: element.amountOfClaim };
            }
            else return { type: element._id, amountOfClaim: element.amountOfClaim };
           
          });
          reply({ claims, total });
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
      reason: Joi.string(),
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
      BenefitPlan.populate(result, {path: 'lastPlan', select: 'effectiveDate expiredDate'}, (err, result) => {
        const companyList = result.map(result => result._id);
        const aggregatorOpts = [
          { $match: { company: { $in: companyList }, status: 'pending'}},
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
            EmployeeCompany.populate(claims, {path: '_id', select: 'companyName logo.link numberOfEmployees'}, (err, companys) => {
              const test = companys.map(company => {
                const index = result.findIndex((element) => element._id.toString() === company._id._id.toString());
                const { effectiveDate, expiredDate } = result[index].lastPlan;
                return Object.assign({}, {
                  companyId: company._id._id,
                  companyName: company._id.companyName,
                  logo: company._id.logo.link,
                  numberOfEmployees: company._id.numberOfEmployees,
                  expiredOldInsurance: expiredDate,
                  startNewInsurance: effectiveDate,
                  amount: company.amount,
                });
              });
              reply(test);
            });
          } else reply(claims);
          // } else {
          //   EmployeeCompany.populate(result, {path: '_id', select: 'companyName logo.link numberOfEmployees'}, (err, companys) => {
          //     const test = companys.map(company => {
          //       const { effectiveDate, expiredDate } = company.lastPlan;
          //       return Object.assign({}, {
          //         companyId: company._id._id,
          //         companyName: company._id.companyName,
          //         logo: company._id.logo.link,
          //         numberOfEmployees: company._id.numberOfEmployees,
          //         expiredOldInsurance: expiredDate,
          //         startNewInsurance: effectiveDate,
          //         amount: 0,
          //       });
          //     });
          //     reply(test);
          //   });
          // }
        });
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
      { $match: { company: mongoose.Types.ObjectId(companyId) }},
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
    LogUserClaim.find({ company: companyId }, 'detail status claimNumber _id')
    .exec((err, claims) => {
      EmployeeCompany.findOne({ _id: companyId }, 'logo.link companyName effectiveDate expriedDate numberOfEmployees', (err, com) => {
        const company = {
          numberOfEmployees: com.numberOfEmployees,
          startInsurance: com.effectiveDate,
          expiredInsurance: com.expiredDate,
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
      reason: Joi.string(),
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
          }
          claim.save().then((claim) => {
            reply(claim);
          });
        });
      }else{
        reply(Boom.badData('This page for Insurer only'));
      }
    });
  },
};

export default function(app) {
  app.route([
    { method: 'GET', path: '/company/get-claim-list', config: getClaimListCompany },
    { method: 'PUT', path: '/company/claim/{status}/{claimId}', config: companyClaim },
    { method: 'GET', path: '/insurer/claim-all-company', config: claimAllCompany },
    { method: 'GET', path: '/insurer/get-claim/{companyId}', config: getClaim },
    { method: 'PUT', path: '/insurer/claim/{status}/{claimId}', config: insurerClaim },
  ]);
}
