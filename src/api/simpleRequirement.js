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
      numberOfEmployee: Joi.number().required(),
      typeOfInsurance: Joi.string().required(),
      IPD: Joi.boolean().required(),
      OPD: Joi.boolean().required(),
      dental: Joi.boolean().required(),
      life: Joi.boolean().required(),
      other: Joi.boolean().required(),
      otherDes: Joi.string().allow(''),
    },
  },
  handler: (request, reply) => {
    const { numberOfEmployee, typeOfInsurance, IPD, OPD, dental, life, other, otherDes } = request.payload;
    const { user } = request.auth.credentials;
    console.log(user);
    if(user.role == 'HR'){
      let simpleRequirement = new SimpleRequirement({ numberOfEmployee, typeOfInsurance, IPD, OPD, dental, life, other, otherDes });
      console.log(simpleRequirement);
      simpleRequirement.save().then(() => {
        reply({ message:'กรอก simpleRequirement เรียนร้อยแล้ว'});
      });
    }else{
      reply({ message:'หน้านี้สำหรับ HR เท่านั้น'});
    }
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/simpleRequirement', config: simpleRequirements },
  ]);
}
