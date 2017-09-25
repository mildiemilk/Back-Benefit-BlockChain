import Joi from 'joi';

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
      user.detail.personalEmail = personalEmail;
      user.detail.phone_number = phone;
      user.detail.personalVerify = true;
      user.markModified('detail');
      user.emailConfirmedAt = Date.now();
      user.save(function(err) {
        if (err) {
          reply({ error: err });
        } else {
          reply({ message: "success" });
        }
      });
    }
  },
};


export default function(server) {
  server.route([
    { method: 'PUT', path: '/employee/updatePersonalDetails', config: updatePersonalDetails },
  ]);
}
