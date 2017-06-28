import Register from './register';
import Auth from './auth';
import FileHandler from './file';
import Remove from './remove';
import simpleRequirements from './simpleRequirement';

export const register = (server, options, next) => {
  Register(server);
  Auth(server);
  FileHandler(server);
  Remove(server);
  simpleRequirements(server);
  next();
};
export const test = (server, options, next) => {
  Auth(server);
  next();
};

register.attributes = {
  name: 'api',
};
