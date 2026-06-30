import io
import pytesseract
from PIL import Image
from typing import BinaryIO
import re

from app.models.document import ExtractedDocument, DocumentMetadata, ExtractedPage, ContentBlock
from app.services.extractors.base_extractor import BaseExtractor
from app.utils.language_utils import detect_language

class ImageExtractor(BaseExtractor):
    def extract(self, file_stream: BinaryIO, filename: str) -> ExtractedDocument:
        file_bytes = file_stream.read()
        image = Image.open(io.BytesIO(file_bytes))
        
        # Convert image to RGB if not already
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        width, height = image.size
        img_format = image.format or "JPEG"
        
        metadata = DocumentMetadata(
            title=filename,
            author="",
            creation_date="",
            total_pages=1,
            file_type="image",
        )
        
        # Extract text with tesseract
        try:
            text = pytesseract.image_to_string(image)
        except Exception as e:
            text = ""
            print(f"OCR failed: {e}")
            
        content_blocks = []
        
        # Basic heuristic parsing
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        current_block = []
        
        for line in lines:
            # Check for captions
            if re.match(r'^(figure|fig\.|table)\s+\d+:', line, re.IGNORECASE):
                if current_block:
                    content_blocks.append(ContentBlock(type="paragraph", text=" ".join(current_block)))
                    current_block = []
                content_blocks.append(ContentBlock(type="caption", text=line))
                continue
                
            # Basic math formula heuristic (contains equal sign and math symbols)
            if re.search(r'[\+\-\=\/\*\^\(\)\[\]\{\}\∑\∫\∞\√]', line) and not re.search(r'[a-zA-Z]{5,}', line):
                if current_block:
                    content_blocks.append(ContentBlock(type="paragraph", text=" ".join(current_block)))
                    current_block = []
                content_blocks.append(ContentBlock(type="formula", text=line))
                continue
                
            current_block.append(line)
            
        if current_block:
            content_blocks.append(ContentBlock(type="paragraph", text=" ".join(current_block)))
            
        # Add the image itself as a figure block
        content_blocks.insert(0, ContentBlock(
            type="image", 
            metadata={"width": width, "height": height, "format": img_format, "source": filename}
        ))
        
        pages = [ExtractedPage(page_number=1, content=content_blocks)]
        metadata.language = detect_language(text)
        
        return ExtractedDocument(
            metadata=metadata,
            pages=pages,
            headings=[]
        )
