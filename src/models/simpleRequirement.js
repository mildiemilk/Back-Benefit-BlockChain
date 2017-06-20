import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongoose_delete from 'mongoose-delete';

const SimpleRequirementSchema = new mongoose.Schema ({
  refId:{type: Number, default: 0, unique: true},
  simId:{type: Number, default: 0, unique: true},
  NumberOfEmployee:{ type: Number, required: true},
  numberofwantedplan:{ type: String, required: true},
  IPD:{ type: Boolean, required: true},
  OPD:{ type: Boolean, required: true},
  Dental:{ type: Boolean, required: true},
  Life:{ type: Boolean, required: true},
  other:{ type: String, required: true},
});


SimpleRequirementSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
SimpleRequirementSchema.plugin(autoIncrement.plugin,{
  model: 'SimpleRequirementSchema',
  field: 'simId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('SimpleRequirement', SimpleRequirementSchema);
