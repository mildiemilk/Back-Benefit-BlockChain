import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongoose_delete from 'mongoose-delete';
import { User } from '../models';
const Schema = mongoose.Schema;

const SimpleRequirementSchema = new mongoose.Schema ({
  simpleRequirementId:{type: Number, default: 0, unique: true},
  numberOfEmployee:{ type: Number, required: true},
  numberOfPlan:{ type: String, required: true},
  IPD:{ type: Boolean, required: true},
  OPD:{ type: Boolean, required: true},
  dental:{ type: Boolean, required: true},
  life:{ type: Boolean, required: true},
  other:{ type: String, required: true},
  hr: { type: Schema.Types.ObjectId, ref: "User" },
});


SimpleRequirementSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
SimpleRequirementSchema.plugin(autoIncrement.plugin,{
  model: 'SimpleRequirementSchema',
  field: 'simpleRequirementId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('SimpleRequirement', SimpleRequirementSchema);
