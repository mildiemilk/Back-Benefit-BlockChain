import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const EmployeeCompanySchema = new mongoose.Schema ({
  companyId: {type: Number, default: 0, unique: true},
  companyName: { type: String, required: true },
  location: { type: String, required: true},
  typeOfBusiness: { type: String, required: true },
  hrDetail: {type: String, required: true},
  numberOfEmployees: { type: Number, required: true },
  tel: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  logo: { 
    logoId: { type: Schema.Types.ObjectId, ref: "Media" },
    link: { type: String }
  },
  completeStep: { type: Array, default: [false,false,false,false] },
  fileEmployee: { type: Schema.Types.ObjectId, ref: "Media" },
  claimData: { type: Array },
  employeeList: { type: Schema.Types.ObjectId, ref: "Media" },
  approve: { type: Boolean, default: false },
  startInsurance: { type: Date, required: true },
  expiredInsurance: { type: Date, required: true },
  uploadPolicy: { type: Boolean, default: false },
  currentInsurer: { type: String, required: true }
});


EmployeeCompanySchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
EmployeeCompanySchema.plugin(mongooseDelete, { deletedAt : true });
EmployeeCompanySchema.plugin(autoIncrement.plugin,{
  model: 'EmployeeCompanySchema',
  field: 'companyId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('EmployeeCompany', EmployeeCompanySchema);
