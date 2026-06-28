from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class ContentBlock(BaseModel):
    type: str = Field(..., description="Type of content: heading, paragraph, table, list, image")
    text: Optional[str] = None
    level: Optional[int] = Field(None, description="Heading level if type is heading")
    metadata: Optional[Dict[str, Any]] = None

class ExtractedPage(BaseModel):
    page_number: int
    content: List[ContentBlock] = []

class DocumentMetadata(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    creation_date: Optional[str] = None
    language: Optional[str] = None
    total_pages: Optional[int] = None
    file_type: Optional[str] = None

class ExtractedDocument(BaseModel):
    metadata: DocumentMetadata
    pages: List[ExtractedPage] = []
    
    # We can also keep a flat list of headings for easy access
    headings: List[ContentBlock] = []
