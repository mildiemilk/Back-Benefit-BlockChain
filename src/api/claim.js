import Joi from 'joi';
import Boom from 'boom';
import mongoose from 'mongoose';
import { LogUserClaim, User, EmployeeCompany, Role } from '../models';

const getClaimListCompany = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const aggregatorOpts = [
      { $match: { company: user.company.detail }},
      {
        $group: {
          _id: { type: '$type', user: '$user', detail: '$detail', status: '$status', claimNumber: '$claimNumber' },
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
          claimNumber: { $push: '$_id.claimNumber' }
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
        reply(result);
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
    EmployeeCompany.find({ deleted: false }, 'insurers')
    .exec((err, companys) => {
      companys = companys.filter(company => {
        const length = company.insurers.length-1;
        console.log(company);
        if( length > 0){
          const lastInsurer = company.insurers[length].insurerCompany.toString();
          return lastInsurer === user.company.detail.toString();
        }
        return false;
      });
      companys = companys.map(company => company._id);
      const aggregatorOpts = [
        { $match: { company: { $in: companys }, status: 'pending'}},
        {
          $group: {
            _id: '$company',
            amountOfClaim: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 }
        }
      ];
      LogUserClaim.aggregate(aggregatorOpts)
      .exec((err, claims) => {
        EmployeeCompany.populate(claims, { path: '_id', select: 'numberOfEmployee expiredInsurance logo.link companyName' }, (err, results) => {
          const allClaims = results.map( result => {
            const startNewInsurance = result._id.expiredInsurance;
            startNewInsurance.setDate(startNewInsurance.getDate() - 1);
            return Object.assign({}, {
              _id: result._id._id,
              companyName: result._id.companyName,
              expiredOldInsurance: result._id.expiredInsurance,
              startNewInsurance,
              logo: result._id.logo.link,
              amountOfClaim: result.amountOfClaim,
            });
          });
          reply(allClaims);
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
          _id: { user: '$user', detail: '$detail', status: '$status', claimNumber: '$claimNumber' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.status',
          user: { $push: '$_id.user' },
          detail: { $push: '$_id.detail' },
          amountOfClaim: { $sum: '$count' },
          claimNumber: { $push: '$_id.claimNumber' },
        }, 
      },
      {
        $sort: { _id: 1 }
      }
    ];

    LogUserClaim.aggregate(aggregatorOpts)
    .exec((err, claims) => {
      if(err) reply(err);
      console.log(companyId, claims);
      User.populate(claims, {path: 'user', select: 'detail.name detail.lastname'}, (err, result) => {
        if(err) reply(err);
        reply(result);
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
