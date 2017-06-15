import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';

const CompanySchema = new mongoose.Schema ({
  refId:{type: Number, default: 0, unique: true},
  CompanyName:{ type: String, required: true},
  location:{ type: String, required: true},
  CompanyNum:{ type: Number, required: true},
  CompanyLegalStructure:{ type: String, required: true},
  EmpolyeeNumber:{ type: Number, required: true},
  CompanyBroker:{type: String, required: true},
  CompanyInsurer:{type: String, required: true},
});


CompanySchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
CompanySchema.plugin(autoIncrement.plugin,{
  model: 'CompanySchema',
  field: 'refId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('Company', CompanySchema);
