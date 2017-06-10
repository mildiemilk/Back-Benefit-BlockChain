import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';

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
            reply({ id: user.id });
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
