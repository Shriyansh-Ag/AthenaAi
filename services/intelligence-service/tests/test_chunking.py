import pytest
from app.models.document import ExtractedDocument, ExtractedPage, ContentBlock, DocumentMetadata
from app.models.chunk import ChunkingRequest, ChunkingConfig
from app.services.chunking_service import chunking_service

def test_chunking_hierarchy_and_size():
    # Create a mock ExtractedDocument
    doc = ExtractedDocument(
        metadata=DocumentMetadata(title="Test Doc"),
        pages=[
            ExtractedPage(
                page_number=1,
                content=[
                    ContentBlock(type="heading", text="Introduction", level=1),
                    ContentBlock(type="paragraph", text="This is a test paragraph that is fairly long. " * 20),
                    ContentBlock(type="heading", text="Background", level=2),
                    ContentBlock(type="paragraph", text="Another long paragraph here. " * 20)
                ]
            )
        ]
    )
    
    # Configure chunker
    config = ChunkingConfig(max_chunk_size=100, overlap_size=20, semantic_threshold=-1.0) # Disable semantic splitting
    request = ChunkingRequest(document=doc, document_id="doc_123", config=config)
    
    response = chunking_service.chunk_document(request.document, request.document_id, request.config)
    
    assert response.total_chunks > 0
    assert response.document_id == "doc_123"
    
    # Check that hierarchy is preserved
    for chunk in response.chunks:
        assert chunk.metadata.document_id == "doc_123"
        assert len(chunk.metadata.page_numbers) > 0
        assert chunk.metadata.chunk_index >= 0
        if "Another" in chunk.text:
            assert chunk.metadata.heading_path == ["Introduction", "Background"]

def test_semantic_splitting():
    # Create a mock ExtractedDocument with distinct topics
    doc = ExtractedDocument(
        metadata=DocumentMetadata(title="Semantic Doc"),
        pages=[
            ExtractedPage(
                page_number=1,
                content=[
                    ContentBlock(type="paragraph", text="The quick brown fox jumps over the lazy dog. Dogs are great pets."),
                    ContentBlock(type="paragraph", text="Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature."),
                    ContentBlock(type="paragraph", text="Quantum physics includes quantum field theory and quantum entanglement.")
                ]
            )
        ]
    )
    
    config = ChunkingConfig(max_chunk_size=5000, overlap_size=10, semantic_threshold=0.2)
    
    response = chunking_service.chunk_document(doc, "doc_456", config)
    
    # Should split because "Quantum mechanics" is semantically far from "fox jumps over the lazy dog"
    assert response.total_chunks >= 2
