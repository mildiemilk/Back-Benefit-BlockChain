import fs from 'fs';
import path from 'path';
import aws from 'aws-sdk';

module.exports = () => {
  const { env } = process;

  //const secretKey = env.APP_SECRET_KEY;
  const jwtKey = fs.readFileSync('./config/jwt.key');
  const jwtPub = fs.readFileSync('./config/jwt.key.pub');

  aws.config.update({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  });

  const serviceOptions = {
    auth: { jwtKey, jwtPub },
    mailer: {
      host: env.MAILER_HOST,
      port: env.MAILER_PORT,
      auth: {
        user: env.MAILER_USER,
        pass: env.MAILER_PASS,
      },
      templatesPath: path.join('src/templates'),
    },
  };

  const manifest = {
    server: {
      cache: [
        {
          name: 'redisCache',
          engine: 'catbox-redis',
          host: env.REDIS_CACHE_HOST,
          port: env.REDIS_CACHE_PORT,
          password: env.REDIS_CACHE_PASS,
          partition: 'cache',
        },
        {
          name: 'redisAuth',
          engine: 'catbox-redis',
          host: env.REDIS_AUTH_HOST,
          port: env.REDIS_AUTH_PORT,
          password: env.REDIS_AUTH_PASS,
          partition: 'auth',
        }
      ],
    },
    connections: [
      {
        host: env.APP_SERVER_HOST,
        port: env.APP_SERVER_PORT,
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
        plugin: {
          register: './src/plugins/services',
          options: serviceOptions,
        },
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
    ],
  };

  return manifest;
};
