process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-integration-tests';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.STORAGE_PROVIDER = 'local';
process.env.LOCAL_STORAGE_PATH = './test-uploads';
process.env.MAX_FILE_SIZE_MB = '50';
