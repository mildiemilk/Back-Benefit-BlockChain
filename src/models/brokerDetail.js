import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
import { User } from '../models';
const Schema = mongoose.Schema;

const BrokerDetailSchema = new mongoose.Schema ({
  brokerId: {type: Number, default: 0, unique: true},
  brokerCompanyName: { type: String, required: true},
  brokerCompanyWebsite: { type: String, required: true},
  brokerCompanyNumber: { type: Number, required: true},
  location: { type: String, required: true},
  brokerSignature:{ type: String, required: true},
  broker: { type: Schema.Types.ObjectId, ref: "User", required: true},
});


BrokerDetailSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
BrokerDetailSchema.plugin(mongooseDelete, { deletedAt : true });
BrokerDetailSchema.plugin(autoIncrement.plugin,{
  model: 'BrokerDetailSchema',
  field: 'brokerId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('BrokerDetail', BrokerDetailSchema);
