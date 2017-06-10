import Register from './register';
import Auth from './auth';

export const register = (server, options, next) => {
  Register(server);
  Auth(server);

  next();
};

register.attributes = {
  name: 'api',
};

