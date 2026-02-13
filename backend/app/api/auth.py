from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import GoogleLoginRequest, TokenResponse
from app.services.auth import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/google", response_model=TokenResponse)
async def google_login(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    # 1. Verify Google Token
    user_info = auth_service.verify_google_token(request.token)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    # 2. Check if user exists
    result = await db.execute(select(User).where(User.email == user_info["email"]))
    user = result.scalars().first()
    
    # 3. Create user if not exists
    if not user:
        user = User(
            email=user_info["email"],
            full_name=user_info["full_name"],
            oauth_sub=user_info["oauth_sub"]
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # 4. Create App JWT
    access_token = auth_service.create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        theme_preference=user.theme_preference or "system"
    )

from pydantic import BaseModel
from app.core.dependencies import get_current_user

class ThemeUpdateRequest(BaseModel):
    theme: str  # "light" | "dark" | "system"

@router.patch("/me/theme")
async def update_theme_preference(
    request: ThemeUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update the current user's theme preference."""
    # Validate theme value
    if request.theme not in ["light", "dark", "system"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid theme. Must be 'light', 'dark', or 'system'"
        )
    
    user.theme_preference = request.theme
    await db.commit()
    await db.refresh(user)
    
    return {"theme_preference": user.theme_preference}

