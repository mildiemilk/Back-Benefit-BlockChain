import Joi from 'joi';
import Boom from 'boom';
import { Company } from '../models';
import timestamps from 'mongoose-timestamp';



const registerCompany = {
  auth: { strategy: 'jwt', scope: 'admin',},
  tags: ['admin', 'api'],
  validate: {
    payload: {
      CompanyName: Joi.string().required(),
      location: Joi.string().required(),
      CompanyNumber: Joi.string().required(),
      NumberOfEmployee: Joi.string().required(),
      CompanyBroker: Joi.string().required(),
      CompanyInsurer: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { CompanyName, location, CompanyNumber, NumberOfEmployee, CompanyBroker, CompanyInsurer } = request.payload;

    Company.findOne({ CompanyName })
      .then((company) => {

        if (company) {
          reply(Boom.badData('Company \'${CompanyName}\' existed', { CompanyName }));
        } else {
          company = new Company({ CompanyName, location, CompanyNumber, NumberOfEmployee, CompanyBroker, CompanyInsurer });
          company.save().then(() => {
            reply('Register Company complete!');
          });
        }

      });

  },
};


export default function(app) {
  app.route([
    { method: 'POST', path: '/registerCompany', config: registerCompany },
  ]);
}
