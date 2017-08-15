import Joi from 'joi';
import aws from 'aws-sdk';

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

const getFile = {
  tags: ['api'],
  auth: 'jwt',
  handler: (request, reply) => {
    const {env} = process;
    aws.config.update({
      accessKeyId: env.AWS_ACCESS_KEY,
      secretAccessKey: env.AWS_SECRET_KEY,
      region:'ap-southeast-1'
    });
    let s3 = new aws.S3();
    let myBucket = 'benefitable-dev';
    let myKey = 'test.txt';
    const getParams = {Bucket: myBucket, Key: myKey};
    s3.getObject(getParams, function(err, data) {
      if (err)
        return err;
      let objectData = data.Body.toString('utf-8');
      reply(objectData);
    });
  },
};


export default function(app) {
  app.route([
    { method: 'POST', path: '/uploadfile', config: uploadFile },
    { method: 'GET', path: '/getfile', config: getFile },
  ]);
}
