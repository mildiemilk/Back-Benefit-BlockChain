import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongoose_delete from 'mongoose-delete';
import { User } from '../models';
const Schema = mongoose.Schema;

const ChatSchema = new mongoose.Schema ({
  chatId:{type: Number, default: 0, unique: true },
  message:{ type: String, required: true },
});


ChatSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
ChatSchema.plugin(autoIncrement.plugin,{
  model: 'ChatSchema',
  field: 'chatId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('Chat', ChatSchema);
