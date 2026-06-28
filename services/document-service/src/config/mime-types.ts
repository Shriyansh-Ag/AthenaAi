/**
 * Central registry of allowed MIME types and their file extensions.
 *
 * To support new file types, add entries to this map.
 * Both the upload validator and the Multer file filter reference this.
 */
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  // Documents
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',

  // Text
  'text/plain': '.txt',
  'text/markdown': '.md',
  'text/csv': '.csv',

  // Images
  'image/png': '.png',
  'image/jpeg': '.jpeg',
  'image/webp': '.webp',
};

/**
 * Magic byte signatures for file type verification.
 * Used to verify actual file content matches the declared MIME type.
 */
export const MAGIC_BYTES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/png': [[0x89, 0x50, 0x4e, 0x47]], // .PNG
  'image/jpeg': [[0xff, 0xd8, 0xff]], // JFIF/Exif
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (followed by WEBP at byte 8)
  // ZIP-based formats (DOCX, PPTX)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4b, 0x03, 0x04]],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [[0x50, 0x4b, 0x03, 0x04]],
};

/** Set of all allowed MIME type strings for quick lookup */
export const ALLOWED_MIME_SET = new Set(Object.keys(ALLOWED_MIME_TYPES));

/** Reverse map: extension → MIME type */
export const EXTENSION_TO_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(ALLOWED_MIME_TYPES).map(([mime, ext]) => [ext, mime])
);

/** Human-readable labels for file type display */
export const MIME_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF Document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation',
  'text/plain': 'Text File',
  'text/markdown': 'Markdown File',
  'text/csv': 'CSV Spreadsheet',
  'image/png': 'PNG Image',
  'image/jpeg': 'JPEG Image',
  'image/webp': 'WebP Image',
};
