from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.user import User
from app.services.auth import auth_service
from uuid import UUID

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/google")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    payload = auth_service.decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    if text := user_id_str:
        try:
           user_id = UUID(text)
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid user ID in token")
    else:
        raise HTTPException(status_code=401, detail="Missing user ID in token")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user
