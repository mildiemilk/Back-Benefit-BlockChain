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

const editMasterPlan = {
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

    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role == 'HR'){
        switch(typeEdit) {
          case 'profilePlan' : MasterPlan.findOneAndUpdate({ planId: planId }, { $set:
          {
            planName: planName,
            employeeOfPlan: employeeOfPlan,
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
          }}, () => reply({message: 'edit OPD complete!'})); break;
          case 'dental' :  MasterPlan.findOneAndUpdate({ planId: planId }, { $set: { dentalPerYear: dentalPerYear }},() => {
            reply({message: 'edit Dental complete!'});
          }); break;
          case 'life' : MasterPlan.findOneAndUpdate({ planId: planId }, { $set:
          {
            lifePerYear: lifePerYear,
            lifeTimeOfSalary: lifeTimeOfSalary,
            lifeNotExceed: lifeNotExceed,
          }}, () => reply({message: 'edit Life complete!'})); break;
        }
      }else{
        reply({ message:'หน้านี้สำหรับ HR เท่านั้น'});
      }
    });
  },
};

const editInsurerPlan = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      planId: Joi.number().integer(),
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
    const { planId } = request.params;
    const { user } = request.auth.credentials;

    Role.findOne({ _id: user.role }).then((thisRole) => {
      const role =  thisRole.roleName;
      if(role === 'Insurer'){
        InsurerPlan.findOne({ planId }).populate('createdBy').exec((err, plan) => {
          if (plan.createdBy.company.detail.toString() === user.company.detail.toString()) {
            InsurerPlan.findOneAndUpdate({ planId: planId }, { $set:
            { planName: planName,
              employeeOfPlan: employeeOfPlan,
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
              opdPerYear: opdPerYear,
              opdPerTime: opdPerTime,
              opdTimeNotExceedPerYear: opdTimeNotExceedPerYear,
              opdCoPay: opdCoPay,
              opdCoPayQuota: opdCoPayQuota,
              opdCoPayDeductable: opdCoPayDeductable,
              opdCoPayMixPercentage: opdCoPayMixPercentage,
              opdCoPayMixNotExceed: opdCoPayMixNotExceed,
              opdCoPayMixYear: opdCoPayMixYear,
              dentalPerYear: dentalPerYear,
              lifePerYear: lifePerYear,
              lifeTimeOfSalary: lifeTimeOfSalary,
              lifeNotExceed: lifeNotExceed,
            }}, () => reply({message: 'edit plan complete!'}));
          } else reply({message:"You can't edit this plan!"});
        });
      } else {
        reply({ message:'หน้านี้สำหรับ Insurer เท่านั้น'});
      }
    });
  },
};

const deletePlanInsurer = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const { planId } = request.params;
    const { user } = request.auth.credentials;
    InsurerPlan.findOne({ planId }).populate('createdBy').exec((err, plan) => {
      if (plan.createdBy.company.detail.toString() === user.company.detail.toString()) {
        plan.remove().then(() => {
          reply({message:'deleted complete!'});
        });
      } else reply({message:"You can't delete this plan!"});
    }); 
  },
};

const deletePlanCompany = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const data = request.payload;
    const { user } = request.auth.credentials;
    const deleted = data.map(ele => {
      return new Promise(resolve => {
        MasterPlan.findOneAndRemove({ planId: ele, company: user.company.detail }, (err) => {
          if (!err)
            resolve();
        });
      });
    });
    Promise.all(deleted).then(() => {
      reply({ message: "deleted completed!" });
    });
  },
};

const copyPlan = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const data = request.payload;
    const copy = data.map(ele => {
      return new Promise(resolve => {
        MasterPlan.findOne({ planId: ele })
        .then((masterPlan) => {
          const planName = masterPlan.planName + ' (Copy)';
          const company = masterPlan.company;
          const employeeOfPlan = masterPlan.employeeOfPlan;
          let newPlan = new MasterPlan({ planName, company, employeeOfPlan });
          newPlan.save().then(() => {
            MasterPlan.findOneAndUpdate({ planId: newPlan.planId }, { $set:
            {
              ipdType: masterPlan.ipdType,
              ipdLumsumPerYear: masterPlan.ipdLumsumPerYear,
              ipdLumsumPerTime: masterPlan.ipdLumsumPerTime,
              ipdLumsumTimeNotExceedPerYear: masterPlan.ipdLumsumTimeNotExceedPerYear,
              rbLumsumRoomPerNight: masterPlan.rbLumsumRoomPerNight,
              rbLumsumNigthNotExceedPerYear: masterPlan.rbLumsumNigthNotExceedPerYear,
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
            }}, () => resolve());
          });
        });
      });
    });
    Promise.all(copy).then(() => {
      reply({ message: "copy completed!" });
    });
  },
};

const getAllPlan = {
  tags: ['api'],
  auth: 'jwt',

  handler: (request, reply) => {
    const { user } = request.auth.credentials;
    MasterPlan.find({ company: user.company.detail }).sort({planId: 1}).exec(function(err, plans) {
      if (err) reply(err);
      reply(plans);
    });
  },
};

const extendedPlan = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      planId: Joi.number().integer(),
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
    const { planId } = request.params;
    const { user } = request.auth.credentials;
    MasterPlan.findOne({ planId })
      .then((masterPlan) => {
        const extendedFrom = masterPlan._id;
        const createdBy = user._id;
        const createdByCompanyId = user.company.detail;
        const company = masterPlan.company;
        let copyNumber = 1;
        // console.log('');
        InsurerPlan
        .find({ extendedFrom, createdByCompanyId })
        .sort({ copyNumber: -1 })
        .then(result => {
          if (result.length > 0) {
            copyNumber = result[0].copyNumber + 1;
          }
          const newPlanName = `${planName} (${copyNumber})`;
          let newPlan = new  InsurerPlan({ company, employeeOfPlan, extendedFrom, copyNumber, createdBy, createdByCompanyId, planName: newPlanName, ipdType, ipdLumsumPerYear, ipdLumsumPerTime, ipdLumsumTimeNotExceedPerYear, rbLumsumRoomPerNight,
            rbLumsumNigthNotExceedPerYear, rbLumsumPayNotExceedPerNight, rbLumsumPayNotExceedPerYear,
            rbSchedulePatient, rbScheduleIntensiveCarePatient, rbScheduleDoctor, rbScheduleSurgerySchedule, rbScheduleSurgeryNonSchedule,
            rbScheduleService, rbScheduleSmallSurgery, rbScheduleAdviser, rbScheduleAmbulance,
            rbScheduleAccident, rbScheduleTreatment, rbScheduleTransplant, ipdCoPay, ipdCoPayQuota,
            ipdCoPayDeductable, ipdCoPayMixPercentage, ipdCoPayMixNotExceed, ipdCoPayMixYear, opdPerYear, opdPerTime, opdTimeNotExceedPerYear,
            opdCoPay, opdCoPayQuota, opdCoPayDeductable, opdCoPayMixPercentage, opdCoPayMixNotExceed, opdCoPayMixYear, dentalPerYear,
            lifePerYear, lifeTimeOfSalary, lifeNotExceed});
          newPlan.save().then((plan) => {
            reply(plan);
          });
        });
      });
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/company/create-plan', config: createPlan },
    { method: 'POST', path: '/insurer/extended-plan/{planId}', config: extendedPlan },
    { method: 'PUT', path: '/company/edit-plan/{planId}/{typeEdit}', config: editMasterPlan },
    { method: 'PUT', path: '/insurer/edit-plan/{planId}', config: editInsurerPlan },
    { method: 'DELETE', path: '/insurer/delete-plan/{planId}', config: deletePlanInsurer },
    { method: 'DELETE', path: '/company/delete-plan', config: deletePlanCompany },
    { method: 'POST', path: '/company/copy-plan', config: copyPlan },
    { method: 'GET', path: '/company/get-all-plan', config: getAllPlan },
  ]);
}
