import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';

const CompanySchema = new mongoose.Schema ({
  refId:{type: Number, default: 0, unique: true},
  Company_name:{ type: String, required: true},
  location:{ type: String},
  CompanyNum:{ type: String},
  CompanyLegalStructure:{ type: String},
  EmpolyeeNumber:{ type: Number},
  CompanyBroker:{type: String},
  CompanyInsurer:{type: String},
  removedAt: { type: Date, default: null },
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
