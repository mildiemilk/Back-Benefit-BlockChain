import Register from './register';
import Auth from './auth';
import FileHandler from './file';
import Remove from './remove';
import Changepassword from './changepassword';

export const register = (server, options, next) => {
  Register(server);
  Auth(server);
  FileHandler(server);
  Remove(server);
  Changepassword(server);
  next();
};

register.attributes = {
  name: 'api',
};
