import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import aws from 'aws-sdk';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

import { merge } from 'lodash';

import Config from '../../config/config';

class MailerService {
  constructor(options) {
    const transport = options.transport || 'smtp';
    const transportOptions = this.getTransportOptions(transport, options);

    this.options = options;
    this.mailer = nodemailer.createTransport(transportOptions);
  }

  getTransportOptions(transport, mailerOptions) {
    switch (transport) {
      case 'ses':
        return {
          SES: new aws.SES({}),
        };
      default:
        return {
          secure: true,
          ...mailerOptions,
        };
    }
  }

  templateOptions(options) {
    const { APP_BASE_URL } = process.env;

    return merge({
      baseURL: APP_BASE_URL,
    }, options);
  }

  getTemplateSubject(template) {
    switch (template) {
      case 'verify-email':
        return 'Verify your account';
      default:
        return '';
    }
  }

  sendTemplateEmail(template, to, options) {
    const templatePath = path.join(this.options.templatesPath, 'email', `${template}.ejs`);
    const content = fs.readFileSync(templatePath, 'utf-8');
    const html = ejs.render(content, this.templateOptions(options));

    const mailOptions = {
      to,
      html,
      from: 'no-reply@benefitable.com',
      subject: this.getTemplateSubject(template),
    };

    this.mailer.sendMail(mailOptions, (err) => {
      if (err) {
        console.log(err);
      }

      this.mailer.close();
    });
  }

  sendMail(to, subject, mailbody) {
    let mailOption = {
      from: this.mailer.user,
      to: to,
      subject: subject,
      html: mailbody,
    };

    this.mailer.sendMail(mailOption,(error) => {
      if (error) {
        console.log(error);
      }
      this.mailer.close(); // shut down the connection pool, no more messages
    });
  }

  genNounce(){
    let nounce = bcrypt.genSaltSync(10);
    return nounce;
  }

  genToken(base){
    let token = bcrypt.hashSync(base, Config.key.privateKey, function(err, hash) {
      if (err) return err;
      return hash;
    });
    return token;
  }

  sendMailVerificationLink(ts,email){
    const nounce = this.genNounce();
    let base = email + ts + nounce;
    const token = this.genToken(base);
    let subject = 'Verify Your Account';
    let mailbody = '<p>Thanks for Registering on Benefitable</p><p>Please verify your email by clicking on the verification link below.<br/><a href="http://'
                    + Config.server.host + ':' + Config.server.port + '/' + Config.email.verifyEmailUrl + '/'
                    + encodeURIComponent(email) + '&' + encodeURIComponent(token) + '&' + ts + '&' + encodeURIComponent(nounce) + '">Verification Link</a></p>';
    this.sendMail(email,subject,mailbody);
  }
  sendMailForgotPasswordLink(email){
    let subject = 'Forgot password Your Account';
    let mailbody = '<p>You forgot your password .<br/><a href="http://www.google.com"> Forgot password Link</a></p>';
    this.sendMail(email,subject,mailbody);
  }
  sendMailApproveAccount(email){
    let subject = 'Approved Account';
    let mailbody = '<p>ConGrats! Your Account is Approved </p>';
    this.sendMail(email,subject,mailbody);
  }
  sendMailToAdminApproveAccount(email){
    let subject = 'Approved Account';
    let mailbody = email +'<p> register in the system, please approve this account </p>';
    this.sendMail(Config.email.username,subject,mailbody);
  }
  sendMailToEmployee(email, password){
    let subject = 'Welcome to Benefitable';
    let mailbody = '<p>Email:'+ email + ' password: ' + password + '</p>';
    this.sendMail(email,subject,mailbody);
  }
}

export default MailerService;
