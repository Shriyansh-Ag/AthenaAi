import io
from app.services.pipeline_service import pipeline_service

def test_markdown_extractor():
    md_content = """# Main Title

This is a test paragraph.

## Subtitle
Another paragraph.
"""
    file_stream = io.BytesIO(md_content.encode('utf-8'))
    
    result = pipeline_service.process_document(file_stream, "test.md")
    
    assert result.metadata.file_type == "markdown"
    assert result.metadata.title == "test.md"
    
    assert len(result.headings) == 2
    assert result.headings[0].text == "Main Title"
    assert result.headings[0].level == 1
    
    assert result.headings[1].text == "Subtitle"
    assert result.headings[1].level == 2
    
    # Check language detection (should be english given the text)
    assert result.metadata.language == "en"

def test_txt_extractor():
    txt_content = "This is a simple text file.\n\nIt has two paragraphs."
    file_stream = io.BytesIO(txt_content.encode('utf-8'))
    
    result = pipeline_service.process_document(file_stream, "test.txt")
    
    assert result.metadata.file_type == "txt"
    assert len(result.pages) == 1
    assert len(result.pages[0].content) == 2
    assert result.pages[0].content[0].text == "This is a simple text file."
    assert result.pages[0].content[1].text == "It has two paragraphs."
    assert result.metadata.language == "en"
