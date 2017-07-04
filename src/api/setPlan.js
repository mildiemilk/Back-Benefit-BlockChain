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
        reply({message:'deleted complete!'})
    })
    
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
        const planName = masterPlan.planName
        const company = masterPlan.company
        const employeeOfPlan = masterPlan.employeeOfPlan
        let newPlan = new MasterPlan({ planName, company, employeeOfPlan, updateBy });
        newPlan.save().then(() => {
          console.log(masterPlan)
          console.log(newPlan.planId)
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
            rbScheduleSurgery: masterPlan.rbScheduleSurgery,
            rbScheduleService: masterPlan.rbScheduleService,
            rbScheduleSmallSurgery: masterPlan.rbScheduleSmallSurgery,
            rbScheduleAdviser: masterPlan.rbScheduleAdviser,
            rbScheduleAmbulance: masterPlan.rbScheduleAmbulance,
            rbScheduleAccident: masterPlan.rbScheduleAccident,
            rbScheduleTreatment: masterPlan.rbScheduleTreatment,
            rbScheduleTransplant: masterPlan.rbScheduleTransplant,
            ipdCoPlay: masterPlan.ipdCoPlay,
            ipdCoPlayQuota: masterPlan.ipdCoPlayQuota,
            ipdCoPlayDeductable: masterPlan.ipdCoPlayDeductable,
            ipdCoPlayMixPercentage: masterPlan.ipdCoPlayMixPercentage,
            ipdCoPlayMixNotExceed: masterPlan.ipdCoPlayMixNotExceed,
            ipdCoPlayMixYear: masterPlan.ipdCoPlayMixYear,
            opdPerYear: masterPlan.opdPerYear,
            opdPerTime: masterPlan.opdPerTime,
            opdTimeNotExceedPerYear: masterPlan.opdTimeNotExceedPerYear,
            opdCoPlay: masterPlan.opdCoPlay,
            opdCoPlayQuota: masterPlan.opdCoPlayQuota,
            opdCoPlayDeductable: masterPlan.opdCoPlayDeductable,
            opdCoPlayMixPercentage: masterPlan.opdCoPlayMixPercentage,
            opdCoPlayMixNotExceed: masterPlan.opdCoPlayMixNotExceed,
            opdCoPlayMixYear: masterPlan.opdCoPlayMixYear,
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
