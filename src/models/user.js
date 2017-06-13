import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';

const UserSchema = new mongoose.Schema ({
  email: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true  },
  isSuperAdmin: { type: Boolean, default: false },
  emailConfirmedAt: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
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

export default mongoose.model('User', UserSchema);
