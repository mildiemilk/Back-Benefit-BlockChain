import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models';

const TokenTTL = 3600;
const jwtkey = user => `jwt_${user.id}`;

class AuthService {
  constructor(options) {
    this.redis = options.redis;
    this.authPub = options.authPub;
    this.authKey = options.authKey;
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  validateAuthToken(decoded, encoded, cb) {
    User.findById(decoded.id).then(user => {
      if (user) {
        this.redis.get(jwtkey(user), (err, result) => {
          if (err) {
            cb(null, false);
          }

          if (result !== this.hashToken(encoded)) {
            return cb(null, false);
          }

          return cb(null, true, { user, scope: ['admin'] });
        });
      } else {
        cb(null, false);
      }
    });
  }

  createAuthToken(user) {
    const token = jwt.sign({ id: user.id }, this.authKey, { algorithm: 'RS256', expiresIn: TokenTTL });
    this.redis.set(jwtkey(user), this.hashToken(token), 'ex', TokenTTL);

    return token;
  }

  removeAuthToken(user) {
    return this.redis.del(jwtkey(user));
  }
}

export default AuthService;
