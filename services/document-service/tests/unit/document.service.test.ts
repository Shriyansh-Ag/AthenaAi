import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentService } from '../../src/services/document.service';
import { DocumentRepository } from '../../src/repositories/document.repository';
import type { StorageProvider } from '../../src/storage/storage-provider.interface';
import type { VirusScanProvider } from '../../src/validators/virus-scan.interface';

// ── Mocks ────────────────────────────────────────────────────────────────

function createMockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'files',
    originalname: 'test-document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    // PDF magic bytes: %PDF
    buffer: Buffer.from([0x25, 0x50, 0x44, 0x46, ...Buffer.from('-1.4 test content')]),
    size: 1024,
    stream: null as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

function createMockRepository(): Record<string, ReturnType<typeof vi.fn>> {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByIdAndUser: vi.fn(),
    findByUserId: vi.fn(),
    updateById: vi.fn(),
    softDelete: vi.fn(),
    findDuplicate: vi.fn(),
    countByUserId: vi.fn(),
  };
}

function createMockStorage(): Record<string, ReturnType<typeof vi.fn>> {
  return {
    upload: vi.fn(),
    download: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
  };
}

function createMockVirusScanner(): Record<string, ReturnType<typeof vi.fn>> {
  return {
    scan: vi.fn().mockResolvedValue({ clean: true, scanDurationMs: 0 }),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('DocumentService', () => {
  let service: DocumentService;
  let mockRepo: ReturnType<typeof createMockRepository>;
  let mockStorage: ReturnType<typeof createMockStorage>;
  let mockScanner: ReturnType<typeof createMockVirusScanner>;

  const userId = '507f1f77bcf86cd799439011';
  const maxFileSizeBytes = 50 * 1024 * 1024; // 50 MB

  beforeEach(() => {
    mockRepo = createMockRepository();
    mockStorage = createMockStorage();
    mockScanner = createMockVirusScanner();

    service = new DocumentService(
      mockRepo as unknown as DocumentRepository,
      mockStorage as unknown as StorageProvider,
      mockScanner as unknown as VirusScanProvider,
      maxFileSizeBytes
    );
  });

  // ── Upload ──────────────────────────────────────────────────────────

  describe('upload', () => {
    it('should upload a valid PDF file', async () => {
      const file = createMockFile();
      mockRepo.findDuplicate.mockResolvedValue(null);
      mockStorage.upload.mockResolvedValue({
        key: 'test-key',
        path: '/uploads/test-key',
        size: file.size,
      });
      mockRepo.create.mockResolvedValue({
        _id: 'doc-id-123',
        userId,
        originalName: 'test-document.pdf',
        displayName: 'test-document',
        mimeType: 'application/pdf',
        extension: '.pdf',
        size: 1024,
        status: 'uploaded',
      });

      const result = await service.upload(userId, file);

      expect(result._id).toBe('doc-id-123');
      expect(mockRepo.findDuplicate).toHaveBeenCalledWith(userId, expect.any(String));
      expect(mockStorage.upload).toHaveBeenCalledOnce();
      expect(mockRepo.create).toHaveBeenCalledOnce();
    });

    it('should reject unsupported MIME types', async () => {
      const file = createMockFile({ mimetype: 'application/zip' });

      await expect(service.upload(userId, file)).rejects.toThrow(
        /not supported/
      );
    });

    it('should reject files exceeding size limit', async () => {
      const file = createMockFile({ size: 100 * 1024 * 1024 }); // 100 MB

      await expect(service.upload(userId, file)).rejects.toThrow(
        /exceeds/
      );
    });

    it('should reject files with mismatched magic bytes', async () => {
      // Declare as PDF but provide PNG magic bytes
      const file = createMockFile({
        mimetype: 'application/pdf',
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00]),
      });

      await expect(service.upload(userId, file)).rejects.toThrow(
        /does not match/
      );
    });

    it('should reject duplicate files', async () => {
      const file = createMockFile();
      mockRepo.findDuplicate.mockResolvedValue({
        _id: 'existing-doc',
        displayName: 'existing-file',
      });

      await expect(service.upload(userId, file)).rejects.toThrow(
        /already exists/
      );
    });

    it('should reject files flagged by virus scanner', async () => {
      const file = createMockFile();
      mockRepo.findDuplicate.mockResolvedValue(null);
      mockScanner.scan.mockResolvedValue({
        clean: false,
        threat: 'Test.Virus',
        scanDurationMs: 10,
      });

      await expect(service.upload(userId, file)).rejects.toThrow(
        /rejected/
      );
    });
  });

  // ── Get by ID ───────────────────────────────────────────────────────

  describe('getById', () => {
    it('should return a document when found', async () => {
      const mockDoc = { _id: 'doc-123', userId, displayName: 'test' };
      mockRepo.findByIdAndUser.mockResolvedValue(mockDoc);

      const result = await service.getById(userId, 'doc-123');
      expect(result).toEqual(mockDoc);
    });

    it('should throw NotFoundError when document does not exist', async () => {
      mockRepo.findByIdAndUser.mockResolvedValue(null);

      await expect(service.getById(userId, 'nonexistent')).rejects.toThrow(
        /not found/i
      );
    });
  });

  // ── Rename ──────────────────────────────────────────────────────────

  describe('rename', () => {
    it('should rename a document', async () => {
      const mockDoc = { _id: 'doc-123', displayName: 'New Name' };
      mockRepo.updateById.mockResolvedValue(mockDoc);

      const result = await service.rename(userId, 'doc-123', 'New Name');
      expect(result.displayName).toBe('New Name');
    });

    it('should throw NotFoundError when document does not exist', async () => {
      mockRepo.updateById.mockResolvedValue(null);

      await expect(
        service.rename(userId, 'nonexistent', 'New Name')
      ).rejects.toThrow(/not found/i);
    });
  });

  // ── Delete ──────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should soft-delete a document', async () => {
      mockRepo.softDelete.mockResolvedValue({ _id: 'doc-123', status: 'deleted' });

      await expect(service.delete(userId, 'doc-123')).resolves.toBeUndefined();
      expect(mockRepo.softDelete).toHaveBeenCalledWith('doc-123', userId);
    });

    it('should throw NotFoundError when document does not exist', async () => {
      mockRepo.softDelete.mockResolvedValue(null);

      await expect(service.delete(userId, 'nonexistent')).rejects.toThrow(
        /not found/i
      );
    });
  });

  // ── List ────────────────────────────────────────────────────────────

  describe('list', () => {
    it('should return paginated documents', async () => {
      const mockResult = {
        data: [{ _id: 'doc-1' }, { _id: 'doc-2' }],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      };
      mockRepo.findByUserId.mockResolvedValue(mockResult);

      const result = await service.list(userId, {
        page: 1,
        limit: 20,
        sortBy: 'uploadedAt',
        sortOrder: 'desc',
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });
});
