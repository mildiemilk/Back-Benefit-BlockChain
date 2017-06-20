import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import autoIncrement from 'mongoose-auto-increment';
import mongooseDelete from 'mongoose-delete';
const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema ({
  userId: { type: Number, default: 0, unique: true },
  email: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true  },
  isSuperAdmin: { type: Boolean, default: false },
  role:{ type: String, required: true},
  emailConfirmedAt: Date,
  company: { type: String, required: true},
  resetPasswordToken: String,
  removedAt: { type: Date, default: null },
  resetPasswordExpires: Date,
  approveFile: {type: Boolean,default:false},
});

UserSchema.pre('save', function(next) {
  const user = this;

  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);

      user.password = hash;
      return next();
    });
  });
});

UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

UserSchema.methods.getScopes = () => {
  const scopes = [];

  return scopes;
};

UserSchema.plugin(timestamps);
autoIncrement.initialize(mongoose.connection);
UserSchema.plugin(mongooseDelete, { deletedAt : true });
UserSchema.plugin(autoIncrement.plugin,{
  model: 'UserSchema',
  field: 'userId',
  startAt: 1,
  incrementBy: 1
});
export default mongoose.model('User', UserSchema);
