import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';

const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;
let email_user;
let userID;

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
    console.log('test1');

    User.findOne({ email })
      .then((user) => {
        email_user = email;
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
  tags: ['api'],
  validate: {
    payload: {
      email: Joi.string().required().email(),
      password: Joi.string().required().trim().regex(passwordPattern),
      newpassword: Joi.string().required().trim().regex(passwordPattern),
      repassword: Joi.string().required().trim().regex(passwordPattern),
    },
  },
  handler: (request, reply) => {
    const { email, password, newpassword, repassword } = request.payload;

    User.findOne({ email })
      .then((user) => {

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
      });
  },
};

export default function(server) {
  User.findOne({email: email_user},(err,obj)=>{
    if(!email_user == null){
      const userID = obj._id;
    }
    server.route([
      { method: 'POST', path: '/login', config: login },
      { method: 'GET', path: '/logout', config: logout }, 
      { method: 'POST', path: '/user/'+ userID +'/changepassword', config: changepassword },
    ]);
  });
}
