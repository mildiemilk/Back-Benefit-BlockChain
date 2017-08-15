import mongoose, { Schema } from 'mongoose';
import mongooseDelete from 'mongoose-delete';
import timestamps from 'mongoose-timestamp';

const MediaSchema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  ext: { type: String, required: true },
  mime: { type: String, required: true },
  length: { type: Number, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
});

MediaSchema.plugin(timestamps);
MediaSchema.plugin(mongooseDelete, { deletedAt: true });

export default mongoose.model('Media', MediaSchema);
