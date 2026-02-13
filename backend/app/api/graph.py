from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from app.services.graph_service import graph_service
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/{document_id}")
async def get_document_graph(
    document_id: UUID,
    user: User = Depends(get_current_user)
):
    """
    Retrieve the knowledge graph for a specific document.
    Formats data for react-force-graph.
    """
    # Cypher query to get nodes and relations for this doc
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
