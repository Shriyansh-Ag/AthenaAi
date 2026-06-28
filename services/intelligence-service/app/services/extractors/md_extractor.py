import re
from typing import BinaryIO
from app.models.document import ExtractedDocument, DocumentMetadata, ExtractedPage, ContentBlock
from app.services.extractors.base_extractor import BaseExtractor
from app.utils.language_utils import detect_language

class MarkdownExtractor(BaseExtractor):
    def extract(self, file_stream: BinaryIO, filename: str) -> ExtractedDocument:
        text = file_stream.read().decode("utf-8", errors="ignore")
        
        metadata = DocumentMetadata(
            title=filename,
            file_type="markdown"
        )
        
        content_blocks = []
        headings = []
        
        lines = text.split('\n')
        current_paragraph = []
        
        def flush_paragraph():
            if current_paragraph:
                p_text = " ".join(current_paragraph).strip()
                if p_text:
                    content_blocks.append(ContentBlock(type="paragraph", text=p_text))
                current_paragraph.clear()
        
        for line in lines:
            line_stripped = line.strip()
            
            if not line_stripped:
                flush_paragraph()
                continue
                
            # Headings
            heading_match = re.match(r'^(#{1,6})\s+(.*)', line_stripped)
            if heading_match:
                flush_paragraph()
                level = len(heading_match.group(1))
                heading_text = heading_match.group(2)
                cb = ContentBlock(type="heading", text=heading_text, level=level)
                headings.append(cb)
                content_blocks.append(cb)
                continue
                
            # Basic table detection (lines with |)
            if '|' in line_stripped and line_stripped.startswith('|'):
                flush_paragraph()
                # Simplified table extraction (just storing as text block for now, or parsing rows)
                cells = [c.strip() for c in line_stripped.split('|') if c.strip()]
                if cells:
                    content_blocks.append(ContentBlock(type="table_row", text=line_stripped, metadata={"cells": cells}))
                continue
                
            current_paragraph.append(line_stripped)
            
        flush_paragraph()
        
        page = ExtractedPage(page_number=1, content=content_blocks)
        
        metadata.language = detect_language(text)
        
        return ExtractedDocument(
            metadata=metadata,
            pages=[page],
            headings=headings
        )
