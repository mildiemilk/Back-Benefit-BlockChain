import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const BiddingRelationSchema = new mongoose.Schema ({
  biddingRelationId: {type: Number, default: 0, unique: true},
  company: { type: Schema.Types.ObjectId, ref: "EmployeeCompany", required: true },
  insurers: [{ insurerCompany: { type: Schema.Types.ObjectId, ref: "InsuranceCompany" },
    status: { type: String, enum: ['waiting', 'join', 'reject', 'selected', 'notSelected'] }}],
  timeout: { type : Date, default: null },
  minPrice: { type: Number, default: 0},
  confirmed: { type: Boolean, default: false },
  insurerWin: { type: Schema.Types.ObjectId, ref: "User", default: null },
  insurerCompanyWin: { type: Schema.Types.ObjectId, ref: "InsuranceCompany", default: null },
  biddingWin: { type: Schema.Types.ObjectId, ref: "Bidding",default: null },
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
