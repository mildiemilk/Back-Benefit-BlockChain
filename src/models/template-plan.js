import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const TemplatePlanSchema = new mongoose.Schema ({
  templatePlanId: { type: Number, default: 0, unique: true },
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  plan: { type: Object, required: true },
  health: { type: Object },
  isHealth: { type: Boolean },
  expense: { type: Object },
  isExpense: { type: Boolean },
});

TemplatePlanSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
TemplatePlanSchema.plugin(mongooseDelete, { deletedAt : true });
TemplatePlanSchema.plugin(autoIncrement.plugin,{
  model: 'TemplatePlanSchema',
  field: 'templatePlanId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('templatePlan', TemplatePlanSchema);
