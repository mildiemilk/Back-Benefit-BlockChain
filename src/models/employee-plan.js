import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const EmployeePlanSchema = new mongoose.Schema ({
  employeePlanId: {type: Number, default: 0, unique: true},
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  benefitPlan: {}, //TODO: should be benefitPlan_id
  selectGroup: { type: String, required: true },
});


EmployeePlanSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
EmployeePlanSchema.plugin(mongooseDelete, { deletedAt : true });
EmployeePlanSchema.plugin(autoIncrement.plugin,{
  model: 'EmployeePlanSchema',
  field: 'employeePlanId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('EmployeePlan', EmployeePlanSchema);
