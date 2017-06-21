import Joi from 'joi';
import Boom from 'boom';
import { BrokerDetail } from '../models';
import { User } from '../models';
import timestamps from 'mongoose-timestamp';



const createBrokerProfile = {
  auth: { strategy: 'jwt', scope: 'admin',},
  tags: ['admin', 'api'],
  validate: {
    payload: {
      companyName: Joi.string().required(),
      location: Joi.string().required(),
      companyNumber: Joi.string().required(),
      companyWebsite: Joi.string().required(),
      brokerSignature: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { email,companyName, location, companyNumber, companyWebsite, brokerSignature} = request.payload;

    User.findOne({ email })
      .then((user) => {
        if(user){
          console.log(user);
          if( user.role == "BR" || user.role == "broker"){
            let brokerdetail = new BrokerDetail({
              brokerCompanyName: companyName,
              brokerCompanyWebsite: companyWebsite,
              brokerCompanyNumber: companyNumber,
              location: location,
              brokerSignature: brokerSignature,
              broker: user._id,
            });
            brokerdetail.save(function(err) {
              if (err) throw err;
              reply('Profie has created');
            });
          }
          else{
            reply(Boom.badData('The user are not Broker'));
          }
        }
      });
  },
};


export default function(app) {
  app.route([
    { method: 'POST', path: '/createBrokerProfile', config: createBrokerProfile },
  ]);
}
