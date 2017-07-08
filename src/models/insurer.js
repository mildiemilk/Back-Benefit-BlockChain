import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const InsurerSchema = new mongoose.Schema ({
  insurerId: { type: Number, default: 0, unique: true },
  insurerName: { type: String, required: true },
  location: { type: String, required: true },
  insurerCode: { type: Number, required: true },
  status: { type: String, default: 'waiting', required: true},
  insurerUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

InsurerSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
InsurerSchema.plugin(mongooseDelete, { deletedAt : true });
InsurerSchema.plugin(autoIncrement.plugin,{
  model: 'InsurerSchema',
  field: 'insurerId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('Insurer', InsurerSchema);
