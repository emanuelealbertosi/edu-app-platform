import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from app.db.base import Base, get_db
from app.main import app
from app.db.models.path import (
    PathCategory, PathTemplate, PathNodeTemplate, 
    Path, PathNode, PathNodeType, CompletionStatus
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
    
    # Override delle dipendenze di autenticazione
    from app.api.dependencies.auth import get_current_user, get_admin_user, get_parent_user
    
    # Mock dell'utente autenticato
    def mock_current_user():
        return {
            "id": "user-id-123",  # Cambia id in user_id per match con TokenData
            "user_id": "user-id-123",
            "email": "test@example.com",
            "role": "admin",  # Questo permette di avere tutti i permessi nei test
            "exp": 9999999999  # Token con scadenza molto lontana
        }
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = mock_current_user
    app.dependency_overrides[get_admin_user] = mock_current_user
    app.dependency_overrides[get_parent_user] = mock_current_user
    
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def test_categories(db):
    # Create test path categories
    math = PathCategory(name="Matematica", description="Percorsi di matematica")
    science = PathCategory(name="Scienze", description="Percorsi di scienze")
    language = PathCategory(name="Lingua", description="Percorsi di lingua italiana")
    
    db.add(math)
    db.add(science)
    db.add(language)
    db.commit()
    
    db.refresh(math)
    db.refresh(science)
    db.refresh(language)
    
    return {"math": math, "science": science, "language": language}

@pytest.fixture(scope="function")
def test_path_templates(db, test_categories):
    # Create test path templates
    math_template = PathTemplate(
        title="Percorso di Algebra",
        description="Un percorso per imparare l'algebra di base",
        instructions="Segui le lezioni e completa i quiz",
        difficulty_level=2,
        points=100,
        estimated_days=14,
        category_id=test_categories["math"].id,
        created_by="admin-uuid",
        created_by_role="admin"
    )
    
    language_template = PathTemplate(
        title="Percorso di Grammatica",
        description="Un percorso per imparare la grammatica italiana",
        instructions="Segui le lezioni e completa gli esercizi",
        difficulty_level=1,
        points=80,
        estimated_days=10,
        category_id=test_categories["language"].id,
        created_by="parent-uuid",
        created_by_role="parent"
    )
    
    db.add(math_template)
    db.add(language_template)
    db.commit()
    
    db.refresh(math_template)
    db.refresh(language_template)
    
    return {"math": math_template, "language": language_template}

@pytest.fixture(scope="function")
def test_path_node_templates(db, test_path_templates):
    # Create test node templates for math path
    math_node1 = PathNodeTemplate(
        title="Introduzione all'Algebra",
        description="Lezione introduttiva sui concetti base dell'algebra",
        node_type=PathNodeType.CONTENT,
        points=10,
        order=1,
        path_template_id=test_path_templates["math"].id,
        content={
            "content": "Questa è un'introduzione all'algebra...",
            "content_type": "text"
        },
        estimated_time=30
    )
    
    math_node2 = PathNodeTemplate(
        title="Quiz sulle Equazioni",
        description="Quiz per testare la comprensione delle equazioni di primo grado",
        node_type=PathNodeType.QUIZ,
        points=20,
        order=2,
        path_template_id=test_path_templates["math"].id,
        content={
            "quiz_template_id": "quiz-template-uuid-1"
        },
        estimated_time=45,
        dependencies={"dependencies": ["#node1"]}
    )
    
    math_node3 = PathNodeTemplate(
        title="Badge Algebra Base",
        description="Ottieni un badge per aver completato la sezione di base",
        node_type=PathNodeType.REWARD,
        points=5,
        order=3,
        path_template_id=test_path_templates["math"].id,
        content={
            "reward_id": "reward-uuid-1",
            "reward_type": "badge"
        },
        estimated_time=5,
        dependencies={"dependencies": ["#node2", "required"]}
    )
    
    # Create test node templates for language path
    lang_node1 = PathNodeTemplate(
        title="I Sostantivi",
        description="Lezione sui sostantivi in italiano",
        node_type=PathNodeType.CONTENT,
        points=8,
        order=1,
        path_template_id=test_path_templates["language"].id,
        content={
            "content": "I sostantivi sono...",
            "content_type": "text"
        },
        estimated_time=25
    )
    
    lang_node2 = PathNodeTemplate(
        title="Esercizio sui Verbi",
        description="Esercizio pratico sulla coniugazione dei verbi",
        node_type=PathNodeType.TASK,
        points=15,
        order=2,
        path_template_id=test_path_templates["language"].id,
        content={
            "task_description": "Coniuga i seguenti verbi al presente indicativo...",
            "verification_type": "manual"
        },
        estimated_time=40,
        dependencies={"dependencies": ["#node1"]}
    )
    
    db.add_all([math_node1, math_node2, math_node3, lang_node1, lang_node2])
    db.commit()
    
    db.refresh(math_node1)
    db.refresh(math_node2)
    db.refresh(math_node3)
    db.refresh(lang_node1)
    db.refresh(lang_node2)
    
    return {
        "math_node1": math_node1,
        "math_node2": math_node2,
        "math_node3": math_node3,
        "lang_node1": lang_node1,
        "lang_node2": lang_node2
    }

@pytest.fixture(scope="function")
def test_paths(db, test_path_templates):
    # Create concrete paths assigned to students
    math_path = Path(
        template_id=test_path_templates["math"].id,
        student_id="student-uuid-1",
        assigned_by="parent-uuid-1",
        status=CompletionStatus.IN_PROGRESS,
        started_at=datetime.now() - timedelta(days=3),
        deadline=datetime.now() + timedelta(days=11),
        current_score=10,
        max_score=100,
        completion_percentage=10.0
    )
    
    language_path = Path(
        template_id=test_path_templates["language"].id,
        student_id="student-uuid-2",
        assigned_by="parent-uuid-2",
        status=CompletionStatus.NOT_STARTED,
        deadline=datetime.now() + timedelta(days=10)
    )
    
    db.add(math_path)
    db.add(language_path)
    db.commit()
    
    db.refresh(math_path)
    db.refresh(language_path)
    
    return {"math": math_path, "language": language_path}

@pytest.fixture(scope="function")
def test_path_nodes(db, test_paths, test_path_node_templates):
    # Create concrete nodes for math path
    math_node1 = PathNode(
        title=test_path_node_templates["math_node1"].title,
        description=test_path_node_templates["math_node1"].description,
        node_type=test_path_node_templates["math_node1"].node_type,
        points=test_path_node_templates["math_node1"].points,
        order=test_path_node_templates["math_node1"].order,
        content=test_path_node_templates["math_node1"].content,
        estimated_time=test_path_node_templates["math_node1"].estimated_time,
        path_id=test_paths["math"].id,
        template_id=test_path_node_templates["math_node1"].id,
        status=CompletionStatus.COMPLETED,
        started_at=datetime.now() - timedelta(days=3),
        completed_at=datetime.now() - timedelta(days=2),
        score=10
    )
    
    math_node2 = PathNode(
        title=test_path_node_templates["math_node2"].title,
        description=test_path_node_templates["math_node2"].description,
        node_type=test_path_node_templates["math_node2"].node_type,
        points=test_path_node_templates["math_node2"].points,
        order=test_path_node_templates["math_node2"].order,
        content=test_path_node_templates["math_node2"].content,
        estimated_time=test_path_node_templates["math_node2"].estimated_time,
        path_id=test_paths["math"].id,
        template_id=test_path_node_templates["math_node2"].id,
        status=CompletionStatus.IN_PROGRESS,
        started_at=datetime.now() - timedelta(days=1),
        dependencies={"dependencies": [math_node1.uuid]}
    )
    
    math_node3 = PathNode(
        title=test_path_node_templates["math_node3"].title,
        description=test_path_node_templates["math_node3"].description,
        node_type=test_path_node_templates["math_node3"].node_type,
        points=test_path_node_templates["math_node3"].points,
        order=test_path_node_templates["math_node3"].order,
        content=test_path_node_templates["math_node3"].content,
        estimated_time=test_path_node_templates["math_node3"].estimated_time,
        path_id=test_paths["math"].id,
        template_id=test_path_node_templates["math_node3"].id,
        status=CompletionStatus.NOT_STARTED,
        dependencies={"dependencies": [math_node2.uuid]}
    )
    
    # Create concrete nodes for language path
    lang_node1 = PathNode(
        title=test_path_node_templates["lang_node1"].title,
        description=test_path_node_templates["lang_node1"].description,
        node_type=test_path_node_templates["lang_node1"].node_type,
        points=test_path_node_templates["lang_node1"].points,
        order=test_path_node_templates["lang_node1"].order,
        content=test_path_node_templates["lang_node1"].content,
        estimated_time=test_path_node_templates["lang_node1"].estimated_time,
        path_id=test_paths["language"].id,
        template_id=test_path_node_templates["lang_node1"].id,
        status=CompletionStatus.NOT_STARTED
    )
    
    db.add_all([math_node1, math_node2, math_node3, lang_node1])
    db.commit()
    
    db.refresh(math_node1)
    db.refresh(math_node2)
    db.refresh(math_node3)
    db.refresh(lang_node1)
    
    return {
        "math_node1": math_node1,
        "math_node2": math_node2, 
        "math_node3": math_node3,
        "lang_node1": lang_node1
    }
