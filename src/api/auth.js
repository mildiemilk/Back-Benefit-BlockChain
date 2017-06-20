import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';

const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;

const login = {
  tags: ['auth', 'api'],
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
        if (!user) {
          reply(Boom.unauthorized('Invalid email or password'));
        } else {
          if (!user.comparePassword(password)) {
            reply(Boom.unauthorized('Invalid email or password'));
          } else {
            const { auth } = request.server.app.services;
            const token = auth.createAuthToken(user);
            reply({token});
          }
        }
      });
  },
};

const logout = {
  tags: ['auth', 'api'],
  auth: 'jwt',
  handler: (request, reply) => {
    reply("OK");
  },
};

const changepassword = {
  tags: ['auth','api'],
  auth: 'jwt',

  validate: {
    payload: {
      password: Joi.string().required().trim().regex(passwordPattern),
      newpassword: Joi.string().required().trim().regex(passwordPattern),
      repassword: Joi.string().required().trim().regex(passwordPattern),
    },
  },

  handler: (request, reply) => {
    const { password, newpassword, repassword } = request.payload;
    const { user } = request.auth.credentials;
    if (user) {
      if(user.comparePassword(password)){
        if(newpassword === repassword){
          user.password = newpassword;
          user.save(function(err){
            if (err) throw err;
            reply('Password has changed.');
          });
        }else{
          reply(Boom.badData('Please fill new password again!'));
        }
      }else{
        reply(Boom.badData('Password is not correct!'));
      }
    }else{
      reply(Boom.badData('Your e-mail is not correct!'));
    }
  },
};


const ForgotPassword = {
  tags: ['api'],
  validate: {
    payload: {
      email: Joi.string().required().email(),
    },
  },
  handler: (request, reply) => {
    const { email} = request.payload;

    User.findOne({ email })
      .then((user) => {

        if (user) {
          user.save().then(() => {
            const { mailer } = request.server.app.services;
            mailer.sendMailForgotPasswordLink(email);
            reply({ message:'please check your email'});
          });
        }
      });

  }
}

export default function(server) {
  server.route([
    { method: 'POST', path: '/login', config: login },
    { method: 'GET', path: '/logout', config: logout },
    { method: 'POST', path: '/ForgotPassword', config: ForgotPassword },
    { method: 'POST', path: '/user/changepassword', config: changepassword },
  ]);
}
