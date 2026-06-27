import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { authRoutes } from '../../src/routes/auth.routes';
import { errorHandler } from '../../src/middleware/error-handler';
import { User } from '../../src/models/user.model';
import { RefreshToken } from '../../src/models/refresh-token.model';

// Mock env module
process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-integration-tests';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-integration-tests';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

let mongoServer: MongoMemoryServer;
let app: express.Express;

function createApp() {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());
  testApp.use('/api/auth', authRoutes);
  testApp.use(errorHandler);
  return testApp;
}

describe('Auth Routes Integration', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    app = createApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'SecurePass1',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.accessToken).toBeDefined();
      // Should not expose password
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      await supertest(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePass1',
      });

      const res = await supertest(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Copy',
          email: 'jane@example.com',
          password: 'SecurePass1',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'weak',
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await supertest(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePass1',
      });
    });

    it('should login with valid credentials', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'SecurePass1',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      // Check refresh cookie is set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'WrongPassword1',
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when authenticated', async () => {
      const registerRes = await supertest(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'SecurePass1',
        });

      const token = registerRes.body.data.accessToken;

      const res = await supertest(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.user.email).toBe('jane@example.com');
    });

    it('should reject unauthenticated requests', async () => {
      await supertest(app).get('/api/auth/me').expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear refresh token cookie', async () => {
      const registerRes = await supertest(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'SecurePass1',
        });

      const token = registerRes.body.data.accessToken;

      const res = await supertest(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/health', () => {
    it('should return health status', async () => {
      const res = await supertest(app).get('/api/auth/health').expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('auth-service');
    });
  });
});
