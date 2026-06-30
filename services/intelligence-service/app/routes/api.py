from fastapi import APIRouter
from app.controllers import extract_controller, chunk_controller, embed_controller

router = APIRouter()

router.include_router(extract_controller.router, prefix="/extract", tags=["extraction"])
router.include_router(chunk_controller.router, prefix="/chunk", tags=["chunking"])
router.include_router(embed_controller.router, prefix="/embed", tags=["embedding"])
