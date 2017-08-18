import Joi from 'joi';
import Boom from 'boom';
import { User, Media } from '../models';

const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;

const login = {
  tags: ['auth', 'api'],
  validate: {
    payload: {
      email: Joi.string().required().email(),
      password: Joi.string().required().trim().regex(passwordPattern).error(new Error('Invalid email or password')),
    },
  },
  handler: (request, reply) => {
    const { email, password } = request.payload;
    User.findOne({ email })
    .then((user) => {
      if (!user || user.emailConfirmedAt === null) {
        if (!user){
          reply(Boom.unauthorized('Invalid email or password'));
        } else {
          reply(Boom.unauthorized('please verify email'));
        }
      } else {
        if (!user.comparePassword(password)) {
          reply(Boom.unauthorized('Invalid email or password'));
        } else {
          const { auth } = request.server.app.services;
          const token = auth.createAuthToken(user);
          User.findOne({ _id: user._id }).populate('company').exec((err, u) => {
            if (u.company) {
              Media.findOne({ _id: u.company.logo }).populate('logo').exec((err, l) => {
                const { path } = l;
                const { storage } = request.server.app.services;

                storage.getUrl(path, (err, url) => {
                  reply({
                    token,
                    companyName: u.company.companyName || null,
                    logo: url || null,
                    Approve: user.approveFile,
                    role: user.role,
                    personalVerify: user.personalVerify,
                  });
                });
              });
            } else {
              reply({
                token,
                companyName: null,
                logo: null,
                Approve: user.approveFile,
                role: user.role,
                personalVerify: user.personalVerify,
              });
            }
            
          });
          
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
      password: Joi.string().required(),
      // newpassword: Joi.string().required().trim().regex(passwordPattern),
      confirmPassword: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { password } = request.payload;
    const { user } = request.auth.credentials;
    if (user) {
      user.password = password;
      user.save(function(err) {
        if (err) throw err;
        reply('Change Password Complete.');
      });
    }
  },
};

const forgotPassword = {
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
          mailer.sentMailForgotPasswordLink(email);
          reply({ message:'please check your email'});
        });
      }
    });
  }
};

export default function(server) {
  server.route([
    { method: 'POST', path: '/login', config: login },
    { method: 'GET', path: '/logout', config: logout },
    { method: 'POST', path: '/forgot-password', config: forgotPassword },
    { method: 'PUT', path: '/user/change-password', config: changepassword },
  ]);
}
