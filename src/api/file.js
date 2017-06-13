import Joi from 'joi';
import Boom from 'boom';
import fs from 'fs';
import crypto from 'crypto';
import { User } from '../models';

const upload = {
  tags: ['file', 'api'],
  // validate: {
  //   payload: {
  //     email: Joi.string().required().email(),
  //     password: Joi.string().required().trim().regex(passwordPattern),
  //   },
  // },
  handler: (request, reply) => {
    const data = request.payload.file;
    const cipher = crypto.createCipher('aes-256-cbc', '1234');
    const crypted = Buffer.concat([cipher.update(data),cipher.final()]);
    const rand = () => Math.random().toString().substr(2, 3);
    const pathname = "./uploads/" + rand() + "/";
    const pathname2 = pathname + rand() + "/";
    const filename = crypto.createHash('md5').update(Date.now().toString()).digest("hex");
    if (!fs.existsSync(pathname)){
      fs.mkdirSync(pathname);
      fs.mkdirSync(pathname2);
    }
    else if (!fs.existsSync(pathname2)) {
      fs.mkdirSync(pathname2);
    }

    fs.writeFile(pathname2 + filename + '.enc', crypted, err => {
      console.log(pathname2, crypted);
    });

    reply("upload function");
  },
};

const download = {
  tags: ['file', 'api'],
  handler: (request, reply) => {
    reply("Should Download Something");
  },
};

export default function(server) {
  server.route([
    { method: 'POST', path: '/file/upload', config: upload },
    { method: 'GET', path: '/file/download', config: download },
  ]);
}
