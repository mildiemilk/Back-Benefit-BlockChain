import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const InsuranceCompanySchema = new mongoose.Schema ({
  companyId: {type: Number, default: 0, unique: true},
  companyName: { type: String, required: true},
  location: { type: String },
  companyCode: { type: String },
  website: { type: String },
  tel: { type: String },
  fax: { type: String },
  email: { type: String },
  contactPerson: { type: String },
  customers: [{ company: { type: Schema.Types.ObjectId, ref: "EmployeeCompany" } }],
  logo: { 
    logoId: { type: Schema.Types.ObjectId, ref: "Media" },
    link: { type: String }
  },
});


InsuranceCompanySchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
InsuranceCompanySchema.plugin(mongooseDelete, { deletedAt : true });
InsuranceCompanySchema.plugin(autoIncrement.plugin,{
  model: 'InsuranceCompanySchema',
  field: 'companyId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('InsuranceCompany', InsuranceCompanySchema);
