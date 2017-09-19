import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const BenefitPlanSchema = new mongoose.Schema ({
  benefitPlanId: { type: Number, default: 0, unique: true },
  company: { type: Schema.Types.ObjectId, ref: "EmployeeCompany", required: true },
  benefitPlanName: { type: String, required: true },
  benefitPlan: { 
    plan: {
      planId: { type: Schema.Types.ObjectId, refPath: "benefitPlan.plan.type" },
      type: { type: String }
    },
    isExpense: { type: Boolean },
    expense: { type: Number },
    isHealth: { type: Boolean },
    health: { type: Number },
    detailPlan: { type: Schema.Types.ObjectId, ref: "TemplatePlan" }
  },
  effectiveDate: { type: Date },
  expiredDate: { type: Date },
  timeout: { type: Date, default: null},
  insurerCompany: { type: Schema.Types.ObjectId, ref: "InsuranceCompany", required: true },
  insurer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bidding: { type: Schema.Types.ObjectId, ref: "Bidding", required: true },
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
export default mongoose.model('BenefitPlan', BenefitPlanSchema);
