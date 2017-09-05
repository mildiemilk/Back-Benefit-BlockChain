import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import mongooseDelete from 'mongoose-delete';

const RoleSchema = new mongoose.Schema ({
  roleName: { type: String, required: true, enum: ['HR', 'Employee', 'Insurer']},
});


RoleSchema.plugin(timestamps);
RoleSchema.plugin(mongooseDelete, { deletedAt : true });

export default mongoose.model('Role', RoleSchema);
