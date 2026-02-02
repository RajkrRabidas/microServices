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

test('POST /auth/register creates a user', async () => {
  const payload = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    fullName: { firstName: 'Test', lastName: 'User' },
    phone: '1234567890'
  };

  const res = await request(app).post('/api/auth/register').send(payload);

  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty('user');
  expect(res.body.user).toHaveProperty('_id');
  expect(res.body.user.email).toBe('test@example.com');

  const userInDb = await User.findOne({ email: 'test@example.com' });
  expect(userInDb).not.toBeNull();
  expect(userInDb.username).toBe('testuser');
});

test('POST /auth/register rejects duplicate email or username', async () => {
  const payload = {
    username: 'dupuser',
    email: 'dup@example.com',
    password: 'password123',
    fullName: { firstName: 'Dup', lastName: 'User' },
    phone: '1234567890'
  };

  // create first
  const res1 = await request(app).post('/api/auth/register').send(payload);
  expect(res1.statusCode).toBe(201);

  // try to create duplicate
  const res2 = await request(app).post('/api/auth/register').send(payload);
  expect(res2.statusCode).toBe(400);
  expect(res2.body).toHaveProperty('message');
});
