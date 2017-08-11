import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';

const updatePersonalDetails = {
  tags: ['auth','api'],
  auth: 'jwt',
  validate: {
    payload: {
      personalEmail: Joi.string().required(),
      phone: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { personalEmail, phone } = request.payload;
    const { user } = request.auth.credentials;
    if (user) {
      user.personalEmail = personalEmail;
      user.phone = phone;
      user.personalVerify = true;
      user.save(function(err) {
        if (err) {
            reply({ error: err });
        } else {
            reply(user)
        }
      })
    }
  },
};


export default function(server) {
  server.route([
    { method: 'PUT', path: '/user/updatePersonalDetails', config: updatePersonalDetails },
  ]);
}
