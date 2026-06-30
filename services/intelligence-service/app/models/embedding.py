from pydantic import BaseModel, Field
from typing import List, Optional

class EmbeddingRequest(BaseModel):
    texts: List[str] = Field(..., description="List of strings to embed")
    model_name: Optional[str] = Field("all-MiniLM-L6-v2", description="Name of the sentence-transformer model to use")

class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]] = Field(..., description="List of generated dense vectors corresponding to the input texts")
    model_name: str = Field(..., description="The model used for embedding")
    version: str = Field("v1", description="Model version")
