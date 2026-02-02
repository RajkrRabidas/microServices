const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/user.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URL = uri;
  process.env.JWT_SECRET = 'test_jwt_secret';
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

test('GET /api/auth/me returns user info when authenticated', async () => {
  const registerPayload = {
    username: 'meuser',
    email: 'me@example.com',
    password: 'password123',
    fullName: { firstName: 'Meh', lastName: 'User' },
    phone: '1234567890'
  };

  const regRes = await request(app).post('/api/auth/register').send(registerPayload);
  expect([200, 201].includes(regRes.statusCode)).toBe(true);

  const loginRes = await request(app).post('/api/auth/login').send({ username: 'meuser', password: 'password123' });
  expect([200, 201].includes(loginRes.statusCode)).toBe(true);

  const setCookie = loginRes.headers['set-cookie'] || [];
  const tokenCookie = setCookie.find((c) => c.startsWith('token='));
  expect(tokenCookie).toBeDefined();

  const res = await request(app).get('/api/auth/me').set('Cookie', tokenCookie);

  expect([200, 201].includes(res.statusCode)).toBe(true);
  const user = res.body.user || res.body;
  expect(user).toBeDefined();
  expect(user.email).toBe('me@example.com');
  expect(user.username).toBe('meuser');
});

test('GET /api/auth/me returns unauthorized when not authenticated', async () => {
  const res = await request(app).get('/api/auth/me');

  expect([401, 403, 400].includes(res.statusCode)).toBe(true);
  expect(res.body).toHaveProperty('message');
});
