import Joi from 'joi';
import Boom from 'boom';
import exceltojson from 'xlsx-to-json-lc';
import fs from 'fs';
import { EmployeeCompany, User, Media, Role, BiddingRelation, EmployeeGroup } from '../models';

const registerCompany = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      companyName: Joi.string().required(),
      location: Joi.string().required(),
      typeOfBusiness: Joi.string().required(),
      hrDetail: Joi.string().required(),
      numberOfEmployees: Joi.number().required(),
      tel: Joi.string().required(),
      startInsurance: Joi.date().required(),
      expiredInsurance: Joi.date().required(),
    },
  },
  handler: (request, reply) => {
    const { companyName, location, typeOfBusiness, hrDetail, numberOfEmployees, tel, startInsurance, expiredInsurance} = request.payload;
    const { user } = request.auth.credentials;
    let hr = user._id;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role = thisRole.roleName;
      if( role === 'HR' ) {
        EmployeeCompany.findOne({ companyName })
          .then((company) => {
            if (company) {
              reply(Boom.badData('EmployeeCompany already existed'));
            } else {
              company = new EmployeeCompany({ companyName, location, typeOfBusiness, hrDetail, numberOfEmployees, tel, createdBy: hr, startInsurance, expiredInsurance });
              company.save().then(() => {
                User.findOneAndUpdate({ _id: hr }, { $set: { company: {kind: 'EmployeeCompany', detail: company._id} }}, () => {
                  console.log('create company complete!');
                });
                reply({profile: company,
                  message: 'setting profile success'});
              });
            }
          });
      } else reply(Boom.badData('This page for HR only'));  
    });
  },
};

const setLogo = {
  tags: ['api'],
  auth: 'jwt',
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
        User.findOne({ _id: user._id }).populate('company.detail').exec((err, u) => {
          storage.getUrl(media.path, (url) => {
            if (!err) {
              u.company.detail.logo = { logoId: media._id, link: url };
              u.company.detail.save();
              reply({logo: url});
            }
          });
        });
      }
    });
  }
};

const uploadEmployee = {
  tags: ['api'],
  auth: 'jwt',
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
            let role;
            Role.findOne({ roleName: 'Employee' }).then((roleId) => {
              role = roleId._id;
              const addEmployee = result.map((employee) => {
                //---------------random password---------------------------------
                // const num = Math.round(Math.random()*26);
                // const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                // const password = Math.random().toString(36).slice(-8) + alpha[num];
                //---------------------------------------------------------------
                return new Promise((resolve) => {
                  const detail = {
                    email: employee.email,
                    password: 'Donut555',
                    role,
                    company: user.company,
                    detail: {
                      employee_code: employee.employee_code,
                      profilePic: null,
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
                  newEmployee.save().then((emp) => {
                    // const { mailer } = request.server.app.services;
                    // mailer.sendMailToEmployee(detail.email, detail.password);
                    resolve(emp);
                  });
                });
              });
              Promise.all(addEmployee).then(() => {
                const aggregatorOpts = [
                  { $match: { "company.detail": user.company.detail, "role": role } },
                  {
                    $group: {
                      _id: "$detail.benefit_group",
                      count: { $sum: 1 }
                    }
                  }
                ];
                User.aggregate(aggregatorOpts).exec((err, groups) => {
                  groups.sort((a, b) => {
                    var nameA = a._id.toUpperCase(); // ignore upper and lowercase
                    var nameB = b._id.toUpperCase(); // ignore upper and lowercase
                    if (nameA < nameB) {
                      return -1;
                    }
                    if (nameA > nameB) {
                      return 1;
                    }
                    // names must be equal
                    return 0;
                  });
                  groups.map((element) => {
                    const company = user.company.detail;
                    const groupName = element._id;
                    const amount = element.count;
                    const newGroup = new EmployeeGroup({ company, groupName, amount });
                    newGroup.save();
                  });
                });
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
          User.findOne({ _id: user._id }).populate('company.detail').exec((err, u) => {
            storage.getUrl(media.path, (url) => {
              if (!err) {
                u.company.detail.fileEmployee = media._id;
                u.company.detail.save();
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
  tags: ['api'],
  auth: 'jwt',
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
  tags: ['api'],
  auth: 'jwt',
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data'
  },

  handler: (request, reply) => {
    let { file } = request.payload;
    const { storage } = request.server.app.services;
    const { user } = request.auth.credentials;

    if (!Array.isArray(file)) {
      file = [file];
    }
    
    const files = file.map((element) => {
      let info = null;
      if(element.hapi.headers['content-type'] === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        info = {ext:'xlsx', mime: 'vnd.ms-excel'};
      }
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
      User.findOne({ _id: user._id }).populate('company.detail').exec((err, u) => {
        u.company.detail.claimData = result;
        u.company.detail.save().then((result) => {
          reply(result);
        });  
      });
    });
  }
};

const getClaimData = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        User.findOne({ _id: user._id }).populate('company.detail').exec((err, u) => {
          const files = u.company.detail.claimData.map(element => {
            return new Promise((resolve) => {
              Media.findOne({ _id: element })
              .then((media) => {
                resolve(media);
              });
            });
          });
          Promise.all(files).then((result) => {
            reply(result);
          });
        });
      }else{    
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const getEmployee = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ roleName: 'Employee' }).then((roleId) => {
      const role = roleId._id;
      User.find({ company: user.company, role, deleted: false }, 'email detail', (err, employees) => {
        reply(employees);
      });
    });
  }
};

const deleteEmployee = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      employeeId: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { employeeId } = request.payload;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        User.findOne({ _id: employeeId, deleted: false }, (err, employee) => {
          employee.delete(() => {
            reply({ message: 'User has deleted' });
          });
        });
      }else{    
        reply(Boom.badData('This page for HR only'));
      }
    });
  }
};

const setCompleteStep = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      step: Joi.number().required(),
      passwordToConfirm: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { step, passwordToConfirm } = request.payload;
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        if (!user.comparePassword(passwordToConfirm)) {
          reply(Boom.badData('Invalid password'));
        } else {
          User.findOne({ _id: user._id }).populate('company.detail').exec((err, u) => {
            if (err) reply(err);
            u.company.detail.completeStep[step] = true;
            u.company.detail.markModified('completeStep');
            u.company.detail.save().then((company)=>{
              if (step === 0) {
                BiddingRelation.findOne({ company: user.company.detail }).then((bidding) => {
                  bidding.confirmed = true;
                  bidding.save().then(() => {
                    reply(company.completeStep);
                  });
                });
              } else if (step === 2) {
                Role.findOne({ roleName: 'Employee' }).then((roleId) => {
                  const role = roleId._id;
                  User.find({ company: user.company, role, deleted: false }, (err, employees) => {
                    const setBenefitPlan = employees.map((employee) => {
                      return new Promise((resolve) => {
                        EmployeeGroup.findOne({ groupName: employee.detail.benefit_group }, (err, group) => {
                          employee.detail.benefit_plan = group.defaultPlan;
                          employee.markModified('detail');
                          employee.save().then(() => {
                            resolve(true);
                          });
                        });
                      });
                    });
                    Promise.all(setBenefitPlan).then(() => {
                      reply(company.completeStep);
                    });
                  });
                });
              } else reply(company.completeStep);
            });
          });
        }
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const getCompleteStep = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    User.findOne({ _id: user._id }).populate('company.detail').exec((err, u) => {
      reply(u.company.detail.completeStep);
    });
  },
};

const getGroupBenefit = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    EmployeeGroup.find({ company: user.company.detail }, 'groupName type benefitPlan defualtPlan amount selected', (err, groups) => {
      reply(groups);
    });
  }
};

const setGroupBenefit = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      type: Joi.string().required(),
      benefitPlan: Joi.array().required(),
      defaultPlan: Joi.string().required(),
    },
    params: {
      employeeGroupId: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { employeeGroupId } = request.params;
    const { type, benefitPlan, defaultPlan } = request.payload;
    EmployeeGroup.findOne({ _id: employeeGroupId }, (err, group) => {
      group.type = type;
      group.benefitPlan = benefitPlan;
      group.defaultPlan = defaultPlan;
      group.save().then(() => {
        reply({ message: 'set group benefit completed' });
      });
    });
  }
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/company/register-company', config: registerCompany },
    { method: 'PUT', path: '/company/set-logo', config: setLogo },
    { method: 'POST', path: '/company/upload-employee', config: uploadEmployee },
    { method: 'GET', path: '/company/get-template', config: getTemplate },
    { method: 'PUT', path: '/company/upload-claimdata', config: uploadClaimData },
    { method: 'GET', path: '/company/get-employee', config: getEmployee },
    { method: 'DELETE', path: '/company/delete-employee', config: deleteEmployee },
    { method: 'GET', path: '/company/get-claim-data', config: getClaimData },
    { method: 'PUT', path: '/company/set-complete-step', config: setCompleteStep },
    { method: 'GET', path: '/company/get-complete-step', config: getCompleteStep },
    { method: 'GET', path: '/company/get-group-benefit', config: getGroupBenefit },
    { method: 'PUT', path: '/company/set-group-benefit/{employeeGroupId}', config: setGroupBenefit },

  ]);
}
