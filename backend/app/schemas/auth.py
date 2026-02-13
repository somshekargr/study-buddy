from pydantic import BaseModel, EmailStr
from uuid import UUID

class GoogleLoginRequest(BaseModel):
    token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: UUID
    full_name: str
    email: EmailStr
    theme_preference: str = "system"
