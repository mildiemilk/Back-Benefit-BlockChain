// import Joi from 'joi';
// import Boom from 'boom';
// import { User } from '../models';
// var fs = require('fs');
// var path = require('path');

// // var Common = require('./common'),
// var nodemailer = require('nodemailer');
// const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;

// const Verify ={
//   tags: ['Verify','api'],
//   validate: {
//     payload: {
//       email: Joi.string().required().email(),
      
//     },
//   },
  
// };

// exports.sentMailVerificationLink = function(user,token) {
//                 var from = Config.email.accountName+" Team<" + Config.email.username + ">";
//                 var mailbody = "<p>Thanks for Registering on "+Config.email.accountName+" </p><p>Please verify your email by clicking on the verification link below.<br/><a href='http://"+Config.server.host+":"+ Config.server.port+"/"+Config.email.verifyEmailUrl+"/"+token+"'>Verification Link</a></p>"
//                 HelperOption(from, user.userName , "Account Verification", mailbody);
//               };    

