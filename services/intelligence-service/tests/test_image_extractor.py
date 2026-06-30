import io
from unittest.mock import patch
from app.services.pipeline_service import pipeline_service
from PIL import Image

def test_image_extractor_basic_text():
    # Create a dummy image
    img = Image.new('RGB', (100, 100), color = 'white')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    file_stream = io.BytesIO(img_byte_arr.getvalue())
    
    with patch('pytesseract.image_to_string') as mock_tesseract:
        mock_tesseract.return_value = "This is some test OCR text.\nFigure 1: A beautiful chart.\nx = y + z"
        
        result = pipeline_service.process_document(file_stream, "test.png")
        
        assert result.metadata.file_type == "image"
        assert len(result.pages) == 1
        
        blocks = result.pages[0].content
        # Block 0: image metadata
        assert blocks[0].type == "image"
        assert blocks[0].metadata["width"] == 100
        assert blocks[0].metadata["height"] == 100
        
        # Text blocks
        text_types = [b.type for b in blocks[1:]]
        assert "paragraph" in text_types
        assert "caption" in text_types
        assert "formula" in text_types
