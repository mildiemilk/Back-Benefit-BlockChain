import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const LogUserClaimSchema = new mongoose.Schema ({
  logUserClaimId: {type: Number, default: 0, unique: true},
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  company: { type: Schema.Types.ObjectId, ref: "EmployeeCompany", required: true },
  detail: { type: Object, required: true}, 
  status: { type: String, required: true, enum:['pending','approve','reject'] },
  claimNumber: { type: Number, required: true },
  policyNumber: { type: Number },
  type: { type: String, required: true, enum: ['health','general','insurance'] },
  reason: { type: String }
});


LogUserClaimSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
LogUserClaimSchema.plugin(mongooseDelete, { deletedAt : true });
LogUserClaimSchema.plugin(autoIncrement.plugin,{
  model: 'LogUserClaimSchema',
  field: 'logUserClaimId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('LogUserClaim', LogUserClaimSchema);
