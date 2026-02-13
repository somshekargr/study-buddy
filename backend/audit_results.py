import asyncio
from app.core.database import async_session
from app.models.chunk import DocumentChunk
from sqlalchemy import select, func
import os

async def audit_results():
    async with async_session() as db:
        # 1. Total Chunks
        count_res = await db.execute(select(func.count(DocumentChunk.id)))
        total_chunks = count_res.scalar()
        print(f"Total Chunks in DB: {total_chunks}")
        
        # 2. Check for Vision Descriptions
        vision_res = await db.execute(
            select(DocumentChunk.content)
            .where(DocumentChunk.content.like("%[Diagram Analysis]%"))
            .limit(5)
        )
        vision_chunks = vision_res.scalars().all()
        print(f"Chunks with Vision components: {len(vision_chunks)}")
        for i, content in enumerate(vision_chunks):
            print(f"--- Example {i+1} ---\n{content[:200]}...\n")

if __name__ == "__main__":
    asyncio.run(audit_results())
