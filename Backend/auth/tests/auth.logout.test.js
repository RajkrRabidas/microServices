const request = require('supertest');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const connectDB = require('../src/db/db');
const userModel = require('../src/models/user.model');

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
    await userModel.deleteMany({});
});

// Skipped until the /api/auth/logout endpoint is implemented
describe('GET /api/auth/logout', () => {
    beforeAll(async () => {
        await connectDB();
    });

    it('clears the auth cookie and returns 200 when logged in', async () => {
        // Seed and login to get cookie
        const password = 'Secret123!';
        const hash = await bcrypt.hash(password, 10);
        await userModel.create({
            username: 'logout_user',
            email: 'logout@example.com',
            password: hash,
            fullName: { firstName: 'Log', lastName: 'Out' },
            phone: '0000000000',
        });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'logout@example.com', password });

        expect(loginRes.status).toBe(200);
        const cookies = loginRes.headers[ 'set-cookie' ];
        expect(cookies).toBeDefined();

        const res = await request(app)
            .get('/api/auth/logout')
            .set('Cookie', cookies);

        expect(res.status).toBe(200);
        const setCookie = res.headers[ 'set-cookie' ] || [];
        const cookieStr = setCookie.join(';');
        // token cookie cleared (empty value) and expired
        expect(cookieStr).toMatch(/token=;/);
        expect(cookieStr.toLowerCase()).toMatch(/expires=/);
    });

    it('is idempotent: returns 200 even without auth cookie', async () => {
        const res = await request(app).get('/api/auth/logout');
        expect(res.status).toBe(200);
    });
});
