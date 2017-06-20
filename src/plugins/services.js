import secret from '../../config/secret';
import AuthService from '../services/auth';
import MailerService from '../services/mailer'
import Config from '../../config/config';

export const register = (plugin, options, next) => {
  const services = {};
  const { redis } = plugin.app;

  services.auth = new AuthService({
    redis: redis,
    authPub: secret.jwtPub,
    authKey: secret.jwtKey,
  });

  services.mailer = new MailerService({
    service:'gmail',
    port:25,
    auth: {
      user: Config.email.username,
      pass: Config.email.password,
    },
    tlsL:{
      rejectUnauthorized: false
    }
  });

  plugin.app.services = services;

  next();
};

register.attributes = {
  name: 'services',
};
