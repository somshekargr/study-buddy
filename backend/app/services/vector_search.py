import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pgvector.sqlalchemy import Vector

from app.models.chunk import DocumentChunk


class VectorSearchService:
    async def search_similar(
        self, 
        query_embedding: list[float], 
        document_id: uuid.UUID, 
        db: AsyncSession,
        top_k: int = 5
    ):
        # Using pgvector cosine distance operator <=>
        # We also filter by document_id to ensure RAG is grounded in the specific file
        query = (
            select(
                DocumentChunk.content,
                DocumentChunk.page_number,
                DocumentChunk.embedding.cosine_distance(query_embedding).label("distance")
            )
            .where(DocumentChunk.document_id == document_id)
            .order_by("distance")
            .limit(top_k)
        )
        
        result = await db.execute(query)
        rows = result.all()
        
        chunks = [
            {
                "content": row.content,
                "page_number": row.page_number,
                "distance": float(row.distance)
            }
            for row in rows
        ]
        
        print(f"🔍 Vector search found {len(chunks)} chunks with pages: {[c['page_number'] for c in chunks]}")
        return chunks


vector_search_service = VectorSearchService()
