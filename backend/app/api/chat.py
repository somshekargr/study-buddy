import json
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage, MessageRole
from app.models.document import Document
from app.services.embeddings import embedding_service
from app.services.hybrid_search import hybrid_search_service
from app.services.persona import persona_engine
from app.services.llm import llm_service
from app.services.web_search import web_search_service


router = APIRouter()


@router.post("/chat")
async def chat_with_document(
    document_id: UUID | None = Body(None),
    question: str = Body(...),
    persona: str = Body("default"),
    session_id: UUID | None = Body(None),
    web_search: bool = Body(False),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    user_id = user.id
    doc = None
    if document_id:
        result = await db.execute(select(Document).where(Document.id == document_id))
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        if doc.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this document")
        if doc.upload_status != "ready":
            raise HTTPException(status_code=400, detail=f"Document is {doc.upload_status}, not ready yet")

    # 2. Get or create session
    if session_id:
        result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        title = f"Chat about {doc.filename}" if doc else "General Chat"
        # Enforce general persona for General Chat (no document)
        if not doc:
            persona = "general"
            
        session = ChatSession(
            user_id=user_id,
            document_id=document_id,
            persona=persona,
            title=title
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        session_id = session.id

    # 3. Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role=MessageRole.USER,
        content=question
    )
    db.add(user_msg)
    await db.commit()

    # 4. Context Pipeline (RAG + Web)
    context_chunks = []
    graph_facts = []
    web_results = []
    
    # a. RAG (only if doc is present)
    if document_id:
        query_vector = embedding_service.embed_texts([question])[0]
        hybrid_results = await hybrid_search_service.search(
            question, query_vector, document_id, db
        )
        context_chunks = [c for c in hybrid_results["vector_chunks"] if c["distance"] < 0.65]
        graph_facts = hybrid_results["graph_facts"]

    # b. Web Search (if enabled)
    if web_search:
        web_results = web_search_service.search(question)

    # Fetch history for context
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(11) # Get last 10 (excluding the one we JUST added)
    )
    history_msgs = history_result.scalars().all()
    # Reverse to get chronological order and skip the very last one (which is the current user_msg)
    history_formatted = [
        {"role": m.role.value, "content": m.content}
        for m in reversed(history_msgs[1:])
    ]
    
    # c. Merge context for persona engine
    merged_context = []
    for c in context_chunks:
        merged_context.append({
            "page_number": c["page_number"],
            "content": c["content"]
        })
    
    # Inject Web Search results as virtual chunks
    for wr in web_results:
        merged_context.append({
            "page_number": "Web", # Mark source as Web
            "content": f"Title: {wr['title']}\nURL: {wr['url']}\nSnippet: {wr['content']}"
        })

    # Enhance the prompt with graph facts
    if graph_facts:
        fact_str = "\n".join(graph_facts)
        question = f"[Related Knowledge Graph Facts]:\n{fact_str}\n\n[Student Question]:\n{question}"
    
    # d. Assemble prompt
    messages = persona_engine.assemble_prompt(persona, merged_context, question, history=history_formatted)
    
    # 5. Stream from LLM
    async def chat_generator():
        full_response = ""
        
        # Yield session ID first
        yield f"__SESSION_ID__:{session_id}\n"
        
        # Yield Citations
        citations_json = json.dumps([c["page_number"] for c in context_chunks])
        print(f"📤 Streaming citations: {citations_json}")
        yield f"__CITATIONS__:{citations_json}\n"
        
        async for token in llm_service.stream_chat(messages):
            full_response += token
            yield token
            
        # 6. Save assistant message after stream ends
        from app.core.database import async_session
        async with async_session() as db_final:
            assistant_msg = ChatMessage(
                session_id=session_id,
                role=MessageRole.ASSISTANT,
                content=full_response,
                citations=json.dumps([c["page_number"] for c in context_chunks]) # Use dict access
            )
            db_final.add(assistant_msg)
            
            # 7. Update title if it's the first interaction (or generic title)
            # We fetch the session to check current title
            session_result = await db_final.execute(select(ChatSession).where(ChatSession.id == session_id))
            session = session_result.scalar_one_or_none()
            
            if session:
                is_default_title = session.title in ["New Chat", "General Chat"] or session.title.startswith("Chat about ")
                if is_default_title:
                    new_title = await llm_service.generate_title(full_response)
                    session.title = new_title
                    db_final.add(session)
            
            await db_final.commit()

    return StreamingResponse(chat_generator(), media_type="text/plain")


from app.schemas.chat import ChatSessionResponse, ChatMessageResponse

@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    document_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = select(ChatSession).where(ChatSession.user_id == user.id)
    if document_id and document_id.strip():
        try:
            doc_uuid = UUID(document_id)
            query = query.where(ChatSession.document_id == doc_uuid)
        except ValueError:
             # If invalid UUID, maybe return empty list or error? 
             # For now, let's just properly cast it. 
             # Actually, if it's invalid string, UUID(...) will raise.
             raise HTTPException(status_code=400, detail="Invalid document_id format")
    else:
        # Default to General Chat sessions if no document_id provided
        query = query.where(ChatSession.document_id == None)
    
    result = await db.execute(query.order_by(ChatSession.updated_at.desc()))
    return result.scalars().all()


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
async def get_session_messages(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Verify session ownership
    session_result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")

    result = await db.execute(select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()))
    return result.scalars().all()
