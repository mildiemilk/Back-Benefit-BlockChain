import Redis from 'ioredis';

export const register = (plugin, options, next) => {
  plugin.app.redis = new Redis();
  next();
};

register.attributes = {
  name: 'redis',
};

export default register;
