import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongoose_delete from 'mongoose-delete';
import { User } from '../models';
const Schema = mongoose.Schema;

const BrokerDetailSchema = new mongoose.Schema ({
  refId: {type: Number, default: 0, unique: true},
  BrokerCompanyName: { type: String, required: true},
  BrokerCompanyWebsite: { type: String, required: true},
  BrokerCompanyNumber: { type: Number, required: true},
  location: { type: String, required: true},
  BrokerSignature:{ type: String, required: true},
  broker: { type: Number, ref: "User", required: true },
});


BrokerDetailSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
BrokerDetailSchema.plugin(autoIncrement.plugin,{
  model: 'BrokerDetailSchema',
  field: 'refId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('BrokerDetail', BrokerDetailSchema);
