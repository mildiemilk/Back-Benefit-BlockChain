import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';

const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;

const login = {
  tags: ['auth', 'api'],
  validate: {
    payload: {
      email: Joi.string().required().email().error(new Error('กรุณากรอกอีเมลและพาสเวิร์ดด้วยค่ะ')),
      password: Joi.string().required().trim().regex(passwordPattern).error(new Error('กรุณากรอกอีเมลและพาสเวิร์ดด้วยค่ะ')),
    },
  },
  handler: (request, reply) => {
    const { email, password } = request.payload;
    User.findOne({ email })
    .then((user) => {
      if (!user || user.emailConfirmedAt === null) {
        if (!user){
          reply(Boom.unauthorized('อีเมลหรือพาวเวิร์ดไม่ถูกต้อง'));  
        } else {
          reply(Boom.unauthorized('กรุณายืนยันอีเมลของคุณด้วยค่ะ'));
        }
      } else {
        let company = null;
        let approve = null;
        let logo = null;
        User.findOne({ _id: user._id }).populate('company.detail role').exec((err, uCompany) => {
          const role = uCompany.role.roleName;
          if (uCompany.company.detail) {
            company = uCompany.company.detail.companyName;
            approve = uCompany.company.detail.approve;
            logo = uCompany.company.detail.logo;
            if (uCompany.company.detail.deleted) {
              reply(Boom.unauthorized('สัญญาของคุณหมดอายุ กรุณาติดต่อเจ้าหน้าที่'));
            } else if (!uCompany.company.detail.approve && role !== 'Insurer') {
              reply(Boom.unauthorized('บริษัทของคุณยังไม่ได้อนุมัติ กรุณาติดต่อเจ้าหน้าที่'));
            } 
          }
          if (user.deleted) {
            reply(Boom.unauthorized('สัญญาของคุณหมดอายุ กรุณาติดต่อเจ้าหน้าที่'));
          } else if (!user.comparePassword(password)) {
            reply(Boom.unauthorized('อีเมลหรือพาวเวิร์ดไม่ถูกต้อง'));
          } else {
            const { auth } = request.server.app.services;
            const token = auth.createAuthToken(user);
          
            reply({
              token,
              companyName: company,
              logo: logo.link,
              approve: approve,
              role: role,
              personalVerify: user.personalVerify,
            });
          }
        });
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
    const { password, confirmPassword } = request.payload;
    const { user } = request.auth.credentials;
    if (user) {
      if(password !== confirmPassword)
      {
        console.log('password !== confirmPassword');
        if(user.comparePassword(password))
        {
          user.password = confirmPassword;
          user.save(function(err) {
            if (err) throw err;
            reply('Change Password Complete.');
          });
        } else {
          reply('Password is incorrect.');
        }
      } else {
        console.log('password === confirmPassword');
        user.password = password;
        user.save(function(err) {
          if (err) throw err;
          reply('Change Password Complete.');
        });
      }
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
