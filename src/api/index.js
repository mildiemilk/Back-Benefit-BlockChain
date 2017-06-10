import Register from './register';
import Auth from './auth';
import FileHandler from './file';

export const register = (server, options, next) => {
  Register(server);
  Auth(server);
  FileHandler(server);

  next();
};

register.attributes = {
  name: 'api',
};
