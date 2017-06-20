import Joi from 'joi';
import Boom from 'boom';
import { SimpleRequirement } from '../models';
import timestamps from 'mongoose-timestamp';



const fillSimpleRequirement = {

  tags: ['admin', 'api'],
  auth: 'jwt',
  validate: {
    payload: {
      numberOfEmployee: Joi.string().required(),
      numberOfPlan: Joi.string().required(),
      IPD: Joi.string().required(),
      OPD: Joi.string().required(),
      dental: Joi.string().required(),
      life: Joi.string().required(),
      other: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { numberOfEmployee,numberOfPlan,IPD,OPD,dental,life,other } = request.payload;
    const { user } = request.auth.credentials;
    const userId = user.userId;
    if (user.role=='HR'||user.role=='hr') {
      let simpleRequirement = new SimpleRequirement({userId,numberOfEmployee,numberOfPlan,IPD,OPD,dental,life,other});
      simpleRequirement.save().then(() => {
        reply('the simpleRequirement has complete');
      });
    }else reply('permission deny');
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/fillSimpleRequirement', config: fillSimpleRequirement },
  ]);
}
