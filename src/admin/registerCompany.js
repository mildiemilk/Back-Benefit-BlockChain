import Joi from 'joi';
import Boom from 'boom';
import { Company } from '../models';
import timestamps from 'mongoose-timestamp';



const registerCompany = {
  auth: { strategy: 'jwt', scope: 'admin',},
  tags: ['admin', 'api'],
  validate: {
    payload: {
      companyName: Joi.string().required(),
      location: Joi.string().required(),
      typeOfBusiness: Joi.string().required(),
      hrDetail: Joi.string().required(),
      numberOfEmployees: Joi.string().required(),
      tel: Joi.string().required(),
      companyBroker: Joi.string().required(),
      companyInsurer: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { companyName, location, typeOfBusiness, hrDetail, numberOfEmployees, tel, companyBroker, companyInsurer } = request.payload;
    const { user } = request.auth.credentials;
    let hr = user._id;
    if( user.role === 'HR' ) {
      Company.findOne({ companyName })
         .then((company) => {
           if (company) {
             reply(Boom.badData('Company already existed'));
           } else {
             company = new Company({ companyName, location, typeOfBusiness, hrDetail, numberOfEmployees, tel, companyBroker, companyInsurer, hr });
             company.save().then(() => {
               reply({message: 'Create Company Success'});
             });
           }
         });
    } else reply(Boom.badData('This page for HR only'));

  },
};


export default function(app) {
  app.route([
    { method: 'POST', path: '/registerCompany', config: registerCompany },
  ]);
}
