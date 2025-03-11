import pytest
from pydantic import ValidationError
from datetime import datetime

from app.schemas.user import (
    UserCreate, UserUpdate, Role, User, 
    ParentProfileCreate, StudentProfileCreate,
    Token, RefreshToken, TokenPayload
)


def test_role_schema():
    """Test Role schema validation."""
    # Test valid data
    role_data = {"id": 1, "name": "admin", "description": "Administrator"}
    role = Role(**role_data)
    assert role.id == 1
    assert role.name == "admin"
    assert role.description == "Administrator"
    
    # Test without optional field
    role_data = {"id": 1, "name": "admin"}
    role = Role(**role_data)
    assert role.description is None


def test_user_create_schema():
    """Test UserCreate schema validation."""
    # Test valid data
    user_data = {
        "email": "user@example.com",
        "username": "validuser",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User"
    }
    user = UserCreate(**user_data)
    assert user.email == "user@example.com"
    assert user.username == "validuser"
    assert user.password == "password123"
    
    # Test password too short
    invalid_user_data = user_data.copy()
    invalid_user_data["password"] = "short"
    with pytest.raises(ValidationError):
        UserCreate(**invalid_user_data)
    
    # Test non-alphanumeric username
    invalid_user_data = user_data.copy()
    invalid_user_data["username"] = "invalid-user"
    with pytest.raises(ValidationError):
        UserCreate(**invalid_user_data)
    
    # Test invalid email
    invalid_user_data = user_data.copy()
    invalid_user_data["email"] = "not_an_email"
    with pytest.raises(ValidationError):
        UserCreate(**invalid_user_data)


def test_user_update_schema():
    """Test UserUpdate schema validation."""
    # Test with all fields
    update_data = {
        "email": "updated@example.com",
        "username": "newusername",
        "first_name": "Updated",
        "last_name": "User",
        "password": "newpassword123",
        "is_active": False
    }
    update = UserUpdate(**update_data)
    assert update.email == "updated@example.com"
    assert update.username == "newusername"
    
    # Test with partial fields (should be allowed as all are optional)
    partial_update = UserUpdate(email="updated@example.com")
    assert partial_update.email == "updated@example.com"
    assert partial_update.username is None
    assert partial_update.password is None


def test_user_schema():
    """Test User schema validation."""
    role1 = Role(id=1, name="admin", description="Administrator")
    role2 = Role(id=2, name="user", description="Regular user")
    
    # Test valid User data with roles
    user_data = {
        "id": 1,
        "uuid": "123e4567-e89b-12d3-a456-426614174000",
        "email": "user@example.com",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "is_active": True,
        "created_at": datetime.now(),
        "roles": [role1, role2]
    }
    
    user = User(**user_data)
    assert user.email == "user@example.com"
    assert user.uuid == "123e4567-e89b-12d3-a456-426614174000"
    assert len(user.roles) == 2
    assert user.roles[0].name == "admin"
    assert user.roles[1].name == "user"


def test_parent_profile_create_schema():
    """Test ParentProfileCreate schema validation."""
    # Test with all fields
    profile_data = {
        "phone_number": "123456789",
        "address": "Via Roma 123"
    }
    profile = ParentProfileCreate(**profile_data)
    assert profile.phone_number == "123456789"
    assert profile.address == "Via Roma 123"
    
    # Test with optional fields omitted
    profile = ParentProfileCreate()
    assert profile.phone_number is None
    assert profile.address is None


def test_student_profile_create_schema():
    """Test StudentProfileCreate schema validation."""
    # Test with all fields
    profile_data = {
        "school_grade": "5th grade",
        "birth_date": datetime.now(),
        "points": 100,
        "parent_id": 1
    }
    profile = StudentProfileCreate(**profile_data)
    assert profile.school_grade == "5th grade"
    assert profile.points == 100
    assert profile.parent_id == 1
    
    # Test with default values
    profile = StudentProfileCreate(parent_id=1)
    assert profile.school_grade is None
    assert profile.points == 0
    assert profile.parent_id == 1


def test_token_schema():
    """Test Token schema validation."""
    token_data = {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "bearer"
    }
    token = Token(**token_data)
    assert token.access_token == token_data["access_token"]
    assert token.refresh_token == token_data["refresh_token"]
    assert token.token_type == "bearer"


def test_token_payload_schema():
    """Test TokenPayload schema validation."""
    payload_data = {
        "sub": "123e4567-e89b-12d3-a456-426614174000",
        "exp": int(datetime.now().timestamp()) + 3600,
        "roles": ["admin", "user"]
    }
    payload = TokenPayload(**payload_data)
    assert payload.sub == payload_data["sub"]
    assert payload.exp == payload_data["exp"]
    assert payload.roles == ["admin", "user"]


def test_refresh_token_schema():
    """Test RefreshToken schema validation."""
    token_data = {"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
    refresh_token = RefreshToken(**token_data)
    assert refresh_token.refresh_token == token_data["refresh_token"]
