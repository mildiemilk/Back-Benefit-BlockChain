import Joi from 'joi';
import Boom from 'boom';
import { User, Bidding, MasterPlan, InsurerPlan, Role, TemplatePlan } from '../models';

const getInsurancePlan = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    User.findOne({_id: user._id }).populate('company.detail').then((result) => {
      const insurers = result.company.detail.insurers;
      const insurer = insurers[insurers.length-1].insurerCompany;
      Bidding.findOne({ company: user.company.detail, insurer }).then((bidding) => {
        if (bidding) {
          let getMaster = [];
          let getInsurer = [];
          let master;
          let insurer;
          if (bidding.plan.master !== undefined) {
            getMaster = bidding.plan.master.map((plan) => {
              return new Promise((resolve) => {
                MasterPlan.findOne({ _id: plan.planId }).then((result) => {
                  resolve (
                    Object.assign({}, {
                      plan: result,
                      price: plan.price,
                    })
                  );
                });
              });
            });
          }
          Promise.all(getMaster).then((result) => {
            master = result;
            if (bidding.plan.insurer !== undefined) {
              getInsurer = bidding.plan.insurer.map((plan) => {
                return new Promise((resolve) => {
                  InsurerPlan.findOne({ _id: plan.planId }).then((result) => {
                    resolve (
                      Object.assign({}, {
                        plan: result,
                        price: plan.price,
                      })
                    );
                  });
                });
              });
            }
            Promise.all(getInsurer).then((result) => {
              insurer = result;
              reply({
                plan: {master, insurer},
              });
            });
          });
        } else {
          reply({
            plan: {master: [], insurer: []},
          });
        }
      });
    });
  }
};

const setTemplatePlan = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      plan: Joi.object().required(),
    },
  },

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { plan } = request.payload;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        TemplatePlan.findOne({ company: user.company.detail }, null, {sort: {createdAt: -1}}, (err, result) => {
          result.plan = plan;
          result.save().then((result) => {
            reply(result);
          });
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const setTemplateBenefit = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      healthList: Joi.array().required(),
      isHealth: Joi.bool().required(),
      expenseList: Joi.array().required(),
      isExpense: Joi.bool().required(),
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
    const { healthList, isHealth, expenseList, isExpense, selectedOptionHealth1,
      selectedOptionHealth2, selectedOptionHealth3, selectedOptionExpense1,
      selectedOptionExpense2, selectedOptionExpense3} = request.payload;
    const health = { healthList, selectedOptionHealth1, selectedOptionHealth2, selectedOptionHealth3 };
    const expense = { expenseList, selectedOptionExpense1, selectedOptionExpense2, selectedOptionExpense3 };
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        TemplatePlan.findOne({ company: user.company.detail }, null, {sort: {createdAt: -1}}, (err, result) => {
          result.health = health;
          result.isHealth = isHealth;
          result.expense = expense;
          result.isExpense = isExpense;
          result.save().then((result) => {
            reply(result);
          });
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const getTemplatePlan = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        TemplatePlan.findOne({ company: user.company.detail }, null, {sort: {createdAt: -1}}, (err, result) => {
          reply({ 
            plan: result.plan,
            isExpense: result.isExpense,
            expense: result.expense,
            isHealth: result.isHealth,
            health: result.health,
          });
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const getBenefitPlan = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    if(user.role == 'HR'){
      User.findOne({ _id: user._id }).populate('company.detail').exec((err, u) => {
        reply(u.company.detail.benefitPlans);
      });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
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
    if(user.role == 'HR'){
      User.findOne({ _id: user._id }).populate('company.detail').exec((err, u) => {
        const benefitPlans = { 
          benefitPlans: u.company.detail.benefitPlans.benefitPlans,
          timeout: timeout,
        };
        u.company.detail.benefitPlans = benefitPlans;
        u.company.detail.save();
        reply(u.company.detail.benefitPlans);
      });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

export default function(app) {
  app.route([
    { method: 'GET', path: '/company/get-insurance-plan', config: getInsurancePlan },
    { method: 'PUT', path: '/company/set-template-plan', config: setTemplatePlan },
    { method: 'PUT', path: '/company/set-template-benefit', config: setTemplateBenefit },
    { method: 'GET', path: '/company/get-template-plan', config: getTemplatePlan },
    { method: 'GET', path: '/get-benefit-plan', config: getBenefitPlan },
    { method: 'POST', path: '/set-benefit-timeout', config: setTimeout },
  ]);
}
