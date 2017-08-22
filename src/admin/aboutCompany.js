import Joi from 'joi';
import Boom from 'boom';
import fs from 'fs';
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
    const isPublic = true;

    storage.upload({ file }, { isPublic }, (err, media) => {
      console.log('err', err);
      console.log('media', media);
      if (!err) {
        media.userId = user.id;
        media.save();
        User.findOne({ _id: user._id }).populate('company').exec((err, u) => {
          storage.getUrl(media.path, (url) => {
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

const uploadEmployee = {
  auth: { strategy: 'jwt', scope: 'admin',},
  tags: ['admin', 'api'],
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data'
  },

  handler: (request, reply) => {
    const { file } = request.payload;
    const data = file;
    console.log('file', data);
    const { storage } = request.server.app.services;
    const { user } = request.auth.credentials;
    const info = {ext:'xlsx', mime: 'vsd.ms-excel'};

    if (data) {
      console.log('yey');
      let name = data.hapi.filename;
      let path = __dirname + "/" + name;
      console.log('path', path);
      let file = fs.createWriteStream(path);

      file.on('error', function (err) { 
        console.error(err); 
      });
      data.pipe(file);
      data.on('end', function (err) { 
        let ret = {
          filename: data.hapi.filename,
          headers: data.hapi.headers
        };
        reply(JSON.stringify(ret));
      });
    }
    storage.upload({ file }, { info }, (err, media) => {
      console.log('media', media);
      if (!err) {
        media.userId = user.id;
        media.save();
        User.findOne({ _id: user._id }).populate('company').exec((err, u) => {
          storage.getUrl(media.path, (url) => {
            if (!err) {
              console.log('upload complete');
              u.company.fileEmployee = media._id;
              u.company.save();
              reply({fileEmployee: url});
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
    { method: 'PUT', path: '/upload-employee', config: uploadEmployee },
  ]);
}
