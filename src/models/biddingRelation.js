import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const BiddingRelationSchema = new mongoose.Schema ({
  biddingRelationId: {type: Number, default: 0, unique: true},
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  insurers: [{ insurerId: { type: Schema.Types.ObjectId, ref: "Company" },
    status: { type: String, enum: ['waiting', 'join', 'reject'] }}],
  timeout: { type : Date, default: null },
  minPrice: { type: Number, default: null},
  confirmed: { type: Boolean, default: false },
});


BiddingRelationSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
BiddingRelationSchema.plugin(mongooseDelete, { deletedAt : true });
BiddingRelationSchema.plugin(autoIncrement.plugin,{
  model: 'BiddingRelationSchema',
  field: 'biddingRelationId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('BiddingRelation', BiddingRelationSchema);
