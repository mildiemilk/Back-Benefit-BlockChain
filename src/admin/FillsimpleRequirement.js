import Joi from 'joi';
import Boom from 'boom';
import { SimpleRequirement } from '../models';
import timestamps from 'mongoose-timestamp';



const FillsimpleRequirement = {

  tags: ['admin', 'api'],
  auth: 'jwt',
  validate: {
    payload: {
      NumberOfEmployee: Joi.string().required(),
      numberofwantedplan: Joi.string().required(),
      IPD: Joi.string().required(),
      OPD: Joi.string().required(),
      Dental: Joi.string().required(),
      Life: Joi.string().required(),
      other: Joi.string().required(),

    },
  },
  handler: (request, reply) => {
    const { NumberOfEmployee,numberofwantedplan,IPD,OPD,Dental,Life,other } = request.payload;
    const { user } = request.auth.credentials;
    const refId = user.refId;
    if (user.role=='HR'||user.role=='hr') {
      console.log(refId);
      let simpleRequirement = new SimpleRequirement({NumberOfEmployee,numberofwantedplan,IPD,OPD,Dental,Life,other});
      simpleRequirement.save().then(() => {
        reply('the simpleRequirement has complete');
      });
    }else reply('permission deny');
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/FillsimpleRequirement', config: FillsimpleRequirement },
  ]);
}
