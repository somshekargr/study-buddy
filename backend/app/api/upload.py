import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document, UploadStatus
from app.schemas.document import DocumentResponse
from app.services.ingestion import ingestion_service
from app.services.graph_service import graph_service
import os
from pathlib import Path


router = APIRouter()


@router.post("/upload", response_model=DocumentResponse)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    user_id = user.id
    # 1. Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # 2. Create document record
    doc_id = uuid.uuid4()
    file_path = settings.upload_path / f"{doc_id}_{file.filename}"
    
    # Save file to disk
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db_doc = Document(
        id=doc_id,
        user_id=user_id,
        filename=file.filename,
        file_path=str(file_path),
        upload_status=UploadStatus.PENDING
    )
    
    db.add(db_doc)
    await db.commit()
    await db.refresh(db_doc)

    # 3. Trigger ingestion in background
    background_tasks.add_task(
        ingestion_service.ingest_document, 
        db_doc.id, 
        db_doc.file_path,
        # We need a new session for background tasks usually, but for now we pass ID 
        # and let the service handle its own session or we can refactor.
        # Fixed implementation: IngestionService will handle its own session
    )

    return db_doc


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document_status(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this document")
    return doc


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(Document).where(Document.user_id == user.id).order_by(Document.created_at.desc()))
    return result.scalars().all()


from fastapi.responses import FileResponse

@router.get("/documents/{document_id}/content")
async def get_document_content(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this document")
        
    return FileResponse(doc.file_path, media_type="application/pdf", filename=doc.filename)
@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")

    # 1. Delete from Neo4j
    await graph_service.execute_query(
        "MATCH (n)-[r {doc_id: $doc_id}]->() DELETE r",
        {"doc_id": str(document_id)}
    )
    await graph_service.execute_query(
        "MATCH (n:Entity) WHERE NOT (n)--() DELETE n",
        {}
    )

    # 2. Delete file from disk
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
        # Also delete extracted images if any
        doc_dir = Path(doc.file_path).parent
        if doc_dir.exists() and doc_dir.is_dir():
            # This is a bit aggressive, maybe just delete the specific file's images
            pass

    # 3. Delete from DB (SQLAlchemy cascade handles chunks and chat sessions)
    await db.delete(doc)
    await db.commit()

    return {"message": "Document and all analytical data deleted successfully"}


@router.post("/documents/{document_id}/reprocess", response_model=DocumentResponse)
async def reprocess_document(
    document_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to reprocess this document")

    # 1. Clear Neo4j data for this doc
    await graph_service.execute_query(
        "MATCH (n)-[r {doc_id: $doc_id}]->() DELETE r",
        {"doc_id": str(document_id)}
    )
    await graph_service.execute_query(
        "MATCH (n:Entity) WHERE NOT (n)--() DELETE n",
        {}
    )

    # 2. Clear Postgres chunks (manual delete if cascade is wanted but we want to keep the Doc record)
    from app.models.chunk import DocumentChunk
    from sqlalchemy import delete
    await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))

    # 3. Reset status and trigger ingestion
    doc.upload_status = UploadStatus.PENDING
    doc.total_pages = 0
    doc.total_chunks = 0
    await db.commit()
    await db.refresh(doc)

    background_tasks.add_task(
        ingestion_service.ingest_document, 
        doc.id, 
        doc.file_path
    )

    return doc
