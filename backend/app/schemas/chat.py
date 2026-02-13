
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from enum import Enum

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessageBase(BaseModel):
    role: MessageRole
    content: str
    citations: str | None = None

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: UUID
    session_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatSessionBase(BaseModel):
    title: str = "New Chat"
    persona: str = "default"

class ChatSessionCreate(ChatSessionBase):
    document_id: UUID | None = None

class ChatSessionResponse(ChatSessionBase):
    id: UUID
    user_id: UUID
    document_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
    
    # We might want to include messages or latest_message, but for now specific endpoints handle that.
    
    model_config = ConfigDict(from_attributes=True)
