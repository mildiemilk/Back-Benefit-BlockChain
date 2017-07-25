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
      BenefitPlan.findOne({ company: user.company }).then((benefitplan) => {
        if(benefitplan){
          benefitplan.plan = plan;
          benefitplan.save().then((err) => {
            if (!err)
              reply(benefitplan);
            else reply(err)
          });
        } else {
          User.findOne({_id:user._id}).then((user)=>{
            const company = user.company
            const benefitplan = new BenefitPlan({ plan, company })
            benefitplan.save().then((err) => {
              if (!err)
                reply(benefitplan);
              else reply(err)
            });
          });
        }
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
      isExpense: Joi.boolean().required(),
      isHealth: Joi.boolean().required(),
      HealthList: Joi.array(),
      ExpenseList: Joi.array(),
      selectedOptionHealth1: Joi.string().required(),
      selectedOptionHealth2: Joi.string().required(),
      selectedOptionHealth3: Joi.string().required(),
      selectedOptionExpense1: Joi.string().required(),
      selectedOptionExpense2: Joi.string().required(),
      selectedOptionExpense3: Joi.string().required(),
    },
  },

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { isExpense, isHealth, HealthList, ExpenseList, selectedOptionHealth1,
    selectedOptionHealth2, selectedOptionHealth3, selectedOptionExpense1,
    selectedOptionExpense2, selectedOptionExpense3 } = request.payload;
    const insurerUser = user._id;
    const health = { HealthList, selectedOptionHealth1, selectedOptionHealth2, selectedOptionHealth3}
    const expense = { ExpenseList, selectedOptionExpense1, selectedOptionExpense2, selectedOptionExpense3}
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

const settingBenefitPlan = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      benefitPlans: Joi.array().items(Joi.object()),
    },
  },

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { benefitPlans } = request.payload;
    if(user.role == 'HR'){
      User.findOne({ _id: user._id }).populate('company').exec((err, u) => {
        u.company.benefitPlans = benefitPlans;
        u.company.save();
        reply(u.company.benefitPlans)
      });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

const getOptionPlan = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    if(user.role == 'HR'){
      BenefitPlan.findOne({company:user.company})
      .then((benefitplan)=>{
        reply(benefitplan);
      });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

const getBenefitPlan = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    if(user.role == 'HR'){
      User.findOne({ _id: user._id }).populate('company').exec((err, u) => {
        reply(u.company.benefitPlans)
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
    { method: 'POST', path: '/set-benefit-plan', config: settingBenefitPlan },
    { method: 'GET', path: '/get-option-plan', config: getOptionPlan },
    { method: 'GET', path: '/get-benefit-plan', config: getBenefitPlan },
  ]);
}
