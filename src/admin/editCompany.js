import Joi from 'joi';
import Boom from 'boom';
import { Company } from '../models';
import { User } from '../models';
import timestamps from 'mongoose-timestamp';

const editCompany = {
  auth: { strategy: 'jwt', scope: 'admin',},
  tags: ['admin', 'api'],
  validate: {
    payload: {
      companyName: Joi.string().required(),
      location: Joi.string().required(),
      companyNumber: Joi.string().required(),
      numberOfEmployee: Joi.string().required(),
      companyBroker: Joi.string().required(),
      companyInsurer: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { companyName, location, companyNumber, numberOfEmployee, companyBroker, companyInsurer } = request.payload;
    const { user } = request.auth.credentials;
    if(user){
      if( user.role == 'HR' || user.role == 'Hr'){
        Company.findOne({ 'CompanyName' : user.company})
          .then((company) => {
            if(company) {
              company.companyNumber         = companyNumber;
              company.location              = location;
              company.numberOfEmployee      = numberOfEmployee;
              company.companyBroker         = companyBroker;
              company.companyInsurer        = companyInsurer;
              company.save(function(err) {
                if (err) throw err;
                reply('Company has Edit.');
              });
            }
            else{
              reply(Boom.badData('Company \'${CompanyName}\'is not match', { companyName }));
            }
          });
      }
      else{
        reply(Boom.badData('Only Hr can edit it'));
      }
    }
    else{
      reply(Boom.badData('Email \'${email}\'is not  existed', { email }));
    }
  },
};


export default function(app) {
  app.route([
    { method: 'POST', path: '/editCompany', config: editCompany },
  ]);
}
