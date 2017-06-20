import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';
import Config from './Config';
import timestamps from 'mongoose-timestamp';
import moment from 'moment';

const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;

const register = {
  tags: ['api'],
  validate: {
    payload: {
      email: Joi.string().required().email(),
      password: Joi.string().required().trim().regex(passwordPattern),
      role: Joi.string().required(),
      company: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { email, password, role, company } = request.payload;

    User.findOne({ email })
      .then((user) => {

        if (user) {
          reply(Boom.badData('Email \'${email}\' existed', { email }));
        } else {
          user = new User({ email, password, role, company });
          user.save().then(() => {
            const { mailer } = request.server.app.services;
            mailer.sendMailVerificationLink(Date.now(),email);
            reply({ message:'Register complete! plaese click confirm link in your email'});
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
    let DateNow = moment(Date.now());
    let Dateconfirm = ts;
    if((DateNow-Dateconfirm)<5*60000){
      if (token === mailer.genToken(base)) {
        User.findOneAndUpdate({ email: email }, { $set: { emailConfirmedAt: Date.now() }},() => {
          reply({message:'You account is verified,Please wait Admin approve your account'});
          mailer.sendMailToAdminApproveAccount(email);
        });
      } else reply('invalid');
    } else reply('Link expired ');

  },
};


export default function(app) {
  app.route([
    { method: 'POST', path: '/register', config: register },
    { method: 'GET', path: '/register-confirmation/{email}&{token}&{ts}&{nounce}', config: verify },
  ]);
}
