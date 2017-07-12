import Joi from 'joi';
import Boom from 'boom';
import { Insurer, Bidding, BiddingRelation } from '../models';
import Config from '../../config/config';
import moment from 'moment';

const bidding = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      planName: Joi.string().required(),
      priceOfBidding: Joi.number().required(),
    },
  },
  handler: (request, reply) => {
    const { planName, priceOfBidding } = request.payload;
    const { user } = request.auth.credentials;
    const insurerUser = user._id;
    if(user.role == 'Insurer' || user.role == 'HR'){
      Insurer.findOne({insurerUser})
        .then((insurer) => {
          BiddingRelation.findOne({hr:user._id})
            .then((biddingrelation) =>{
              const index = biddingrelation.insurers.findIndex((element) => {
                return element.insurerName === insurer.insurerName
              });
              biddingrelation.status[index] = 'join';
              biddingrelation.markModified('status');
              biddingrelation.save().then((err)=>{
                console.log(err);
              });
            });

          Bidding.findOne({planName,insurerName:insurer.insurerName})
            .then((bidding) => {
              if(bidding){
                bidding.priceOfBidding = priceOfBidding;
                bidding.timeOfBidding = bidding.timeOfBidding + 1;
                bidding.save().then((err) => {
                  if (!err)
                    reply(bidding);
                  else reply(err)
                });
              }else{
                const insurerName = insurer.insurerName;
                const timeOfBidding = 1;
                const bidding = new Bidding({ insurerName, planName,  priceOfBidding, timeOfBidding });
                bidding.save().then((err) => {
                  if (!err)
                    reply(bidding);
                  else reply(err)
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
                return element.insurerName === insurer.insurerName
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
}

export default function(app) {
  app.route([
    { method: 'POST', path: '/bidding', config: bidding },
    { method: 'PUT', path: '/canclebidding', config: cancleBidding },
    { method: 'GET', path: '/getbidding', config: getBidding },
  ]);
}
