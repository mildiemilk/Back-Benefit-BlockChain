import Joi from 'joi';
import Boom from 'boom';
import { SimpleRequirement } from '../models';
import Config from '../../config/config';
import timestamps from 'mongoose-timestamp';
import moment from 'moment';


const simpleRequirements = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      numberOfEmployee: Joi.string().required(),
      typeOfInsurance: Joi.string().required(),
      IPD: Joi.boolean().required(),
      OPD: Joi.boolean().required(),
      dental: Joi.boolean().required(),
      life: Joi.boolean().required(),
      other: Joi.boolean().required(),
      otherDes: Joi.string().allow(''),
      day: Joi.string().required(),
      month: Joi.string().required(),
      year: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { numberOfEmployee, typeOfInsurance, IPD, OPD, dental, life, other, otherDes, day, month, year } = request.payload;
    const { user } = request.auth.credentials;
    console.log(user);
    if(user.role == 'HR'){
      let simpleRequirement = new SimpleRequirement({ numberOfEmployee, typeOfInsurance, IPD, OPD, dental, life, other, otherDes, day, month, year });
      console.log(simpleRequirement);
      simpleRequirement.save().then(() => {
        reply({ message:'กรอก simpleRequirement เรียนร้อยแล้ว',
          numberOfEmployee:numberOfEmployee,
          typeOfInsurance:typeOfInsurance,
          IPD:IPD,
          OPD:OPD,
          dental:dental,
          life:life,
          other:other,
          otherDes:otherDes,
          day:day,
          month:month,
          year:year });
      });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/simpleRequirement', config: simpleRequirements },
  ]);
}
