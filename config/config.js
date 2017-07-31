module.exports = {
  server: {
    host: '127.0.0.1',
    port: 8000
  },
  key: {
    privateKey: '$2a$10$7BnaKrZwxqzzqdI19MmgBe',
    tokenExpiry: 1 * 30 * 1000 * 60 //1 hour
  },
  email: {
    username: 'thedo.a1412@gmail.com',
    password: 'detective',
    accountName: 'MILK',
    verifyEmailUrl: 'api/register-confirmation'
  }
};
