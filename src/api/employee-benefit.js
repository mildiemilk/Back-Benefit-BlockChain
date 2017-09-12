import Joi from 'joi';
import Boom from 'boom';
import { EmployeeGroup, BenefitPlan, EmployeePlan, LogUserClaim  } from '../models';

const getAllBenefit = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    EmployeeGroup
    .findOne({ company: user.company.detail, groupName: user.detail.benefit_group })
    .exec((err, group) => {
      BenefitPlan.find({ _id: { $in: [group.benefitPlan] }})
      .populate('benefitPlan.plan.planId benefitPlan.detailPlan')
      .exec((err, result) => {
        reply(result);
      });
    });
    
  },
};

const selectPlan = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      planId: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { planId } = request.payload;
    const { user } = request.auth.credentials;
    EmployeePlan
    .findOne({ company: user.company.detail, user: user._id })
    .exec((err, result) => {
      if (err) {
        reply(err);
      } else {
        result.benefitPlan = planId;
        result.approve = true;
        result.save(function(err) {
          if (err) throw err;
          reply('Updated select plan and change status.');
        });
      }
    }); 
  },
};

const claimHealth = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      type: Joi.string().valid('health','general','insurance').required(),
    },
  },
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data'
  },
  handler: (request, reply) => {
    let { detail, files } = request.payload;
    const { user } = request.auth.credentials;
    const { type } = request.params;
    let claimNumber = null;

    const { storage } = request.server.app.services;
    const isPublic = true;
    storage.upload({ file: files }, { isPublic }, (err, media) => {
      if (!err) {
        media.userId = user.id;
        media.save();
        storage.getUrl(media.path, (url) => {
          detail = JSON.parse(detail);
          detail.mediaImg = media._id;
          detail.urlImg = url;
          if (err) throw err;
          if (type !== 'insurance') {
            LogUserClaim
            .find({ company: user.company.detail, type: 'insurance' })
            .exec((err, result) => {
              claimNumber = result.length + 1;
              const createClaim = new LogUserClaim({
                user: user._id,
                company: user.company.detail,
                detail,
                status: 'pending',
                claimNumber,
                type,
              });
              createClaim.save();
            });
          } else {
            LogUserClaim
            .find({ company: user.company.detail, type: 'insurance' })
            .exec((err, result) => {
              claimNumber = result.length + 1;
              const createClaim = new LogUserClaim({
                user: user._id,
                company: user.company.detail,
                detail,
                status: 'pending',
                claimNumber,
                policyNumber: null,
                type,
              });
              createClaim.save();
            });
          }
        });
      }
    });
  },
};

const getProfile = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    reply({ email: user.email, detail: user.detail });
  },
};

const setProfile = {
  tags: ['api'],
  auth: 'jwt',
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data'
  },
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    let { detail, file } = request.payload;
    detail = JSON.parse(detail);
    if (file === undefined) {
      user.detail = detail;
      user.save().then((user) => {
        reply({ email: user.email, detail: user.detail });
      });
    } else {
      const { storage } = request.server.app.services;
      storage.upload({ file }, { isPublic: true }, (err, media) => {
        if (!err) {
          media.userId = user.id;
          media.save();
          storage.getUrl(media.path, (url) => {
            detail.mediaProfile = media._id;
            detail.profilePic = url;
            user.detail = detail;
            user.save().then((user) => {
              reply({ email: user.email, detail: user.detail });
            });
          });
        }
      });
    }
  },
};

export default function(app) {
  app.route([
    { method: 'GET', path: '/employee/get-all-benefit', config: getAllBenefit },
    { method: 'PUT', path: '/employee/select-benefit', config: selectPlan },
    { method: 'GET', path: '/employee/get-profile', config: getProfile },
    { method: 'PUT', path: '/employee/set-profile', config: setProfile },
    { method: 'POST', path: '/employee/claim/{type}', config:claimHealth },
  ]);
}
