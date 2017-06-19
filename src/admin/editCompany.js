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
      email:Joi.string().required().email(),
      CompanyName: Joi.string().required(),
      location: Joi.string().required(),
      CompanyNumber: Joi.string().required(),
      NumberOfEmployee: Joi.string().required(),
      CompanyBroker: Joi.string().required(),
      CompanyInsurer: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { email,CompanyName, location, CompanyNumber, NumberOfEmployee, CompanyBroker, CompanyInsurer } = request.payload;

    User.findOne({ email })
      .then((user) => {
        if(user){
          console.log(user);
          Company.findOne({ 'CompanyName' : user.company})
            .then((company) => {
              if(company) {
                company.CompanyNumber         = CompanyNumber;
                company.location              = location;
                company.NumberOfEmployee      = NumberOfEmployee;
                company.CompanyBroker         = CompanyBroker;
                company.CompanyInsurer        = CompanyInsurer;
                company.save(function(err) {
                  if (err) throw err;
                  reply('Company has Edit.');
                });
              }
              else{
                reply(Boom.badData('Company \'${CompanyName}\'is not match', { CompanyName }));
              }
            });
        }
        else{
          reply(Boom.badData('Email \'${email}\'is not  existed', { email }));
        }
      });
  },
};


export default function(app) {
  app.route([
    { method: 'POST', path: '/editCompany', config: editCompany },
  ]);
}
