import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';
import timestamps from 'mongoose-timestamp';

const Remove = {
  tags: ['api','remove'],

  validate: {
    payload: {
      email: Joi.string().required().email(),
    },
  },
  handler: (request, reply) => {

    const { email } = request.payload;
    User.findOne({ 'email': email}, function(err,user) {
      user.delete(function(err){
        if (err) throw err;
      });
      reply(Boom.unauthorized('already remove'));
    });
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/Remove', config: Remove },
  ]);
}
