from fastapi import APIRouter
from app.models.embedding import EmbeddingRequest, EmbeddingResponse
from app.services.embedding_service import embedding_service
import asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()
executor = ThreadPoolExecutor(max_workers=5)

@router.post("/", response_model=EmbeddingResponse)
async def embed_texts(request: EmbeddingRequest):
    """
    Generate dense vector embeddings for a list of texts.
    """
    # Generating embeddings is CPU intensive, run in a thread pool
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        executor, 
        embedding_service.generate_embeddings, 
        request
    )
    
    return result
