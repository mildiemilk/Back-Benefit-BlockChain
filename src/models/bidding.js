import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const BiddingSchema = new mongoose.Schema ({
  biddingId: { type: Number, default: 0, unique: true },
  insurerName: { type: String, required: true },
  detail: { type: Array, required: true },
  timeOfBidding : { type: Number, default: 0, required: true },
  status: { type: String, required: true },
  hr: { type: String, required: true },
});

BiddingSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
BiddingSchema.plugin(mongooseDelete, { deletedAt : true });
BiddingSchema.plugin(autoIncrement.plugin,{
  model: 'BiddingSchema',
  field: 'biddingId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('Bidding', BiddingSchema);
