import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';

const upload = {
  tags: ['file', 'api'],
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

    fs.writeFile(pathname2 + filename + '.enc', crypted, () => {
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

const invoke = {
  tags: ['file', 'api'],
  handler: (request, reply) => {
    axios({
      method: 'post',
      url: 'http://localhost:8081/apis/channels/mychannel/chaincodes/mycc',
      data: { 
        peers: '["127.0.0.1:7051"]',
        fcn: 'invoke',
        args: JSON.stringify(["a","b","7"])
      },
    })
    .then(response => {
      console.log(response);
      reply('success');
    });
  },
};

export default function(server) {
  server.route([
    { method: 'POST', path: '/file/upload', config: upload },
    { method: 'GET', path: '/file/download', config: download },
    { method: 'GET', path: '/test-invoke', config: invoke },
  ]);
}
