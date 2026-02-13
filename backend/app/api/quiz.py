import uuid
import random
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.services.llm import llm_service

router = APIRouter()

class QuizRequest(BaseModel):
    document_id: uuid.UUID
    num_questions: int = 5

class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer: int
    explanation: str

class QuizResponse(BaseModel):
    questions: list[QuizQuestion]


@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(
    request: QuizRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # 1. Verify document ownership
    result = await db.execute(select(Document).where(Document.id == request.document_id))
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 2. Select random chunks (Postgres-specific RANDOM())
    # Limiting to 5 chunks to keep context window manageable while geting variety
    query = select(DocumentChunk).where(DocumentChunk.document_id == request.document_id).order_by(func.random()).limit(5)
    result = await db.execute(query)
    chunks = result.scalars().all()
    
    if not chunks:
        raise HTTPException(status_code=400, detail="Document has no content to generate quiz from.")

    # 3. Prepare context
    context_text = "\n\n".join([c.content for c in chunks])
    
    # 4. Generate Quiz
    questions_data = await llm_service.generate_quiz(context_text, request.num_questions)
    
    return {"questions": questions_data}
