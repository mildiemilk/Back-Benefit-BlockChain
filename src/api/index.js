import Register from './register';
import Auth from './auth';
import FileHandler from './file';
import Remove from './remove';
import SetPlan from './setPlan';
import PostBox from './postBox';
import Insurer from './insurer';

export const register = (server, options, next) => {
  Register(server);
  Auth(server);
  FileHandler(server);
  Remove(server);
  SetPlan(server);
  PostBox(server);
  Insurer(server);
  next();
};
export const test = (server, options, next) => {
  Auth(server);
  next();
};

register.attributes = {
  name: 'api',
};
