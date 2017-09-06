import Joi from 'joi';
import Boom from 'boom';
import { Insurer, Bidding, BiddingRelation, User } from '../models';

const bidding = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      detail: Joi.array().items(Joi.object()),
      hrId: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const insurerUser = user._id;
    const { detail, hrId } = request.payload;
    if(user.role == 'Insurer'){
      Insurer.findOne({insurerUser})
        .then((insurer) => {
          BiddingRelation.findOne({hr:user._id})
            .then((biddingrelation) =>{
              const index = biddingrelation.insurers.findIndex((element) => {
                return element.insurerName === insurer.insurerName;
              });
              biddingrelation.status[index] = 'join';
              biddingrelation.markModified('status');
              biddingrelation.save().then((err)=>{
                console.log(err);
              });
            });
          Bidding.findOne({insurerName:insurer.insurerName, status:'valid'})
            .then((nowBidding) => {
              if(nowBidding){
                nowBidding.status = 'invalid';
                nowBidding.save();
                const status = 'valid';
                const insurerName = insurer.insurerName;
                const hr = hrId;
                const timeOfBidding = nowBidding.timeOfBidding + 1;
                const bidding = new Bidding({ insurerName, detail, timeOfBidding, status, hr });
                bidding.save().then((err) => {
                  if (!err)
                    reply(bidding);
                  else reply(err);
                });
              }else{
                const status = 'valid';
                const insurerName = insurer.insurerName;
                const timeOfBidding = 1;
                const hr = hrId;
                const bidding = new Bidding({ insurerName, detail, timeOfBidding, status, hr });
                bidding.save().then((err) => {
                  if (!err)
                    reply(bidding);
                  else reply(err);
                });
              }
            });
        });
    }else{
      reply(Boom.badData('This page for Insurer only'));
    }
  },
};

const cancleBidding = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const insurerUser = user._id;
    if(user.role == 'Insurer' || user.role == 'HR'){
      Insurer.findOne({insurerUser})
        .then((insurer) => {
          BiddingRelation.findOne({hr:user._id})
            .then((biddingrelation) =>{
              const index = biddingrelation.insurers.findIndex((element) => {
                return element.insurerName === insurer.insurerName;
              });
              biddingrelation.status[index] = 'cancel';
              biddingrelation.markModified('status');
              biddingrelation.save().then((err)=>{
                reply(err);
              });
            });
        });
    }else{
      reply(Boom.badData('This page for Insurer only'));
    }
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

const joinBidding = {
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
    BiddingRelation.findOne({ 'insurers.insurerId': user._id, company: companyId }).then((result) => {
      const index = result.insurers.findIndex((insurer) => insurer.insurerId.toString() === user._id.toString());
      result.insurers[index].status = 'join';
      result.markModified('insurers');
      result.save().then((result) => {
        reply(result);
      });
    });
  }
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/bidding', config: bidding },
    { method: 'PUT', path: '/canclebidding', config: cancleBidding },
    { method: 'GET', path: '/getbidding', config: getBidding },
    { method: 'POST', path: '/choosefinalinsurer', config: chooseFinalInsurer },
    { method: 'GET', path: '/insurer/join-bidding/{companyId}', config: joinBidding }, 
  ]);
}
