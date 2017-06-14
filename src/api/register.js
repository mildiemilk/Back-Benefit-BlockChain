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
      role: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { email, password,role } = request.payload;

    User.findOne({ email })
      .then((user) => {

        if (user) {
          reply(Boom.badData('Email \'${email}\' existed', { email }));
          User.findOneAndRemove({email}, function (err) {
            if (err) throw err;
            console.log('remove complete!');
          });
        
        } else {
          user = new User({ email, password ,role });
          user.save().then(() => {
<<<<<<< Updated upstream
            const { mailer } = request.server.app.services;
            let to = email;
            let subject = 'verify your email';
            let mailbody = 'click link to verify your account!';
            mailer.sendMail(to,subject,mailbody);
            reply('Register complete! plaese click confirm link in your email');
=======
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
>>>>>>> Stashed changes
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
