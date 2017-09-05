import Joi from 'joi';
import Boom from 'boom';
import { Insurer, BiddingRelation } from '../models';

const createInsurer = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      insurerName: Joi.string().required(),
      location: Joi.string().required(),
      insurerCode: Joi.number().integer().required(),
    },
  },
  handler: (request, reply) => {
    const { insurerName, location, insurerCode } = request.payload;
    const { user } = request.auth.credentials;
    const insurerUser = user._id;
    if(user.role === 'HR'){
      const insurer = new Insurer({ insurerName, location, insurerCode, insurerUser });
      insurer.save().then((err) => {
        if (!err)
          reply(insurer);
        else reply(err);
      });
    }else{
      reply(Boom.badData('This page for Insurer only'));
    }
  },
};


const getAllInsurer = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    if(user.role == 'HR'){
      Insurer.find({}).then((insurers) => {
        reply(insurers);
      });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

const chooseInsurer = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      insurers: Joi.array(),
    },
  },
  handler: (request, reply) => {
    const { insurers } = request.payload;
    const { user } = request.auth.credentials;
    const company = user.company;
    const insurerBidding = insurers.map((insurer) => Object.assign({}, { insurerId: insurer, status: 'waiting' }));
    console.log(insurerBidding);
    if(user.role == 'HR'){
      BiddingRelation.findOne({ company })
        .then((biddingrelation) => {
          if(biddingrelation){
            biddingrelation.insurers = insurerBidding;
            biddingrelation.save().then((result) => {
              reply(result);
            });
          }else{
            const biddingrelation = new BiddingRelation({ company, insurers: insurerBidding });
            biddingrelation.save().then((result) => {
              reply(result);
            });
          }
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
      BiddingRelation.findOneAndUpdate({ hr: user._id },{ timeout }, (err) => {
        if (err) console.log(err);
        reply(timeout);
      });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

const getSelectInsurer = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    if(user.role == 'HR'){
      BiddingRelation.findOne({ hr: user._id })
      .then((biddingrelation) => {
        reply(biddingrelation.insurers);
      });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

const getTimeout = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    if(user.role == 'HR'){
      BiddingRelation.findOne({ hr: user._id })
      .then((biddingrelation) => {
        reply(biddingrelation.timeout);
      });
    }else{    
      reply(Boom.badData('This page for HR only'));
    }
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/createInsurer', config: createInsurer },
    { method: 'GET', path: '/getAllInsurer', config: getAllInsurer },
    { method: 'PUT', path: '/chooseInsurer', config: chooseInsurer },
    { method: 'PUT', path: '/setTimeout', config: setTimeout },
    { method: 'GET', path: '/getTimeout', config: getTimeout },
    { method: 'GET', path: '/getSelectInsurer', config: getSelectInsurer },
  ]);
}
