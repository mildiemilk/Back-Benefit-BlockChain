import Joi from 'joi';
import Boom from 'boom';
import { LogUserClaim, User, EmployeeCompany } from '../models';

const getClaimListCompany = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const aggregatorOpts = [
      { $match: { company: user.company.detail }},
      {
        $group: {
          _id: { type: '$type', user: '$user', detail: '$detail', status: '$status' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.type',
          user: { $push: '$_id.user' },
          status: { $push: '$_id.status' },
          detail: { $push: '$_id.detail' },
          count: { $sum: '$count' }
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
    const { reason } = request.payload;
    LogUserClaim.findOne({ _id: claimId }).exec((err, claim) => {
      if(err) reply(err);
      claim.status = status;
      if (status === 'reject') {
        claim.reason = reason;
      }
      claim.save().then((claim) => {
        reply(claim);
      });
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

export default function(app) {
  app.route([
    { method: 'GET', path: '/company/get-claim-list', config: getClaimListCompany },
    { method: 'PUT', path: '/company/claim/{status}/{claimId}', config: companyClaim },
    { method: 'GET', path: '/insurer/claim-all-company', config: claimAllCompany },
  ]);
}
