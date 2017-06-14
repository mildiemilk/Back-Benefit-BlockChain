import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';

const CompanySchema = new mongoose.Schema ({
  id:{type: Number, default: 0, unique: true},
  Company_name:{ type: String, required: true},
  location:{ type: String, required: true},
  Company_NO:{ type: String},
  Company_legal_structure:{ type: String},
  Empolyee_number:{ type: Number},
  Company_Broker:{type: String},
  Company_Insurer:{type: String},
  removedAt: { type: Date, default: null },
});


CompanySchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
CompanySchema.plugin(autoIncrement.plugin,{
  model: 'CompanySchema',
  field: 'id',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('Company', CompanySchema);
