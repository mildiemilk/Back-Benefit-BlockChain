import Joi from 'joi';
import Boom from 'boom';
import { User } from '../models';

<<<<<<< Updated upstream
const passwordPattern = /^(?=.*\d)(?=.*[A-Z]).{8,20}/;

const remove = {
  tags: ['api'],
=======
const Remove = {
  tags: ['api','remove'],
>>>>>>> Stashed changes
  validate: {
    payload: {
      email: Joi.string().required().email(),
    },
  },
  handler: (request, reply) => {
<<<<<<< Updated upstream
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
=======
    const { email, password } = request.payload;

    User.findOne({ email })
      .then((user) => {

        User.findOneAndRemove({ email }, function(err) {
          if (err) throw err;

            // we have deleted the user
          reply('User deleted!');
        });
      }
      );
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/Remove', config: Remove },
  ]);
}
>>>>>>> Stashed changes
