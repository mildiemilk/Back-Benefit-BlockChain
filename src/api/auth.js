import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';

const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;

const login = {
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
        if (!user) {
          reply(Boom.unauthorized('Invalid email or password'));
        } else {
          if (!user.comparePassword(password)) {
            reply(Boom.unauthorized('Invalid email or password'));
          } else {
            const { authService } = request.server.app;
            const token = authService.createAuthToken(user);
  
            reply({ token });
          }
        }
      });
  },
};

const logout = {
  auth: 'jwt',
  handler: (request, reply) => {
    reply("OK");
  },
};

export default function(server) {
  server.route([
    { method: 'POST', path: '/login', config: login },
    { method: 'GET', path: '/logout', config: logout },
  ]);
}
