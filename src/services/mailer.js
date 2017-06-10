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

  sendMail(to) {

  }
}

export default MailerService;
