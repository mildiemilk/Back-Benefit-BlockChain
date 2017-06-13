import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';

const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;

const remove = {
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
          reply(Boom.badData(`Email \'${email}\' existed`, { email }));
          console.log("Find");
          User.findOneAndRemove({ 'email': email }, function(err) {
            if (err) throw err;
            console.log('User deleted!');
          });
        }
      });
  },
};



export default function(app) {
  app.route([
    { method: 'POST', path: '/remove', config: remove },
  ]);
}
