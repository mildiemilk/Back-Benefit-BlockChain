import Joi from 'joi';
import Boom from 'boom';


const postBox = {
  tags: ['api'],
  auth: 'jwt',

  validate: {
    payload: {
      passwordToConfirm: Joi.string().required(),
    },
  },
  handler: (request, reply) => {
    const { passwordToConfirm } = request.payload;
    const { user } = request.auth.credentials;
    console.log(user);
    if(user.role == 'HR'){
      if (!user.comparePassword(passwordToConfirm)) {
        reply(Boom.badData('Invalid password'));
      } else {
        reply({ message:'เลือก broker เรียบร้อยแล้ว' });
      }
    }else{
      reply(Boom.badData('This page for HR only'));
    }
  },
};

export default function(app) {
  app.route([
    { method: 'POST', path: '/postbox', config: postBox },
  ]);
}
