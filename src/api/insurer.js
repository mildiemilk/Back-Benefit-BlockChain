import Joi from 'joi';
import Boom from 'boom';
import { Insurer, SimpleRequirement } from '../models';
import Config from '../../config/config';
import moment from 'moment';

const createInsurer = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      insurerName: Joi.string().required(),
      location: Joi.string().required(),
      insurerCode: Joi.number().required(),
    },
  },
  handler: (request, reply) => {
    const { insurerName, location, insurerCode } = request.payload;
    const { user } = request.auth.credentials;
    const insurerUser = user._id;
    if(user.role == 'Insurer'){
      const insurer = new Insurer({ insurerName, location, insurerCode, insurerUser });
      insurer.save().then((err) => {
        if (!err)
          reply(insurer);
        else reply(err)
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
      Insurer.find({}, (insurers) => {
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
      insurers: Joi.array().required(),
    },
  },
  handler: (request, reply) => {
    const { insurers } = request.payload;
    const { user } = request.auth.credentials;
    if(user.role == 'HR'){
      SimpleRequirement.findOneAndUpdate({ hr: user._id }, { insurers }, () => {
        reply(insurers);
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
      SimpleRequirement.findOneAndUpdate({ hr: user._id },{ timeout }, (err) => {
        if (err) console.log(err)
        reply(timeout);
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
  ]);
}
