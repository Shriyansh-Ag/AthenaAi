process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-integration-tests';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-integration-tests';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
