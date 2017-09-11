import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const BenefitPlanSchema = new mongoose.Schema ({
  benefitPlanId: { type: Number, default: 0, unique: true },
  company: { type: Schema.Types.ObjectId, ref: "EmployeeCompany", required: true },
  benefitPlanName: { type: String, required: true },
  benefitPlan: { type: Object, required: true },
  effectiveDate: { type: Date },
  expiredDate: { type: Date },
  timeout: { type: Date, default: null},
});

BenefitPlanSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
BenefitPlanSchema.plugin(mongooseDelete, { deletedAt : true });
BenefitPlanSchema.plugin(autoIncrement.plugin,{
  model: 'BenefitPlanSchema',
  field: 'benefitPlanId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('benefitPlan', BenefitPlanSchema);
