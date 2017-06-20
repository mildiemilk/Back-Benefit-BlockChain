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
      companyNumber: Joi.string().required(),
      numberOfEmployee: Joi.string().required(),
      companyBroker: Joi.string().required(),
      companyInsurer: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { companyName, location, companyNumber, numberOfEmployee, companyBroker, companyInsurer } = request.payload;
    const { user } = request.auth.credentials;
    let hr = user._id;
    Company.findOne({ companyName })
      .then((company) => {

        if (company) {
          reply(Boom.badData('Company \'${companyName}\' existed', { companyName }));
        } else {
          company = new Company({ companyName, location, companyNumber, numberOfEmployee, companyBroker, companyInsurer, hr });
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
