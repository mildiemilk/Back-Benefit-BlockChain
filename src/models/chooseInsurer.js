import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongoose_delete from 'mongoose-delete';
import { User } from '../models';
const Schema = mongoose.Schema;

const chooseInsurerSchema = new mongoose.Schema ({
  chooseInsurerId:{type: Number, default: 0, unique: true },
  Insurer1:{ type: String, default: null },
  Insurer2:{ type: String, default: null },
  Insurer3:{ type: String, default: null },
  Insurer4:{ type: String, default: null },
  Insurer5:{ type: String, default: null },
  Status:{ type: String, default: null },
});


chooseInsurerSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
chooseInsurerSchema.plugin(autoIncrement.plugin,{
  model: 'chooseInsurerSchema',
  field: 'chooseInsurerId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('chooseInsurer', chooseInsurerSchema);
