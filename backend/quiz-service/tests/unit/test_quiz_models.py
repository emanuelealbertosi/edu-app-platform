import pytest
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.db.models.quiz import (
    QuizCategory, QuizTemplate, QuestionTemplate, AnswerOptionTemplate,
    Quiz, Question, AnswerOption, QuizAttempt, StudentAnswer, QuestionType
)


def test_quiz_category_model(db, test_categories):
    """Test the QuizCategory model and its properties."""
    math_category = test_categories["math"]
    
    # Check if category was created correctly
    assert math_category.name == "Matematica"
    assert math_category.description == "Quiz di matematica"
    
    # Test string representation
    assert str(math_category) == "<QuizCategory Matematica>"
    
    # Test unique constraint on category name
    duplicate_category = QuizCategory(name="Matematica", description="Duplicato")
    db.add(duplicate_category)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_quiz_template_model(db, test_quiz_templates, test_categories):
    """Test the QuizTemplate model and its properties."""
    math_template = test_quiz_templates["math"]
    
    # Check if template was created correctly
    assert math_template.title == "Quiz di algebra"
    assert math_template.description == "Quiz sulle operazioni algebriche di base"
    assert math_template.difficulty_level == 2
    assert math_template.points == 20
    assert math_template.time_limit == 600
    assert math_template.passing_score == 70.0
    assert math_template.is_active is True
    assert math_template.created_by == "admin-uuid"
    
    # Check UUID generation
    assert math_template.uuid is not None
    
    # Test relationship with category
    assert math_template.category_id == test_categories["math"].id
    assert math_template.category.name == "Matematica"
    
    # Test string representation
    assert str(math_template) == "<QuizTemplate Quiz di algebra>"


def test_question_template_model(db, test_question_templates, test_quiz_templates):
    """Test the QuestionTemplate model and its properties."""
    math_q1 = test_question_templates["math_q1"]
    
    # Check if question template was created correctly
    assert math_q1.text == "Quanto fa 2 + 2?"
    assert math_q1.question_type == QuestionType.SINGLE_CHOICE
    assert math_q1.points == 5
    assert math_q1.order == 1
    
    # Check UUID generation
    assert math_q1.uuid is not None
    
    # Test relationship with quiz template
    assert math_q1.quiz_template_id == test_quiz_templates["math"].id
    assert math_q1.quiz_template.title == "Quiz di algebra"
    
    # Test string representation
    assert str(math_q1).startswith("<QuestionTemplate Quanto fa 2 + 2?")


def test_answer_option_template_model(db, test_answer_option_templates, test_question_templates):
    """Test the AnswerOptionTemplate model and its properties."""
    # Get the correct answer option for math question 1
    correct_option = next(opt for opt in test_answer_option_templates["math_q1"] if opt.is_correct)
    
    # Check if answer option was created correctly
    assert correct_option.text == "4"
    assert correct_option.is_correct is True
    assert correct_option.order == 2
    
    # Check UUID generation
    assert correct_option.uuid is not None
    
    # Test relationship with question template
    assert correct_option.question_template_id == test_question_templates["math_q1"].id
    assert correct_option.question_template.text == "Quanto fa 2 + 2?"
    
    # Test string representation
    assert str(correct_option).startswith("<AnswerOptionTemplate 4")


def test_quiz_model(db, test_quizzes, test_quiz_templates):
    """Test the Quiz model and its properties."""
    math_quiz = test_quizzes["math"]
    
    # Check if quiz was created correctly
    assert math_quiz.student_id == "student-uuid-1"
    assert math_quiz.is_completed is False
    assert math_quiz.assigned_at is not None
    
    # Check UUID generation
    assert math_quiz.uuid is not None
    
    # Test relationship with template
    assert math_quiz.template_id == test_quiz_templates["math"].id
    assert math_quiz.template.title == "Quiz di algebra"
    
    # Test string representation
    assert str(math_quiz).startswith(f"<Quiz {math_quiz.id}")


def test_question_model(db, test_questions, test_quizzes, test_question_templates):
    """Test the Question model and its properties."""
    math_q1 = test_questions["math_q1"]
    
    # Check if question was created correctly
    assert math_q1.text == "Quanto fa 2 + 2?"
    assert math_q1.question_type == QuestionType.SINGLE_CHOICE
    assert math_q1.points == 5
    assert math_q1.order == 1
    
    # Check UUID generation
    assert math_q1.uuid is not None
    
    # Test relationship with quiz
    assert math_q1.quiz_id == test_quizzes["math"].id
    assert math_q1.quiz.student_id == "student-uuid-1"
    
    # Test relationship with template
    assert math_q1.template_id == test_question_templates["math_q1"].id
    assert math_q1.template.question_type == QuestionType.SINGLE_CHOICE
    
    # Test string representation
    assert str(math_q1).startswith("<Question Quanto fa 2 + 2?")


def test_quiz_attempt_model(db, test_quiz_attempts, test_quizzes):
    """Test the QuizAttempt model and its properties."""
    math_attempt = test_quiz_attempts["math"]
    science_attempt = test_quiz_attempts["science"]
    
    # Check if attempts were created correctly
    assert math_attempt.quiz_id == test_quizzes["math"].id
    assert math_attempt.started_at is not None
    assert math_attempt.completed_at is None
    assert math_attempt.score == 0
    assert math_attempt.max_score == 20
    assert math_attempt.passed is False
    
    assert science_attempt.quiz_id == test_quizzes["science"].id
    assert science_attempt.started_at is not None
    assert science_attempt.completed_at is not None
    assert science_attempt.score == 12
    assert science_attempt.max_score == 15
    assert science_attempt.passed is True
    
    # Check UUID generation
    assert math_attempt.uuid is not None
    assert science_attempt.uuid is not None
    
    # Test relationship with quiz
    assert math_attempt.quiz.student_id == "student-uuid-1"
    assert science_attempt.quiz.student_id == "student-uuid-2"
    
    # Test string representation
    assert str(math_attempt).startswith(f"<QuizAttempt {math_attempt.id}")
    assert str(science_attempt).startswith(f"<QuizAttempt {science_attempt.id}")


def test_student_answer_model(db, test_quiz_attempts, test_questions):
    """Test the StudentAnswer model and its properties."""
    # Create a student answer
    student_answer = StudentAnswer(
        attempt_id=test_quiz_attempts["math"].id,
        question_id=test_questions["math_q1"].id,
        answer_data={"selected_option_id": 2},
        is_correct=True,
        score=5.0
    )
    
    db.add(student_answer)
    db.commit()
    db.refresh(student_answer)
    
    # Check if student answer was created correctly
    assert student_answer.attempt_id == test_quiz_attempts["math"].id
    assert student_answer.question_id == test_questions["math_q1"].id
    assert student_answer.answer_data == {"selected_option_id": 2}
    assert student_answer.is_correct is True
    assert student_answer.score == 5.0
    assert student_answer.answered_at is not None
    
    # Check UUID generation
    assert student_answer.uuid is not None
    
    # Test relationships
    assert student_answer.attempt.quiz_id == test_quiz_attempts["math"].quiz_id
    assert student_answer.question.text == "Quanto fa 2 + 2?"
    
    # Test string representation
    assert str(student_answer).startswith(f"<StudentAnswer {student_answer.id}")


def test_cascade_delete_quiz_template(db, test_quiz_templates, test_question_templates):
    """Test that deleting a QuizTemplate deletes its QuestionTemplates."""
    # Get counts before deletion
    question_count_before = db.query(QuestionTemplate).count()
    template_id = test_quiz_templates["math"].id
    
    # Delete quiz template
    db.delete(test_quiz_templates["math"])
    db.commit()
    
    # Check if question templates were deleted
    question_count_after = db.query(QuestionTemplate).count()
    assert question_count_after < question_count_before
    
    # Check specifically that the math questions are gone
    math_questions = db.query(QuestionTemplate).filter_by(quiz_template_id=template_id).all()
    assert len(math_questions) == 0


def test_cascade_delete_question_template(db, test_question_templates, test_answer_option_templates):
    """Test that deleting a QuestionTemplate deletes its AnswerOptionTemplates."""
    # Get counts before deletion
    answer_option_count_before = db.query(AnswerOptionTemplate).count()
    question_id = test_question_templates["math_q1"].id
    
    # Delete question template
    db.delete(test_question_templates["math_q1"])
    db.commit()
    
    # Check if answer option templates were deleted
    answer_option_count_after = db.query(AnswerOptionTemplate).count()
    assert answer_option_count_after < answer_option_count_before
    
    # Check specifically that the math_q1 options are gone
    math_q1_options = db.query(AnswerOptionTemplate).filter_by(question_template_id=question_id).all()
    assert len(math_q1_options) == 0


def test_cascade_delete_quiz(db, test_quizzes, test_questions, test_quiz_attempts):
    """Test that deleting a Quiz deletes its Questions and QuizAttempt."""
    # Get counts before deletion
    question_count_before = db.query(Question).count()
    attempt_count_before = db.query(QuizAttempt).count()
    quiz_id = test_quizzes["math"].id
    
    # Delete quiz
    db.delete(test_quizzes["math"])
    db.commit()
    
    # Check if questions were deleted
    question_count_after = db.query(Question).count()
    assert question_count_after < question_count_before
    
    # Check if attempt was deleted
    attempt_count_after = db.query(QuizAttempt).count()
    assert attempt_count_after < attempt_count_before
    
    # Check specifically that the math questions and attempt are gone
    math_questions = db.query(Question).filter_by(quiz_id=quiz_id).all()
    assert len(math_questions) == 0
    
    math_attempt = db.query(QuizAttempt).filter_by(quiz_id=quiz_id).first()
    assert math_attempt is None
