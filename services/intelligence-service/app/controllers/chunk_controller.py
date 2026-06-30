from fastapi import APIRouter
from app.models.chunk import ChunkingRequest, ChunkingResponse
from app.services.chunking_service import chunking_service
import asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()
executor = ThreadPoolExecutor(max_workers=5)

@router.post("/", response_model=ChunkingResponse)
async def chunk_document(request: ChunkingRequest):
    """
    Chunks an extracted document into semantic, hierarchical chunks.
    """
    # Since chunking (especially semantic similarity) can be CPU intensive,
    # we run it in a thread pool to avoid blocking the async event loop.
    
    # Use default config if none provided
    from app.models.chunk import ChunkingConfig
    config = request.config or ChunkingConfig()
    
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        executor, 
        chunking_service.chunk_document, 
        request.document, 
        request.document_id,
        config
    )
    
    return result
