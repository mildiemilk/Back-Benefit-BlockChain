import Joi from 'joi';
import Boom from 'boom';
import { MasterPlan } from '../models';
import Config from '../../config/config';
import timestamps from 'mongoose-timestamp';

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
      rbScheduleSurgery: Joi.number().allow(null),
      rbScheduleService: Joi.number().allow(null),
      rbScheduleSmallSurgery: Joi.number().allow(null),
      rbScheduleAdviser: Joi.number().allow(null),
      rbScheduleAmbulance: Joi.number().allow(null),
      rbScheduleAccident: Joi.number().allow(null),
      rbScheduleTreatment: Joi.number().allow(null),
      rbScheduleTransplant: Joi.number().allow(null),
      ipdCoPlay: Joi.boolean(),
      ipdCoPlayQuota: Joi.number().allow(null),
      ipdCoPlayDeductable: Joi.number().allow(null),
      ipdCoPlayMixPercentage: Joi.number().allow(null),
      ipdCoPlayMixNotExceed: Joi.number().allow(null),
      ipdCoPlayMixYear: Joi.number().integer().allow(null),
      opdPerYear: Joi.number().allow(null),
      opdPerTime: Joi.number().allow(null),
      opdTimeNotExceedPerYear: Joi.number().allow(null),
      opdCoPlay: Joi.boolean(),
      opdCoPlayQuota: Joi.number().allow(null),
      opdCoPlayDeductable: Joi.number().allow(null),
      opdCoPlayMixPercentage: Joi.number().allow(null),
      opdCoPlayMixNotExceed: Joi.number().allow(null),
      opdCoPlayMixYear: Joi.number().integer().allow(null),
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
      rbSchedulePatient, rbScheduleIntensiveCarePatient, rbScheduleDoctor, rbScheduleSurgery,
      rbScheduleService, rbScheduleSmallSurgery, rbScheduleAdviser, rbScheduleAmbulance,
      rbScheduleAccident, rbScheduleTreatment, rbScheduleTransplant, ipdCoPlay, ipdCoPlayQuota,
      ipdCoPlayDeductable, ipdCoPlayMixPercentage, ipdCoPlayMixNotExceed, ipdCoPlayMixYear, opdPerYear, opdPerTime, opdTimeNotExceedPerYear,
      opdCoPlay, opdCoPlayQuota, opdCoPlayDeductable, opdCoPlayMixPercentage, opdCoPlayMixNotExceed, opdCoPlayMixYear, dentalPerYear,
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
          ipdLumsumPerYear: ipdLumsumPerYear,
          ipdLumsumPerTime: ipdLumsumPerTime,
          ipdLumsumTimeNotExceedPerYear: ipdLumsumTimeNotExceedPerYear,
          rbLumsumRoomPerNight: rbLumsumRoomPerNight,
          rbLumsumNigthNotExceedPerYear: rbLumsumPayNotExceedPerYear,
          rbLumsumPayNotExceedPerNight: rbLumsumPayNotExceedPerNight,
          rbLumsumPayNotExceedPerYear: rbLumsumPayNotExceedPerYear,
          rbSchedulePatient: rbSchedulePatient,
          rbScheduleIntensiveCarePatient: rbScheduleIntensiveCarePatient,
          rbScheduleDoctor: rbScheduleDoctor,
          rbScheduleSurgery: rbScheduleSurgery,
          rbScheduleService: rbScheduleService,
          rbScheduleSmallSurgery: rbScheduleSmallSurgery,
          rbScheduleAdviser: rbScheduleAdviser,
          rbScheduleAmbulance: rbScheduleAmbulance,
          rbScheduleAccident: rbScheduleAccident,
          rbScheduleTreatment: rbScheduleTreatment,
          rbScheduleTransplant: rbScheduleTransplant,
          ipdCoPlay: ipdCoPlay,
          ipdCoPlayQuota: ipdCoPlayQuota,
          ipdCoPlayDeductable: ipdCoPlayDeductable,
          ipdCoPlayMixPercentage: ipdCoPlayMixPercentage,
          ipdCoPlayMixNotExceed: ipdCoPlayMixNotExceed,
          ipdCoPlayMixYear: ipdCoPlayMixYear,
          updateBy: updateBy
        }}, () => reply({message: 'edit IPD complete!'})); break;
        case 'opd' : MasterPlan.findOneAndUpdate({ planId: planId }, { $set: 
        { 
          opdPerYear: opdPerYear,
          opdPerTime: opdPerTime,
          opdTimeNotExceedPerYear: opdTimeNotExceedPerYear,
          opdCoPlay: opdCoPlay,
          opdCoPlayQuota: opdCoPlayQuota,
          opdCoPlayDeductable: opdCoPlayDeductable,
          opdCoPlayMixPercentage: opdCoPlayMixPercentage,
          opdCoPlayMixNotExceed: opdCoPlayMixNotExceed,
          opdCoPlayMixYear: opdCoPlayMixYear,
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

export default function(app) {
  app.route([
    { method: 'POST', path: '/createPlan', config: createPlan },
    { method: 'PUT', path: '/editPlan/{planId}/{typeEdit}', config: editPlan },
  ]);
}
