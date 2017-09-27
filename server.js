import mongoose from 'mongoose';
import Glue from 'glue';
import Inert from 'inert';
import Vision from 'vision';
import HapiSwagger from 'hapi-swagger';
import Promise from 'bluebird';
import Manifest from './config/manifest';
import dotenv from 'dotenv';

dotenv.config();
const manifest = Manifest();

Promise.promisifyAll(mongoose);
mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://52.163.114.114:27017/mydb');
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/mydb');

if (!process.env.PRODUCTION) {
  manifest.registrations.push({
    "plugin": {
      "register": "blipp",
      "options": {}
    }
  });
}

Glue.compose(manifest, { relativeTo: __dirname }, (err, server) => {
  if (err) {
    console.log('server.register err:', err);
  }

  const options = {
    info: {
      'title': 'Benefitable API Documentation',
      'version': '0.0.1',
    },
    grouping: 'tags',
    payloadType: 'form',
  };

  server.register([
    Inert,
    Vision,
    { register: HapiSwagger, options: options }
  ], (err) => {
    server.start(() => {
      if (err) {
        console.log(err);
      } else {
        console.log('Server running at:', server.info.uri);
      }
    });
  });

  server.start(() => {
    console.log('✅  Server is listening on ' + server.info.uri.toLowerCase());
  });
});
