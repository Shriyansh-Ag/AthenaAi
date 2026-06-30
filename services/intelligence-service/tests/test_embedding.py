import pytest
from app.models.embedding import EmbeddingRequest
from app.services.embedding_service import embedding_service

def test_generate_embeddings():
    request = EmbeddingRequest(
        texts=["Hello world", "This is a test document", "Another random string"],
        model_name="all-MiniLM-L6-v2"
    )
    
    response = embedding_service.generate_embeddings(request)
    
    # We sent 3 texts, should get 3 embeddings
    assert len(response.embeddings) == 3
    
    # The default miniLM model produces 384-dimensional embeddings
    for emb in response.embeddings:
        assert len(emb) == 384
        assert isinstance(emb[0], float)

def test_empty_embeddings_request():
    request = EmbeddingRequest(texts=[])
    response = embedding_service.generate_embeddings(request)
    
    assert len(response.embeddings) == 0
