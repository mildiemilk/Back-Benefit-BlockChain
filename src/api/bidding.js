import Joi from 'joi';
import Boom from 'boom';
import { Bidding, BiddingRelation, User } from '../models';

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
    Bidding.findOne({ insurer: user._id, company: companyId }).then(bidding => {
      if (bidding) {
        bidding.countBidding = bidding.countBidding + 1;
        bidding.totalPrice = totalPrice;
        bidding.plan = plan;
        bidding.quotationId = quotationId;
      } else {
        bidding = new Bidding({ company: companyId, insurer: user._id, totalPrice, plan, quotationId, countBidding: 1 });
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
    Bidding.find({}).then((bidding) => {
      reply(bidding);
    });
  },
};

const chooseFinalInsurer = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      passwordToConfirm: Joi.string().required(),
      insurerName: Joi.string().required(),
      step: Joi.number().required(),
    },
  },
  handler: (request, reply) => {
    const { passwordToConfirm, insurerName, step } = request.payload;
    const { user } = request.auth.credentials;
    console.log(user);
    if(user.role == 'HR'){
      if (!user.comparePassword(passwordToConfirm)) {
        reply(Boom.badData('Invalid password'));
      } else {
        User.findOne({ _id: user._id }).populate('company').exec((err, u) => {
          if (err) console.log(err);
          u.company.companyInsurer = insurerName;
          u.company.completeStep[step] = true;
          u.company.markModified('completeStep');
          u.company.save().then((company)=>{
            reply({completeStep: company.completeStep, message:'เลือก broker เรียบร้อยแล้ว'});
          });
        });
      }
    }else{
      reply(Boom.badData('This page for HR only'));
    }
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
    BiddingRelation.findOne({ 'insurers.insurerId': user._id, company: companyId }).then((result) => {
      const index = result.insurers.findIndex((insurer) => insurer.insurerId.toString() === user._id.toString());
      result.insurers[index].status = status;
      result.markModified('insurers');
      result.save().then((result) => {
        reply(result);
      });
    });
  }
};

const biddingDetail = {
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
    Bidding.findOne({ company: companyId, insurer: user._id }).populate('company').exec((err, bidding) => {
      if (bidding) {
        reply({
          biddingId: bidding.biddingId,
          countBidding: bidding.countBidding,
          updatedAt: bidding.updatedAt,
          plan: bidding.plan,
          totalPrice: bidding.totalPrice,
          claimData: bidding.company.claimData,
          memberList: null,
        });
      } else {
        reply({
          biddingId: null,
          countBidding: 0,
          updatedAt: null,
          plan: null,
          totalPrice: null,
          claimData: null,
          memberList: null,
        });
      }
    });
  }
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/insurer/bidding/{companyId}', config: bidding },
    { method: 'GET', path: '/getbidding', config: getBidding },
    { method: 'POST', path: '/choosefinalinsurer', config: chooseFinalInsurer },
    { method: 'PUT', path: '/insurer/{status}', config: statusBidding },
    { method: 'GET', path: '/insurer/bidding-detail/{companyId}', config: biddingDetail },
  ]);
}
