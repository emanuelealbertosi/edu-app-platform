import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from app.db.base import Base, get_db
from app.main import app
from app.core.security import get_password_hash
from app.db.models.user import User, Role, ParentProfile, StudentProfile

# Test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Create test database tables
    Base.metadata.create_all(bind=engine)
    
    # Create a new session for each test
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Clean up after the test
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def test_roles(db):
    # Create test roles
    admin_role = Role(name="admin", description="Administrator")
    parent_role = Role(name="parent", description="Genitore")
    student_role = Role(name="student", description="Studente")
    
    db.add(admin_role)
    db.add(parent_role)
    db.add(student_role)
    db.commit()
    
    db.refresh(admin_role)
    db.refresh(parent_role)
    db.refresh(student_role)
    
    return {"admin": admin_role, "parent": parent_role, "student": student_role}

@pytest.fixture(scope="function")
def test_users(db, test_roles):
    # Create test users with different roles
    admin_user = User(
        email="admin@example.com",
        username="admin",
        hashed_password=get_password_hash("adminpassword"),
        first_name="Admin",
        last_name="User",
        is_active=True
    )
    admin_user.roles.append(test_roles["admin"])
    
    parent_user = User(
        email="parent@example.com",
        username="parent",
        hashed_password=get_password_hash("parentpassword"),
        first_name="Parent",
        last_name="User",
        is_active=True
    )
    parent_user.roles.append(test_roles["parent"])
    
    student_user = User(
        email="student@example.com",
        username="student",
        hashed_password=get_password_hash("studentpassword"),
        first_name="Student",
        last_name="User",
        is_active=True
    )
    student_user.roles.append(test_roles["student"])
    
    inactive_user = User(
        email="inactive@example.com",
        username="inactive",
        hashed_password=get_password_hash("inactivepassword"),
        first_name="Inactive",
        last_name="User",
        is_active=False
    )
    inactive_user.roles.append(test_roles["student"])
    
    db.add(admin_user)
    db.add(parent_user)
    db.add(student_user)
    db.add(inactive_user)
    db.commit()
    
    db.refresh(admin_user)
    db.refresh(parent_user)
    db.refresh(student_user)
    db.refresh(inactive_user)
    
    return {
        "admin": admin_user,
        "parent": parent_user,
        "student": student_user,
        "inactive": inactive_user
    }

@pytest.fixture(scope="function")
def test_profiles(db, test_users):
    # Create parent profile
    parent_profile = ParentProfile(
        user_id=test_users["parent"].id,
        phone_number="123456789",
        address="Via Roma 123"
    )
    
    # Create student profile
    student_profile = StudentProfile(
        user_id=test_users["student"].id,
        school_grade="5th grade",
        birth_date=datetime.now() - timedelta(days=365*10),  # 10 years ago
        points=100,
        parent_id=None  # Will be set after parent profile is created
    )
    
    db.add(parent_profile)
    db.commit()
    db.refresh(parent_profile)
    
    # Now set the parent_id
    student_profile.parent_id = parent_profile.id
    db.add(student_profile)
    db.commit()
    db.refresh(student_profile)
    
    return {
        "parent": parent_profile,
        "student": student_profile
    }
