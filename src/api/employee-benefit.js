import Joi from 'joi';
import Boom from 'boom';
import { EmployeeGroup, BenefitPlan, EmployeePlan, LogUserClaim  } from '../models';

const getAllBenefit = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    EmployeeGroup
    .findOne({ company: user.company.detail, groupName: user.detail.benefitGroup })
    .exec((err, group) => {
      BenefitPlan.find({ _id: { $in: group.benefitPlan }})
      .populate('benefitPlan.plan.planId benefitPlan.detailPlan')
      .exec((err, result) => {
        reply({ group, benefitPlan: result });
      });
    });
  },
};

const confirmPlan = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    EmployeePlan
    .find({ user: user._id }, null, {sort: {createdAt: -1}}, (err, plan) => {
      let newUser = false;
      if (plan.length === 1) {
        newUser = true;
      }
      reply({
        confirm: plan[0].confirm,
        newUser,
        currentSelect: plan[0].benefitPlan,
      });
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
    .find({ user: user._id }, null, {sort: {createdAt: -1}})
    .exec((err, result) => {
      if (err) {
        reply(err);
      } else {
        result[0].benefitPlan = planId;
        result[0].confirm = true;
        result[0].save(function(err) {
          if (err) throw err;
          reply({ txt: 'Updated select plan and change status.', planId });
        });
      }
    });
  },
};

const claim = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      type: Joi.string().valid('health','general','insurance').required(),
    },
  },
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data',
    maxBytes: 20000000,
  },
  handler: (request, reply) => {
    let { detail, files } = request.payload;
    const { user } = request.auth.credentials;
    const { type } = request.params;
    let claimNumber = null;

    const { storage } = request.server.app.services;
    const isPublic = true;
    detail = JSON.parse(detail);
    const mediaImg = [];
    const urlImg = [];
    if (!Array.isArray(files)) {
      files = [files];
    }
    const allFile = files.map(file => {
      return new Promise(resolve => {
        storage.upload({ file: file }, { isPublic }, (err, media) => {
          if (!err) {
            media.userId = user.id;
            media.save();
            storage.getUrl(media.path, (url) => {
              if (err) throw err;
              mediaImg.push(media._id);
              urlImg.push(url);
              resolve();
            });
          }
        });
      });
      
    });

    Promise.all(allFile).then(() => {
      detail.imageClaimFile = {
        mediaImg,
        urlImg,
      };
      if (type !== 'insurance') {
        LogUserClaim
        .find({ company: user.company.detail, type: {$in: ['health', 'general']} })
        .exec((err, result) => {
          claimNumber = result.length + 1;
          const createClaim = new LogUserClaim({
            user: user._id,
            company: user.company.detail,
            detail,
            status: 'pending',
            claimNumber,
            type,
          });
          createClaim.save().then(() => {
            reply({ message: 'send claim success' });
          });
        });
      } else {
        LogUserClaim
        .find({ company: user.company.detail, type: 'insurance' })
        .exec((err, result) => {
          claimNumber = result.length + 1;
          const createClaim = new LogUserClaim({
            user: user._id,
            company: user.company.detail,
            detail,
            status: 'pending',
            claimNumber,
            policyNumber: null,
            type,
          });
          createClaim.save().then(() => {
            reply({ message: 'send claim success' });
          });
        });
      }
    });
  },
};

const reClaim = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      claimId: Joi.string().required(),
    },
  },
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data',
    maxBytes: 20000000,
  },
  handler: (request, reply) => {
    let { detail, files, type } = request.payload;
    type = JSON.parse(type);
    const { user } = request.auth.credentials;
    const { claimId } = request.params;
    const { storage } = request.server.app.services;
    const isPublic = true;
    let claimNumber = null;
    detail = JSON.parse(detail);
    const mediaImg = [];
    const urlImg = [];
    if (!Array.isArray(files)) {
      files = [files];
    }
    const allFile = files.map(file => {
      return new Promise(resolve => {
        storage.upload({ file: file }, { isPublic }, (err, media) => {
          if (!err) {
            media.userId = user.id;
            media.save();
            storage.getUrl(media.path, (url) => {
              if (err) throw err;
              mediaImg.push(media._id);
              urlImg.push(url);
              resolve();
            });
          }
        });
      });
      
    });

    Promise.all(allFile).then(() => {
      detail.imageClaimFile = {
        mediaImg,
        urlImg,
      };
      LogUserClaim.findOne({ _id: claimId }).exec((err, claim) => {
        if (claim.type == 'insurance' && type != 'insurance') {
          claim.delete(() => {
            LogUserClaim
            .find({ company: user.company.detail, type: {$in: ['health', 'general']} })
            .exec((err, result) => {
              claimNumber = result.length + 1;
              const createClaim = new LogUserClaim({
                user: user._id,
                company: user.company.detail,
                detail,
                status: 'pending',
                claimNumber,
                policyNumber: null,
                type,
              });
              createClaim.save().then(() => {
                reply({ message: 'send claim success' });
              });
            });
          });
        } else if (claim.type != 'insurance' && type == 'insurance') {
          claim.delete(() => {
            LogUserClaim
            .find({ company: user.company.detail, type: 'insurance' })
            .exec((err, result) => {
              claimNumber = result.length + 1;
              const createClaim = new LogUserClaim({
                user: user._id,
                company: user.company.detail,
                detail,
                status: 'pending',
                claimNumber,
                type,
              });
              createClaim.save().then(() => {
                reply({ message: 'send claim success' });
              });
            });
          });
        } else {
          claim.detail = detail;
          claim.status = 'pending';
          claim.type = type;
          claim.save().then(() => {
            reply({ message: 'send claim success' });
          });
        }
      });
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
    allow: 'multipart/form-data',
    maxBytes: 20000000,
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

const currentPlan = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    EmployeePlan
    .find({ user: user._id }, 'benefitPlan -_id', (err, plans) => {
      plans = plans.map(plan => plan.benefitPlan);
      const today = new Date();
      BenefitPlan
      .findOne({ _id: { $in: plans }, effectiveDate: { $lte: today }, expiredDate: { $gte: today }})
      .populate('benefitPlan.detailPlan benefitPlan.plan.planId')
      .exec((err, result) => {
        if (err) throw err;
        reply(result);
      });
    });
  },
};

const claimOption = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const fullname = user.detail.prefix + user.detail.name + ' ' + user.detail.lastname;
    user.detail.familyDetail.unshift(fullname);
    EmployeePlan
    .find({ user: user._id }, 'benefitPlan -_id', (err, plans) => {
      plans = plans.map(plan => plan.benefitPlan);
      const today = new Date();
      BenefitPlan.findOne({ _id: { $in: plans }, effectiveDate: { $lte: today }, expiredDate: { $gte: today }})
      .populate('benefitPlan.detailPlan benefitPlan.plan.planId')
      .exec((err, result) => {
        if(!result.benefitPlan) {
          reply(Boom.badData('benefit plan not found'));
        } else {
          const { planId } = result.benefitPlan.plan;
          const { ipdType, opdPerYear, opdPerTime, opdTimeNotExceedPerYear,
            dentalPerYear, lifePerYear, lifeTimeOfSalary, lifeNotExceed } = planId;
          const insuranceList = [];
          if ( ipdType && ipdType !== '' ) {
            insuranceList.push('IPD');
          }
          if ( opdPerYear || opdPerTime || opdTimeNotExceedPerYear ) {
            insuranceList.push('OPD');
          }
          if ( dentalPerYear ) {
            insuranceList.push('Dental');
          }
          if ( lifePerYear || lifeTimeOfSalary || lifeNotExceed) {
            insuranceList.push('Life');
          }
          reply({
            claimUser: user.detail.familyDetail,
            insuranceList,
            healthList: result.benefitPlan.detailPlan.health.healthList,
            expenseList: result.benefitPlan.detailPlan.expense.expenseList,
          });
        }
      });
    });
  },
};

const checkNewUser = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    EmployeePlan
    .find({ company: user.company.detail, user: user._id })
    .exec((err, result) => {
      if (err) {
        reply(err);
      } else {
        let newUser = false;
        if (result.length === 1) {
          newUser = true;
        }
        reply({newUser});
      }
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
    LogUserClaim.find(
      {
        user: user._id,
        $and:[
          { updatedAt: { $lte: today } },
          { updatedAt: { $gte: afterSevenDay } }
        ],
        status: { $in: ['approve', 'reject'] },
        deleted: false
      },
      '-createdAt -updatedAt -deleted'
    )
    .then((logClaim) => {
      LogUserClaim.find({ user: user._id, status: 'pending', }).exec((err, pending) => {
        const allClaim = pending.concat(logClaim);
        reply(allClaim);
      });
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
    LogUserClaim.find(
      {
        user: user._id,
        updatedAt:{$lt:afterSevenDay},
        status: { $in: ['approve', 'reject'] },
        deleted: false
      },
      '-createdAt -updatedAt -deleted'
    )
    .then((logClaim) => {
      reply(logClaim);
    });
  },
};

export default function(app) {
  app.route([
    { method: 'GET', path: '/employee/get-all-benefit', config: getAllBenefit },
    { method: 'PUT', path: '/employee/select-benefit', config: selectPlan },
    { method: 'GET', path: '/employee/get-profile', config: getProfile },
    { method: 'PUT', path: '/employee/set-profile', config: setProfile },
    { method: 'POST', path: '/employee/claim/{type}', config: claim },
    { method: 'PUT', path: '/employee/re-claim/{claimId}', config: reClaim },
    { method: 'GET', path: '/employee/current-plan', config: currentPlan },
    { method: 'GET', path: '/employee/claim-option', config: claimOption },
    { method: 'GET', path: '/employee/confirm-plan', config: confirmPlan },
    { method: 'GET', path: '/employee/new-user', config: checkNewUser },
    { method: 'GET', path: '/employee/get-claim-status', config: getClaimStatus},
    { method: 'GET', path: '/employee/get-claim-history', config: getClaimHistory},
  ]);
}
