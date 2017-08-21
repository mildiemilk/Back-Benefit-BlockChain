import { Test } from '../models';
import exceltojson from 'xlsx-to-json-lc';

const testXlsx = {
  tags: ['api'],

  handler: (request, reply) => {
    exceltojson({
      input: __dirname + "/test.xlsx",
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
        });
      }
    });
  },
};

export default function(app) {
  app.route([
    { method: 'GET', path: '/test-xlsx', config: testXlsx },
  ]);
}
