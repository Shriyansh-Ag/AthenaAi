import uuid
import logging
from typing import List, Optional
from app.models.document import ExtractedDocument, ContentBlock
from app.models.chunk import Chunk, ChunkMetadata, ChunkingConfig, ChunkingResponse

logger = logging.getLogger(__name__)

class SemanticChunker:
    def __init__(self):
        self._model = None
        self._cosine_similarity = None

    def _get_model(self):
        if self._model is None:
            logger.info("Loading sentence-transformers model...")
            from sentence_transformers import SentenceTransformer
            from sklearn.metrics.pairwise import cosine_similarity
            # Using a small, fast model for semantic similarity
            self._model = SentenceTransformer('all-MiniLM-L6-v2')
            self._cosine_similarity = cosine_similarity
            logger.info("Model loaded successfully.")
        return self._model, self._cosine_similarity

    def _compute_similarity(self, text1: str, text2: str) -> float:
        if not text1.strip() or not text2.strip():
            return 1.0
        model, cosine_similarity = self._get_model()
        embeddings = model.encode([text1, text2])
        sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(sim)

    def chunk_document(self, request_doc: ExtractedDocument, document_id: Optional[str], config: ChunkingConfig) -> ChunkingResponse:
        chunks: List[Chunk] = []
        current_chunk_text = ""
        current_chunk_pages = set()
        current_heading_path = []
        current_section = None
        chunk_index = 0
        
        last_block_text = ""
        
        def save_chunk(text: str, pages: set, heading_path: list, section: str):
            nonlocal chunk_index
            if not text.strip():
                return
            
            # Simple overlap logic: take the last `config.overlap_size` characters of the text
            # for the next chunk, but we only save the current chunk here.
            
            chunk_metadata = ChunkMetadata(
                document_id=document_id,
                page_numbers=sorted(list(pages)),
                heading_path=list(heading_path),
                chunk_index=chunk_index,
                chunk_type="text",
                original_metadata=request_doc.metadata.model_dump() if request_doc.metadata else None
            )
            
            chunk = Chunk(
                id=str(uuid.uuid4()),
                text=text.strip(),
                metadata=chunk_metadata
            )
            chunks.append(chunk)
            chunk_index += 1

        for page in request_doc.pages:
            for block in page.content:
                block_text = block.text or ""
                if not block_text.strip():
                    continue
                
                # Update heading hierarchy
                if block.type == "heading":
                    level = block.level or 1
                    # Ensure heading path has enough slots
                    while len(current_heading_path) >= level:
                        current_heading_path.pop()
                    # Pad if there are skipped levels
                    while len(current_heading_path) < level - 1:
                        current_heading_path.append("Unknown")
                    current_heading_path.append(block_text)
                    current_section = block_text
                    
                    # Split on new top-level heading
                    if level == 1 and current_chunk_text:
                        save_chunk(current_chunk_text, current_chunk_pages, current_heading_path[:-1], current_section)
                        # Carry over overlap
                        overlap = current_chunk_text[-config.overlap_size:] if config.overlap_size > 0 else ""
                        current_chunk_text = overlap
                        current_chunk_pages = {page.page_number}
                        last_block_text = ""

                # Semantic check (only if we have previous text)
                if last_block_text and current_chunk_text:
                    sim = self._compute_similarity(last_block_text, block_text)
                    if sim < config.semantic_threshold:
                        # Semantic shift detected, save current chunk
                        save_chunk(current_chunk_text, current_chunk_pages, current_heading_path, current_section)
                        overlap = current_chunk_text[-config.overlap_size:] if config.overlap_size > 0 else ""
                        current_chunk_text = overlap
                        current_chunk_pages = {page.page_number}
                        
                # Size check
                if len(current_chunk_text) + len(block_text) > config.max_chunk_size and len(current_chunk_text) > 0:
                    save_chunk(current_chunk_text, current_chunk_pages, current_heading_path, current_section)
                    overlap = current_chunk_text[-config.overlap_size:] if config.overlap_size > 0 else ""
                    current_chunk_text = overlap
                    current_chunk_pages = {page.page_number}
                
                # Append block text
                current_chunk_text += ("\n\n" if current_chunk_text and not current_chunk_text.endswith("\n\n") else "") + block_text
                current_chunk_pages.add(page.page_number)
                last_block_text = block_text

        # Save remaining chunk
        if current_chunk_text.strip():
            save_chunk(current_chunk_text, current_chunk_pages, current_heading_path, current_section)

        return ChunkingResponse(
            document_id=document_id,
            chunks=chunks,
            total_chunks=len(chunks)
        )

chunking_service = SemanticChunker()
