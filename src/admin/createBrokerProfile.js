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
      email:Joi.string().required().email(),
      CompanyName: Joi.string().required(),
      location: Joi.string().required(),
      CompanyNumber: Joi.string().required(),
      CompanyWebsite: Joi.string().required(),
      BrokerSignature: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { email,CompanyName, location, CompanyNumber, CompanyWebsite, BrokerSignature} = request.payload;

    User.findOne({ email })
      .then((user) => {
        if(user){
          console.log(user);
          if( user.role == "BR" || user.role == "broker"){
            // let brokerdetail = new BrokerDetail({ CompanyName, CompanyWebsite, CompanyNumber, location, BrokerSignature, broker : user.refId});
            // brokerdetail.save(function(err) {
            //   if (err) throw err;
            //   reply('Profie has created');
            // });
            let brokerdetail = new BrokerDetail({
              BrokerCompanyName: CompanyName,
              BrokerCompanyWebsite: CompanyWebsite,
              BrokerCompanyNumber: CompanyNumber,
              location: location,
              BrokerSignature: BrokerSignature,
              broker: user.refId,
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
