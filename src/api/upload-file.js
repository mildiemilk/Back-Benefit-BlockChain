import Joi from 'joi';
import { Media } from '../models';

const uploadFile = {
  tags: ['api'],
  auth: 'jwt',
  payload: {
    output: 'stream',
    parse: true,
    allow: 'multipart/form-data'
  },

  handler: (request, reply) => {
    const { file } = request.payload;
    const { storage } = request.server.app.services;
    const { user } = request.auth.credentials;

    storage.upload({ file }, (err, media) => {
      if (err) {
        reply(err);
      } else {
        media.userId = user.id;
        media.save(err => {
          if (err) {
            throw err;
          }
          reply({ media });
        });
      }
    });
  },
};

const getUrl = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      path: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { path } = request.params;
    const { storage } = request.server.app.services;

    storage.getUrl(path, (err, url) => {
      if (err) {
        reply(err);
      } else {
        reply(url);
      }
    });
  },
};

const downloadfile = {
  tags: ['api'],
  auth: 'jwt',
  validate: {
    params: {
      path: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { path } = request.params;
    const { storage } = request.server.app.services;
    console.log('path: ',path);
    storage.download(path, (err, data) => {
      if (err) {
        reply(err);
      } else {
        Media.findOne({ path }, (err, media) => {
          if (err) {
            reply(err);
          } else {
            console.log(data);
            const filename = 'attachment; filename='+ media.name + ';';
            reply(data.Body).header('Content-Type', data.ContentType)
            .header('content-disposition', filename);
          }
        });
      }
    });
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/uploadfile', config: uploadFile },
    { method: 'GET', path: '/geturl/{path}', config: getUrl },
    { method: 'GET', path: '/downloadfile/{path}', config: downloadfile }
  ]);
}
