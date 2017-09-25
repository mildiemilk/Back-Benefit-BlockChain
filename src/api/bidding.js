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
    const insurerCompany = user.company.detail;
    const insurer = user._id;
    Bidding.findOne({ insurerCompany, company: companyId }).then(bidding => {
      if (bidding) {
        bidding.insurer = insurer;
        bidding.countBidding = bidding.countBidding + 1;
        bidding.totalPrice = totalPrice;
        bidding.plan = plan;
      } else {
        bidding = new Bidding({ company: companyId, insurer, insurerCompany, totalPrice, plan, quotationId, countBidding: 1 });
      }
      bidding.save().then((bidding) => {
        BiddingRelation.find({ company: companyId }, null, {sort: { createdAt: -1 }})
        .exec(biddingRelation => {
          const { minPrice } = biddingRelation[0];
          const { totalPrice } = bidding;
          if(minPrice > 0) {
            if(minPrice > totalPrice) {
              biddingRelation[0].minPrice = totalPrice;
            }
          }
          biddingRelation[0].save().then(() => {
            reply({
              biddingId: bidding.biddingId,
              countBidding: bidding.countBidding,
              updatedAt: bidding.updatedAt,
              plan: bidding.plan,
              totalPrice: bidding.totalPrice,
            });
          });
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
    BiddingRelation.find({ company }, null, {sort: { createdAt: -1 }}).populate('insurers.insurerCompany', 'logo.link companyName').exec((err, biddings) => {
      const detail = biddings[0].insurers.map((insurer) => {
        return new Promise((resolve) => {
          Bidding.findOne({ company, insurerCompany: insurer.insurerCompany }, 'updatedAt totalPrice countBidding quotationId', (err, result) => {
            if(result) {
              resolve({
                ...insurer._doc,
                biddingId: result.quotationId,
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
        reply({ biddingDetail: result, minPrice: biddings[0].minPrice });
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
            if (err) reply(err);
            BiddingRelation.find({ company: user.company.detail }, null, {sort: { createdAt: -1 }})
            .exec((err, biddingRelation) => {
              Bidding.findOne({ company:  user.company.detail, insurerCompany: insurerCompany })
              .exec((err, bidding) => {
                console.log('bidding', bidding);
                biddingRelation[0].insurerWin = bidding.insurer;
                biddingRelation[0].insurerCompanyWin = bidding.insurerCompany;
                biddingRelation[0].biddingWin = bidding;
                biddingRelation[0].save().then(() => {
                  u.company.detail.completeStep[step] = true;
                  u.company.detail.markModified('completeStep');
                  u.company.detail.save().then((company)=>{
                    const templatePlan = new TemplatePlan({ company: company._id });
                    templatePlan.save().then(() => {
                      reply({completeStep: company.completeStep, message:'เลือก insurer เรียบร้อยแล้ว'});
                    });
                  });
                });
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
      myDate.setDate(myDate.getDate() - 1);
      Bidding.findOne({ company: companyId, insurerCompany: user.company.detail }, (err, bidding) => {
        if (bidding) {
          let master = [];
          let insurer = [];
          MasterPlan.find({ company: companyId }).sort({planId: 1}).exec(function(err, plans) {
            if (bidding.plan.master !== undefined) {
              master = plans.map(plan => {
                const index = bidding.plan.master.findIndex(element => plan._id == element.planId);
                if(index !== -1) {
                  return Object.assign({}, {
                    planDetail: plan,
                    price: bidding.plan.master[index].price,
                  });
                } else {
                  return Object.assign({}, {
                    planDetail: plan,
                    price: null,
                  });
                }
              });
            } else {
              master = plans.map(plan => {
                return Object.assign({}, {
                  planDetail: plan,
                  price: null,
                });
              });
            }
          })
          .then(() => {
            InsurerPlan.find({ company: companyId, createdBy: user._id }).sort({planId: 1}).exec(function(err, plans) {
              if (bidding.plan.insurer !== undefined) {
                insurer = plans.map(plan => {
                  const index = bidding.plan.insurer.findIndex(element => plan._id == element.planId);
                  if(index !== -1) {
                    return Object.assign({}, {
                      planDetail: plan,
                      price: bidding.plan.insurer[index].price,
                    });
                  } else {
                    return Object.assign({}, {
                      planDetail: plan,
                      price: null,
                    });
                  }
                });
              } else {
                insurer = plans.map(plan => {
                  return Object.assign({}, {
                    planDetail: plan,
                    price: null,
                  });
                });
              }
            })
            .then(() => {
              reply({
                companyId: result.company._id,
                companyName: result.company.companyName,
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
                quotationId: bidding.quotationId,
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
              companyName: result.company.companyName,
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
              quotationId: null,
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
    Bidding.findOne({ company: user.company.detail, insurerCompany: companyId }, (err, bidding) => {
      if (bidding) {
        let master = [];
        let insurer = [];
        MasterPlan.find({ company: companyId }).sort({planId: 1}).exec(function(err, plans) {
          if (bidding.plan.master !== undefined) {
            master = plans.map(plan => {
              const index = bidding.plan.master.findIndex(element => plan._id == element.planId);
              if(index !== -1) {
                return Object.assign({}, {
                  planDetail: plan,
                  price: bidding.plan.master[index].price,
                });
              } else {
                return Object.assign({}, {
                  planDetail: plan,
                  price: null,
                });
              }
            });
          } else {
            master = plans.map(plan => {
              return Object.assign({}, {
                planDetail: plan,
                price: null,
              });
            });
          }
        })
        .then(() => {
          InsurerPlan.find({ company: companyId, createdBy: user._id }).sort({planId: 1}).exec(function(err, plans) {
            if (bidding.plan.insurer !== undefined) {
              insurer = plans.map(plan => {
                const index = bidding.plan.insurer.findIndex(element => plan._id == element.planId);
                if(index !== -1) {
                  return Object.assign({}, {
                    planDetail: plan,
                    price: bidding.plan.insurer[index].price,
                  });
                } else {
                  return Object.assign({}, {
                    planDetail: plan,
                    price: null,
                  });
                }
              });
            } else {
              insurer = plans.map(plan => {
                return Object.assign({}, {
                  planDetail: plan,
                  price: null,
                });
              });
            }
          })
          .then(() => {
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
