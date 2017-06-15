import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';

const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;

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

export default function(app) {
  app.route([
    { method: 'POST', path: '/changepassword', config: changepassword },
  ]);
}
