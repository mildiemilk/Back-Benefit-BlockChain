import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
import { Company } from '../models';
const Schema = mongoose.Schema;

const masterPlanSchema = new mongoose.Schema ({
  planId: { type: Number, default: 0, unique: true },
  planName: { type: String, required: true },
  company:  { type: Schema.Types.ObjectId, ref: "Company", required: true },
  employeeOfPlan: { type: Number, required: true },
  updateBy: { type: String, required: true },
  ipdType: { type: String },
  ipdLumsumPerYear: { type: Number },
  ipdLumsumPerTime: { type: Number },
  ipdLumsumTimeNotExceedPerYear: { type: Number },
  rbLumsumRoomPerNight: { type: Number },
  rbLumsumNigthNotExceedPerYear: { type: Number },
  rbLumsumPayNotExceedPerNight: { type: Number },
  rbLumsumPayNotExceedPerYear: { type: Number },
  rbSchedulePatient: { type: Number },
  rbScheduleIntensiveCarePatient: { type: Number },
  rbScheduleDoctor: { type: Number },
  rbScheduleSurgery: { type: Number },
  rbScheduleService: { type: Number },
  rbScheduleSmallSurgery: { type: Number },
  rbScheduleAdviser: { type: Number },
  rbScheduleAmbulance: { type: Number },
  rbScheduleAccident: { type: Number },
  rbScheduleTreatment: { type: Number },
  rbScheduleTransplant: { type: Number },
  ipdCoPlay: { type: Boolean },
  ipdCoPlayQuota: { type: Number },
  ipdCoPlayDeductable: { type: Number },
  ipdCoPlayMixPercentage: { type: Number },
  ipdCoPlayMixNotExceed: { type: Number },
  ipdCoPlayMixYear: { type: Number },
  opdPerYear: { type: Number },
  opdPerTime: { type: Number },
  opdTimeNotExceedPerYear: { type: Number },
  opdCoPlay: { type: Boolean },
  opdCoPlayQuota: { type: Number },
  opdCoPlayDeductable: { type: Number },
  opdCoPlayMixPercentage: { type: Number },
  opdCoPlayMixNotExceed: { type: Number },
  opdCoPlayMixYear: { type: Number },
  dentalPerYear: { type: Number },
  lifePerYear: { type: Number },
  lifeTimeOfSalary: { type: Number },
  lifeNotExceed: { type: Number },
});

masterPlanSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
masterPlanSchema.plugin(mongooseDelete, { deletedAt : true });
masterPlanSchema.plugin(autoIncrement.plugin,{
  model: 'masterPlanSchema',
  field: 'planId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('MasterPlan', masterPlanSchema);
