import asyncio
import uuid
from app.core.database import async_session
from app.models.user import User
from app.services.ingestion import ingestion_service
from app.models.document import Document, UploadStatus
from app.services.embeddings import embedding_service
from sqlalchemy import insert, select
import os
import shutil

async def run_e2e_test():
    async with async_session() as db:
        # 1. Get or Create a test user
        result = await db.execute(select(User).where(User.email == "test@example.com"))
        user = result.scalar_one_or_none()
        if not user:
            user_id = uuid.uuid4()
            user = User(
                id=user_id,
                email="test@example.com",
                full_name="Test User",
                oauth_sub="test-sub-123",
                theme_preference="dark"
            )
            db.add(user)
            await db.commit()
            print(f"Created test user: {user_id}")
        else:
            user_id = user.id
            print(f"Using existing test user: {user_id}")

        # 2. Setup document
        document_id = uuid.uuid4()
        filename = "jesc112.pdf"
        source_path = "/home/somshekar/anti_gravity/study-buddy/docs/jesc112.pdf"
        dest_path = f"uploads/{document_id}_{filename}"
        
        # Ensure uploads dir exists
        os.makedirs("uploads", exist_ok=True)
        shutil.copy(source_path, dest_path)
        
        doc = Document(
            id=document_id,
            user_id=user_id,
            filename=filename,
            file_path=dest_path,
            upload_status=UploadStatus.PENDING
        )
        db.add(doc)
        await db.commit()
        print(f"Created document record: {document_id}")

        # 3. Initialize embeddings and run ingestion
        print("Initializing embedding service...")
        await embedding_service.initialize()
        
        print("Starting ingestion (this includes Triplet Extraction and Vision Analysis)...")
        await ingestion_service.ingest_document(document_id, dest_path)
        
        # 4. Verify status - Use a fresh session to avoid cache issues
        async with async_session() as db_verify:
            result = await db_verify.execute(select(Document).where(Document.id == document_id))
            final_doc = result.scalar_one()
            print(f"Ingestion finished. Status: {final_doc.upload_status}")
            print(f"Total Pages: {final_doc.total_pages}, Total Chunks: {final_doc.total_chunks}")

if __name__ == "__main__":
    asyncio.run(run_e2e_test())
