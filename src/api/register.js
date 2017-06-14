import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';
import Config from './Config';

const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;

const register = {
  tags: ['api'],
  validate: {
    payload: {
      email: Joi.string().required().email(),
      password: Joi.string().required().trim().regex(passwordPattern),
    },
  },
  handler: (request, reply) => {
    const { email, password } = request.payload;

    User.findOne({ email })
      .then((user) => {

        if (user) {
          reply(Boom.badData('Email \'${email}\' existed', { email }));
          User.findOneAndRemove({email}, function (err) {
            if (err) throw err;
            console.log('remove complete!');
          });
        
        } else {
          user = new User({ email, password });
          user.save().then(() => {
            const { mailer } = request.server.app.services;
            let to = email;
            let subject = 'verify your email';
            let mailbody = 'click link to verify your account!';
            mailer.sendMail(to,subject,mailbody);
            reply('Register complete! plaese click confirm link in your email');
          });
        }

      });
   
  },
};



export default function(app) {
  app.route([
    { method: 'POST', path: '/register', config: register },
  ]);
}