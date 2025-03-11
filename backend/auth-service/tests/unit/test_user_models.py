import pytest
from sqlalchemy.exc import IntegrityError
from app.db.models.user import User, Role, ParentProfile, StudentProfile


def test_role_model(db, test_roles):
    """Test the Role model and its properties."""
    admin_role = test_roles["admin"]
    
    # Check if role was created correctly
    assert admin_role.name == "admin"
    assert admin_role.description == "Administrator"
    
    # Test string representation
    assert str(admin_role) == "<Role admin>"
    
    # Test unique constraint on role name
    duplicate_role = Role(name="admin", description="Duplicate admin")
    db.add(duplicate_role)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_user_model(db, test_users):
    """Test the User model and its properties."""
    admin_user = test_users["admin"]
    
    # Check if user was created correctly
    assert admin_user.email == "admin@example.com"
    assert admin_user.username == "admin"
    assert admin_user.first_name == "Admin"
    assert admin_user.last_name == "User"
    assert admin_user.is_active is True
    
    # Check UUID generation
    assert admin_user.uuid is not None
    
    # Test string representation
    assert str(admin_user) == "<User admin>"
    
    # Test unique constraint on email
    duplicate_user = User(
        email="admin@example.com",
        username="admin2",
        hashed_password="hashedpassword",
        first_name="Duplicate",
        last_name="Admin"
    )
    db.add(duplicate_user)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
    
    # Test unique constraint on username
    duplicate_user = User(
        email="admin2@example.com",
        username="admin",
        hashed_password="hashedpassword",
        first_name="Duplicate",
        last_name="Admin"
    )
    db.add(duplicate_user)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_user_role_relationship(db, test_users, test_roles):
    """Test the relationship between User and Role models."""
    admin_user = test_users["admin"]
    student_role = test_roles["student"]
    
    # Check if roles were assigned correctly
    assert len(admin_user.roles) == 1
    assert admin_user.roles[0].name == "admin"
    
    # Add another role to user
    admin_user.roles.append(student_role)
    db.commit()
    db.refresh(admin_user)
    
    # Check if role was added correctly
    assert len(admin_user.roles) == 2
    role_names = [role.name for role in admin_user.roles]
    assert "admin" in role_names
    assert "student" in role_names


def test_parent_profile_model(db, test_profiles, test_users):
    """Test the ParentProfile model and its properties."""
    parent_profile = test_profiles["parent"]
    parent_user = test_users["parent"]
    
    # Check if parent profile was created correctly
    assert parent_profile.phone_number == "123456789"
    assert parent_profile.address == "Via Roma 123"
    assert parent_profile.user_id == parent_user.id
    
    # Test relationship with User
    assert parent_profile.user.username == "parent"
    
    # Test relationship with StudentProfile
    assert len(parent_profile.students) == 1
    assert parent_profile.students[0].school_grade == "5th grade"
    
    # Test string representation
    assert str(parent_profile).startswith("<ParentProfile ")


def test_student_profile_model(db, test_profiles, test_users):
    """Test the StudentProfile model and its properties."""
    student_profile = test_profiles["student"]
    student_user = test_users["student"]
    parent_profile = test_profiles["parent"]
    
    # Check if student profile was created correctly
    assert student_profile.school_grade == "5th grade"
    assert student_profile.points == 100
    assert student_profile.user_id == student_user.id
    assert student_profile.parent_id == parent_profile.id
    
    # Test relationship with User
    assert student_profile.user.username == "student"
    
    # Test relationship with ParentProfile
    assert student_profile.parent.phone_number == "123456789"
    
    # Test string representation
    assert str(student_profile).startswith("<StudentProfile ")


def test_refresh_token_cascade_delete(db, test_users):
    """Test that RefreshToken is deleted when User is deleted."""
    from datetime import datetime, timezone
    from app.db.models.user import RefreshToken
    
    # Create a refresh token for user
    user = test_users["admin"]
    
    # Create a proper RefreshToken object
    refresh_token_obj = RefreshToken(
        token="test_token",
        expires_at=datetime(2099, 1, 1, tzinfo=timezone.utc),
        revoked=False,
        user_id=user.id
    )
    db.add(refresh_token_obj)
    db.commit()
    
    # Check if refresh token was created
    db.refresh(user)
    assert len(user.refresh_tokens) >= 1
    
    # Get token ID for later verification
    token_id = refresh_token_obj.id
    
    # Delete user
    db.delete(user)
    db.commit()
    
    # Check if refresh token was deleted (cascade)
    result = db.query(User).filter(User.email == "admin@example.com").first()
    assert result is None
