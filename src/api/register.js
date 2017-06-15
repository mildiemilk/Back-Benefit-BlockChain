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
<<<<<<< HEAD
            let to = email;
            let subject = 'verify your email';
            let mailbody = 'click link to verify your account!';
            mailer.sendMail(to,subject,mailbody);
            reply('Register complete! plaese click confirm link in your email');
            // reply({ id: user.id });
            // const transporter = nodemailer.createTransport({
            //   service:'gmail',
            //   secure:false,
            //   port:25,
            //   auth: {
            //     user: 'punthitra.dits@gmail.com',
            //     pass: '',
            //   },
            //   tlsL:{
            //     rejectUnauthorized: false
            //   }
            // });

            // function mail(from, email, subject, mailbody){
            //   let HelperOption = {
            //     from: from,
            //     to: [email],
            //     subject: 'EmailVerify',
            //     text: 'Hello',
            //   }

              // transporter.sendMail(HelperOption,(error,info) => {
              //   if(error){
              //     console.log(error);
              //   }
              //   console.log("the message was sent");
              //   console.log(info);
              //   transporter.close(); // shut down the connection pool, no more messages
              // });
              // exports.sentMailVerificationLink = function(user,token) {
              //   var from = Config.email.accountName+" Team<" + Config.email.username + ">";
              //   var mailbody = "<p>Thanks for Registering on "+Config.email.accountName+" </p><p>Please verify your email by clicking on the verification link below.<br/><a href='http://"+Config.server.host+":"+ Config.server.port+"/"+Config.email.verifyEmailUrl+"/"+token+"'>Verification Link</a></p>"
              //   HelperOption(from, user.userName , "Account Verification", mailbody);
              // };
            // }
            reply("Please confirm your email id by clicking on link in email")
=======
            mailer.sentMailVerificationLink(Date.now(),email);
            reply({ message:'Register complete! plaese click confirm link in your email'});
>>>>>>> cb280e8e4948f7754e6e72087ea6bbc32f4c3bb4
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
          reply('You account is verified');
        });
      } else reply('invalid');
    } else reply('Link expired DN ='+DateNow+' DV='+Dateconfirm);
    
  },
};


export default function(app) {
  app.route([
    { method: 'POST', path: '/register', config: register },
    { method: 'GET', path: '/register-confirmation/{email}&{token}&{ts}&{nounce}', config: verify },
  ]);
}