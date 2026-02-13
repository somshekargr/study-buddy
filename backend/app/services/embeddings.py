from sentence_transformers import SentenceTransformer
from app.core.config import settings


class EmbeddingService:
    def __init__(self):
        self.model = None

    async def initialize(self):
        if self.model is None:
            # Running this in a separate thread if needed, but for now blocking init is okay on startup
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
            print(f"Loaded embedding model: {settings.EMBEDDING_MODEL}")

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if self.model is None:
            raise RuntimeError("Embedding model not initialized")
        embeddings = self.model.encode(texts)
        return embeddings.tolist()


embedding_service = EmbeddingService()
