import Joi from 'joi';
import Boom from 'boom';
import { EmployeeGroup, BenefitPlan } from '../models';

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

export default function(app) {
  app.route([
    { method: 'GET', path: '/employee/get-all-benefit', config: getAllBenefit },
  ]);
}
