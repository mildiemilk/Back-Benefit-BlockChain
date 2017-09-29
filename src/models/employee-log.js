import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const EmployeeLogSchema = new mongoose.Schema ({
  employeeLogId: {type: Number, default: 0, unique: true},
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  company: { type: Schema.Types.ObjectId, ref: "EmployeeCompany", required: true },
  status: { type: String, required: true, enum: ['resign', 'promote', 'new'] },
  effectiveDate: { type: Date, required: true },
  typeOfEmployee: { type: String },
  department: { type: String },
  title: { type: String },
  benefitGroup: { type: String },
  benefitPlan: { type: String },
  reason: { type: String },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});


EmployeeLogSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
EmployeeLogSchema.plugin(mongooseDelete, { deletedAt : true });
EmployeeLogSchema.plugin(autoIncrement.plugin,{
  model: 'EmployeeLogSchema',
  field: 'employeeLogId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('EmployeeLog', EmployeeLogSchema);
