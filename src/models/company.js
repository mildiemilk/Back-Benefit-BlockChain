import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongoose_delete from 'mongoose-delete';
import { User } from '../models';
const Schema = mongoose.Schema;

const CompanySchema = new mongoose.Schema ({
  refId: {type: Number, default: 0, unique: true},
  CompanyName: { type: String, required: true},
  location: { type: String, required: true},
  CompanyNumber: { type: Number, required: true},
  NumberOfEmployee: { type: Number, required: true},
  CompanyBroker: {type: String, required: true},
  CompanyInsurer: {type: String, required: true},
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
