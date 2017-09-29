import Joi from 'joi';
import Boom from 'boom';
import exceltojson from 'xlsx-to-json-lc';
import fs from 'fs';
import moment from 'moment';
import { EmployeeCompany, User, Media, Role,
  BiddingRelation, EmployeeGroup, EmployeePlan,
  BenefitPlan, EmployeeLog, TemplatePlan } from '../models';

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
    allow: 'multipart/form-data',
    maxBytes: 20000000,
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
    allow: 'multipart/form-data',
    maxBytes: 20000000,
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
                // const password = Math.random().toString(36).slice(-8) + alpha[num]; //may be base 58
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
                      policyNumber: null,
                      memberNumber: null,
                      prefix: employee.prefix,
                      name: employee.name,
                      lastname: employee.lastname,
                      citizenId: employee.citizen_id,
                      phoneNumber: employee.phone_number,
                      typeOfEmployee: employee.type_of_employee,
                      title: employee.title,
                      department: employee.department,
                      level: employee.level,
                      endDate: null,
                      startDate: employee.start_date,
                      nationality: employee.nationality,
                      benefitPlan: employee.benefit_plan,
                      address: employee.address,
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
    allow: 'multipart/form-data',
    maxBytes: 20000000,
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
      User.find({ company: user.company, role, deleted: false }, 'email detail', {sort: {'detail.employeeCode': 1}}, (err, employees) => {
        const getLog = employees.map(emp => {
          return new Promise((resolve) => {
            EmployeeLog.findOne({ user: emp._id, effectiveDate: { $gt: Date.now()} })
            .select('-createdAt -updateAt -__v -deleted').then((log) => {
              if(log) {
                let status;
                switch(log.status) {
                  case 'new' : status = 'พนักงานใหม่'; break;
                  case 'promote' : status = 'ปรับตำแหน่ง'; break;
                  case 'resign' : status = 'ลาออก'; break;
                }
                emp.detail.status = status;
                emp.detail.effectiveDate = log.effectiveDate;
                emp = {
                  ...emp._doc,
                  log,
                };
              } else {
                emp.detail.status = 'พนักงาน';
                emp.detail.effectiveDate = '-';
                emp.log = null;
                emp = {
                  ...emp._doc,
                  log,
                };
              }
              resolve(emp);
            });
          });
        });
        Promise.all(getLog).then((emps) => {
          reply(emps);
        });
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
                          employee.detail.benefiPlan = group.defaultPlan.benefitPlanName;
                          employee.markModified('detail');
                          employee.save();
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
        { $match: { "company.detail": user.company.detail, "role": role, deleted: false } },
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
        User.count({ "company.detail": user.company.detail, "role": role, deleted: false }, (err, total) => {
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
    EmployeeCompany.populate(user, {path: 'company.detail', select: 'startInsurance expiredInsurance'}, (err, result) => {
      const effectiveDate = result.company.detail.startInsurance;
      const expiredDate = result.company.detail.expiredInsurance;
      BenefitPlan.find({ company: user.company.detail, effectiveDate, expiredDate})
      .exec((err, benefitPlans) => {
        benefitPlans = benefitPlans.map(benefitPlan => benefitPlan._id);
        const aggregatorOpts = [
          { $match: { company: user.company.detail._id, benefitPlan: { $in: benefitPlans }}},
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
                }).then(() => {
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
  }
};

const addEmployee = {
  tags: ['api'],
  auth: 'jwt',
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data',
    maxBytes: 20000000,
  },
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { file } = request.payload;
    let { detail } = request.payload;
    const { storage } = request.server.app.services;
    const isPublic = true;
    detail = JSON.parse(detail);
    const isStart = moment(detail.startDate).isAfter(Date.now());
    console.log('isStart', isStart, detail.startDate, detail);

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
                  EmployeeGroup.findOne({ groupName: employee.detail.benefitGroup, company: employee.company.detail })
                  .populate('defaultPlan').exec((err, group) => {
                    const employeePlan = new EmployeePlan({ user: employee._id, company: employee.company.detail, benefitPlan: group.defaultPlan, selectGroup: group.groupName });
                    if(!isStart) {
                      reply({ message: "add employee success" });
                    } else {  
                      employeePlan.save().then(() => {
                        const emp = new EmployeeLog({
                          user: employee._id,
                          company: employee.company.detail,
                          status: 'new',
                          effectiveDate: employee.detail.startDate,
                          updatedBy: user._id,
                        });
                        emp.save().then(() => {
                          reply({ message: "add employee success" });
                        });
                      });
                    }
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
          EmployeeGroup.findOne({ groupName: employee.detail.benefitGroup, company: employee.company.detail })
          .populate('defaultPlan').exec((err, group) => {
            const employeePlan = new EmployeePlan({ user: employee._id, company: employee.company.detail, benefitPlan: group.defaultPlan, selectGroup: group.groupName });
            if(!isStart) {
              reply({ message: "add employee success" });
            } else {  
              employeePlan.save().then(() => {
                const emp = new EmployeeLog({
                  user: employee._id,
                  company: employee.company.detail,
                  status: 'new',
                  effectiveDate: employee.detail.startDate,
                  updatedBy: user._id,
                });
                emp.save().then(() => {
                  reply({ message: "add employee success" });
                });
              });
            }
          });
        });
      }
    });
  }
};

const editEmployee = {
  tags: ['api'],
  auth: 'jwt',
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data',
    maxBytes: 20000000,
  },
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { file } = request.payload;
    let { detail } = request.payload;
    const { storage } = request.server.app.services;
    const isPublic = true;
    detail = JSON.parse(detail);
    const isEnd = moment(detail.endDate).isAfter(Date.now());

    if(file) {
      storage.upload({ file }, { isPublic }, (err, media) => {
        if (!err) {
          media.userId = user.id;
          media.save();
          storage.getUrl(media.path, (url) => {
            if (!err) {
              detail.profilePic = { mediaId: media._id, link: url };
              user.detail = detail;
              user.save().then((employee) => {
                if(!isEnd) {
                  reply({ message: "edit employee success" });
                } else {
                  EmployeeLog.findOne({ user: employee._id, effectiveDate: { $gt: Date.now()} }).then((log) => {
                    if(log) {
                      log.status = 'resign';
                      log.typeOfEmployee = 'ลาออก';
                      log.reason = '';
                      log.effectiveDate = employee.detail.endDate;
                      log.updatedBy = user._id;
                    } else {
                      log = new EmployeeLog({
                        user: employee._id,
                        company: employee.company.detail,
                        status:'resign',
                        reason: '',
                        updatedBy: user._id,
                      });
                    }
                    log.save().then(() => {
                      reply({ message: "edit employee success" });
                    });
                  });
                }
              });
            }
          });
        }
      });
    } else {
      user.detail = detail;
      user.save().then((employee) => {
        if(!isEnd) {
          reply({ message: "edit employee success" });
        } else {
          EmployeeLog.findOne({ user: employee._id, effectiveDate: { $gt: Date.now()} }).then((log) => {
            if(log) {
              log.status = 'resign';
              log.reason = '';
              log.effectiveDate = employee.detail.endDate;
              log.updatedBy = user._id;
            } else {
              log = new EmployeeLog({
                user: employee._id,
                company: employee.company.detail,
                status:'resign',
                reason: '',
                updatedBy: user._id,
              });
            }
            log.save().then(() => {
              reply({ message: "edit employee success" });
            });
          });
        }
      });
    }
  }
};

const manageEmployee = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      employeeId: Joi.string().required(),
      effectiveDate: Joi.date().required(),
      typeOfEmployee: Joi.string(),
      department: Joi.string(),
      title: Joi.string(),
      benefitGroup: Joi.string(),
      benefitPlan: Joi.string(),
      reason: Joi.string(),
    },
    params: {
      status: Joi.string().allow('resign', 'promote').required(),
    }
  },

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const company = user.company.detail;
    const { status } = request.params;
    const { employeeId, effectiveDate, typeOfEmployee, department, title, benefitGroup, benefitPlan, reason } = request.payload;
    EmployeeLog.findOne({ user: employeeId, effectiveDate: { $gt: Date.now()} }).then((log) => {
      if(log) {
        log.status = status;
        log.typeOfEmployee = typeOfEmployee;
        log.department = department;
        log.title = title;
        log.benefitGroup = benefitGroup;
        log.benefitPlan = benefitPlan;
        log.reason = reason;
      } else {
        log = new EmployeeLog({
          user: employeeId, company, status ,effectiveDate, typeOfEmployee,
          department, title, benefitGroup, benefitPlan, reason,
          updatedBy: user._id });
      }
      log.save().then(() => {
        reply({ message: "success" });
      }).catch((err) => {
        reply(err);
      });
    }).catch((err) => {
      reply(err);
    });
  }
};

const summaryEmployee = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const month = new Date().getMonth() + 1;
    const aggregatorOpts = [
      { $project: { company: 1, status: 1, month:{ $month: "$effectiveDate" }}},
      { $match: { company: user.company.detail, month: month }},
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];
    EmployeeLog.aggregate(aggregatorOpts).exec((err, logs) => {
      const haveNew = logs.findIndex(element => element._id === 'new') !== -1;
      const havePromote = logs.findIndex(element => element._id === 'promote') !== -1;
      const haveResign = logs.findIndex(element => element._id === 'resign') !== -1;
      if(!haveNew) {
        logs.push({ _id: 'new', count: 0 });
      }
      if(!havePromote) {
        logs.push({ _id: 'promote', count: 0 });
      }
      if(!haveResign) {
        logs.push({ _id: 'resign', count: 0 });
      }
      const summary = logs.reduce((o, a) => Object.assign(o, { [a._id]: a.count }), {});
      reply(summary);
    });
  }
};

const summaryBenefitPlan = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    EmployeeCompany.populate(user, {path: 'company.detail', select: 'startInsurance expiredInsurance'}, (err, result) => {
      const effectiveDate = result.company.detail.startInsurance;
      const expiredDate = result.company.detail.expiredInsurance;
      BenefitPlan.find({ company: user.company.detail, effectiveDate, expiredDate})
      .exec((err, benefitPlans) => {
        const allPlans = benefitPlans.map(benefitPlan => benefitPlan._id);
        const aggregatorOpts = [
          { $match: { company: user.company.detail._id, benefitPlan: { $in: allPlans }, confirm: true }},
          {
            $group: {
              _id: '$benefitPlan',
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 }
          }
        ];
        EmployeePlan.aggregate(aggregatorOpts)
        .exec((err, plans) => {
          const summary = benefitPlans.map((plan) => {
            const indexPlan = plans.findIndex(p => p._id.toString() === plan._id.toString());
            if(indexPlan !== -1) {
              return Object.assign({}, {
                benefitPlanId: plan._id,
                benefitPlanName: plan.benefitPlanName,
                amount: plans[indexPlan].count,
              });
            } else {
              return Object.assign({}, {
                benefitPlanId: plan._id,
                benefitPlanName: plan.benefitPlanName,
                amount: 0,
              });
            }
          });
          reply(summary);
        });
      });
    });
  }
};

const summaryInsurancePlan = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    EmployeeCompany.populate(user, {path: 'company.detail', select: 'startInsurance expiredInsurance'}, (err, result) => {
      const effectiveDate = result.company.detail.startInsurance;
      const expiredDate = result.company.detail.expiredInsurance;
      BenefitPlan.find({ company: user.company.detail, effectiveDate, expiredDate})
      .exec((err, benefitPlans) => {
        const allPlans = benefitPlans.map(benefitPlan => benefitPlan._id);
        const aggregatorOpts = [
          { $match: { company: user.company.detail._id, benefitPlan: { $in: allPlans }, confirm: true }},
          { 
            $lookup: {
              from: "benefitplans",
              localField: "benefitPlan",
              foreignField: "_id",
              as: "benefitPlan",
            }
          },
          {
            $group: {
              _id: '$benefitPlan.benefitPlan.plan',
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: '$_id.type',
              planId: { $push: '$_id.planId' },
              amount: { $push: '$count' },
            },
          },
          { $unwind: '$_id'},
        ];
        EmployeePlan.aggregate(aggregatorOpts)
        .exec((err, plans) => {
          const summary = plans.reduce((o, a) => Object.assign(o, { [a._id]: a }), {});
          TemplatePlan.find({ company: user.company.detail }, 'plan', {sort: {createdAt: -1}})
          .populate('plan.insurer.planId plan.master.planId')
          .exec((err, template) => {
            const master = template[0].plan.master.map(plan => {
              let index = -1;
              if(summary.MasterPlan !== undefined) {
                index = summary.MasterPlan.planId.findIndex(p => p[0].toString() === plan.planId._id.toString());
              }
              if(index !== -1) {
                return Object.assign({}, {
                  planId: plan.planId._id,
                  planName: plan.planId.planName,
                  amount: summary.master.amount[index],
                });
              } else {
                return Object.assign({}, {
                  planId: plan.planId._id,
                  planName: plan.planId.planName,
                  amount: 0,
                });
              }
            });
            const insurer = template[0].plan.insurer.map(plan => {
              let index = -1;
              if(summary.InsurerPlan !== undefined) {
                index = summary.InsurerPlan.planId.findIndex(p => p[0].toString() === plan.planId._id.toString());
              }
              if(index !== -1) {
                return Object.assign({}, {
                  planId: plan.planId._id,
                  planName: plan.planId.planName,
                  amount: summary.insurer.amount[index],
                });
              } else {
                return Object.assign({}, {
                  planId: plan.planId._id,
                  planName: plan.planId.planName,
                  amount: 0,
                });
              }
            });
            const sum = master.concat(insurer);
            reply(sum);
          });
        });
      });
    });
  }
};

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
    { method: 'PUT', path: '/company/edit-employee', config: editEmployee },
    { method: 'POST', path: '/company/manage-employee/{status}', config: manageEmployee },
    { method: 'GET', path: '/company/get-claim-data', config: getClaimData },
    { method: 'PUT', path: '/company/set-complete-step', config: setCompleteStep },
    { method: 'GET', path: '/company/get-complete-step', config: getCompleteStep },
    { method: 'GET', path: '/company/get-group-benefit', config: getGroupBenefit },
    { method: 'PUT', path: '/company/set-group-benefit/{employeeGroupId}', config: setGroupBenefit },
    { method: 'GET', path: '/company/summary-group', config: summaryGroup },
    { method: 'GET', path: '/company/summary-employee-benefit', config: summaryEmployeeBenefit },
    { method: 'GET', path: '/company/summary-employee', config: summaryEmployee },
    { method: 'GET', path: '/company/summary-benefit-plan', config: summaryBenefitPlan },
    { method: 'GET', path: '/company/summary-insurance-plan', config: summaryInsurancePlan },
  ]);
}
