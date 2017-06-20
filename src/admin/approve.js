import Joi from 'joi';
import Boom from 'boom';
import { Company } from '../models';
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
    User.findOneAndUpdate({ email: email }, { $set: { ApproveFile: true }},() => {
      const { mailer } = request.server.app.services;
      mailer.sendMailApproveAccount(email);
      reply({ message:'Account Approved'});
    });   
  },
}  

export default function(app) {
  app.route([
    { method: 'POST', path: '/approve', config: approve },
  ]);
}
