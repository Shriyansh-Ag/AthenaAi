import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4002),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/athena-documents'),

  JWT_ACCESS_SECRET: z.string().min(16),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  STORAGE_PROVIDER: z.enum(['local', 's3', 'r2', 'azure']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('./uploads'),

  MAX_FILE_SIZE_MB: z.coerce.number().default(50),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    const missing = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${missing}`);
  }

  return result.data;
}

export const env = loadEnv();
