import mongoose, { Schema } from 'mongoose';
import mongooseDelete from 'mongoose-delete';
import timestamps from 'mongoose-timestamp';

const TestSchema = new Schema({
  employee_code: { type: String, required: true },
  prefix: { type: String, required: true },
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  citizen_id: { type: String, required: true },
  email: { type: String, required: true },
  phone_number: { type: String, required: true },
  type_of_employee: { type: String, required: true },
  title: { type: String, required: true },
  department: { type: String, required: true },
  level: { type: String, required: true },
  start_date: { type: String, required: true },
  benefit_group: { type: String, required: true },
  date_of_birth: { type: String, required: true },
  nationality: { type: String, required: true },
  account_number: { type: String, required: true },
  bank_name: { type: String, required: true },
  marriage_status: { type: String, required: true },
});

TestSchema.plugin(timestamps);
TestSchema.plugin(mongooseDelete, { deletedAt: true });

export default mongoose.model('Test', TestSchema);
