import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/main';
import { DocumentModel } from '../../src/models/document.model';

let mongoServer: MongoMemoryServer;

const TEST_SECRET = process.env.JWT_ACCESS_SECRET!;

function createTestToken(userId: string = '507f1f77bcf86cd799439011') {
  return jwt.sign(
    { userId, email: 'test@test.com', role: 'student' },
    TEST_SECRET,
    { expiresIn: '15m', issuer: 'athena-auth', audience: 'athena-web' }
  );
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  // Disconnect if already connected (from main.ts bootstrap)
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
});

afterEach(async () => {
  await DocumentModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Document Routes', () => {
  const request = supertest(app);
  const token = createTestToken();

  // ── Health Check ──────────────────────────────────────────────────

  describe('GET /api/documents/health/status', () => {
    it('should return health status', async () => {
      const res = await request.get('/api/documents/health/status');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('document-service');
    });
  });

  // ── Authentication ────────────────────────────────────────────────

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const res = await request.get('/api/documents');
      expect(res.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const res = await request
        .get('/api/documents')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });

  // ── Upload ────────────────────────────────────────────────────────

  describe('POST /api/documents/upload', () => {
    it('should upload a valid text file', async () => {
      const res = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from('Hello, world!'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.successful).toBe(1);
      expect(res.body.data.uploaded).toHaveLength(1);
      expect(res.body.data.uploaded[0].originalName).toBe('test.txt');
    });

    it('should upload multiple files', async () => {
      const res = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from('File 1 content'), {
          filename: 'file1.txt',
          contentType: 'text/plain',
        })
        .attach('files', Buffer.from('File 2 content'), {
          filename: 'file2.txt',
          contentType: 'text/plain',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.summary.successful).toBe(2);
    });

    it('should reject unsupported file types', async () => {
      const res = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from('fake zip'), {
          filename: 'bad.zip',
          contentType: 'application/zip',
        });

      // Multer's file filter rejects unsupported types → 415
      expect(res.status).toBe(415);
    });

    it('should detect duplicate files', async () => {
      const content = Buffer.from('unique content for dedup test');

      // First upload
      await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', content, {
          filename: 'original.txt',
          contentType: 'text/plain',
        });

      // Second upload with same content
      const res = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', content, {
          filename: 'duplicate.txt',
          contentType: 'text/plain',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.summary.failed).toBe(1);
      expect(res.body.data.failed[0].error).toMatch(/already exists/);
    });

    it('should reject requests with no files', async () => {
      const res = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  // ── List ──────────────────────────────────────────────────────────

  describe('GET /api/documents', () => {
    it('should return empty list when no documents', async () => {
      const res = await request
        .get('/api/documents')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should return uploaded documents', async () => {
      // Upload first
      await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from('content'), {
          filename: 'listed.txt',
          contentType: 'text/plain',
        });

      const res = await request
        .get('/api/documents')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should support search by name', async () => {
      await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from('content A'), {
          filename: 'alpha.txt',
          contentType: 'text/plain',
        });

      await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from('content B'), {
          filename: 'beta.txt',
          contentType: 'text/plain',
        });

      const res = await request
        .get('/api/documents?search=alpha')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ── Get by ID ─────────────────────────────────────────────────────

  describe('GET /api/documents/:id', () => {
    it('should return a document by ID', async () => {
      const uploadRes = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from('get by id content'), {
          filename: 'getme.txt',
          contentType: 'text/plain',
        });

      const docId = uploadRes.body.data.uploaded[0].id;

      const res = await request
        .get(`/api/documents/${docId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.originalName).toBe('getme.txt');
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request
        .get('/api/documents/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  // ── Rename ────────────────────────────────────────────────────────

  describe('PATCH /api/documents/:id', () => {
    it('should rename a document', async () => {
      const uploadRes = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from('rename me'), {
          filename: 'old-name.txt',
          contentType: 'text/plain',
        });

      const docId = uploadRes.body.data.uploaded[0].id;

      const res = await request
        .patch(`/api/documents/${docId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'New Display Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.displayName).toBe('New Display Name');
    });

    it('should reject empty display name', async () => {
      const uploadRes = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from('validate rename'), {
          filename: 'validate.txt',
          contentType: 'text/plain',
        });

      const docId = uploadRes.body.data.uploaded[0].id;

      const res = await request
        .patch(`/api/documents/${docId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: '' });

      expect(res.status).toBe(400);
    });
  });

  // ── Delete ────────────────────────────────────────────────────────

  describe('DELETE /api/documents/:id', () => {
    it('should soft-delete a document', async () => {
      const uploadRes = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from('delete me'), {
          filename: 'deletable.txt',
          contentType: 'text/plain',
        });

      const docId = uploadRes.body.data.uploaded[0].id;

      const deleteRes = await request
        .delete(`/api/documents/${docId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);

      // Should no longer appear in list
      const listRes = await request
        .get('/api/documents')
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.body.data).toHaveLength(0);
    });
  });

  // ── Download ──────────────────────────────────────────────────────

  describe('GET /api/documents/:id/download', () => {
    it('should download a document', async () => {
      const content = 'download me!';
      const uploadRes = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from(content), {
          filename: 'downloadable.txt',
          contentType: 'text/plain',
        });

      const docId = uploadRes.body.data.uploaded[0].id;

      const res = await request
        .get(`/api/documents/${docId}/download`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toBe(content);
    });
  });
});
