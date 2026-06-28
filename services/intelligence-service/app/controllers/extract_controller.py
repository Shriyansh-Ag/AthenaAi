from fastapi import APIRouter, UploadFile, File
from app.services.pipeline_service import pipeline_service
from app.models.document import ExtractedDocument
import asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()
executor = ThreadPoolExecutor(max_workers=5)

@router.post("/", response_model=ExtractedDocument)
async def extract_document(file: UploadFile = File(...)):
    """
    Extracts text, headings, tables, and images from an uploaded document.
    """
    # Since extracting can be CPU intensive and blocking, we run it in a thread pool
    # to avoid blocking the async event loop.
    
    # Read the file stream asynchronously
    file_bytes = await file.read()
    
    # Create a BytesIO object for the extractors
    import io
    file_stream = io.BytesIO(file_bytes)
    
    # Process the document
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        executor, 
        pipeline_service.process_document, 
        file_stream, 
        file.filename
    )
    
    return result
