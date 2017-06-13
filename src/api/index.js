import Register from './register';
import Auth from './auth';
import FileHandler from './file';
import Changepassword from './changepassword';

export const register = (server, options, next) => {
  Register(server);
  Auth(server);
  FileHandler(server);
  Changepassword(server);

  next();
};

register.attributes = {
  name: 'api',
};
