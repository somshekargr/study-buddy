import uuid
import logging
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, insert, select

from app.models.document import Document, UploadStatus
from app.models.chunk import DocumentChunk
from app.services.pdf_parser import pdf_parser
from app.services.chunker import chunker
from app.services.embeddings import embedding_service
from app.services.vision_service import vision_service
from app.services.graph_service import graph_service
from app.services.email_service import email_service
from app.models.user import User
from app.core.database import async_session
from app.core.config import settings

logger = logging.getLogger(__name__)

class IngestionService:
    async def ingest_document(self, document_id: uuid.UUID, file_path: str):
        async with async_session() as db:
            try:
                # 1. Update status to PROCESSING
                await db.execute(
                    update(Document)
                    .where(Document.id == document_id)
                    .values(upload_status=UploadStatus.PROCESSING)
                )
                await db.commit()

                # 2. Parse PDF + Extract Images
                path = Path(file_path)
                doc_dir = path.parent
                pages = pdf_parser.parse_pdf(path, output_dir=doc_dir)
                
                # 3. Process Vision (Diagrams)
                if settings.ENABLE_VISION_ANALYSIS:
                    for page in pages:
                        for img_path in page.image_paths:
                            desc = await vision_service.describe_image(img_path)
                            # Append vision descriptions to page text for indexing
                            page.text += f"\n\n[Visual Content Detail]: {desc}"
                else:
                    logger.info("Vision Analysis disabled. Skipping diagram descriptions.")

                # 4. Extract Entities/Triplets for GraphRAG
                if settings.ENABLE_GRAPH_RAG:
                    all_triplets = []
                    for page in pages:
                        if len(page.text) > 50:
                            triplets = await graph_service.extract_triplets(page.text)
                            for t in triplets:
                                t["page_number"] = page.page_number
                                all_triplets.append(t)

                    # 5. Populate Neo4j
                    if all_triplets:
                        query = """
                        UNWIND $triplets AS t
                        MERGE (s:Entity {name: t.subject})
                        MERGE (o:Entity {name: t.object})
                        MERGE (s)-[r:RELATES_TO {relation: t.relation, page: t.page_number, doc_id: $doc_id}]->(o)
                        """
                        await graph_service.execute_query(
                            query, 
                            {"triplets": all_triplets, "doc_id": str(document_id)}
                        )
                else:
                    logger.info("GraphRAG disabled. Skipping entity extraction and Neo4j storage.")

                # 6. Chunk text
                chunks = chunker.chunk_pages(pages)
                
                # 7. Generate Embeddings
                texts = [c.content for c in chunks]
                if texts:
                    embeddings = embedding_service.embed_texts(texts)
                    
                    # 8. Store in DB
                    chunk_data = []
                    for idx, (chunk, vector) in enumerate(zip(chunks, embeddings)):
                        chunk_data.append({
                            "id": uuid.uuid4(),
                            "document_id": document_id,
                            "chunk_index": chunk.chunk_index,
                            "content": chunk.content,
                            "page_number": chunk.page_number,
                            "embedding": vector
                        })
                    
                    if chunk_data:
                        await db.execute(insert(DocumentChunk).values(chunk_data))

                # 9. Final update
                any_needs_ocr = any(p.needs_ocr for p in pages)
                final_status = UploadStatus.READY
                if any_needs_ocr and not texts:
                    final_status = UploadStatus.NEEDS_OCR

                await db.execute(
                    update(Document)
                    .where(Document.id == document_id)
                    .values(
                        upload_status=final_status,
                        total_pages=len(pages),
                        total_chunks=len(chunks)
                    )
                )
                await db.commit()

                # 10. Send Success Email
                try:
                    result = await db.execute(
                        select(User.email, Document.filename)
                        .join(Document, User.id == Document.user_id)
                        .where(Document.id == document_id)
                    )
                    user_data = result.one_or_none()
                    
                    if user_data:
                        user_email, filename = user_data
                        await email_service.send_ingestion_status_email(
                            user_email, filename or "Document", final_status.value
                        )
                except Exception as email_err:
                    logger.error(f"Failed to send success email: {email_err}")

            except Exception as e:
                import traceback
                error_msg = f"Error ingesting document {document_id}: {e}\n{traceback.format_exc()}"
                print(error_msg)
                logger.error(error_msg)
                async with async_session() as db_err:
                    await db_err.execute(
                        update(Document)
                        .where(Document.id == document_id)
                        .values(upload_status=UploadStatus.FAILED)
                    )
                    await db_err.commit()

                    # Send Failure Email
                    try:
                        user_email_result = await db_err.execute(
                            select(User.email)
                            .join(Document, User.id == Document.user_id)
                            .where(Document.id == document_id)
                        )
                        user_email = user_email_result.scalar_one_or_none()
                        if user_email:
                            # Try to get filename if possible
                            doc_result = await db_err.execute(select(Document.filename).where(Document.id == document_id))
                            filename = doc_result.scalar_one_or_none() or "Document"
                            await email_service.send_ingestion_status_email(
                                user_email, filename, UploadStatus.FAILED.value
                            )
                    except Exception as email_err:
                        logger.error(f"Failed to send failure email: {email_err}")


ingestion_service = IngestionService()
