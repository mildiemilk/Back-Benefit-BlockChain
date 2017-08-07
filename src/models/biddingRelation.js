import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const BiddingRelationSchema = new mongoose.Schema ({
  BiddingrelationId: {type: Number, default: 0, unique: true},
  insurers: { type: Array },
  status: { type: Array },
  hr: { type: Schema.Types.ObjectId, ref: "User", required: true },
  timeout: { type : Date, default: null },
});


BiddingRelationSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
BiddingRelationSchema.plugin(mongooseDelete, { deletedAt : true });
BiddingRelationSchema.plugin(autoIncrement.plugin,{
  model: 'BiddingRelationSchema',
  field: 'BiddingRelationId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('BiddingRelation', BiddingRelationSchema);
