
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator
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
    citations: list[dict] | None = None # Change to list of dicts
    created_at: datetime

    @model_validator(mode='before')
    @classmethod
    def parse_citations(cls, data):
        import json
        if hasattr(data, "citations") and isinstance(data.citations, str) and data.citations.strip():
            try:
                # We need to convert the object to a dict to modify it, or just return a new dict
                # But since this is 'before', data might be the SQLAlchemy model
                citations_raw = data.citations
                parsed_citations = json.loads(citations_raw)
                # However, modifying the SQLAlchemy model is not ideal.
                # Better to return a dict that Pydantic can use.
                
                # Convert SQLAlchemy model to dict if attributes are accessible
                result = {
                    "id": data.id,
                    "session_id": data.session_id,
                    "role": data.role,
                    "content": data.content,
                    "citations": parsed_citations,
                    "created_at": data.created_at
                }
                return result
            except:
                pass
        return data

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
