from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from sqlalchemy import select
from app.services.graph_service import graph_service
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.get("/{document_id}")
async def get_document_graph(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Retrieve the knowledge graph for a specific document.
    Formats data for react-force-graph.
    """
    # 1. Verify document ownership
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this document")

    # 2. Cypher query to get nodes and relations for this doc
    query = """
    MATCH (s:Entity)-[r:RELATES_TO {doc_id: $doc_id}]->(o:Entity)
    RETURN s.name AS source, r.relation AS relation, o.name AS target
    """
    
    try:
        records = await graph_service.execute_query(query, {"doc_id": str(document_id)})
        
        nodes = set()
        links = []
        
        for record in records:
            source = record["source"]
            target = record["target"]
            relation = record["relation"]
            
            nodes.add(source)
            nodes.add(target)
            
            links.append({
                "source": source,
                "target": target,
                "label": relation
            })
            
        return {
            "nodes": [{"id": n, "name": n} for n in nodes],
            "links": links
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
