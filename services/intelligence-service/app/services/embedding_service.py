import logging
from typing import List, Dict, Any
from app.models.embedding import EmbeddingRequest, EmbeddingResponse

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        # Cache of loaded models to avoid reloading
        self._models: Dict[str, Any] = {}

    def _get_model(self, model_name: str):
        if model_name not in self._models:
            logger.info(f"Loading sentence-transformers model: {model_name}...")
            from sentence_transformers import SentenceTransformer
            self._models[model_name] = SentenceTransformer(model_name)
            logger.info(f"Model {model_name} loaded successfully.")
        return self._models[model_name]

    def generate_embeddings(self, request: EmbeddingRequest) -> EmbeddingResponse:
        model_name = request.model_name or "all-MiniLM-L6-v2"
        
        if not request.texts:
            return EmbeddingResponse(
                embeddings=[],
                model_name=model_name,
                version="v1"
            )

        model = self._get_model(model_name)
        
        logger.info(f"Generating embeddings for {len(request.texts)} texts using {model_name}")
        # encode returns a numpy array, convert to list of lists of floats
        embeddings_np = model.encode(request.texts, show_progress_bar=False)
        embeddings = embeddings_np.tolist()
        
        return EmbeddingResponse(
            embeddings=embeddings,
            model_name=model_name,
            version="v1"
        )

embedding_service = EmbeddingService()
