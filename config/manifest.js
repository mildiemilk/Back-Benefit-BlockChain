const envKey = key => {
  const env = process.env.NODE_ENV || 'development';

  const configuration = {
    development: {
      host: 'localhost',
      port: 8000
    },
    uat: {
      host: 'localhost',
      port: 8010
    },
    // These should match environment variables on hosted server
    production: {
      host: process.env.HOST,
      port: process.env.PORT
    }
  };

  return configuration[env][key];
};

const serviceOptions = {
  mailer: {
    host: process.env.MAILER_HOST,
    port: process.env.MAILER_PORT,
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASS,
    }
  },
};

const manifest = {
  server: {
    cache: [
      {
        name: 'redisCache',
        engine: 'catbox-redis',
        host: '127.0.0.1',
        port: 6379,
        password: '',
        partition: 'cache',
      },
      {
        name: 'redisAuth',
        engine: 'catbox-redis',
        host: '127.0.0.1',
        port: 6379,
        password: '',
        partition: 'auth',
      }
    ],
  },
  connections: [
    {
      host: envKey('host'),
      port: envKey('port'),
      routes: {
        cors: true
      },
      router: {
        stripTrailingSlash: true
      }
    }
  ],
  registrations: [
    {
      plugin: 'hapi-auth-jwt2'
    },
    {
      plugin: './src/plugins/redis',
    },
    {
      plugin: './src/plugins/auth'
    },
    {
      plugin: './src/plugins/services',
    },
    {
      plugin: './src/api',
      options: { routes: { prefix: '/api' } }
    },
    {
      plugin: './src/admin',
      options: { routes: { prefix: '/admin' } }
    },
    {
      plugin: {
        register: 'good',
        options: {
          ops: { interval: 60000 },
          reporters: {
            console: [
              { module: 'good-squeeze', name: 'Squeeze', args: [{ error: '*' }] }, { module: 'good-console' }, 'stdout'
            ]
          }
        }
      }
    }
  ]
};

module.exports = manifest;
