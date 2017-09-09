import Joi from 'joi';
import { Role } from '../models';

const addRole = {
  tags: ['admin','api'],
  validate: {
    payload: {
      roleName: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { roleName } = request.payload;
    Role.findOne({ roleName }).then(findRole => {
      if(!findRole) {
        const newRole = new Role({ roleName });
        newRole.save().then((result) => {
          reply(result);
        });
      }
      else reply('The role already exist!');
    });
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/add-role', config: addRole },
  ]);
}
