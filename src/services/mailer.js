import aws from 'aws-sdk';
import nodemailer from 'nodemailer';
import Config from '../../config/config';
import bcrypt from 'bcrypt';

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

  sendMail(to,subject,mailbody) {
    let mailOption = {
      from: this.mailer.user,
      to: to,
      subject: subject,
      html: mailbody,
    };
    
    this.mailer.sendMail(mailOption,(error,info) => {
      if(error){
        console.log(error);
      }
      console.log("the message was sent");
      console.log(info);
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
}

export default MailerService;
