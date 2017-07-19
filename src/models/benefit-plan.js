import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const BenefitPlanSchema = new mongoose.Schema ({
  BenefitPlanId: { type: Number, default: 0, unique: true },
  plan: { type: Array, required: true },
  health: { type: Object },
  isHealth: { type: Boolean },
  expense: { type: Object },
  isExpense: { type: Boolean },
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
});

BenefitPlanSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
BenefitPlanSchema.plugin(mongooseDelete, { deletedAt : true });
BenefitPlanSchema.plugin(autoIncrement.plugin,{
  model: 'BenefitPlanSchema',
  field: 'BenefitPlanId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('BenefitPlan', BenefitPlanSchema);
