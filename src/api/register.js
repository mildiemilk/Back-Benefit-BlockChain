import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';
import Config from './Config';
import timestamps from 'mongoose-timestamp';

const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;

const register = {
  tags: ['api'],
  validate: {
    payload: {
      email: Joi.string().required().email(),
      password: Joi.string().required().trim().regex(passwordPattern),
      role: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { email, password, role } = request.payload;

    User.findOne({ email })
      .then((user) => {

        if (user) {
          reply(Boom.badData('Email \'${email}\' existed', { email }));
        } else {
          user = new User({ email, password, role });
          user.save().then(() => {
            const { mailer } = request.server.app.services;
            mailer.sentMailVerificationLink(Date.now(),email);
            reply('Register complete! plaese click confirm link in your email');
          });
        }

      });
   
  },
};

const verify = {
  tags: ['api'],
  validate: {
    params: {
      email: Joi.string().required().email(),
      token: Joi.string().required(),
      ts: Joi.string().required(),
      nounce: Joi.string().required()
    },
  },
  handler: (request, reply) => {
    const { email, token, ts, nounce} = request.params;
    const { mailer } = request.server.app.services;
    let base = email + ts + nounce;
    if (token === mailer.genToken(base)) {
      User.findOneAndUpdate({ email: email }, { $set: { emailConfirmedAt: Date.now() }},() => {
        reply('You account is verified');
      });
    } else reply('invalid');
   
  },
};


export default function(app) {
  app.route([
    { method: 'POST', path: '/register', config: register },
    { method: 'GET', path: '/register-confirmation/{email}&{token}&{ts}&{nounce}', config: verify },
  ]);
}