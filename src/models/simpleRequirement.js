import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
const Schema = mongoose.Schema;

const SimpleRequirementSchema = new mongoose.Schema ({
  simpleRequirementId:{ type: Number, default: 0, unique: true },
  numberOfEmployee:{ type: String, required: true },
  typeOfInsurance:{ type: String, required: true },
  IPD:{ type: Boolean, required: true },
  OPD:{ type: Boolean, required: true },
  dental:{ type: Boolean, required: true },
  life:{ type: Boolean, required: true },
  other:{ type: Boolean, required: true },
  otherDes:{ type: String, default: null },
  date: { type : Date, default: null },
  hr: { type: Schema.Types.ObjectId, ref: "User", required:true },
  insurers: { type: Array },
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
