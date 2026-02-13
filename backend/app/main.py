from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.services.embeddings import embedding_service
from app.core.database import async_session
from app.models.document import Document, UploadStatus
from sqlalchemy import update


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load embedding model on startup
    await embedding_service.initialize()

    # Recovery: Reset stuck "PROCESSING" documents to "FAILED"
    async with async_session() as db:
        try:
            from sqlalchemy import select
            # Only reset if there are actually any stuck documents
            result = await db.execute(
                update(Document)
                .where(Document.upload_status == UploadStatus.PROCESSING)
                .values(upload_status=UploadStatus.FAILED)
            )
            await db.commit()
            count = result.rowcount
            if count > 0:
                print(f"Startup Recovery: Reset {count} stuck processing documents to FAILED.")
        except Exception as e:
            print(f"Startup Recovery Error: {e}")

    yield
    # Cleanup if needed


app = FastAPI(
    title="Study Buddy API",
    description="GenAI-native educational web app for personalized learning.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://somshekargr.github.io",
    ],  # Explicit origins only, no wildcard
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

from app.api import upload, chat, auth

# Routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(upload.router, prefix="/api", tags=["Upload"])

app.include_router(chat.router, prefix="/api", tags=["Chat"])

from app.api import quiz
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])

from app.api import graph
app.include_router(graph.router, prefix="/api/graph", tags=["Graph"])


