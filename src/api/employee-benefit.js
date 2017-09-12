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

export default function(app) {
  app.route([
    { method: 'GET', path: '/employee/get-all-benefit', config: getAllBenefit },
    { method: 'GET', path: '/employee/get-claim-status', config: getClaimStatus},
    { method: 'GET', path: '/employee/get-claim-history', config: getClaimHistory},
    { method: 'PUT', path: '/employee/select-benefit', config: selectPlan },
  ]);
}
