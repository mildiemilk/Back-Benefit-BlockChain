import Joi from 'joi';
import Boom from 'boom';
import exceltojson from 'xlsx-to-json-lc';
import fs from 'fs';
import { Company, User, Media } from '../models';

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
    const { storage } = request.server.app.services;
    const { user } = request.auth.credentials;
    const info = {ext:'xlsx', mime: 'vnd.ms-excel'};
    const name = data.hapi.filename;
    const path = __dirname + "/" + name;
    //------------save to directory---------------//
    if (data) {
      let file = fs.createWriteStream(path);
      file.on('error', function (err) { 
        console.error(err); 
      });
      data.pipe(file);
      file.on('finish', function(err){
        if(err) console.log('file:error', err);
        //-----------convert-to-json------------------
        exceltojson({
          input: path,
          output: null,
          lowerCaseHeaders: true //to convert all excel headers to lowr case in json
        }, function(err, result) {
          if(err) {
            console.error(err);
          } else {
            console.log(result);
            result.map((employee) => {
              const detail = {
                email: employee.email,
                password: 'Donut555',
                role: 'Employee',
                company: user.company,
                detail: {
                  employee_code: employee.employee_code,
                  prefix: employee.prefix,
                  name: employee.name,
                  lastname: employee.lastname,
                  citizen_id: employee.citizen_id,
                  phone_number: employee.phone_number,
                  type_of_employee: employee.type_of_employee,
                  title: employee.title,
                  department: employee.department,
                  level: employee.level,
                  start_date: employee.start_date,
                  benefit_group: employee.benefit_group,
                  date_of_birth: employee.date_of_birth,
                  account_number: employee.account_number,
                  bank_name: employee.bank_name,
                  marriage_status: employee.marriage_status,
                }
              };
              const newEmployee = new User(detail);
              newEmployee.save().then(() => {
                const { mailer } = request.server.app.services;
                mailer.sendMailToEmployee(detail.email, detail.password);
              });
            });
          }
        });
      });
      //------------upload to S3-----------------//
      storage.upload({ file: data }, { info }, (err, media) => {
        if (err) reply(err);
        if (!err) {
          media.userId = user.id;
          media.save();
          User.findOne({ _id: user._id }).populate('company').exec((err, u) => {
            storage.getUrl(media.path, (url) => {
              if (!err) {
                u.company.fileEmployee = media._id;
                u.company.save();
                fs.unlink(path, (err) => {
                  if (err) throw err;
                  reply({fileEmployee: url});
                });
              }
            });
          });
        }
      });
    }
  }
};

const getTemplate = {
  auth: { strategy: 'jwt', scope: 'admin',},
  tags: ['admin', 'api'],
  handler: (request, reply) => {
    const { storage } = request.server.app.services;
    const path = '860/864/8d92ac9fbfec93f6b7e1f10e5cb149e7.xlsx';
    storage.download(path, (err, data) => {
      if (err) {
        reply(err);
      } else {
        Media.findOne({ path }, (err, media) => {
          if (err) {
            reply(err);
          } else {
            const filename = 'attachment; filename='+ media.name + ';';
            reply(data.Body).header('Content-Type', media.mime)
            .header('content-disposition', filename);
          }
        });
      }
    });
  }
};

const uploadClaimData = {
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
    const info = {ext:'xlsx', mime: 'vnd.ms-excel'};

    const files = file.map((element) => {
      return new Promise((resolve, reject) => {
        storage.upload({ file: element }, { info }, (err, media) => {
          if (!err) {
            media.userId = user.id;
            media.save();
            const url = media._id;
            resolve(url);
          } else reject(err);
        });
      });
    });

    Promise.all(files).then((result) => {
      User.findOne({ _id: user._id }).populate('company').exec((err, u) => {
        u.company.claimData = result;
        u.company.save().then(() => {
          reply(result);
        });  
      });
    });
  }
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/registerCompany', config: registerCompany },
    { method: 'PUT', path: '/set-logo', config: setLogo },
    { method: 'PUT', path: '/upload-employee', config: uploadEmployee },
    { method: 'GET', path: '/get-template', config: getTemplate },
    { method: 'PUT', path: '/upload-claimdata', config: uploadClaimData },
  ]);
}
