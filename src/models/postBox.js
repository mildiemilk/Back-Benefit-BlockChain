import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongoose_delete from 'mongoose-delete';
import { User } from '../models';
const Schema = mongoose.Schema;

const PostBoxSchema = new mongoose.Schema ({
  simpleRequirementId:{type: Number, default: 0, unique: true },
});


PostBoxSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
PostBoxSchema.plugin(autoIncrement.plugin,{
  model: 'PostBoxSchema',
  field: 'postBoxId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('PostBox', PostBoxSchema);
