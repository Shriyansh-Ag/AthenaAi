# Document Service

AthenaAI's document upload and management microservice.

## Architecture

```
src/
├── config/          # Environment config, MIME type registry
├── controllers/     # Express request handlers
├── middleware/       # Auth, error handling, rate limiting, upload
├── models/          # Mongoose schemas
├── repositories/    # Data access layer
├── routes/          # Route definitions & DI composition root
├── services/        # Business logic
├── storage/         # Abstracted storage providers
├── types/           # TypeScript interfaces
├── utils/           # Logger, errors, JWT verification
├── validators/      # File validation, Zod schemas, virus scan
└── main.ts          # Express app entry point
```

### Clean Architecture Layers

1. **Controllers** — Parse HTTP requests, delegate to services, format responses
2. **Services** — Business logic (validation pipeline, CRUD orchestration)
3. **Repositories** — Mongoose queries (data access only)
4. **Storage Providers** — Abstracted file storage (local / S3 / R2 / Azure)

### Storage Abstraction

The `StorageProvider` interface allows swapping between:
- **Local filesystem** (default for development)
- **AWS S3** (not yet implemented)
- **Cloudflare R2** (not yet implemented)
- **Azure Blob** (not yet implemented)

Set `STORAGE_PROVIDER` in `.env` to switch providers without changing business logic.

## Setup

### Prerequisites

- Node.js ≥ 22
- pnpm ≥ 9
- MongoDB (local or Atlas)

### Install

```bash
cd services/document-service
pnpm install
```

### Configure

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

> **Important:** `JWT_ACCESS_SECRET` must match the auth-service secret for token verification.

### Run

```bash
# Development (with hot reload)
pnpm dev

# Production build
pnpm build
pnpm start
```

## API Reference

All endpoints require JWT authentication via `Authorization: Bearer <token>`.

### Upload Documents

```
POST /api/documents/upload
Content-Type: multipart/form-data

Field: files (multiple)
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "uploaded": [...],
    "failed": [...],
    "summary": { "total": 2, "successful": 2, "failed": 0 }
  }
}
```

### List Documents

```
GET /api/documents?page=1&limit=20&search=report&sortBy=uploadedAt&sortOrder=desc&mimeType=application/pdf
```

### Get Document

```
GET /api/documents/:id
```

### Rename Document

```
PATCH /api/documents/:id
Content-Type: application/json

{ "displayName": "New Name" }
```

### Delete Document

```
DELETE /api/documents/:id
```

### Download Document

```
GET /api/documents/:id/download
```

### Health Check

```
GET /api/documents/health/status
```

## Supported File Types

| Type | MIME Type | Extension |
|------|-----------|-----------|
| PDF | application/pdf | .pdf |
| Word | application/vnd.openxmlformats-officedocument.wordprocessingml.document | .docx |
| PowerPoint | application/vnd.openxmlformats-officedocument.presentationml.presentation | .pptx |
| Text | text/plain | .txt |
| Markdown | text/markdown | .md |
| CSV | text/csv | .csv |
| PNG | image/png | .png |
| JPEG | image/jpeg | .jpeg |
| WebP | image/webp | .webp |

## Validation Pipeline

1. **MIME type check** — Against allowlist
2. **File size check** — Configurable limit (default 50 MB)
3. **Magic byte verification** — Ensures file content matches declared type
4. **Virus scan** — Abstracted interface (NoOp in development)
5. **Duplicate detection** — SHA-256 checksum per user
6. **Filename sanitization** — Strips path traversal, null bytes, special chars

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4002 | Server port |
| NODE_ENV | development | Environment |
| MONGODB_URI | mongodb://localhost:27017/athena-documents | MongoDB connection |
| JWT_ACCESS_SECRET | — | Shared with auth-service |
| CORS_ORIGIN | http://localhost:3000 | Allowed CORS origin |
| STORAGE_PROVIDER | local | Storage backend |
| LOCAL_STORAGE_PATH | ./uploads | Local storage directory |
| MAX_FILE_SIZE_MB | 50 | Maximum upload size |

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

## Processing Status

Documents follow this lifecycle:

```
uploaded → queued → processing → processed
                                   ↓
                                 failed
```

> **Note:** Document parsing is not yet implemented. All uploaded documents remain in `uploaded` status.
