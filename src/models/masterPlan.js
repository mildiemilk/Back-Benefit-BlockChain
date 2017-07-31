import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const masterPlanSchema = new mongoose.Schema ({
  planId: { type: Number, default: 0, unique: true },
  planName: { type: String, required: true },
  company:  { type: Schema.Types.ObjectId, ref: "Company", required: true },
  employeeOfPlan: { type: Number, required: true },
  updateBy: { type: String, required: true },
  ipdType: { type: String, default: null },
  ipdLumsumPerYear: { type: Number, default: null },
  ipdLumsumPerTime: { type: Number, default: null },
  ipdLumsumTimeNotExceedPerYear: { type: Number, default: null },
  rbLumsumRoomPerNight: { type: Number, default: null },
  rbLumsumNigthNotExceedPerYear: { type: Number, default: null },
  rbLumsumPayNotExceedPerNight: { type: Number, default: null },
  rbLumsumPayNotExceedPerYear: { type: Number, default: null },
  rbSchedulePatient: { type: Number, default: null },
  rbScheduleIntensiveCarePatient: { type: Number, default: null },
  rbScheduleDoctor: { type: Number, default: null },
  rbScheduleSurgerySchedule: { type: Number, default: null },
  rbScheduleSurgeryNonSchedule: { type: Number, default: null },
  rbScheduleService: { type: Number, default: null },
  rbScheduleSmallSurgery: { type: Number, default: null },
  rbScheduleAdviser: { type: Number, default: null },
  rbScheduleAmbulance: { type: Number, default: null },
  rbScheduleAccident: { type: Number, default: null },
  rbScheduleTreatment: { type: Number, default: null },
  rbScheduleTransplant: { type: Number, default: null },
  ipdCoPlay: { type: Boolean, default: false },
  ipdCoPlayQuota: { type: Number, default: null },
  ipdCoPlayDeductable: { type: Number, default: null },
  ipdCoPlayMixPercentage: { type: Number, default: null },
  ipdCoPlayMixNotExceed: { type: Number, default: null },
  ipdCoPlayMixYear: { type: Number, default: null },
  opdPerYear: { type: Number, default: null },
  opdPerTime: { type: Number, default: null },
  opdTimeNotExceedPerYear: { type: Number, default: null },
  opdCoPlay: { type: Boolean, default: false },
  opdCoPlayQuota: { type: Number, default: null },
  opdCoPlayDeductable: { type: Number, default: null },
  opdCoPlayMixPercentage: { type: Number, default: null },
  opdCoPlayMixNotExceed: { type: Number, default: null },
  opdCoPlayMixYear: { type: Number, default: null },
  dentalPerYear: { type: Number, default: null },
  lifePerYear: { type: Number, default: null },
  lifeTimeOfSalary: { type: Number, default: null },
  lifeNotExceed: { type: Number, default: null },
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
