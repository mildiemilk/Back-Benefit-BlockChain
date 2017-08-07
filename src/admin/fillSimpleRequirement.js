import Joi from 'joi';
import Boom from 'boom';
import { SimpleRequirement } from '../models';

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
      date: Joi.date().required(),   
    },
  },
  handler: (request, reply) => {
    const { numberOfEmployee, typeOfInsurance, IPD, OPD, dental, life, other, otherDes, date } = request.payload;
    const { user } = request.auth.credentials;
    let hr = user._id;
    if(user.role == 'HR'){
      let simpleRequirement = new SimpleRequirement({ numberOfEmployee, typeOfInsurance, IPD, OPD, dental, life, other, otherDes, hr, date });
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
          date:date, });
      });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

const getSimpleRequirements = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    if(user.role == 'HR'){
      SimpleRequirement.findOne({ hr: user._id })
      .then((simpleRequirement) => {
        reply(simpleRequirement);
      });
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/simpleRequirement', config: simpleRequirements },
    { method: 'GET', path: '/getSimpleRequirement', config: getSimpleRequirements},
  ]);
}
