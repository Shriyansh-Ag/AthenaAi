import fitz
from typing import BinaryIO
from app.models.document import ExtractedDocument, DocumentMetadata, ExtractedPage, ContentBlock
from app.services.extractors.base_extractor import BaseExtractor
from app.utils.language_utils import detect_language

class PDFExtractor(BaseExtractor):
    def extract(self, file_stream: BinaryIO, filename: str) -> ExtractedDocument:
        # Read the file stream into bytes
        file_bytes = file_stream.read()
        
        # Open the document with PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        
        metadata = DocumentMetadata(
            title=doc.metadata.get("title", filename) if doc.metadata else filename,
            author=doc.metadata.get("author", "") if doc.metadata else "",
            creation_date=doc.metadata.get("creationDate", "") if doc.metadata else "",
            total_pages=len(doc),
            file_type="pdf"
        )
        
        pages = []
        headings = []
        all_text = ""
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            blocks = page.get_text("dict")["blocks"]
            content_blocks = []
            
            for b in blocks:
                if b["type"] == 0:  # Text block
                    # Simplified heading detection based on font size
                    block_text = ""
                    max_size = 0
                    for line in b["lines"]:
                        for span in line["spans"]:
                            block_text += span["text"] + " "
                            if span["size"] > max_size:
                                max_size = span["size"]
                                
                    block_text = block_text.strip()
                    if not block_text:
                        continue
                        
                    all_text += block_text + " "
                    
                    # Assume sizes > 14 are headings (simplified heuristic)
                    if max_size > 14:
                        level = 1 if max_size > 18 else 2 if max_size > 16 else 3
                        cb = ContentBlock(type="heading", text=block_text, level=level)
                        headings.append(cb)
                    else:
                        cb = ContentBlock(type="paragraph", text=block_text)
                        
                    content_blocks.append(cb)
                    
                elif b["type"] == 1:  # Image block
                    cb = ContentBlock(
                        type="image", 
                        metadata={"width": b.get("width"), "height": b.get("height")}
                    )
                    content_blocks.append(cb)
                    
            # Extract tables (PyMuPDF has basic table support)
            tables = page.find_tables()
            for table in tables:
                table_data = table.extract()
                cb = ContentBlock(
                    type="table",
                    metadata={"data": table_data}
                )
                content_blocks.append(cb)
                
            # Fallback for scanned PDFs
            if not content_blocks and len(tables) == 0:
                # Convert page to image for OCR
                pix = page.get_pixmap(dpi=300)
                from PIL import Image
                import pytesseract
                import io
                
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                try:
                    ocr_text = pytesseract.image_to_string(img)
                    if ocr_text.strip():
                        all_text += ocr_text.strip() + " "
                        cb = ContentBlock(type="paragraph", text=ocr_text.strip())
                        content_blocks.append(cb)
                        
                        # Check for formulas in OCR text
                        import re
                        lines = [line.strip() for line in ocr_text.split('\n') if line.strip()]
                        for line in lines:
                            if re.search(r'[\+\-\=\/\*\^\(\)\[\]\{\}\∑\∫\∞\√]', line) and not re.search(r'[a-zA-Z]{5,}', line):
                                content_blocks.append(ContentBlock(type="formula", text=line))
                except Exception as e:
                    print(f"OCR failed for PDF page: {e}")

            pages.append(ExtractedPage(page_number=page_num + 1, content=content_blocks))
            
        doc.close()
        
        metadata.language = detect_language(all_text)
        
        return ExtractedDocument(
            metadata=metadata,
            pages=pages,
            headings=headings
        )
