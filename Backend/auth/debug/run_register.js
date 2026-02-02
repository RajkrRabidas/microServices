const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');

(async () => {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URL = uri;
  process.env.JWT_SECRET = 'test_jwt_secret';
  await mongoose.connect(uri);

  const registerPayload = {
    username: 'meuser',
    email: 'me@example.com',
    password: 'password123',
    fullName: { firstName: 'Me', lastName: 'User' },
    phone: '1234567890'
  };

  const res = await request(app).post('/api/auth/register').send(registerPayload);
  console.log('status:', res.statusCode);
  console.log('body:', res.body);
  console.log('headers set-cookie:', res.headers['set-cookie']);

  await mongoose.disconnect();
  await mongoServer.stop();
})();