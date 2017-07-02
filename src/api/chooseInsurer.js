import Joi from 'joi';
import Boom from 'boom';
import { SimpleRequirement } from '../models';
import Config from '../../config/config';
import timestamps from 'mongoose-timestamp';
import moment from 'moment';


const postBox = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      Insurer1: Joi.string().required(),
      Insurer2: Joi.string().required(),
      Insurer3: Joi.string().required(),
      Insurer4: Joi.string().required(),
      Insurer5: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { passwordToConfirm } = request.payload;
    const { user } = request.auth.credentials;
    console.log(user);
    if(user.role == 'HR'){
      reply({ message:'เลือก Insurer เรียบร้อยแล้ว' });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/postbox', config: postBox },
  ]);
}
