import Joi from 'joi';
import Boom from 'boom';
import { Bidding, BiddingRelation, User, MasterPlan, InsurerPlan, Role, TemplatePlan } from '../models';

const bidding = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      totalPrice: Joi.number().required(),
      plan: Joi.object().required(),
      quotationId: Joi.string().required(),
    },
    params: {
      companyId: Joi.string().required(),
    }
  },
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { companyId } = request.params;
    const { totalPrice, plan, quotationId } = request.payload;
    const insurer = user.company.detail;
    Bidding.findOne({ insurer, company: companyId }).then(bidding => {
      if (bidding) {
        bidding.countBidding = bidding.countBidding + 1;
        bidding.totalPrice = totalPrice;
        bidding.plan = plan;
        bidding.quotationId = quotationId;
      } else {
        bidding = new Bidding({ company: companyId, insurer, totalPrice, plan, quotationId, countBidding: 1 });
      }
      bidding.save().then((bidding) => {
        reply({
          biddingId: bidding.biddingId,
          countBidding: bidding.countBidding,
          updatedAt: bidding.updatedAt,
          plan: bidding.plan,
          totalPrice: bidding.totalPrice,
        });
      });
    });
  },
};

const getBidding = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const company = user.company.detail;
    BiddingRelation.findOne({ company }).populate('insurers.insurerCompany', 'logo.link companyName').exec((err, biddings) => {
      const detail = biddings.insurers.map((insurer) => {
        return new Promise((resolve) => {
          Bidding.findOne({ company, insurer: insurer.insurerCompany }, 'biddingId updatedAt totalPrice countBidding', (err, result) => {
            if(result) {
              resolve({
                ...insurer._doc,
                biddingId: result.biddingId,
                updatedAt: result.updatedAt,
                totalPrice: result.totalPrice,
                countBidding: result.countBidding,
              });
            } else {
              resolve({
                ...insurer._doc,
                biddingId: null,
                updatedAt: null,
                totalPrice: null,
                countBidding: 0,
              });
            }
          });
        });
      });
      Promise.all(detail).then((result) => {
        reply(result);
      });
    });
  },
};

const chooseFinalInsurer = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      passwordToConfirm: Joi.string().required(),
      insurerCompany: Joi.string().required(),
      step: Joi.number().required(),
    },
  },
  handler: (request, reply) => {
    const { passwordToConfirm, insurerCompany, step } = request.payload;
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        if (!user.comparePassword(passwordToConfirm)) {
          reply(Boom.badData('Invalid password'));
        } else {
          User.findOne({ _id: user._id }).populate('company.detail').exec((err, u) => {
            if (err) console.log(err);
            u.company.detail.insurers.push({ insurerCompany, date: Date.now() });
            u.company.detail.completeStep[step] = true;
            u.company.detail.markModified('completeStep');
            u.company.detail.save().then((company)=>{
              const templatePlan = new TemplatePlan({ company: company._id });
              templatePlan.save().then(() => {
                reply({completeStep: company.completeStep, message:'เลือก insurer เรียบร้อยแล้ว'});
              });
            });
          });
        }
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const statusBidding = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      companyId: Joi.string().required(),
    },
    params: {
      status: Joi.string().valid('join', 'reject').required(),
    }
  },
  handler: (request, reply) => {
    const { companyId } = request.payload;
    const { status } = request.params;
    const { user } = request.auth.credentials;
    BiddingRelation.findOne({ 'insurers.insurerCompany': user.company.detail, company: companyId }).then((result) => {
      const index = result.insurers.findIndex((insurer) => insurer.insurerCompany.toString() === user.company.detail.toString());
      result.insurers[index].status = status;
      result.markModified('insurers');
      result.save().then((result) => {
        reply(result);
      });
    });
  }
};

const biddingDetailForInsurer = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      companyId: Joi.string().required(),
    }
  },
  handler: (request, reply) => {
    const { companyId } = request.params;
    const { user } = request.auth.credentials;
    BiddingRelation.findOne({ 'insurers.insurerCompany': user.company.detail, company: companyId }).populate('company').exec((err, result) => {
      const myDate = result.company.expiredInsurance;
      myDate.setDate(myDate.getDate() + 1);
      Bidding.findOne({ company: companyId, insurer: user.company.detail }, (err, bidding) => {
        if (bidding) {
          let getMaster = [];
          let getInsurer = [];
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
          Promise.all(getMaster).then((master) => {
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
            Promise.all(getInsurer).then((insurer) => {
              reply({
                companyId: result.company._id,
                company: result.company.companyName,
                logo: result.company.logo.link,
                numberOfEmployees: result.company.numberOfEmployees,
                expiredOldInsurance: result.company.expiredInsurance,
                startNewInsurance: myDate,
                status: result.insurers.find((insurer) => insurer.insurerCompany.toString() === user.company.detail.toString()).status,
                candidateInsurer: result.insurers.length,
                minPrice: result.minPrice,
                timeout: result.timeout,
                biddingId: bidding.biddingId,
                countBidding: bidding.countBidding,
                updatedAt: bidding.updatedAt,
                plan: {master, insurer},
                totalPrice: bidding.totalPrice,
                claimData: result.company.claimData,
                memberList: null,
              });
            });
          });
        } else {
          MasterPlan.find({ company: companyId }).sort({planId: 1}).exec(function(err, plans) {
            const plan = plans.map((plan) => {
              return Object.assign({}, {
                planDetail: plan,
                price: null,
              });
            });
            reply({
              companyId: result.company._id,
              company: result.company.companyName,
              logo: result.company.logo.link,
              numberOfEmployees: result.company.numberOfEmployees,
              expiredOldInsurance: result.company.expiredInsurance,
              startNewInsurance: myDate,
              status: result.insurers.find((insurer) => insurer.insurerCompany.toString() === user.company.detail.toString()).status,
              candidateInsurer: result.insurers.length,
              minPrice: result.minPrice,
              timeout: result.timeout,
              biddingId: null,
              countBidding: 0,
              updatedAt: null,
              plan: {master: plan, insurer: []},
              totalPrice: null,
              claimData: null,
              memberList: null,
            });
          });
        }
      });
    });
  }
};

const biddingDetailForCompany = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      companyId: Joi.string().required(),
    }
  },
  handler: (request, reply) => {
    const { companyId } = request.params;
    const { user } = request.auth.credentials;
    Bidding.findOne({ company: user.company.detail, insurer: companyId }).then((bidding) => {
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

export default function(app) {
  app.route([
    { method: 'POST', path: '/insurer/bidding/{companyId}', config: bidding },
    { method: 'GET', path: '/company/get-bidding', config: getBidding },
    { method: 'PUT', path: '/company/choose-final-insurer', config: chooseFinalInsurer },
    { method: 'PUT', path: '/insurer/{status}', config: statusBidding },
    { method: 'GET', path: '/insurer/bidding-detail/{companyId}', config: biddingDetailForInsurer },
    { method: 'GET', path: '/company/bidding-detail/{companyId}', config: biddingDetailForCompany },
  ]);
}
