from fastapi import APIRouter
from app.controllers import extract_controller

router = APIRouter()

router.include_router(extract_controller.router, prefix="/extract", tags=["extraction"])
