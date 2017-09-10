import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const EmployeeGroupSchema = new mongoose.Schema ({
  employeeGroupId: { type: Number, default: 0, unique: true },
  company: { type: Schema.Types.ObjectId, ref: "EmployeeCompany", required: true },
  groupName: { type: String, required: true },
  type: { type: String, enum: ['fixed', 'flex', null], default: null },
  benefitPlan: [{ type: Schema.Types.ObjectId, ref: "BenefitPlan", default: null }],
  defaultPlan: { type: Schema.Types.ObjectId, ref: "BenefitPlan", default: null },
  amount: { type: Number, required: true },
});

EmployeeGroupSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
EmployeeGroupSchema.plugin(mongooseDelete, { deletedAt : true });
EmployeeGroupSchema.plugin(autoIncrement.plugin,{
  model: 'EmployeeGroupSchema',
  field: 'employeeGroupId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('EmployeeGroup', EmployeeGroupSchema);
