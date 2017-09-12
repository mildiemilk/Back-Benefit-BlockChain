import Joi from 'joi';
import Boom from 'boom';
import { EmployeeGroup, BenefitPlan, LogUserClaim, EmployeePlan } from '../models';

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

const getClaimStatus = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const today = new Date();
    const afterSevenDay = new Date();
    afterSevenDay.setDate(today.getDate() - 7);
    LogUserClaim.find({ user: user._id, $and:[{createdAt:{$lte:today}},{createdAt:{$gte:afterSevenDay}}] }, '-createdAt -updatedAt -deleted').then((logClaim) => {
      reply(logClaim);
    });
  },
};

const getClaimHistory = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const afterSevenDay = new Date();
    afterSevenDay.setDate(afterSevenDay.getDate() - 7);
    LogUserClaim.find({ user: user._id, createdAt:{$lt:afterSevenDay }}, '-createdAt -updatedAt -deleted').then((logClaim) => {
      reply(logClaim);
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
    { method: 'GET', path: '/employee/get-claim-status', config: getClaimStatus},
    { method: 'GET', path: '/employee/get-claim-history', config: getClaimHistory},
    { method: 'PUT', path: '/employee/select-benefit', config: selectPlan },
    { method: 'GET', path: '/employee/get-profile', config: getProfile },
    { method: 'PUT', path: '/employee/set-profile', config: setProfile },
  ]);
}
