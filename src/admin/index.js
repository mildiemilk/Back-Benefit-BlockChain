export const register = (server, options, next) => {

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
