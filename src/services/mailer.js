import aws from 'aws-sdk';
import nodemailer from 'nodemailer';

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
      text: mailbody,
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
}

export default MailerService;
