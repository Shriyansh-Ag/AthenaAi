from fastapi import FastAPI
from app.routes.api import router as api_router
from app.config.settings import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description="Document Intelligence Pipeline for Athena AI"
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": settings.project_name}
