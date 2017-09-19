import Joi from 'joi';
import Boom from 'boom';
import { User, Bidding, MasterPlan, InsurerPlan, Role, TemplatePlan, BenefitPlan, BiddingRelation } from '../models';

const getInsurancePlan = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    BiddingRelation.find({ company: user.company.detail }, null, {sort: { createdAt: -1 }})
    .populate('biddingWin')
    .exec((err, biddingRelation) => {
      const bidding = biddingRelation[0].biddingWin;
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
        console.log(user.company);
        TemplatePlan.find({ company: user.company.detail }, null, {sort: {createdAt: -1}})
        .exec((err, result) => {
          reply({ 
            plan: result[0].plan,
            isExpense: result[0].isExpense,
            expense: result[0].expense,
            isHealth: result[0].isHealth,
            health: result[0].health,
          });
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const setBenefitPlan = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      benefitPlanId: Joi.string().allow(null).required(),
      planName: Joi.string().required(),
      benefitPlan: Joi.object().required(),
    },
  },
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { planName, benefitPlan, benefitPlanId } = request.payload;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role = thisRole.roleName;
      if(role == 'HR'){
        User.findOne({ _id: user._id }).populate('company.detail').exec((err, result) => {
          let effectiveDate = new Date(result.company.detail.expiredInsurance);
          let expiredDate = new Date(result.company.detail.expiredInsurance);
          const company = result.company.detail._id;
          effectiveDate.setDate(effectiveDate.getDate() + 1);
          expiredDate.setFullYear(effectiveDate.getFullYear() + 1);
          if(benefitPlanId){
            BenefitPlan.findOne({ _id: benefitPlanId }).then((result) => {
              result.company = company;
              result.benefitPlanName = planName;
              result.benefitPlan = benefitPlan;
              result.effectiveDate = effectiveDate;
              result.expiredDate = expiredDate;
              result.save().then(() => {
                BenefitPlan.find({ bidding: result.biddingWin }, 'benefitPlanName benefitPlan', {sort: {createdAt: 1}})
                .populate({ path: 'benefitPlan.plan.planId', select: 'planName' }).exec((err, result) => {
                  reply(result);
                });
              });
            });
          } else {
            BiddingRelation.find({ company }, null, {sort: { createdAt: -1 }})
            .exec((err, biddingRelation) => {
              const insurerCompany = biddingRelation[0].insurerCompanyWin;
              const insurer = biddingRelation[0].insurerWin;
              const bidding = biddingRelation[0].biddingWin;
              const newBenefitPlan = new BenefitPlan({ company, insurer, insurerCompany, bidding, benefitPlanName: planName, benefitPlan, effectiveDate, expiredDate });
              newBenefitPlan.save().then(() => {
                reply({ message: 'set new benefit plan success' });
              });
            });
            
          }
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
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role = thisRole.roleName;
      if(role == 'HR'){
        BiddingRelation.find({ company: user.company.detail }, null, {sort: { createdAt: -1 }})
        .exec((err, biddingRelation) => {
          console.log(biddingRelation);
          BenefitPlan.find({ bidding: biddingRelation[0].biddingWin }, 'benefitPlanName benefitPlan', {sort: {createdAt: 1}})
          .populate({ path: 'benefitPlan.plan.planId', select: 'planName' }).exec((err, result) => {
            reply(result);
          });
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
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
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role = thisRole.roleName;
      if(role == 'HR'){
        User.findOne({ _id: user._id }).populate('company.detail').exec((err, result) => {
          let effectiveDate = new Date(result.company.detail.expiredInsurance);
          const company = result.company.detail._id;
          effectiveDate.setDate(effectiveDate.getDate() + 1);
          BenefitPlan.find({ company, effectiveDate }, null, {sort: {createdAt: 1}}, (err, results) => {
            const setTimeout = results.map((result) => {
              return new Promise((resolve) => {
                result.timeout = timeout;
                result.save().then((result) => {
                  resolve(result);
                });
              });
            });
            Promise.all(setTimeout).then(() => {
              reply({ message: 'set timeout completed' });
            });
          });
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

export default function(app) {
  app.route([
    { method: 'GET', path: '/company/get-insurance-plan', config: getInsurancePlan },
    { method: 'PUT', path: '/company/set-template-plan', config: setTemplatePlan },
    { method: 'PUT', path: '/company/set-template-benefit', config: setTemplateBenefit },
    { method: 'GET', path: '/company/get-template-plan', config: getTemplatePlan },
    { method: 'POST', path: '/company/set-benefit-plan', config: setBenefitPlan },
    { method: 'GET', path: '/company/get-benefit-plan', config: getBenefitPlan },
    { method: 'PUT', path: '/company/set-benefit-plan', config: setTimeout },
  ]);
}
