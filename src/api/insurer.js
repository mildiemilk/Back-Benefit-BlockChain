import Joi from 'joi';
import Boom from 'boom';
import moment from 'moment';
import json2csv from 'json2csv';
import exceltojson from 'xlsx-to-json-lc';
import fs from 'fs';
import mongoose from 'mongoose';
import { BiddingRelation, Role, Bidding, InsuranceCompany,
  BenefitPlan, EmployeeCompany, TemplatePlan, User, EmployeeLog,
  MasterPlan, InsurerPlan, Media, EmployeePlan } from '../models';

const getAllInsurer = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        InsuranceCompany.find({}).then((insurers) => {
          reply(insurers);
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const chooseInsurer = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      insurers: Joi.array(),
    },
  },
  handler: (request, reply) => {
    const { insurers } = request.payload;
    const { user } = request.auth.credentials;
    const company = user.company.detail;
    const insurerBidding = insurers.map((insurer) => Object.assign({}, { insurerCompany: insurer, status: 'waiting' }));
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        BiddingRelation.findOne({ company })
          .then((biddingrelation) => {
            if(biddingrelation){
              biddingrelation.insurers = insurerBidding;
              biddingrelation.save().then((result) => {
                reply(result);
              });
            }else{
              const biddingrelation = new BiddingRelation({ company, insurers: insurerBidding });
              biddingrelation.save().then((result) => {
                reply(result);
              });
            }
          });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const setTimeout = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      timeout: Joi.date().required(),
    },
  },
  handler: (request, reply) => {
    const { timeout } = request.payload;
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        BiddingRelation.findOneAndUpdate({ company: user.company.detail },{ $set: { timeout }}, (err) => {
          if (err) console.log(err);
          reply(timeout);
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const getSelectInsurer = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        BiddingRelation.findOne({ company: user.company.detail })
        .populate('insurers.insurerCompany')
        .then((biddingrelation) => {
          const insurers = biddingrelation.insurers.map(insurer => insurer.insurerCompany);
          reply(insurers);
        });
      }else{
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const getTimeout = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        BiddingRelation.findOne({ company: user.company.detail })
        .then((biddingrelation) => {
          reply(biddingrelation.timeout);
        });
      }else{    
        reply(Boom.badData('This page for HR only'));
      }
    });
  },
};

const getCompanyList = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role === 'Insurer'){
        BiddingRelation.find({ 'insurers.insurerCompany': user.company.detail, confirmed: true }, null, {sort: {createdAt: -1}}).populate('company').exec((err, results) => {
          const data = results.map((result) => {
            const { startInsurance, expiredInsurance } = result.company;
            const today = Date.now();
            let start, end;
            if (moment(today).isBetween(startInsurance, expiredInsurance, null, "[]")) {
              start = new Date(startInsurance);
              start.setFullYear(start.getFullYear() + 1);
              end = expiredInsurance;
            } else {
              start = startInsurance;
              end = new Date(expiredInsurance);
              end.setFullYear(end.getFullYear() - 1);
            }

            return new Promise((resolve) => {
              Bidding.findOne({ company: result.company, insurerCompany: user.company.detail }, 'countBidding',(err, bidding) => {
                let countBidding = 0;
                if(bidding) {
                  countBidding = bidding.countBidding;
                }
                resolve(Object.assign({},{
                  companyId: result.company._id,
                  company: result.company.companyName,
                  logo: result.company.logo.link,
                  countBidding,
                  numberOfEmployees: result.company.numberOfEmployees,
                  expiredOldInsurance: end,
                  startNewInsurance: start,
                  status: result.insurers.find((insurer) => insurer.insurerCompany.toString() === user.company.detail.toString()).status,
                  candidateInsurer: result.insurers.length,
                  minPrice: result.minPrice,
                  timeout: result.timeout,
                }));
              });
            });
          });
          Promise.all(data).then((result) => reply(result));
        });
      } else reply(Boom.badData('This page for Insurer only'));
    });
  },
};

const insurerCustomer = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const aggregatorOpts = [
      {$match: {insurerCompanyWin: user.company.detail}},
      {$project:{"_id":1, "company": 1, "createdAt": 1}},
      {$sort:{"createdAt": 1}},
      {
        $group: {
          _id: "$company",
          lastPlan: { $first: "$_id" }
        },
      },
    ];
    BiddingRelation.aggregate(aggregatorOpts)
    .exec((err, result) => {
      EmployeeCompany.populate(result, {path: '_id', select: 'startInsurance expiredInsurance companyName logo.link numberOfEmployees completeStep uploadPolicy'}, (err, result) => {
        const test = result.map(benefit => {
          const { startInsurance, expiredInsurance, uploadPolicy, completeStep, _id, companyName, logo, numberOfEmployees } = benefit._id;
          const today = Date.now();
          let start, end;
          if (moment(today).isBetween(startInsurance, expiredInsurance, null, "[]")) {
            start = new Date(startInsurance);
            start.setFullYear(start.getFullYear() + 1);
            end = expiredInsurance;
          } else {
            start = startInsurance;
            end = new Date(expiredInsurance);
            end.setFullYear(end.getFullYear() - 1);
          }
          let status;
          if(completeStep[3]) {
            status = 'pending';
            if(moment(today).isAfter(expiredInsurance)) {
              status = 'inActive';
            } else if(uploadPolicy) {
              status = 'active';
            }
          } else status = 'waiting';

          return Object.assign({}, {
            companyId: _id,
            companyName: companyName,
            logo: logo.link,
            numberOfEmployees: numberOfEmployees,
            expiredOldInsurance: end,
            startNewInsurance: start,
            status,
          });
        });
        reply(test);
      });
    });
  },
};

const insurerCustomerEmployee = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      companyId: Joi.string().required(),
    }
  },
  handler: (request, reply) => {
    const { companyId } = request.params;
    const month = new Date().getMonth() + 1;
    const aggregatorOpts = [
      { $project: { company: 1, status: 1, month:{ $month: "$effectiveDate" }}},
      { $match: { company: mongoose.Types.ObjectId(companyId), month: month }},
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
      Role.findOne({ roleName: 'Employee' }).then((roleId) => {
        const role = roleId._id;
        User.find({ 'company.detail': companyId, role, deleted: false }, 'email detail', {sort: {'detail.employeeCode': 1}}, (err, employees) => {
          const getLog = employees.map(emp => {
            return new Promise((resolve) => {
              EmployeeLog.findOne({ user: emp._id, effectiveDate: { $gt: Date.now()} }).then((log) => {
                if(log) {
                  let status;
                  switch(log.status) {
                    case 'new' : status = 'พนักงานใหม่'; break;
                    case 'promote' : status = 'ปรับตำแหน่ง'; break;
                    case 'resign' : status = 'ลาออก'; break;
                  }
                  emp.detail.status = status;
                  emp.detail.effectiveDate = log.effectiveDate;
                } else {
                  emp.detail.status = 'พนักงาน';
                  emp.detail.effectiveDate = '-';
                }
                resolve();
              });
            });
          });
          Promise.all(getLog).then(() => {
            reply({employees, summary});
          });
        });
      });
    });
  }
};

const insurerCustomerPlan = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      companyId: Joi.string().required(),
    }
  },
  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    const { companyId } = request.params;
    BenefitPlan.find({ insurerCompany: user.company.detail, company: companyId })
    .sort({ createdAt: -1 })
    .exec((err, result) => {
      Bidding.findOne({ _id: result[0].bidding })
      .populate('plan.master.planId plan.insurer.planId')
      .exec((err, bidding) => {
        reply(bidding.plan);
      });
    });
  },
};

const insurerCustomerSelectPlan = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      companyId: Joi.string().required(),
    }
  },
  handler: (request, reply) => {
    const { companyId } = request.params;
    // TemplatePlan.find({ company: companyId })
    // .sort({ createdAt: -1 })
    // .populate('plan.master.planId plan.insurer.planId')
    // .exec((err, template) => {
    //   const master = template[0].plan.master.map(plan => {
    //     return new Promise((resolve) => {
    //       Media.populate(plan.planId, {path: 'fileDetail', select: 'name'}, () => {
    //         resolve(Object.assign({}, {
    //           ...plan._doc,
    //           type: 'master',
    //         }));
    //       });
    //     });
    //   });
    //   Promise.all(master).then((master) => {
    //     const insurer = template[0].plan.insurer.map(plan => {
    //       return new Promise((resolve) => {
    //         Media.populate(plan.planId, {path: 'fileDetail', select: 'name'}, () => {
    //           resolve(Object.assign({}, {
    //             ...plan._doc,
    //             type: 'insurer',
    //           }));
    //         });
    //       });
    //     });
    //     Promise.all(insurer).then((insurer) => {
    //       const allPlan = master.concat(insurer);
    //       reply(allPlan);
    //     });
    //   });
    // });
    EmployeeCompany.findOne({ _id: companyId }).select('startInsurance expiredInsurance').exec((err, result) => {
      const effectiveDate = result.startInsurance;
      const expiredDate = result.expiredInsurance;
      BenefitPlan.find({ company: companyId, effectiveDate, expiredDate})
      .exec((err, benefitPlans) => {
        const allPlans = benefitPlans.map(benefitPlan => benefitPlan._id);
        const aggregatorOpts = [
          { $match: { company: mongoose.Types.ObjectId(companyId), benefitPlan: { $in: allPlans }}},
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
          TemplatePlan.find({ company: companyId }, 'plan', {sort: {createdAt: -1}})
          .populate('plan.insurer.planId plan.master.planId')
          .exec((err, template) => {
            let master = template[0].plan.master.map(plan => {
              let index = -1;
              if(summary.MasterPlan !== undefined) {
                index = summary.MasterPlan.planId.findIndex(p => p[0].toString() === plan.planId._id.toString());
              }
              if(index !== -1) {
                return plan;
              }
            });
            let insurer = template[0].plan.insurer.map(plan => {
              let index = -1;
              if(summary.InsurerPlan !== undefined) {
                index = summary.InsurerPlan.planId.findIndex(p => p[0].toString() === plan.planId._id.toString());
              }
              if(index !== -1) {
                return plan;
              }
            });
            master = master.filter(plan => plan !== undefined);
            insurer = insurer.filter(plan => plan !== undefined);
            const newMaster = master.map(plan => {
              return new Promise((resolve) => {
                Media.populate(plan.planId, {path: 'fileDetail', select: 'name'}, () => {
                  resolve(Object.assign({}, {
                    ...plan._doc,
                    type: 'master',
                  }));
                });
              });
            });
            Promise.all(newMaster).then((master) => {
              const newInsurer = insurer.map(plan => {
                return new Promise((resolve) => {
                  Media.populate(plan.planId, {path: 'fileDetail', select: 'name'}, () => {
                    resolve(Object.assign({}, {
                      ...plan._doc,
                      type: 'insurer',
                    }));
                  });
                });
              });
              Promise.all(newInsurer).then((insurer) => {
                const allPlan = master.concat(insurer);
                reply(allPlan);
              });
            });
          });
        });
      });
    });
  },
};

const insurerCustomerFile = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      companyId: Joi.string().required(),
    }
  },
  handler: (request, reply) => {
    const { companyId } = request.params;
    Role.findOne({ roleName: 'Employee' }).then((roleId) => {
      const role = roleId._id;
      User.find({ role, 'company.detail': companyId })
      .select('email detail')
      .exec((err, employees) => {
        employees = employees.map(emp => {
          emp.detail.email = emp.email;
          delete emp.detail.personalVerify;
          delete emp.detail.profilePic;
          delete emp.detail.familyDetail;
          return emp.detail;
        });
        const fields = [
          'email',
          'employeeCode',
          'gender',
          'prefix',
          'name',
          'lastname',
          'citizenId',
          'phoneNumber',
          'typeOfEmployee',
          'title',
          'department',
          'level',
          'endDate',
          'startDate',
          'nationality',
          'benefitPlan',
          'address',
          'benefitGroup',
          'dateOfBirth',
          'accountNumber',
          'bankName',
          'marriageStatus',
          'personalEmail',
          'policyNumber',
          'memberNumber',
        ];
        const csv = json2csv({ data: employees, fields: fields });
        reply(csv.toString('utf-8'))
        .header('Content-Type', 'application/octet-stream')
        .header('content-disposition', 'attachment; filename=CronjReport.csv;');
      });
    });
  }
};

const insurerCustomerUploadFile = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      companyId: Joi.string().required(),
    }
  },
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data',
    maxBytes: 20000000,
  },

  handler: (request, reply) => {
    const { file } = request.payload;
    const { companyId } = request.params;
    const data = file;
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
          lowerCaseHeaders: false //to convert all excel headers to lowr case in json
        }, function(err, result) {
          if(err) {
            console.error(err);
          } else {
            let role;
            Role.findOne({ roleName: 'Employee' }).then((roleId) => {
              role = roleId._id;
              const addEmployee = result.map((employee) => {
                return new Promise((resolve, reject) => {
                  User.findOne({ 'company.detail': companyId, 'detail.employeeCode': employee.employeeCode, role })
                  .exec((err, emp) => {
                    if(emp) {
                      emp.detail.policyNumber = employee.policyNumber,
                      emp.detail.memberNumber = employee.memberNumber,
                      emp.markModified('detail');
                      emp.save().then((emp) => {
                        resolve(emp);
                      });
                    } else {
                      reject();
                    }
                  });
                });
              });
              Promise.all(addEmployee).then(() => {
                fs.unlink(path, (err) => {
                  if (err) throw err;
                  reply({ message: 'upload policy success'});
                });
              });
            });
          }
        });
      });
    }
  }
};

const insurerCustomerUploadFileDetail = {
  tags: ['api'],
  auth: 'jwt',
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data',
    maxBytes: 20000000,
  },

  handler: (request, reply) => {
    let { file, type, planId } = request.payload;
    type = JSON.parse(type);
    planId = JSON.parse(planId);
    const { storage } = request.server.app.services;
    const { user } = request.auth.credentials;
    const info = null;
    let planType;
    let companyId;
    const saveFile = file.map((file, index) => {
      return new Promise((resolve) => {
        storage.upload({ file }, { info }, (err, media) => {
          if (!err) {
            media.userId = user.id;
            media.save().then(detail => {
              const nowType = type[index];
              const nowPlanId = planId[index];
              switch(nowType) {
                case 'master' : planType = MasterPlan; break;
                case 'insurer' : planType = InsurerPlan; break;
              }
              planType.findOne({ _id: nowPlanId }).exec((err, plan) => {
                companyId = plan.company;
                plan.fileDetail = detail;
                plan.save().then(() => {
                  resolve();
                });
              });
            });
          } else reply(err);
        });
      });
    });
    Promise.all(saveFile).then(() => {
      EmployeeCompany.findOne({ _id: companyId }).exec((err, company) => {
        company.uploadPolicy = true;
        company.save().then(() => {
          reply({ message: 'upload file detail success' });
        });
      });
    });
  }
};

const insurerCustomerEditPolicy = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    payload: {
      employeeId: Joi.string().required(),
      policyNumber: Joi.string().required(),
      memberNumber: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { employeeId, policyNumber, memberNumber } = request.payload;
    User.findOne({ _id: employeeId })
    .exec((err, emp) => {
      emp.detail.policyNumber = policyNumber,
      emp.detail.memberNumber = memberNumber,
      emp.markModified('detail');
      emp.save().then(() => {
        reply({ message: 'edit policy number success' });
      });
    });
  },
};

export default function(app) {
  app.route([
    { method: 'GET', path: '/company/get-all-insurer', config: getAllInsurer },
    { method: 'PUT', path: '/company/choose-insurer', config: chooseInsurer },
    { method: 'PUT', path: '/company/set-insurer-timeout', config: setTimeout },
    { method: 'GET', path: '/company/get-insurer-timeout', config: getTimeout },
    { method: 'GET', path: '/company/get-select-insurer', config: getSelectInsurer },
    { method: 'GET', path: '/insurer/company-list', config: getCompanyList },
    { method: 'GET', path: '/insurer/customer', config: insurerCustomer },
    { method: 'GET', path: '/insurer/customer-employee/{companyId}', config: insurerCustomerEmployee },
    { method: 'PUT', path: '/insurer/customer-edit-policy', config: insurerCustomerEditPolicy },
    { method: 'GET', path: '/insurer/customer-plan/{companyId}', config: insurerCustomerPlan },
    { method: 'GET', path: '/insurer/customer-select-plan/{companyId}', config: insurerCustomerSelectPlan },
    { method: 'GET', path: '/insurer/customer-file/{companyId}', config: insurerCustomerFile },
    { method: 'PUT', path: '/insurer/customer-upload-file/{companyId}', config: insurerCustomerUploadFile },
    { method: 'PUT', path: '/insurer/customer-upload-file-detail', config: insurerCustomerUploadFileDetail },
  ]);
}