import AboutCompany from './aboutCompany';
import EditCompany from './editCompany';
import Approve from './approve';
import FillSimpleRequirement from './fillSimpleRequirement';
import ManageRole from './manageRole';

export const register = (server, options, next) => {
  AboutCompany(server);
  EditCompany(server);
  Approve(server);
  FillSimpleRequirement(server);
  ManageRole(server);
  server.route([
    {
      method: 'GET',
      path: '/',
      config: {
        auth: {
          strategy: 'jwt',
          scope: 'admin',
        },
        tags: ['admin', 'api'],
        handler: (request, reply) => {
          reply({ messege: 'hello' });
        },
      },
    },
  ]);

  next();
};

register.attributes = {
  name: 'admin',
};
