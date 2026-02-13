import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.vector_search import vector_search_service
from app.services.graph_service import graph_service
from app.core.config import settings

logger = logging.getLogger(__name__)

class HybridSearchService:
    async def search(
        self, 
        query_text: str,
        query_embedding: list[float], 
        document_id: uuid.UUID, 
        db: AsyncSession,
        vector_top_k: int = 5
    ):
        # 1. Standard Vector Search
        vector_chunks = await vector_search_service.search_similar(
            query_embedding, document_id, db, top_k=vector_top_k
        )
        
        # 2. Extract Entities from Question
        # In a real-world scenario, we'd use a small NER model or LLM.
        # For our local-first approach, we'll use a simple "keyword" based extraction
        # against our known graph entities to keep it fast.
        
        entities_in_query = await self._identify_entities_in_text(query_text, document_id)
        logger.info(f"Entities identified in query: {entities_in_query}")
        
        # 3. Graph Traversal (1-hop expansion)
        graph_facts = []
        if entities_in_query:
            query = """
            MATCH (s:Entity)-[r:RELATES_TO {doc_id: $doc_id}]->(o:Entity)
            WHERE s.name IN $entities OR o.name IN $entities
            RETURN s.name AS subject, r.relation AS relation, o.name AS object, r.page AS page
            LIMIT 10
            """
            records = await graph_service.execute_query(
                query, 
                {"doc_id": str(document_id), "entities": entities_in_query}
            )
            
            for r in records:
                fact = f"- {r['subject']} {r['relation']} {r['object']} (Found on Page {r['page']})"
                graph_facts.append(fact)
        
        # 4. Integrate Vision Content
        # (This is already appended to the vector chunks during ingestion)
        
        return {
            "vector_chunks": vector_chunks,
            "graph_facts": graph_facts,
            "entities": entities_in_query
        }

    async def _identify_entities_in_text(self, text: str, document_id: uuid.UUID) -> list[str]:
        """Simple cross-reference to find doc entities mentioned in text."""
        # Get all entities for this doc
        query = "MATCH (e:Entity) WHERE ANY(r IN [(e)-[:RELATES_TO {doc_id: $doc_id}]->() | 1] WHERE r=1) RETURN DISTINCT e.name AS name LIMIT 100"
        records = await graph_service.execute_query(query, {"doc_id": str(document_id)})
        all_entities = [r["name"] for r in records]
        
        # Find matches (case-insensitive)
        text_lower = text.lower()
        found = []
        for entity in all_entities:
            if entity.lower() in text_lower:
                found.append(entity)
        return found

hybrid_search_service = HybridSearchService()
