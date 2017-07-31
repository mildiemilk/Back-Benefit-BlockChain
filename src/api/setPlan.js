import Joi from 'joi';
import { MasterPlan } from '../models';

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
    const company = user.company;
    const updateBy = user.role;
    if(user.role === 'HR' || user.role === 'BROKER' ){
      let masterPlan = new MasterPlan({ planName, company, employeeOfPlan, updateBy });
      masterPlan.save().then(() => {
        reply(masterPlan);
      });
    }else{
      reply({ message:'หน้านี้สำหรับ HR หรือ Broker เท่านั้น'});
    }
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
    const { planId, typeEdit } = request.params;
    const { user } = request.auth.credentials;
    const updateBy = user.role;

    if(user.role == 'HR' || user.role === 'BROKER'){
      switch(typeEdit) {
        case 'profilePlan' : MasterPlan.findOneAndUpdate({ planId: planId }, { $set:
        {
          planName: planName,
          employeeOfPlan: employeeOfPlan,
          updateBy: updateBy
        }}, () => reply({message: 'edit Profile Plan complete!'})); break;
        case 'ipd' : MasterPlan.findOneAndUpdate({ planId: planId }, { $set:
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
          updateBy: updateBy
        }}, () => reply({message: 'edit IPD complete!'})); break;
        case 'opd' : MasterPlan.findOneAndUpdate({ planId: planId }, { $set:
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
          updateBy: updateBy
        }}, () => reply({message: 'edit OPD complete!'})); break;
        case 'dental' :  MasterPlan.findOneAndUpdate({ planId: planId }, { $set: { dentalPerYear: dentalPerYear, updateBy: updateBy}},() => {
          reply({message: 'edit Dental complete!'});
        }); break;
        case 'life' : MasterPlan.findOneAndUpdate({ planId: planId }, { $set:
        {
          lifePerYear: lifePerYear,
          lifeTimeOfSalary: lifeTimeOfSalary,
          lifeNotExceed: lifeNotExceed,
          updateBy: updateBy
        }}, () => reply({message: 'edit Life complete!'})); break;
      }
    }else{
      reply({ message:'หน้านี้สำหรับ HR หรือ Broker เท่านั้น'});
    }
  },
};


const deletePlan = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    params: {
      planId: Joi.number().integer().required(),
    },
  },
  handler: (request, reply) => {
    const { planId } = request.params;
    MasterPlan.findOneAndRemove({ planId }, (err) => {
      if (!err)
        reply({message:'deleted complete!'});
    });

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
    const { user } = request.auth.credentials;
    const updateBy = user.role;
    MasterPlan.findOne({ planId })
      .then((masterPlan) => {
        const planName = masterPlan.planName + ' (Copy)';
        const company = masterPlan.company;
        const employeeOfPlan = masterPlan.employeeOfPlan;
        let newPlan = new MasterPlan({ planName, company, employeeOfPlan, updateBy });
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
            updateBy: updateBy,
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
    MasterPlan.find({ company: user.company }, function(err, plans) {
      if (err) throw err;
      reply(plans);
    });
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/createPlan', config: createPlan },
    { method: 'PUT', path: '/editPlan/{planId}/{typeEdit}', config: editPlan },
    { method: 'DELETE', path: '/deletePlan/{planId}', config: deletePlan },
    { method: 'POST', path: '/copyPlan/{planId}', config: copyPlan },
    { method: 'GET', path: '/getAllPlan', config: getAllPlan },
  ]);
}
