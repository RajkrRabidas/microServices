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

test('POST /api/auth/login succeeds with correct credentials and sets token cookie', async () => {
  const registerPayload = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    fullName: { firstName: 'Test', lastName: 'User' },
    phone: '1234567890'
  };

  // register the user first
  const regRes = await request(app).post('/api/auth/register').send(registerPayload);
  expect(regRes.statusCode).toBe(201);

  const loginPayload = { username: 'testuser', password: 'password123' };

  const res = await request(app).post('/api/auth/login').send(loginPayload);

  // Expect a successful login (implementation may differ; adapt as needed)
  expect([200, 201].includes(res.statusCode)).toBe(true);

  // cookie named token should be set by the server on successful auth
  const setCookie = res.headers['set-cookie'] || [];
  const hasTokenCookie = setCookie.some((c) => c.startsWith('token='));
  expect(hasTokenCookie).toBe(true);
});

test('POST /api/auth/login fails with incorrect password', async () => {
  const registerPayload = {
    username: 'baduser',
    email: 'bad@example.com',
    password: 'rightpassword',
    fullName: { firstName: 'Bad', lastName: 'User' },
    phone: '8888888888'
  };

  await request(app).post('/api/auth/register').send(registerPayload);

  const res = await request(app).post('/api/auth/login').send({ username: 'baduser', password: 'wrongpassword' });

  // Expect unauthorized or bad request depending on implementation
  expect([400, 401, 404].includes(res.statusCode)).toBe(true);
  expect(res.body).toHaveProperty('message');
});
