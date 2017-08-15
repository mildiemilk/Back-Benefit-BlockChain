import aws from 'aws-sdk';
import fileType from 'file-type';
import merge from 'lodash/merge';
import tmp from 'tmp';
import crypto from 'crypto';
import { Media } from '../models';

class StorageService {
  constructor(options) {
    console.log(options);
    this.s3 = new aws.S3({ region: options.region });
    this.bucket = options.bucket;
  }

  upload(data, callback) {
    const file = data.file;
    const info = fileType(file._data);
    const filename = file.hapi.filename;
    const contentLength = file._data.length;

    if (!info) {
      return new Error("Invalid valid filetype");
    }

    const path = this._generateRandomStorageKey(filename, info.ext);

    const params = {
      Bucket: this.bucket,
      Key: path,
      ContentType: info.mime,
      ContentLength: contentLength,
      Body: file,
      ServerSideEncryption : 'AES256',
    };

    this.s3.putObject(params, err => {
      if (err) {
        callback(err, null);
      } else {
        const media = new Media({
          path,
          name: filename,
          ext: info.ext,
          length: contentLength,
          mime: info.mime,
        });

        callback(err, media)
      }
    });
  }

  _generateRandomStorageKey(filename, ext) {
    const c1 = Math.floor(Math.random() * 999) + 1;
    const c2 = Math.floor(Math.random() * 999) + 1;
    const c3 = Math.floor(Math.random() * 999) + 1;

    const pad = (num) => {
      let s = num + "";
      while (s.length < 3) s = "0" + s;
      return s;
    };

    const hash = crypto.createHash('md5').update(filename + c3).digest("hex");

    return `${pad(c1)}/${pad(c2)}/${hash}.${ext}`;
  }
}

export default StorageService;
