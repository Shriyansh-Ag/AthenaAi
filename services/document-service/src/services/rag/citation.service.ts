import { ChunkModel } from '../../models/chunk.model';
import { ICitation } from '../../models/message.model';

export class CitationService {
  /**
   * Enriches raw search results with deeper metadata (like surrounding context or page numbers).
   */
  async buildCitations(searchResults: any[]): Promise<ICitation[]> {
    const citations: ICitation[] = [];

    for (const result of searchResults) {
      // Basic citation mapping
      const citation: ICitation = {
        documentId: result.payload.documentId || result.documentId, // hybrid search might map differently
        documentName: result.payload.documentName || result.documentName || 'Unknown Document',
        chunkId: result.id || result._id?.toString(),
        chunkIndex: result.payload.chunkIndex !== undefined ? result.payload.chunkIndex : result.chunkIndex,
        similarityScore: result.score || 0,
        text: result.payload.text || result.text
      };

      // Optional: If we want to enrich with page numbers from Mongo metadata
      try {
        const chunk = await ChunkModel.findById(citation.chunkId).lean();
        if (chunk && chunk.metadata) {
          // If the processor stored page numbers, attach them
          (citation as any).page = chunk.metadata.page || chunk.metadata.pageNumber;
        }
      } catch (e) {
        console.warn(`Failed to enrich chunk ${citation.chunkId}`);
      }

      citations.push(citation);
    }

    return citations;
  }
}
