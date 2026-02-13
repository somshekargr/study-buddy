import pytest
import uuid
from unittest.mock import patch, AsyncMock
from app.services.auth import auth_service
from app.models.user import User

class TestAuth:
    @pytest.mark.asyncio
    async def test_google_login_success(self, client, mock_db_session):
        # Mock Google verification
        with patch("app.services.auth.auth_service.verify_google_token") as mock_verify:
            mock_verify.return_value = {
                "email": "test@example.com",
                "full_name": "Test User",
                "oauth_sub": "google_123"
            }
            
            # Mock DB to simulate user creation
            # First query checks if user exists (returns None)
            mock_db_session.execute.return_value.scalars.return_value.first.return_value = None
            mock_db_session.execute.return_value.scalar_one_or_none.return_value = None
            
            # Side effect for refresh to simulate DB assigning ID
            async def fake_refresh(instance):
                instance.id = uuid.uuid4()
            
            mock_db_session.refresh.side_effect = fake_refresh

            payload = {"token": "valid_google_token"}
            
            payload = {"token": "valid_google_token"}
            response = await client.post("/api/auth/google", json=payload)
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert data["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_protected_endpoint_unauthorized(self, client):
        response = await client.get("/api/documents")
        assert response.status_code == 401
        assert response.json()["detail"] == "Not authenticated"

    @pytest.mark.asyncio
    async def test_protected_endpoint_authorized(self, client, mock_db_session):
        # 1. Create a fake token
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = auth_service.create_access_token({"sub": user_id})
        
        # 2. Mock DB to return a user when get_current_user queries it
        mock_user = User(id=user_id, email="test@example.com")
        mock_db_session.execute.return_value.scalars.return_value.first.return_value = mock_user
        
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/api/documents", headers=headers)
        
        # Should be 200 (empty list is fine)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
