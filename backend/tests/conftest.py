import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock
from app.main import app
from app.core.database import get_db
from app.models.user import User

@pytest_asyncio.fixture
async def mock_db_session():
    """Mocks the SQLAlchemy AsyncSession."""
    session = AsyncMock()
    
    # Create the Result mock which should be synchronous
    result_mock = MagicMock()
    session.execute.return_value = result_mock
    
    # scalars() is synchronous and returns a Scalars object (mock)
    scalars_mock = MagicMock()
    result_mock.scalars.return_value = scalars_mock
    
    # first() and all() are synchronous
    scalars_mock.first.return_value = None
    scalars_mock.all.return_value = []
    
    # scalar_one_or_none is also on the Result object directly sometimes or scalars? 
    # In my code I used result.scalar_one_or_none() in some places, result.scalars().first() in others.
    # Check dependencies.py: uses result.scalars().first()
    # Check upload.py: uses result.scalar_one_or_none()
    
    
    result_mock.scalar_one_or_none.return_value = None
    
    # Configure session methods
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    
    return session

@pytest_asyncio.fixture
async def client(mock_db_session) -> AsyncGenerator[AsyncClient, None]:
    """Test client with mocked DB dependency."""
    app.dependency_overrides[get_db] = lambda: mock_db_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
