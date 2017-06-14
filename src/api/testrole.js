import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';
import timestamps from 'mongoose-timestamp';

const Testrole = {
  tags: ['api'],

  validate: {
    payload: {
      email: Joi.string().required().email(),
    },
  },
  handler: (request, reply) => {

    const { email } = request.payload;
    User.findOne({ 'email': email}, function(err,user) {
      reply({ role : user.role});
    });
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/Testrole', config: Testrole },
  ]);
}
