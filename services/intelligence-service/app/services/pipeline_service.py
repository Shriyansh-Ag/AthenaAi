import os
from typing import BinaryIO
from fastapi import HTTPException
from app.models.document import ExtractedDocument
from app.services.extractors.pdf_extractor import PDFExtractor
from app.services.extractors.docx_extractor import DocxExtractor
from app.services.extractors.pptx_extractor import PptxExtractor
from app.services.extractors.md_extractor import MarkdownExtractor
from app.services.extractors.txt_extractor import TxtExtractor

class PipelineService:
    def __init__(self):
        self.extractors = {
            ".pdf": PDFExtractor(),
            ".docx": DocxExtractor(),
            ".pptx": PptxExtractor(),
            ".md": MarkdownExtractor(),
            ".txt": TxtExtractor()
        }

    def process_document(self, file_stream: BinaryIO, filename: str) -> ExtractedDocument:
        ext = os.path.splitext(filename)[1].lower()
        
        extractor = self.extractors.get(ext)
        if not extractor:
            raise HTTPException(status_code=400, detail=f"Unsupported file extension: {ext}")
            
        try:
            return extractor.extract(file_stream, filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting document: {str(e)}")

pipeline_service = PipelineService()
