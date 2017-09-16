import Register from './register';
import Auth from './auth';
import FileHandler from './file';
import Remove from './remove';
import SetPlan from './set-plan';
import Insurer from './insurer';
import Bidding from './bidding';
import BenefitPlan from './benefit-plan';
import UploadFile from './upload-file';
import UserDetail from './user-detail';
import EmployeeCompany from './employee-company';
import EmployeeBenefit from './employee-benefit';
import Claim from './claim';

export const register = (server, options, next) => {
  Register(server);
  Auth(server);
  FileHandler(server);
  Remove(server);
  SetPlan(server);
  Insurer(server);
  Bidding(server);
  BenefitPlan(server);
  UploadFile(server);
  UserDetail(server);
  EmployeeCompany(server);
  EmployeeBenefit(server);
  Claim(server);
  next();
};
export const test = (server, options, next) => {
  Auth(server);
  next();
};

register.attributes = {
  name: 'api',
};
