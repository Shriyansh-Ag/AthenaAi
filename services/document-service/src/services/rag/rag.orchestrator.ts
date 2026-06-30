import { DocumentService } from '../document.service';
import { CitationService } from './citation.service';

export class RAGOrchestrator {
  private citationService: CitationService;

  constructor(private documentService: DocumentService) {
    this.citationService = new CitationService();
  }

  /**
   * Retrieves relevant context for a query and formats it into a prompt string.
   */
  async buildContext(userId: string, query: string, filters: { course?: string; tags?: string[] } = {}): Promise<{
    contextText: string;
    citations: any[];
  }> {
    // 1. Retrieve chunks using hybrid search
    const results = await this.documentService.search(
      userId,
      query,
      'hybrid',
      filters,
      1,
      5 // Top 5 chunks for context compression
    );

    if (!results || results.length === 0) {
      return { contextText: '', citations: [] };
    }

    // 2. Build enriched citations using CitationService
    const citations = await this.citationService.buildCitations(results);
    let contextText = '';

    citations.forEach((citation, index) => {
      // Add to context string with Source references
      contextText += `\n--- Source [${index + 1}] ---\n`;
      contextText += `Document: ${citation.documentName}\n`;
      if ((citation as any).page) {
        contextText += `Page: ${(citation as any).page}\n`;
      }
      contextText += `Text:\n${citation.text}\n`;
    });

    return { contextText, citations };
  }

  /**
   * Constructs the final system prompt based on retrieved context.
   */
  buildSystemPrompt(contextText: string): string {
    const basePrompt = `You are AthenaAI, an intelligent tutor that answers questions strictly based on the provided uploaded course material.

Your instructions:
1. You MUST answer the user's question using ONLY the provided Source context.
2. If the answer is not contained in the Source context, say "I don't have enough information in the uploaded documents to answer that." Do NOT guess or hallucinate.
3. You must use Markdown formatting to structure your response (bullet points, bold text, etc.).
4. When you state a fact from the context, you must cite the source index. Example: "The mitochondria is the powerhouse of the cell [1]." 
5. You can use LaTeX for math equations if appropriate. Wrap inline math in $...$ and block math in $$...$$.

Here is the retrieved context:

${contextText ? contextText : 'No relevant documents found.'}
`;

    return basePrompt;
  }
}
