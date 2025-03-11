import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from app.db.base import Base, get_db
from app.api.dependencies.auth import get_current_user, get_current_active_user, get_current_admin_user, get_current_parent_or_admin_user
from app.main import app
from app.db.models.reward import (
    RewardCategory, Reward, UserReward, RewardProgress,
    RewardType, RewardRarity
)

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
    
    # Override database dependency
    app.dependency_overrides[get_db] = override_get_db
    
    # Override auth dependencies with mock users
    async def mock_current_user():
        return {"id": "admin-uuid-1", "role": "admin"}
    
    async def mock_current_active_user():
        return {"id": "admin-uuid-1", "role": "admin", "is_active": True}
        
    async def mock_current_admin_user():
        return {"id": "admin-uuid-1", "role": "admin", "is_active": True}
        
    # Add parent_or_admin dependency
    async def mock_current_parent_or_admin_user():
        return {"id": "admin-uuid-1", "role": "admin", "is_active": True}
    
    app.dependency_overrides[get_current_user] = mock_current_user
    app.dependency_overrides[get_current_active_user] = mock_current_active_user
    app.dependency_overrides[get_current_admin_user] = mock_current_admin_user
    app.dependency_overrides[get_current_parent_or_admin_user] = mock_current_parent_or_admin_user
    
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def test_reward_categories(db):
    # Create test reward categories
    achievements = RewardCategory(
        name="Achievements",
        description="Obiettivi raggiunti e traguardi"
    )
    
    badges = RewardCategory(
        name="Badges",
        description="Badge per competenze specifiche"
    )
    
    certificates = RewardCategory(
        name="Certificates",
        description="Certificati di competenza"
    )
    
    db.add_all([achievements, badges, certificates])
    db.commit()
    
    db.refresh(achievements)
    db.refresh(badges)
    db.refresh(certificates)
    
    return {
        "achievements": achievements,
        "badges": badges,
        "certificates": certificates
    }

@pytest.fixture(scope="function")
def test_rewards(db, test_reward_categories):
    # Create test rewards
    math_master = Reward(
        name="Math Master",
        description="Completamento di tutti i percorsi di matematica",
        reward_type=RewardType.BADGE,
        rarity=RewardRarity.RARE,
        icon_url="https://example.com/icons/math_master.png",
        image_url="https://example.com/images/math_master.png",
        points_value=50,
        requirements={"completed_paths": ["math_algebra", "math_geometry", "math_arithmetic"]},
        category_id=test_reward_categories["badges"].id,
        created_by="admin-uuid-1"
    )
    
    reading_certificate = Reward(
        name="Reading Certificate",
        description="Certificato di lettura avanzata",
        reward_type=RewardType.CERTIFICATE,
        rarity=RewardRarity.UNCOMMON,
        image_url="https://example.com/images/reading_certificate.png",
        points_value=100,
        requirements={"books_read": 15},
        category_id=test_reward_categories["certificates"].id,
        created_by="admin-uuid-1"
    )
    
    first_quiz = Reward(
        name="First Quiz",
        description="Completamento del primo quiz",
        reward_type=RewardType.ACHIEVEMENT,
        rarity=RewardRarity.COMMON,
        icon_url="https://example.com/icons/first_quiz.png",
        points_value=10,
        category_id=test_reward_categories["achievements"].id,
        created_by="admin-uuid-2"
    )
    
    db.add_all([math_master, reading_certificate, first_quiz])
    db.commit()
    
    db.refresh(math_master)
    db.refresh(reading_certificate)
    db.refresh(first_quiz)
    
    return {
        "math_master": math_master,
        "reading_certificate": reading_certificate,
        "first_quiz": first_quiz
    }

@pytest.fixture(scope="function")
def test_user_rewards(db, test_rewards):
    # Create test user rewards
    user1_math = UserReward(
        user_id="student-uuid-1",
        reward_id=test_rewards["math_master"].id,
        earned_at=datetime.utcnow() - timedelta(days=7),
        is_displayed=True,
        reward_metadata={"earned_for": "Completamento percorso algebra avanzata"}
    )
    
    user1_first_quiz = UserReward(
        user_id="student-uuid-1",
        reward_id=test_rewards["first_quiz"].id,
        earned_at=datetime.utcnow() - timedelta(days=30),
        is_displayed=True
    )
    
    user2_reading = UserReward(
        user_id="student-uuid-2",
        reward_id=test_rewards["reading_certificate"].id,
        earned_at=datetime.utcnow() - timedelta(days=3),
        is_displayed=True,
        reward_metadata={"certified_level": "Advanced"}
    )
    
    db.add_all([user1_math, user1_first_quiz, user2_reading])
    db.commit()
    
    db.refresh(user1_math)
    db.refresh(user1_first_quiz)
    db.refresh(user2_reading)
    
    return {
        "user1_math": user1_math,
        "user1_first_quiz": user1_first_quiz,
        "user2_reading": user2_reading
    }

@pytest.fixture(scope="function")
def test_reward_progress(db, test_rewards):
    # Create test reward progress
    user1_reading = RewardProgress(
        user_id="student-uuid-1",
        reward_id=test_rewards["reading_certificate"].id,
        current_progress=12,
        target_progress=15,
        progress_metadata={"books_read": ["book1", "book2", "book3"]}
    )
    
    user2_math = RewardProgress(
        user_id="student-uuid-2",
        reward_id=test_rewards["math_master"].id,
        current_progress=2,
        target_progress=3,
        progress_metadata={"completed_paths": ["math_algebra", "math_geometry"]}
    )
    
    db.add_all([user1_reading, user2_math])
    db.commit()
    
    db.refresh(user1_reading)
    db.refresh(user2_math)
    
    return {
        "user1_reading": user1_reading,
        "user2_math": user2_math
    }
