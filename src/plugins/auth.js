import secret from '../../config/secret';

export const register = (plugin, options, next) => {

  plugin.auth.strategy('jwt', 'jwt', {
    key: secret.jwtPub,
    verifyOptions: {
      algorithms: ['RS256']
    },
    validateFunc: (decoded, request, callback) => {
      const { auth } = request.server.app.services;

      const token = request.headers['authorization'];
      auth.validateAuthToken(decoded, token, callback);
    },
  });

  next();
};

register.attributes = {
  name: 'auth'
};
