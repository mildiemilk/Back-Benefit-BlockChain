import Joi from 'joi';
import Boom from 'boom';
import { User, BenefitPlan, MasterPlan } from '../models';
import Config from '../../config/config';
import moment from 'moment';

const benefitPlan = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      plan: Joi.array().items(Joi.object().required()),
    },
  },

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { plan } = request.payload;
    const insurerUser = user._id;
    if(user.role == 'HR'){
      User.findOne({_id:user._id})
        .then((user)=>{
          const company = user.company
          const benefitplan = new BenefitPlan({ plan, company })
          benefitplan.save().then((err) => {
            if (!err)
              reply(benefitplan);
            else reply(err)
          });
        });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

const editBenefitPlan = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      health: Joi.object(),
      isHealth: Joi.boolean().required(),
      expense: Joi.object(),
      isExpense: Joi.boolean().required(),
    },
  },

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { health, isHealth, expense, isExpense } = request.payload;
    const insurerUser = user._id;
    if(user.role == 'HR'){
      BenefitPlan.findOne({company:user.company})
        .then((benefitplan)=>{
          benefitplan.health = health;
          benefitplan.isHealth = isHealth;
          benefitplan.expense = expense;
          benefitplan.isExpense = isExpense;
          benefitplan.save().then((err) => {
            if (!err)
              reply(benefitplan);
            else reply(err)
          });
        });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

const settingBenefit = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      benefitPlans: Joi.array().items(Joi.object().required()),
    },
  },

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { benefitPlans } = request.payload;
    if(user.role == 'HR'){
      User.findOne({ _id: user._id }).populate('company').exec((err, u) => {
        u.company.benefitPlans = benefitPlans;
        u.company.save();
        reply('success')
      });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/benefit-plan', config: benefitPlan },
    { method: 'POST', path: '/edit-benefit-plan', config: editBenefitPlan },
    { method: 'POST', path: '/setting-benefit', config: settingBenefit },
  ]);
}
