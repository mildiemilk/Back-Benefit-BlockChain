import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const TemplatePlanSchema = new mongoose.Schema ({
  templatePlanId: { type: Number, default: 0, unique: true },
  company: { type: Schema.Types.ObjectId, ref: "EmployeeCompany", required: true },
  plan: { 
    master: [{
      planId: { type: Schema.Types.ObjectId, ref: "MasterPlan" },
      price: { type: Number }
    }],
    insurer: [{
      planId: { type: Schema.Types.ObjectId, ref: "InsurerPlan" },
      price: { type: Number }
    }],
  },
  health: { type: Object, default: null },
  isHealth: { type: Boolean, default: false },
  expense: { type: Object, default: null },
  isExpense: { type: Boolean, default: false },
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
export default mongoose.model('TemplatePlan', TemplatePlanSchema);
