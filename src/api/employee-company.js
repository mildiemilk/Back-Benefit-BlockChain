import Joi from 'joi';
import Boom from 'boom';
import exceltojson from 'xlsx-to-json-lc';
import fs from 'fs';
import { EmployeeCompany, User, Media, Role, BiddingRelation, EmployeeGroup, EmployeePlan, BenefitPlan } from '../models';

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
      if (!err) {
        media.userId = user.id;
        media.save();
        User.findOne({ _id: user._id }).populate('company.detail').exec((err, u) => {
          storage.getUrl(media.path, (url) => {
            if (!err) {
              u.company.detail.logo = { mediaId: media._id, link: url };
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
                    password: 'Benefit2017',
                    role,
                    company: user.company,
                    detail: {
                      employeeCode: employee.employee_code,
                      gender: employee.gender,
                      profilePic: null,
                      personalVerify: false,
                      personalEmail: null,
                      prefix: employee.prefix,
                      name: employee.name,
                      lastname: employee.lastname,
                      citizenId: employee.citizen_id,
                      phoneNumber: employee.phone_number,
                      typeOfEmployee: employee.type_of_employee,
                      title: employee.title,
                      department: employee.department,
                      level: employee.level,
                      startDate: employee.start_date,
                      benefitGroup: employee.benefit_group,
                      dateOfBirth: employee.date_of_birth,
                      accountNumber: employee.account_number,
                      bankName: employee.bank_name,
                      marriageStatus: employee.marriage_status,
                      familyDetail: [],
                    }
                  };
                  const newEmployee = new User(detail);
                  newEmployee.save().then((emp) => {
                    const { mailer } = request.server.app.services;
                    mailer.sendMailToEmployee(detail.email, detail.password);
                    resolve(emp);
                  });
                });
              });
              Promise.all(addEmployee).then(() => {
                const aggregatorOpts = [
                  { $match: { "company.detail": user.company.detail, "role": role } },
                  {
                    $group: {
                      _id: "$detail.benefitGroup",
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
const getFileEmployee = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }, (err, thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        EmployeeCompany.populate(user, {path: 'company.detail'}, (err, company) => {
          console.log(company);
          Media.populate(company, {path: 'company.detail.fileEmployee', select: 'name'}, (err, result) => {
            console.log('result', result);
            reply({ filename: result.company.detail.fileEmployee.name});          
          });
        });
        
      }else{    
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};
const getTemplate = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { storage } = request.server.app.services;
    const path = '625/442/8419e2b7c98caaa6f15ee0c7ad8cc2dd.xlsx';
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
      passwordToConfirm: Joi.string().required(),
      step: Joi.number().required(),
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
                  let effectiveDate = new Date(company.expiredInsurance);
                  let expiredDate = new Date(company.expiredInsurance);
                  effectiveDate.setDate(effectiveDate.getDate() + 1);
                  expiredDate.setFullYear(effectiveDate.getFullYear() + 1);
                  company.startInsurance = effectiveDate;
                  company.expiredInsurance = expiredDate;
                  company.save();

                  const role = roleId._id;
                  User.find({ 'company.detail': company, role, deleted: false }, (err, employees) => {
                    const setBenefitPlan = employees.map((employee) => {
                      return new Promise((resolve) => {
                        EmployeeGroup.findOne({ company, groupName: employee.detail.benefitGroup }).populate('defaultPlan').exec((err, group) => {
                          const employeePlan = new EmployeePlan({ user: employee, company, benefitPlan: group.defaultPlan, selectGroup: group.groupName });
                          employeePlan.save().then(() => {
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
    EmployeeGroup.find({ company: user.company.detail }, 'groupName type benefitPlan defaultPlan amount', (err, groups) => {
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
    const { user } = request.auth.credentials;
    const { employeeGroupId } = request.params;
    const { type, benefitPlan, defaultPlan } = request.payload;
    EmployeeGroup.findOne({ _id: employeeGroupId }, (err, group) => {
      group.type = type;
      group.benefitPlan = benefitPlan;
      group.defaultPlan = defaultPlan;
      group.save().then(() => {
        EmployeeGroup
        .find(
          { company: user.company.detail },
          'groupName type benefitPlan defaultPlan amount',
          (err, groups) => {
            reply(groups);
          });
      });
    });
  }
};

const summaryGroup = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    
    Role.findOne({ roleName: 'Employee' }).then((roleId) => {
      const role = roleId._id;
      const aggregatorOpts = [
        { $match: { "company.detail": user.company.detail, "role": role } },
        {
          $group: {
            _id: "$detail.benefitGroup",
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ];
      User.aggregate(aggregatorOpts).exec((err, groups) => {
        groups = groups.map(group => 
          Object.assign({}, { groupName: group._id, count: group.count })
        );
        User.count({ "company.detail": user.company.detail, "role": role }, (err, total) => {
          reply({ total, groups});
        });
      });
    });
  }
};

const summaryEmployeeBenefit = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const today = new Date();
    EmployeeCompany.populate(user, {path: 'company.detail', select: 'effectiveDate expiredDate'}, (err, result) => {
      const { effectiveDate, expiredDate } = result.company.detail;
      BenefitPlan.find({ company: user.company.detail, effectiveDate, expiredDate})
      .exec((err, benefitPlans) => {
        benefitPlans = benefitPlans.map(benefitPlan => benefitPlan._id);
        const aggregatorOpts = [
          { $match: { company: user.company.detail, benefitPlan: { $in: benefitPlans }}},
          {
            $group: {
              _id: { benefitPlan: '$benefitPlan', selectGroup: '$selectGroup', confirm: '$confirm'},
              countAll: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: '$_id.selectGroup',
              benefitPlan: { $push: '$_id.benefitPlan' },
              confirm: { $push: '$_id.confirm' },
              countPerPlan: { $push: '$countAll' },
              total: { $sum: '$countAll' },
            }, 
          },
          {
            $sort: { _id: 1 }
          }
        ];
        EmployeePlan.aggregate(aggregatorOpts)
        .exec((err, plans) => {
          BenefitPlan.populate(plans, {path: 'benefitPlan', select: 'benefitPlanName'}, (err, groups) => {
            const summary = groups.map((group) => {
              return new Promise((resolve) => {
                let plan = [];
                let confirm = [];
                let amountOfPlan = [];
                let defaultPlan;
                let type;
                const inProcess = new Promise((resolve) => {
                  EmployeeGroup.findOne({ groupName: group._id, company: user.company.detail })
                  .populate('benefitPlan defaultPlan')
                  .exec((err, empGroup) => {
                    type = empGroup.type;
                    plan = empGroup.benefitPlan.map(element => element.benefitPlanName);
                    defaultPlan = empGroup.defaultPlan.benefitPlanName;
                    plan.map(() => {
                      confirm.push(0);
                      amountOfPlan.push(0);
                    });
                    group.benefitPlan.map((benefitPlan, index) => {
                      const i = plan.indexOf(benefitPlan.benefitPlanName);
                      if (group.confirm[index]) {
                        confirm[i] += group.countPerPlan[index];
                      }
                      amountOfPlan[i] += group.countPerPlan[index];
                    });
                    resolve();
                  });
                });
                
                inProcess.then(() => {
                  resolve(Object.assign({}, {
                    groupName: group._id,
                    plan,
                    confirm,
                    amountOfPlan,
                    defaultPlan,
                    totalOfGroup: group.total,
                    type,
                  }));
                });
              });
            });
            Promise.all(summary).then((groups) => reply(groups));
          });
        });
      });
    });
    BenefitPlan.find({ company: user.company.detail, timeout: { $gte: today }})
    .exec((err, benefitPlans) => {
      benefitPlans = benefitPlans.map(benefitPlan => benefitPlan._id);
      const aggregatorOpts = [
        { $match: { company: user.company.detail, benefitPlan: { $in: benefitPlans }}},
        {
          $group: {
            _id: { benefitPlan: '$benefitPlan', selectGroup: '$selectGroup', confirm: '$confirm'},
            countAll: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.selectGroup',
            benefitPlan: { $push: '$_id.benefitPlan' },
            confirm: { $push: '$_id.confirm' },
            countPerPlan: { $push: '$countAll' },
            total: { $sum: '$countAll' },
          }, 
        },
        {
          $sort: { _id: 1 }
        }
      ];
      EmployeePlan.aggregate(aggregatorOpts)
      .exec((err, plans) => {
        BenefitPlan.populate(plans, {path: 'benefitPlan', select: 'benefitPlanName'}, (err, groups) => {
          const summary = groups.map((group) => {
            return new Promise((resolve) => {
              let plan = [];
              let confirm = [];
              let amountOfPlan = [];
              let defaultPlan;
              let type;
              const inProcess = new Promise((resolve) => {
                EmployeeGroup.findOne({ groupName: group._id, company: user.company.detail })
                .populate('benefitPlan defaultPlan')
                .exec((err, empGroup) => {
                  type = empGroup.type;
                  plan = empGroup.benefitPlan.map(element => element.benefitPlanName);
                  defaultPlan = empGroup.defaultPlan.benefitPlanName;
                  plan.map(() => {
                    confirm.push(0);
                    amountOfPlan.push(0);
                  });
                  group.benefitPlan.map((benefitPlan, index) => {
                    const i = plan.indexOf(benefitPlan.benefitPlanName);
                    if (group.confirm[index]) {
                      confirm[i] += group.countPerPlan[index];
                    }
                    amountOfPlan[i] += group.countPerPlan[index];
                  });
                  resolve();
                });
              });
              
              inProcess.then(() => {
                resolve(Object.assign({}, {
                  groupName: group._id,
                  plan,
                  confirm,
                  amountOfPlan,
                  defaultPlan,
                  totalOfGroup: group.total,
                  type,
                }));
              });
            });
          });
          Promise.all(summary).then((groups) => reply(groups));
        });
      });
    });
  }
};

const addEmployee = {
  tags: ['api'],
  auth: 'jwt',
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data'
  },
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { file } = request.payload;
    let { detail } = request.payload;
    const { storage } = request.server.app.services;
    const isPublic = true;
    detail = JSON.parse(detail);

    Role.findOne({ roleName: 'Employee' }).then((roleId) => {
      const role = roleId._id;
      const company = user.company;
      const data = {
        email: detail.email,
        password: 'Benefit2017',
        role,
        company,
        detail: {
          ...detail,
          personalVerify: false,
          profilePic: null,
        }
      };
      if(file) {
        storage.upload({ file }, { isPublic }, (err, media) => {
          if (!err) {
            media.userId = user.id;
            media.save();
            storage.getUrl(media.path, (url) => {
              if (!err) {
                data.detail.profilePic = { mediaId: media._id, link: url };
                const newEmployee = new User(data);
                newEmployee.save().then((employee) => {
                  const { mailer } = request.server.app.services;
                  mailer.sendMailToEmployee(data.email, data.password);
                  EmployeeGroup.findOne({ _id: employee._id }).populate('defaultPlan').exec((err, group) => {
                    const employeePlan = new EmployeePlan({ user: employee._id, company, benefitPlan: group.defaultPlan, selectGroup: group.groupName });
                    employeePlan.save().then(() => {
                      reply({ message: "add employee success" });
                    });
                  });
                });
              }
            });
          }
        });
      } else {
        const newEmployee = new User(data);
        newEmployee.save().then((employee) => {
          const { mailer } = request.server.app.services;
          mailer.sendMailToEmployee(data.email, data.password);
          EmployeeGroup.findOne({ _id: employee._id }).populate('defaultPlan').exec((err, group) => {
            const employeePlan = new EmployeePlan({ user: employee._id, company, benefitPlan: group.defaultPlan, selectGroup: group.groupName });
            employeePlan.save().then(() => {
              reply({ message: "add employee success" });
            });
          });
        });
      }
    });
  }
};

// const summaryEmployee = {
//   tags: ['api'],
//   auth: 'jwt',

//   handler: (request, reply) => {
//     const { user } = request.auth.credentials;
//     Role.findOne({ roleName: 'Employee' }).then((roleId) => {
//       const role = roleId._id;
//       const month = new Date().getMonth();
//       const aggregatorOpts = [
//         { $project: { 'detail.effectiveDate': { $ifNull: [ { $month: "$detail.effectiveDate" }, 0 ]}}},
//         { $match: { company: user.company, role, deleted: false, 'detail.effectiveDate' : { $month: month }}},
//         {
//           $group: {
//             _id: "$detail.type_of_employee",
//             count: { $sum: 1 }
//           }
//         },
//         {
//           $sort: { _id: 1 }
//         }
//       ];
//       User.aggregate(aggregatorOpts).exec((err, employees) => {
//         reply(employees);
//       });
//     });
//   }
// };


export default function(app) {
  app.route([
    { method: 'POST', path: '/company/register-company', config: registerCompany },
    { method: 'PUT', path: '/company/set-logo', config: setLogo },
    { method: 'POST', path: '/company/upload-employee', config: uploadEmployee },
    { method: 'GET', path: '/company/get-file-employee', config: getFileEmployee },
    { method: 'GET', path: '/company/get-template', config: getTemplate },
    { method: 'PUT', path: '/company/upload-claimdata', config: uploadClaimData },
    { method: 'GET', path: '/company/get-employee', config: getEmployee },
    { method: 'DELETE', path: '/company/delete-employee', config: deleteEmployee },
    { method: 'POST', path: '/company/add-employee', config: addEmployee },
    { method: 'GET', path: '/company/get-claim-data', config: getClaimData },
    { method: 'PUT', path: '/company/set-complete-step', config: setCompleteStep },
    { method: 'GET', path: '/company/get-complete-step', config: getCompleteStep },
    { method: 'GET', path: '/company/get-group-benefit', config: getGroupBenefit },
    { method: 'PUT', path: '/company/set-group-benefit/{employeeGroupId}', config: setGroupBenefit },
    { method: 'GET', path: '/company/summary-group', config: summaryGroup },
    { method: 'GET', path: '/company/summary-employee-benefit', config: summaryEmployeeBenefit },
    // { method: 'GET', path: '/company/summary-employee', config: summaryEmployee },
  ]);
}
