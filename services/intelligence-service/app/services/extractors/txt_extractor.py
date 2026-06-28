from typing import BinaryIO
from app.models.document import ExtractedDocument, DocumentMetadata, ExtractedPage, ContentBlock
from app.services.extractors.base_extractor import BaseExtractor
from app.utils.language_utils import detect_language

class TxtExtractor(BaseExtractor):
    def extract(self, file_stream: BinaryIO, filename: str) -> ExtractedDocument:
        text = file_stream.read().decode("utf-8", errors="ignore")
        
        metadata = DocumentMetadata(
            title=filename,
            file_type="txt"
        )
        
        content_blocks = []
        
        paragraphs = text.split('\n\n')
        for p in paragraphs:
            p_text = p.strip()
            if p_text:
                content_blocks.append(ContentBlock(type="paragraph", text=p_text))
                
        page = ExtractedPage(page_number=1, content=content_blocks)
        
        metadata.language = detect_language(text)
        
        return ExtractedDocument(
            metadata=metadata,
            pages=[page],
            headings=[]
        )
