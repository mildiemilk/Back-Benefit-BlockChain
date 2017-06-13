import secret from '../../config/secret';
import AuthService from '../services/auth';

export const register = (plugin, options, next) => {
  const services = {};
  const { redis } = plugin.app;

  services.auth = new AuthService({
    redis: redis,
    authPub: secret.jwtPub,
    authKey: secret.jwtKey,
  });

  plugin.app.services = services;

  next();
};

register.attributes = {
  name: 'services',
};
