import RegisterCompany from './registerCompany';
import EditCompany from './editCompany';
import Approve from './Approve';

export const register = (server, options, next) => {
  RegisterCompany(server);
  EditCompany(server);
  Approve(server);
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
