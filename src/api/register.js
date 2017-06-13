import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';
import Config from './Config';

var fs = require('fs');
var path = require('path');
var nodemailer = require('nodemailer');
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
          reply(Boom.badData(`Email \'${email}\' existed`, { email }));
        } else {
          user = new User({ email, password });
          user.save().then(() => {
            // reply({ id: user.id });
            const transporter = nodemailer.createTransport({
              service:'gmail',
              secure:false,
              port:25,
              auth: {
                user: 'punthitra.dits@gmail.com',
                pass: '',
              },
              tlsL:{
                rejectUnauthorized: false
              }
            });

            function mail(from, email, subject, mailbody){
              let HelperOption = {
                from: from,
                to: [email],
                subject: 'EmailVerify',
                text: 'Hello',
              }
            
              transporter.sendMail(HelperOption,(error,info) => {
                if(error){
                  console.log(error);
                }
                console.log("the message was sent");
                console.log(info);
                transporter.close(); // shut down the connection pool, no more messages
              });
              // exports.sentMailVerificationLink = function(user,token) {
              //   var from = Config.email.accountName+" Team<" + Config.email.username + ">";
              //   var mailbody = "<p>Thanks for Registering on "+Config.email.accountName+" </p><p>Please verify your email by clicking on the verification link below.<br/><a href='http://"+Config.server.host+":"+ Config.server.port+"/"+Config.email.verifyEmailUrl+"/"+token+"'>Verification Link</a></p>"
              //   HelperOption(from, user.userName , "Account Verification", mailbody);
              // };    
            }
            reply("Please confirm your email id by clicking on link in email")
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