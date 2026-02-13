from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.document import UploadStatus


class DocumentBase(BaseModel):
    filename: str


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    id: UUID
    upload_status: UploadStatus
    total_pages: int
    total_chunks: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
