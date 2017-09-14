import Joi from 'joi';
import { MasterPlan, Role, InsurerPlan } from '../models';

const createPlan = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      planName: Joi.string().required(),
      employeeOfPlan: Joi.number().integer().required(),
    },
  },
  handler: (request, reply) => {
    const { planName, employeeOfPlan } = request.payload;
    const { user } = request.auth.credentials;
    const company = user.company.detail;
    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if (role === 'HR') {
        let masterPlan = new MasterPlan({ planName, company, employeeOfPlan });
        masterPlan.save().then((result) => {
          reply(result);
        });
      } else {
        reply({ message:'หน้านี้สำหรับ HR เท่านั้น'});
      }
    });
  },
};

const editPlan = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      planName: Joi.string(),
      employeeOfPlan: Joi.number().integer(),
      ipdType: Joi.string().allow(null),
      ipdLumsumPerYear: Joi.number().allow(null),
      ipdLumsumPerTime: Joi.number().allow(null),
      ipdLumsumTimeNotExceedPerYear: Joi.number().allow(null),
      rbLumsumRoomPerNight: Joi.number().allow(null),
      rbLumsumNigthNotExceedPerYear: Joi.number().allow(null),
      rbLumsumPayNotExceedPerNight: Joi.number().allow(null),
      rbLumsumPayNotExceedPerYear: Joi.number().allow(null),
      rbSchedulePatient: Joi.number().allow(null),
      rbScheduleIntensiveCarePatient: Joi.number().allow(null),
      rbScheduleDoctor: Joi.number().allow(null),
      rbScheduleSurgerySchedule: Joi.number().allow(null),
      rbScheduleSurgeryNonSchedule: Joi.number().allow(null),
      rbScheduleService: Joi.number().allow(null),
      rbScheduleSmallSurgery: Joi.number().allow(null),
      rbScheduleAdviser: Joi.number().allow(null),
      rbScheduleAmbulance: Joi.number().allow(null),
      rbScheduleAccident: Joi.number().allow(null),
      rbScheduleTreatment: Joi.number().allow(null),
      rbScheduleTransplant: Joi.number().allow(null),
      ipdCoPay: Joi.boolean(),
      ipdCoPayQuota: Joi.number().allow(null),
      ipdCoPayDeductable: Joi.number().allow(null),
      ipdCoPayMixPercentage: Joi.number().allow(null),
      ipdCoPayMixNotExceed: Joi.number().allow(null),
      ipdCoPayMixYear: Joi.number().integer().allow(null),
      opdPerYear: Joi.number().allow(null),
      opdPerTime: Joi.number().allow(null),
      opdTimeNotExceedPerYear: Joi.number().allow(null),
      opdCoPay: Joi.boolean(),
      opdCoPayQuota: Joi.number().allow(null),
      opdCoPayDeductable: Joi.number().allow(null),
      opdCoPayMixPercentage: Joi.number().allow(null),
      opdCoPayMixNotExceed: Joi.number().allow(null),
      opdCoPayMixYear: Joi.number().integer().allow(null),
      dentalPerYear: Joi.number().allow(null),
      lifePerYear: Joi.number().allow(null),
      lifeTimeOfSalary: Joi.number().allow(null),
      lifeNotExceed: Joi.number().allow(null),
    },
    params: {
      planId: Joi.number().integer().required(),
      typeEdit: Joi.string().required(),
      editBy: Joi.string().valid('company', 'insurer').required(),
    },
  },
  handler: (request, reply) => {
    const { planName, employeeOfPlan, ipdType, ipdLumsumPerYear, ipdLumsumPerTime, ipdLumsumTimeNotExceedPerYear, rbLumsumRoomPerNight,
      rbLumsumNigthNotExceedPerYear, rbLumsumPayNotExceedPerNight, rbLumsumPayNotExceedPerYear,
      rbSchedulePatient, rbScheduleIntensiveCarePatient, rbScheduleDoctor, rbScheduleSurgerySchedule, rbScheduleSurgeryNonSchedule,
      rbScheduleService, rbScheduleSmallSurgery, rbScheduleAdviser, rbScheduleAmbulance,
      rbScheduleAccident, rbScheduleTreatment, rbScheduleTransplant, ipdCoPay, ipdCoPayQuota,
      ipdCoPayDeductable, ipdCoPayMixPercentage, ipdCoPayMixNotExceed, ipdCoPayMixYear, opdPerYear, opdPerTime, opdTimeNotExceedPerYear,
      opdCoPay, opdCoPayQuota, opdCoPayDeductable, opdCoPayMixPercentage, opdCoPayMixNotExceed, opdCoPayMixYear, dentalPerYear,
      lifePerYear, lifeTimeOfSalary, lifeNotExceed } = request.payload;
    const { planId, typeEdit, editBy } = request.params;
    const { user } = request.auth.credentials;
    let planType;

    switch(editBy) {
      case 'company' : planType = MasterPlan; break;
      case 'insurer' : planType = InsurerPlan; break;
    }

    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR' || role === 'Insurer'){
        switch(typeEdit) {
          case 'profilePlan' : planType.findOneAndUpdate({ planId: planId }, { $set:
          {
            planName: planName,
            employeeOfPlan: employeeOfPlan,
          }}, () => reply({message: 'edit Profile Plan complete!'})); break;
          case 'ipd' : planType.findOneAndUpdate({ planId: planId }, { $set:
          {
            ipdType: ipdType,
            ipdLumsumPerYear: ipdLumsumPerYear,
            ipdLumsumPerTime: ipdLumsumPerTime,
            ipdLumsumTimeNotExceedPerYear: ipdLumsumTimeNotExceedPerYear,
            rbLumsumRoomPerNight: rbLumsumRoomPerNight,
            rbLumsumNigthNotExceedPerYear: rbLumsumNigthNotExceedPerYear,
            rbLumsumPayNotExceedPerNight: rbLumsumPayNotExceedPerNight,
            rbLumsumPayNotExceedPerYear: rbLumsumPayNotExceedPerYear,
            rbSchedulePatient: rbSchedulePatient,
            rbScheduleIntensiveCarePatient: rbScheduleIntensiveCarePatient,
            rbScheduleDoctor: rbScheduleDoctor,
            rbScheduleSurgerySchedule: rbScheduleSurgerySchedule,
            rbScheduleSurgeryNonSchedule: rbScheduleSurgeryNonSchedule,
            rbScheduleService: rbScheduleService,
            rbScheduleSmallSurgery: rbScheduleSmallSurgery,
            rbScheduleAdviser: rbScheduleAdviser,
            rbScheduleAmbulance: rbScheduleAmbulance,
            rbScheduleAccident: rbScheduleAccident,
            rbScheduleTreatment: rbScheduleTreatment,
            rbScheduleTransplant: rbScheduleTransplant,
            ipdCoPay: ipdCoPay,
            ipdCoPayQuota: ipdCoPayQuota,
            ipdCoPayDeductable: ipdCoPayDeductable,
            ipdCoPayMixPercentage: ipdCoPayMixPercentage,
            ipdCoPayMixNotExceed: ipdCoPayMixNotExceed,
            ipdCoPayMixYear: ipdCoPayMixYear,
          }}, () => reply({message: 'edit IPD complete!'})); break;
          case 'opd' : planType.findOneAndUpdate({ planId: planId }, { $set:
          {
            opdPerYear: opdPerYear,
            opdPerTime: opdPerTime,
            opdTimeNotExceedPerYear: opdTimeNotExceedPerYear,
            opdCoPay: opdCoPay,
            opdCoPayQuota: opdCoPayQuota,
            opdCoPayDeductable: opdCoPayDeductable,
            opdCoPayMixPercentage: opdCoPayMixPercentage,
            opdCoPayMixNotExceed: opdCoPayMixNotExceed,
            opdCoPayMixYear: opdCoPayMixYear,
          }}, () => reply({message: 'edit OPD complete!'})); break;
          case 'dental' :  planType.findOneAndUpdate({ planId: planId }, { $set: { dentalPerYear: dentalPerYear }},() => {
            reply({message: 'edit Dental complete!'});
          }); break;
          case 'life' : planType.findOneAndUpdate({ planId: planId }, { $set:
          {
            lifePerYear: lifePerYear,
            lifeTimeOfSalary: lifeTimeOfSalary,
            lifeNotExceed: lifeNotExceed,
          }}, () => reply({message: 'edit Life complete!'})); break;
        }
      }else{
        reply({ message:'หน้านี้สำหรับ HR หรือ Broker เท่านั้น'});
      }
    });
  },
};

const deletePlan = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    params: {
      planId: Joi.number().integer().required(),
      editBy: Joi.string().valid('company', 'insurer').required(),
    },
  },
  handler: (request, reply) => {
    const { planId, editBy } = request.params;
    const { user } = request.auth.credentials;
    switch(editBy) {
      case 'company' : 
        MasterPlan.findOneAndRemove({ planId, company: user.company.detail }, (err) => {
          if (!err)
            reply({message:'deleted complete!'});
        }); 
        break;
      case 'insurer' : 
        InsurerPlan.findOne({ planId }).populate('createdBy').exec((err, plan) => {
          if (plan.createdBy.company.detail === user.company.detail) {
            plan.remove().then(() => {
              reply({message:'deleted complete!'});
            });
          } else reply({message:"You can't delete this plan!"});
        }); 
        break;
    }
  },
};

const copyPlan = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    params: {
      planId: Joi.number().integer().required(),
    },
  },

  handler: (request, reply) => {
    const { planId } = request.params;
    MasterPlan.findOne({ planId })
      .then((masterPlan) => {
        const planName = masterPlan.planName + ' (Copy)';
        const company = masterPlan.company;
        const employeeOfPlan = masterPlan.employeeOfPlan;
        let newPlan = new MasterPlan({ planName, company, employeeOfPlan });
        newPlan.save().then(() => {
          MasterPlan.findOneAndUpdate({ planId: newPlan.planId }, { $set:
          {
            ipdLumsumPerYear: masterPlan.ipdLumsumPerYear,
            ipdLumsumPerTime: masterPlan.ipdLumsumPerTime,
            ipdLumsumTimeNotExceedPerYear: masterPlan.ipdLumsumTimeNotExceedPerYear,
            rbLumsumRoomPerNight: masterPlan.rbLumsumRoomPerNight,
            rbLumsumNigthNotExceedPerYear: masterPlan.rbLumsumPayNotExceedPerYear,
            rbLumsumPayNotExceedPerNight: masterPlan.rbLumsumPayNotExceedPerNight,
            rbLumsumPayNotExceedPerYear: masterPlan.rbLumsumPayNotExceedPerYear,
            rbSchedulePatient: masterPlan.rbSchedulePatient,
            rbScheduleIntensiveCarePatient: masterPlan.rbScheduleIntensiveCarePatient,
            rbScheduleDoctor: masterPlan.rbScheduleDoctor,
            rbScheduleSurgerySchedule: masterPlan.rbScheduleSurgerySchedule,
            rbScheduleSurgeryNonSchedule: masterPlan.rbScheduleSurgeryNonSchedule,
            rbScheduleService: masterPlan.rbScheduleService,
            rbScheduleSmallSurgery: masterPlan.rbScheduleSmallSurgery,
            rbScheduleAdviser: masterPlan.rbScheduleAdviser,
            rbScheduleAmbulance: masterPlan.rbScheduleAmbulance,
            rbScheduleAccident: masterPlan.rbScheduleAccident,
            rbScheduleTreatment: masterPlan.rbScheduleTreatment,
            rbScheduleTransplant: masterPlan.rbScheduleTransplant,
            ipdCoPay: masterPlan.ipdCoPay,
            ipdCoPayQuota: masterPlan.ipdCoPayQuota,
            ipdCoPayDeductable: masterPlan.ipdCoPayDeductable,
            ipdCoPayMixPercentage: masterPlan.ipdCoPayMixPercentage,
            ipdCoPayMixNotExceed: masterPlan.ipdCoPayMixNotExceed,
            ipdCoPayMixYear: masterPlan.ipdCoPayMixYear,
            opdPerYear: masterPlan.opdPerYear,
            opdPerTime: masterPlan.opdPerTime,
            opdTimeNotExceedPerYear: masterPlan.opdTimeNotExceedPerYear,
            opdCoPay: masterPlan.opdCoPay,
            opdCoPayQuota: masterPlan.opdCoPayQuota,
            opdCoPayDeductable: masterPlan.opdCoPayDeductable,
            opdCoPayMixPercentage: masterPlan.opdCoPayMixPercentage,
            opdCoPayMixNotExceed: masterPlan.opdCoPayMixNotExceed,
            opdCoPayMixYear: masterPlan.opdCoPayMixYear,
            lifePerYear: masterPlan.lifePerYear,
            lifeTimeOfSalary: masterPlan.lifeTimeOfSalary,
            lifeNotExceed: masterPlan.lifeNotExceed,
            dentalPerYear: masterPlan.dentalPerYear,
          }}, () => reply({message: 'copy plan complete'}));
        });
      });
  },
};

const getAllPlan = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    MasterPlan.find({ company: user.company.detail }).sort({planId: 1}).exec(function(err, plans) {
      if (err) throw err;
      reply(plans);
    });
  },
};

const extendedPlan = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    params: {
      planId: Joi.number().integer().required(),
    },
  },

  handler: (request, reply) => {
    const { planId } = request.params;
    const { user } = request.auth.credentials;
    MasterPlan.findOne({ planId })
      .then((masterPlan) => {
        const planName = masterPlan.planName;
        const company = masterPlan.company;
        const employeeOfPlan = masterPlan.employeeOfPlan;
        const extendedFrom = masterPlan._id;
        const createdBy = user._id;
        let newPlan = new  InsurerPlan({ planName, company, employeeOfPlan, extendedFrom, createdBy });
        newPlan.save().then(() => {
          InsurerPlan.findOneAndUpdate({ planId: newPlan.planId }, { $set:
          {
            ipdLumsumPerYear: masterPlan.ipdLumsumPerYear,
            ipdLumsumPerTime: masterPlan.ipdLumsumPerTime,
            ipdLumsumTimeNotExceedPerYear: masterPlan.ipdLumsumTimeNotExceedPerYear,
            rbLumsumRoomPerNight: masterPlan.rbLumsumRoomPerNight,
            rbLumsumNigthNotExceedPerYear: masterPlan.rbLumsumPayNotExceedPerYear,
            rbLumsumPayNotExceedPerNight: masterPlan.rbLumsumPayNotExceedPerNight,
            rbLumsumPayNotExceedPerYear: masterPlan.rbLumsumPayNotExceedPerYear,
            rbSchedulePatient: masterPlan.rbSchedulePatient,
            rbScheduleIntensiveCarePatient: masterPlan.rbScheduleIntensiveCarePatient,
            rbScheduleDoctor: masterPlan.rbScheduleDoctor,
            rbScheduleSurgerySchedule: masterPlan.rbScheduleSurgerySchedule,
            rbScheduleSurgeryNonSchedule: masterPlan.rbScheduleSurgeryNonSchedule,
            rbScheduleService: masterPlan.rbScheduleService,
            rbScheduleSmallSurgery: masterPlan.rbScheduleSmallSurgery,
            rbScheduleAdviser: masterPlan.rbScheduleAdviser,
            rbScheduleAmbulance: masterPlan.rbScheduleAmbulance,
            rbScheduleAccident: masterPlan.rbScheduleAccident,
            rbScheduleTreatment: masterPlan.rbScheduleTreatment,
            rbScheduleTransplant: masterPlan.rbScheduleTransplant,
            ipdCoPay: masterPlan.ipdCoPay,
            ipdCoPayQuota: masterPlan.ipdCoPayQuota,
            ipdCoPayDeductable: masterPlan.ipdCoPayDeductable,
            ipdCoPayMixPercentage: masterPlan.ipdCoPayMixPercentage,
            ipdCoPayMixNotExceed: masterPlan.ipdCoPayMixNotExceed,
            ipdCoPayMixYear: masterPlan.ipdCoPayMixYear,
            opdPerYear: masterPlan.opdPerYear,
            opdPerTime: masterPlan.opdPerTime,
            opdTimeNotExceedPerYear: masterPlan.opdTimeNotExceedPerYear,
            opdCoPay: masterPlan.opdCoPay,
            opdCoPayQuota: masterPlan.opdCoPayQuota,
            opdCoPayDeductable: masterPlan.opdCoPayDeductable,
            opdCoPayMixPercentage: masterPlan.opdCoPayMixPercentage,
            opdCoPayMixNotExceed: masterPlan.opdCoPayMixNotExceed,
            opdCoPayMixYear: masterPlan.opdCoPayMixYear,
            lifePerYear: masterPlan.lifePerYear,
            lifeTimeOfSalary: masterPlan.lifeTimeOfSalary,
            lifeNotExceed: masterPlan.lifeNotExceed,
            dentalPerYear: masterPlan.dentalPerYear,
          }}, () => reply({message: 'create extended plan completed!'}));
        });
      });
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/company/create-plan', config: createPlan },
    { method: 'POST', path: '/insurer/extended-plan/{planId}', config: extendedPlan },
    { method: 'PUT', path: '/{editBy}/edit-plan/{planId}/{typeEdit}', config: editPlan },
    { method: 'DELETE', path: '/{editBy}/delete-plan/{planId}', config: deletePlan },
    { method: 'POST', path: '/company/copy-plan/{planId}', config: copyPlan },
    { method: 'GET', path: '/company/get-all-plan', config: getAllPlan },
  ]);
}
