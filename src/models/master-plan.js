import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const masterPlanSchema = new mongoose.Schema ({
  planId: { type: Number, default: 0, unique: true },
  planName: { type: String, required: true },
  company:  { type: Schema.Types.ObjectId, ref: "EmployeeCompany", required: true },
  employeeOfPlan: { type: Number, required: true },
  fileDetail: { type: Schema.Types.ObjectId, ref: "Media", default: null },
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
  ipdCoPay: { type: Boolean, default: false },
  ipdCoPayQuota: { type: Number, default: null },
  ipdCoPayDeductable: { type: Number, default: null },
  ipdCoPayMixPercentage: { type: Number, default: null },
  ipdCoPayMixNotExceed: { type: Number, default: null },
  ipdCoPayMixYear: { type: Number, default: null },
  opdPerYear: { type: Number, default: null },
  opdPerTime: { type: Number, default: null },
  opdTimeNotExceedPerYear: { type: Number, default: null },
  opdCoPay: { type: Boolean, default: false },
  opdCoPayQuota: { type: Number, default: null },
  opdCoPayDeductable: { type: Number, default: null },
  opdCoPayMixPercentage: { type: Number, default: null },
  opdCoPayMixNotExceed: { type: Number, default: null },
  opdCoPayMixYear: { type: Number, default: null },
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
