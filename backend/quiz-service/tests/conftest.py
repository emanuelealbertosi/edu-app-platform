import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient
from datetime import datetime

from app.db.base import Base, get_db
from app.main import app
from app.db.models.quiz import (
    QuizCategory, QuizTemplate, QuestionTemplate, AnswerOptionTemplate,
    Quiz, Question, AnswerOption, QuizAttempt, StudentAnswer, QuestionType
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
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def test_categories(db):
    # Create test quiz categories
    math = QuizCategory(name="Matematica", description="Quiz di matematica")
    science = QuizCategory(name="Scienze", description="Quiz di scienze")
    history = QuizCategory(name="Storia", description="Quiz di storia")
    
    db.add(math)
    db.add(science)
    db.add(history)
    db.commit()
    
    db.refresh(math)
    db.refresh(science)
    db.refresh(history)
    
    return {"math": math, "science": science, "history": history}

@pytest.fixture(scope="function")
def test_quiz_templates(db, test_categories):
    # Create test quiz templates
    math_template = QuizTemplate(
        title="Quiz di algebra",
        description="Quiz sulle operazioni algebriche di base",
        instructions="Risolvi i seguenti problemi di algebra",
        difficulty_level=2,
        points=20,
        time_limit=600,  # 10 minuti
        passing_score=70.0,
        category_id=test_categories["math"].id,
        created_by="admin-uuid"
    )
    
    science_template = QuizTemplate(
        title="Quiz sul sistema solare",
        description="Quiz sui pianeti e corpi celesti",
        instructions="Rispondi alle domande sul sistema solare",
        difficulty_level=1,
        points=15,
        time_limit=480,  # 8 minuti
        passing_score=60.0,
        category_id=test_categories["science"].id,
        created_by="admin-uuid"
    )
    
    db.add(math_template)
    db.add(science_template)
    db.commit()
    
    db.refresh(math_template)
    db.refresh(science_template)
    
    return {"math": math_template, "science": science_template}

@pytest.fixture(scope="function")
def test_question_templates(db, test_quiz_templates):
    # Create test question templates for math quiz
    math_q1 = QuestionTemplate(
        text="Quanto fa 2 + 2?",
        question_type=QuestionType.SINGLE_CHOICE,
        points=5,
        order=1,
        quiz_template_id=test_quiz_templates["math"].id
    )
    
    math_q2 = QuestionTemplate(
        text="Quali sono numeri primi?",
        question_type=QuestionType.MULTIPLE_CHOICE,
        points=10,
        order=2,
        quiz_template_id=test_quiz_templates["math"].id
    )
    
    math_q3 = QuestionTemplate(
        text="L'equazione x² = 4 ha due soluzioni.",
        question_type=QuestionType.TRUE_FALSE,
        points=5,
        order=3,
        quiz_template_id=test_quiz_templates["math"].id
    )
    
    # Create test question templates for science quiz
    science_q1 = QuestionTemplate(
        text="Qual è il pianeta più vicino al Sole?",
        question_type=QuestionType.SINGLE_CHOICE,
        points=5,
        order=1,
        quiz_template_id=test_quiz_templates["science"].id
    )
    
    science_q2 = QuestionTemplate(
        text="Quali sono pianeti del sistema solare?",
        question_type=QuestionType.MULTIPLE_CHOICE,
        points=10,
        order=2,
        quiz_template_id=test_quiz_templates["science"].id
    )
    
    db.add(math_q1)
    db.add(math_q2)
    db.add(math_q3)
    db.add(science_q1)
    db.add(science_q2)
    db.commit()
    
    db.refresh(math_q1)
    db.refresh(math_q2)
    db.refresh(math_q3)
    db.refresh(science_q1)
    db.refresh(science_q2)
    
    return {
        "math_q1": math_q1,
        "math_q2": math_q2,
        "math_q3": math_q3,
        "science_q1": science_q1,
        "science_q2": science_q2
    }

@pytest.fixture(scope="function")
def test_answer_option_templates(db, test_question_templates):
    # Math Q1 answer options (single choice)
    math_q1_a1 = AnswerOptionTemplate(
        text="3",
        is_correct=False,
        order=1,
        question_template_id=test_question_templates["math_q1"].id
    )
    
    math_q1_a2 = AnswerOptionTemplate(
        text="4",
        is_correct=True,
        order=2,
        question_template_id=test_question_templates["math_q1"].id
    )
    
    math_q1_a3 = AnswerOptionTemplate(
        text="5",
        is_correct=False,
        order=3,
        question_template_id=test_question_templates["math_q1"].id
    )
    
    # Math Q2 answer options (multiple choice)
    math_q2_a1 = AnswerOptionTemplate(
        text="2",
        is_correct=True,
        order=1,
        question_template_id=test_question_templates["math_q2"].id
    )
    
    math_q2_a2 = AnswerOptionTemplate(
        text="4",
        is_correct=False,
        order=2,
        question_template_id=test_question_templates["math_q2"].id
    )
    
    math_q2_a3 = AnswerOptionTemplate(
        text="7",
        is_correct=True,
        order=3,
        question_template_id=test_question_templates["math_q2"].id
    )
    
    math_q2_a4 = AnswerOptionTemplate(
        text="9",
        is_correct=False,
        order=4,
        question_template_id=test_question_templates["math_q2"].id
    )
    
    # Math Q3 answer options (true/false)
    math_q3_a1 = AnswerOptionTemplate(
        text="Vero",
        is_correct=True,
        order=1,
        question_template_id=test_question_templates["math_q3"].id
    )
    
    math_q3_a2 = AnswerOptionTemplate(
        text="Falso",
        is_correct=False,
        order=2,
        question_template_id=test_question_templates["math_q3"].id
    )
    
    # Science Q1 answer options (single choice)
    science_q1_a1 = AnswerOptionTemplate(
        text="Venere",
        is_correct=False,
        order=1,
        question_template_id=test_question_templates["science_q1"].id
    )
    
    science_q1_a2 = AnswerOptionTemplate(
        text="Mercurio",
        is_correct=True,
        order=2,
        question_template_id=test_question_templates["science_q1"].id
    )
    
    science_q1_a3 = AnswerOptionTemplate(
        text="Terra",
        is_correct=False,
        order=3,
        question_template_id=test_question_templates["science_q1"].id
    )
    
    # Science Q2 answer options (multiple choice)
    science_q2_a1 = AnswerOptionTemplate(
        text="Terra",
        is_correct=True,
        order=1,
        question_template_id=test_question_templates["science_q2"].id
    )
    
    science_q2_a2 = AnswerOptionTemplate(
        text="Luna",
        is_correct=False,
        order=2,
        question_template_id=test_question_templates["science_q2"].id
    )
    
    science_q2_a3 = AnswerOptionTemplate(
        text="Saturno",
        is_correct=True,
        order=3,
        question_template_id=test_question_templates["science_q2"].id
    )
    
    science_q2_a4 = AnswerOptionTemplate(
        text="Sole",
        is_correct=False,
        order=4,
        question_template_id=test_question_templates["science_q2"].id
    )
    
    db.add_all([
        math_q1_a1, math_q1_a2, math_q1_a3,
        math_q2_a1, math_q2_a2, math_q2_a3, math_q2_a4,
        math_q3_a1, math_q3_a2,
        science_q1_a1, science_q1_a2, science_q1_a3,
        science_q2_a1, science_q2_a2, science_q2_a3, science_q2_a4
    ])
    db.commit()
    
    return {
        "math_q1": [math_q1_a1, math_q1_a2, math_q1_a3],
        "math_q2": [math_q2_a1, math_q2_a2, math_q2_a3, math_q2_a4],
        "math_q3": [math_q3_a1, math_q3_a2],
        "science_q1": [science_q1_a1, science_q1_a2, science_q1_a3],
        "science_q2": [science_q2_a1, science_q2_a2, science_q2_a3, science_q2_a4],
    }

@pytest.fixture(scope="function")
def test_quizzes(db, test_quiz_templates):
    # Create concrete quizzes assigned to students
    math_quiz = Quiz(
        template_id=test_quiz_templates["math"].id,
        student_id="student-uuid-1",
        assigned_at=datetime.now(),
        is_completed=False
    )
    
    science_quiz = Quiz(
        template_id=test_quiz_templates["science"].id,
        student_id="student-uuid-2",
        assigned_at=datetime.now(),
        is_completed=True
    )
    
    db.add(math_quiz)
    db.add(science_quiz)
    db.commit()
    
    db.refresh(math_quiz)
    db.refresh(science_quiz)
    
    return {"math": math_quiz, "science": science_quiz}

@pytest.fixture(scope="function")
def test_questions(db, test_quizzes, test_question_templates):
    # Create concrete questions for math quiz
    math_q1 = Question(
        text=test_question_templates["math_q1"].text,
        question_type=test_question_templates["math_q1"].question_type,
        points=test_question_templates["math_q1"].points,
        order=test_question_templates["math_q1"].order,
        quiz_id=test_quizzes["math"].id,
        template_id=test_question_templates["math_q1"].id
    )
    
    math_q2 = Question(
        text=test_question_templates["math_q2"].text,
        question_type=test_question_templates["math_q2"].question_type,
        points=test_question_templates["math_q2"].points,
        order=test_question_templates["math_q2"].order,
        quiz_id=test_quizzes["math"].id,
        template_id=test_question_templates["math_q2"].id
    )
    
    # Create concrete questions for science quiz
    science_q1 = Question(
        text=test_question_templates["science_q1"].text,
        question_type=test_question_templates["science_q1"].question_type,
        points=test_question_templates["science_q1"].points,
        order=test_question_templates["science_q1"].order,
        quiz_id=test_quizzes["science"].id,
        template_id=test_question_templates["science_q1"].id
    )
    
    db.add(math_q1)
    db.add(math_q2)
    db.add(science_q1)
    db.commit()
    
    db.refresh(math_q1)
    db.refresh(math_q2)
    db.refresh(science_q1)
    
    return {
        "math_q1": math_q1,
        "math_q2": math_q2,
        "science_q1": science_q1,
    }

@pytest.fixture(scope="function")
def test_quiz_attempts(db, test_quizzes):
    # Create quiz attempts
    math_attempt = QuizAttempt(
        quiz_id=test_quizzes["math"].id,
        started_at=datetime.now(),
        completed_at=None,
        score=0,
        max_score=20,
        passed=False
    )
    
    science_attempt = QuizAttempt(
        quiz_id=test_quizzes["science"].id,
        started_at=datetime.now(),
        completed_at=datetime.now(),
        score=12,
        max_score=15,
        passed=True
    )
    
    db.add(math_attempt)
    db.add(science_attempt)
    db.commit()
    
    db.refresh(math_attempt)
    db.refresh(science_attempt)
    
    return {"math": math_attempt, "science": science_attempt}
