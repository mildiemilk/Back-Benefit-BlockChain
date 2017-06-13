import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';


const Remove = {
  tags: ['api','remove'],

  validate: {
    payload: {
      email: Joi.string().required().email(),
    },
  },
  handler: (request, reply) => {

    const { email, password } = request.payload;
    User.findOne({ 'email': email, isRemoved: true }, function(err, contact) {
        //   isRemoved: true,
        //   removedAt: Mon Jan 04 2016 16:39:23 GMT-0800 (PST)
    });
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/Remove', config: Remove },
  ]);
}
