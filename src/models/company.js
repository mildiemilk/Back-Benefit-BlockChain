import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
import { User, Bidding } from '../models';
const Schema = mongoose.Schema;

const CompanySchema = new mongoose.Schema ({
  companyId: {type: Number, default: 0, unique: true},
  companyName: { type: String, required: true },
  location: { type: String, required: true},
  typeOfBusiness: { type: String, required: true},
  hrDetail: {type: String, required: true},
  numberOfEmployees: { type: String, required: true},
  tel: { type: String, required: true },
  companyBroker: {type: String, required: true},
  companyInsurer: {type: String, required: true},
  hr: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bidding: { type: Schema.Types.ObjectId, ref: "Bidding" },
  benefitPlans: { type: Array }
});


CompanySchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
CompanySchema.plugin(mongooseDelete, { deletedAt : true });
CompanySchema.plugin(autoIncrement.plugin,{
  model: 'CompanySchema',
  field: 'companyId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('Company', CompanySchema);
