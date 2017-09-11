import Joi from 'joi';
import Boom from 'boom';
import { User, EmployeeGroup, BenefitPlan } from '../models';

const getAllBenefit = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    EmployeeGroup
    .findOne({ company: user.company.detail, groupName: user.detail.benefit_group })
    .populate('benefitPlan')
    .exec((err, group) => {
      reply(group.benefitPlan);
    });
  },
};

export default function(app) {
  app.route([
    { method: 'GET', path: '/employee/get-all-benefit', config: getAllBenefit },
  ]);
}
