import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const CompanySchema = new mongoose.Schema ({
  companyId: {type: Number, default: 0, unique: true},
  companyName: { type: String, required: true },
  location: { type: String, required: true},
  typeOfBusiness: { type: String, required: true, enum: ['Type 1', 'Type 2', 'Type 3']}, 
  hrDetail: {type: String, required: true},
  numberOfEmployees: { type: String, required: true, enum: ['1-50', '51-100', '101-150']},
  tel: { type: String, required: true },
  insurer: { type: Array },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  logo: { type: Schema.Types.ObjectId, ref: "Media" },
  completeStep: { type: Array, default: [false,false,false,false] },
  fileEmployee: { type: Schema.Types.ObjectId, ref: "Media" },
  employeeList: { type: Schema.Types.ObjectId, ref: "Media" },
  approve: { type: Boolean, default: false },
  startInsurance: { type: Date, required: true },
  expiredInsurance: { type: Date, required: true },
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
