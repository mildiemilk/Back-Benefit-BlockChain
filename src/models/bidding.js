import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const BiddingSchema = new mongoose.Schema ({
  biddingId: { type: Number, default: 0, unique: true },
  company: { type: Schema.Types.ObjectId, ref: "EmployeeCompany", required: true },
  insurerCompany: { type: Schema.Types.ObjectId, ref: "InsuranceCompany", required: true },
  insurer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  countBidding : { type: Number, default: 0, required: true },
  plan: { 
    master: [{
      planId: { type: Schema.Types.ObjectId, ref: "MasterPlan" },
      price: { type: Number }
    }],
    insurer: [{
      planId: { type: Schema.Types.ObjectId, ref: "InsurerPlan" },
      price: { type: Number }
    }],
  },
  totalPrice: { type: Number, required: true },
  quotationId: { type: String, required: true},
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
