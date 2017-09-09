import Joi from 'joi';
import { User } from '../models';

const approve = {
  tags: ['admin','api'],
  validate: {
    payload: {
      email: Joi.string().required().email(),
    },
  },
  handler: (request, reply) => {
    const { email } = request.payload;
    User.findOne({ email: email }).populate('company.detail').exec((err, user) => {
      user.company.detail.approve = true;
      user.company.detail.save().then(() => {
        const { mailer } = request.server.app.services;
        mailer.sendMailApproveAccount(email);
        reply({ message:'Account Approved'});
      });
    });
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/approve', config: approve },
  ]);
}
