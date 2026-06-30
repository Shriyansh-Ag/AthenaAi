import { logger } from '../utils/logger';

export class IntelligenceClient {
  private baseUrl: string;

  constructor() {
    // Assuming intelligence service is configured in env or defaults to localhost:8000
    this.baseUrl = process.env.INTELLIGENCE_SERVICE_URL || 'http://localhost:8000/api/v1';
  }

  async extractDocument(fileBuffer: Buffer, filename: string, mimeType: string): Promise<any> {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append('file', blob, filename);

    logger.info(`Sending ${filename} to intelligence service for extraction...`);

    try {
      const response = await fetch(`${this.baseUrl}/extract/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Intelligence service error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error communicating with intelligence service for extraction:', error);
      throw error;
    }
  }

  async chunkDocument(extractedDocument: any, documentId: string): Promise<any> {
    logger.info(`Sending document ${documentId} to intelligence service for chunking...`);

    try {
      const response = await fetch(`${this.baseUrl}/chunk/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: extractedDocument,
          document_id: documentId,
          config: {} // use default config
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Intelligence service chunking error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error communicating with intelligence service for chunking:', error);
      throw error;
    }
  }
  async embedChunks(texts: string[], modelName?: string): Promise<any> {
    logger.info(`Sending ${texts.length} texts to intelligence service for embedding...`);

    try {
      const response = await fetch(`${this.baseUrl}/embed/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts,
          model_name: modelName || 'all-MiniLM-L6-v2'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Intelligence service embedding error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error communicating with intelligence service for embedding:', error);
      throw error;
    }
  }
}

export const intelligenceClient = new IntelligenceClient();
