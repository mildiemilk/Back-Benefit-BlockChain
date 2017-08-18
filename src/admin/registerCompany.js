import Joi from 'joi';
import Boom from 'boom';
import { Company, User } from '../models';

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
              User.findOneAndUpdate({ _id: hr }, { $set: { company: company._id }}, () => {
                console.log('create company complete!');
              });
              reply({profile: company,
                message: 'setting profile success'});
            });
          }
        });
    } else reply(Boom.badData('This page for HR only'));

  },
};

const setLogo = {
  auth: { strategy: 'jwt', scope: 'admin',},
  tags: ['admin', 'api'],
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data'
  },

  handler: (request, reply) => {
    const { file } = request.payload;
    const { storage } = request.server.app.services;
    const { user } = request.auth.credentials;

    storage.upload({ file }, (err, media) => {
      if (!err) {
        media.userId = user.id;
        media.save();
        User.findOne({ _id: user._id }).populate('company').exec((err, u) => {
          storage.getUrl(media.path, (err, url) => {
            if (!err) {
              u.company.logo = media._id;
              u.company.save();
              reply({logo: url});
            }
          });
        });
      }
    });
  }
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/registerCompany', config: registerCompany },
    { method: 'PUT', path: '/set-logo', config: setLogo },
  ]);
}
