import Joi from 'joi';
import Boom from 'boom';
import { BiddingRelation, Role, Media, InsuranceCompany } from '../models';

const getAllInsurer = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        InsuranceCompany.find({}).then((insurers) => {
          reply(insurers);
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const chooseInsurer = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      insurers: Joi.array(),
    },
  },
  handler: (request, reply) => {
    const { insurers } = request.payload;
    const { user } = request.auth.credentials;
    const company = user.company.detail;
    const insurerBidding = insurers.map((insurer) => Object.assign({}, { insurerCompany: insurer, status: 'waiting' }));
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        BiddingRelation.findOne({ company })
          .then((biddingrelation) => {
            if(biddingrelation){
              biddingrelation.insurers = insurerBidding;
              biddingrelation.save().then((result) => {
                reply(result);
              });
            }else{
              const biddingrelation = new BiddingRelation({ company, insurers: insurerBidding });
              biddingrelation.save().then((result) => {
                reply(result);
              });
            }
          });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const setTimeout = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      timeout: Joi.date().required(),
    },
  },
  handler: (request, reply) => {
    const { timeout } = request.payload;
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        BiddingRelation.findOneAndUpdate({ hr: user._id },{ timeout }, (err) => {
          if (err) console.log(err);
          reply(timeout);
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const getSelectInsurer = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        BiddingRelation.findOne({ company: user.company.detail })
        .then((biddingrelation) => {
          reply(biddingrelation.insurers);
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const getTimeout = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        BiddingRelation.findOne({ hr: user._id })
        .then((biddingrelation) => {
          reply(biddingrelation.timeout);
        });
      }else{    
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const getCompanyList = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role === 'Insurer'){
        BiddingRelation.find({ 'insurers.insurerCompany': user._id, confirmed: true }, null, {sort: {createdAt: -1}}).populate('company.detail').exec((err, results) => {
          const data = results.map((result) => {
            const myDate = result.company.detail.expiredInsurance;
            myDate.setDate(myDate.getDate() + 1);

            return new Promise((resolve) => {
              Media.findOne({ _id: result.company.detail.logo }).then((logo) => {
                let object;
                const { storage } = request.server.app.services;

                storage.getUrl(logo.path, (url) => {
                  object = Object.assign({},{
                    companyId: result.company.detail._id,
                    company: result.company.detail.companyName,
                    logo: url,
                    numberOfEmployees: result.company.detail.numberOfEmployees,
                    expiredOldInsurance: result.company.detail.expiredInsurance,
                    startNewInsurance: myDate,
                    status: result.insurers.find((insurer) => insurer.insurerCompany.toString() === user._id.toString()).status,
                    candidateInsurer: result.insurers.length,
                    minPrice: result.minPrice,
                    timeout: result.timeout,
                  });
                  resolve(object);
                });
              });
            });
          });
          Promise.all(data).then((result) => reply(result));
        });
      } else reply(Boom.badData('This page for Insurer only'));
    });
  },
};


export default function(app) {
  app.route([
    { method: 'GET', path: '/company/get-all-insurer', config: getAllInsurer },
    { method: 'PUT', path: '/company/choose-insurer', config: chooseInsurer },
    { method: 'PUT', path: '/company/set-timeout', config: setTimeout },
    { method: 'GET', path: '/company/get-timeout', config: getTimeout },
    { method: 'GET', path: '/company/get-select-insurer', config: getSelectInsurer },
    { method: 'GET', path: '/insurer/company-list', config: getCompanyList },
  ]);
}
