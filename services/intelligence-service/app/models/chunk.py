from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from app.models.document import ExtractedDocument

class ChunkMetadata(BaseModel):
    document_id: Optional[str] = Field(None, description="ID of the source document")
    page_numbers: List[int] = Field(default_factory=list, description="Pages this chunk spans across")
    heading_path: List[str] = Field(default_factory=list, description="Hierarchical path of headings")
    chunk_index: int = Field(..., description="Sequential index of the chunk")
    chunk_type: str = Field(default="text", description="Type of chunk (text, table, image, mixed)")
    original_metadata: Optional[Dict[str, Any]] = Field(None, description="Original document metadata")

class Chunk(BaseModel):
    id: str = Field(..., description="Unique identifier for the chunk (UUID)")
    text: str = Field(..., description="The textual content of the chunk")
    metadata: ChunkMetadata

class ChunkingConfig(BaseModel):
    max_chunk_size: int = Field(1000, description="Maximum characters per chunk")
    overlap_size: int = Field(200, description="Number of overlapping characters between chunks")
    semantic_threshold: float = Field(0.4, description="Cosine similarity threshold for semantic splitting")

class ChunkingRequest(BaseModel):
    document: ExtractedDocument
    document_id: Optional[str] = None
    config: Optional[ChunkingConfig] = None

class ChunkingResponse(BaseModel):
    document_id: Optional[str]
    chunks: List[Chunk] = []
    total_chunks: int = 0
