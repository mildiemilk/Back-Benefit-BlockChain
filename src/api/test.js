import { Test } from '../models';
import exceltojson from 'xlsx-to-json-lc';
import fs from 'fs';
import Joi from 'joi';

const xlsxToJson = {
  tags: ['api'],
  validate : {
    params : {
      name: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { name } = request.params;
    exceltojson({
      input: __dirname + "/" + name,
      output: null,
      lowerCaseHeaders:true //to convert all excel headers to lowr case in json
    }, function(err, result) {
      if(err) {
        console.error(err);
      } else {
        console.log(result);
        const test = new Test(result[0]);
        test.save().then(err => {
          reply(err);
          fs.unlink(__dirname + "/" + name, (err) => {
            if (err) throw err;
            console.log('successfully deleted');
          });
        });
      }
    });
  },
};

export default function(app) {
  app.route([
    { method: 'GET', path: '/xlsx-json/{name}', config: xlsxToJson },
  ]);
}
