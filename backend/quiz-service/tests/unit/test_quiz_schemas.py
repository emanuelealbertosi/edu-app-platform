import pytest
from pydantic import ValidationError
from datetime import datetime

from app.schemas.quiz import (
    QuizCategoryCreate, QuizCategoryUpdate, QuizCategory,
    QuizTemplateCreate, QuizTemplateUpdate, QuizTemplate, QuizTemplateSummary,
    QuestionTemplateCreate, QuestionTemplate, QuestionType,
    AnswerOptionTemplateCreate, AnswerOptionTemplate,
    QuizCreate, QuizUpdate, Quiz, QuizSummary,
    QuestionCreate, Question, 
    AnswerOptionCreate, AnswerOption,
    StudentAnswerCreate, StudentAnswer,
    QuizAttemptCreate, QuizAttemptUpdate, QuizAttempt,
    SubmitQuizAnswers
)


class TestQuizCategorySchemas:
    def test_quiz_category_create(self):
        # Test valid category creation
        category = QuizCategoryCreate(name="Matematica", description="Quiz di matematica")
        assert category.name == "Matematica"
        assert category.description == "Quiz di matematica"
        
        # Test category creation without description
        category = QuizCategoryCreate(name="Matematica")
        assert category.name == "Matematica"
        assert category.description is None
        
        # Test empty name validation
        with pytest.raises(ValidationError):
            QuizCategoryCreate(name="", description="Quiz di matematica")
    
    def test_quiz_category_update(self):
        # Test partial update
        category_update = QuizCategoryUpdate(name="Matematica Avanzata")
        assert category_update.name == "Matematica Avanzata"
        assert category_update.description is None
        
        # Test complete update
        category_update = QuizCategoryUpdate(
            name="Matematica Avanzata", 
            description="Quiz avanzati di matematica"
        )
        assert category_update.name == "Matematica Avanzata"
        assert category_update.description == "Quiz avanzati di matematica"
        
        # Test empty update (valid for PATCH)
        category_update = QuizCategoryUpdate()
        assert category_update.name is None
        assert category_update.description is None
    
    def test_quiz_category_response(self, test_categories):
        # Test conversion from ORM model
        math_category = test_categories["math"]
        category_response = QuizCategory.from_orm(math_category)
        
        assert category_response.id == math_category.id
        assert category_response.name == "Matematica"
        assert category_response.description == "Quiz di matematica"


class TestQuizTemplateSchemas:
    def test_quiz_template_create(self):
        # Test valid template creation with minimum fields
        template = QuizTemplateCreate(
            title="Quiz di algebra",
            created_by="admin-uuid"
        )
        assert template.title == "Quiz di algebra"
        assert template.created_by == "admin-uuid"
        assert template.difficulty_level == 1  # Default value
        assert template.questions == []
        
        # Test valid template creation with all fields
        template = QuizTemplateCreate(
            title="Quiz di algebra",
            description="Quiz sulle operazioni algebriche di base",
            instructions="Risolvi i seguenti problemi di algebra",
            difficulty_level=2,
            points=20,
            time_limit=600,
            passing_score=70.0,
            is_active=True,
            category_id=1,
            created_by="admin-uuid",
            questions=[]
        )
        assert template.title == "Quiz di algebra"
        assert template.description == "Quiz sulle operazioni algebriche di base"
        assert template.difficulty_level == 2
        assert template.time_limit == 600
        
        # Test difficulty level validation
        with pytest.raises(ValidationError):
            QuizTemplateCreate(
                title="Quiz invalido",
                difficulty_level=6,  # Should be between 1 and 5
                created_by="admin-uuid"
            )
        
        # Test passing score validation
        with pytest.raises(ValidationError):
            QuizTemplateCreate(
                title="Quiz invalido",
                passing_score=101.0,  # Should be between 0 and 100
                created_by="admin-uuid"
            )
    
    def test_quiz_template_update(self):
        # Test partial update
        template_update = QuizTemplateUpdate(title="Quiz di algebra aggiornato")
        assert template_update.title == "Quiz di algebra aggiornato"
        assert template_update.description is None
        assert template_update.difficulty_level is None
        
        # Test complete update
        template_update = QuizTemplateUpdate(
            title="Quiz di algebra aggiornato",
            description="Descrizione aggiornata",
            instructions="Istruzioni aggiornate",
            difficulty_level=3,
            points=25,
            time_limit=720,
            passing_score=75.0,
            is_active=False,
            category_id=2,
            created_by="new-admin-uuid"
        )
        assert template_update.title == "Quiz di algebra aggiornato"
        assert template_update.difficulty_level == 3
        assert template_update.is_active is False
        
        # Test empty update (valid for PATCH)
        template_update = QuizTemplateUpdate()
        assert template_update.title is None
        assert template_update.description is None
    
    def test_quiz_template_response(self, test_quiz_templates):
        # Test conversion from ORM model
        math_template = test_quiz_templates["math"]
        template_response = QuizTemplate.from_orm(math_template)
        
        assert template_response.id == math_template.id
        assert template_response.uuid == math_template.uuid
        assert template_response.title == "Quiz di algebra"
        assert template_response.difficulty_level == 2
        assert template_response.points == 20
        assert template_response.created_by == "admin-uuid"
        
        # Test QuizTemplateSummary
        template_summary = QuizTemplateSummary.from_orm(math_template)
        template_summary.question_count = 3  # This would be set by the API
        
        assert template_summary.id == math_template.id
        assert template_summary.title == "Quiz di algebra"
        assert template_summary.question_count == 3


class TestQuestionTemplateSchemas:
    def test_question_template_create(self):
        # Test valid question template creation (single choice)
        question = QuestionTemplateCreate(
            text="Quanto fa 2 + 2?",
            question_type=QuestionType.SINGLE_CHOICE,
            points=5,
            order=1,
            answer_options=[
                AnswerOptionTemplateCreate(text="3", is_correct=False, order=1),
                AnswerOptionTemplateCreate(text="4", is_correct=True, order=2),
                AnswerOptionTemplateCreate(text="5", is_correct=False, order=3)
            ]
        )
        assert question.text == "Quanto fa 2 + 2?"
        assert question.question_type == QuestionType.SINGLE_CHOICE
        assert question.points == 5
        assert len(question.answer_options) == 3
        
        # Test validation for single choice (must have exactly one correct answer)
        with pytest.raises(ValidationError):
            QuestionTemplateCreate(
                text="Quanto fa 2 + 2?",
                question_type=QuestionType.SINGLE_CHOICE,
                answer_options=[
                    AnswerOptionTemplateCreate(text="3", is_correct=False, order=1),
                    AnswerOptionTemplateCreate(text="4", is_correct=True, order=2),
                    AnswerOptionTemplateCreate(text="5", is_correct=True, order=3)  # Two correct answers
                ]
            )
        
        # Test validation for true/false (must have exactly two options)
        with pytest.raises(ValidationError):
            QuestionTemplateCreate(
                text="L'equazione x² = 4 ha due soluzioni.",
                question_type=QuestionType.TRUE_FALSE,
                answer_options=[
                    AnswerOptionTemplateCreate(text="Vero", is_correct=True, order=1),
                    AnswerOptionTemplateCreate(text="Falso", is_correct=False, order=2),
                    AnswerOptionTemplateCreate(text="Non so", is_correct=False, order=3)  # Third option not allowed
                ]
            )
        
        # Test validation for multiple choice (must have at least one correct answer)
        with pytest.raises(ValidationError):
            QuestionTemplateCreate(
                text="Quali sono numeri primi?",
                question_type=QuestionType.MULTIPLE_CHOICE,
                answer_options=[
                    AnswerOptionTemplateCreate(text="2", is_correct=False, order=1),  # Should be correct
                    AnswerOptionTemplateCreate(text="4", is_correct=False, order=2),
                    AnswerOptionTemplateCreate(text="7", is_correct=False, order=3)   # Should be correct
                ]
            )
    
    def test_question_template_response(self, test_question_templates, test_answer_option_templates):
        # Test conversion from ORM model
        math_q1 = test_question_templates["math_q1"]
        question_response = QuestionTemplate.from_orm(math_q1)
        
        assert question_response.id == math_q1.id
        assert question_response.uuid == math_q1.uuid
        assert question_response.text == "Quanto fa 2 + 2?"
        assert question_response.question_type == QuestionType.SINGLE_CHOICE
        assert question_response.points == 5
        assert question_response.quiz_template_id == math_q1.quiz_template_id


class TestAnswerOptionTemplateSchemas:
    def test_answer_option_template_create(self):
        # Test valid answer option creation
        option = AnswerOptionTemplateCreate(
            text="4",
            is_correct=True,
            order=2,
            additional_data={"feedback": "Corretto!"}
        )
        assert option.text == "4"
        assert option.is_correct is True
        assert option.order == 2
        assert option.additional_data == {"feedback": "Corretto!"}
        
        # Test default values
        option = AnswerOptionTemplateCreate(text="4")
        assert option.is_correct is False
        assert option.order == 0
        assert option.additional_data is None
    
    def test_answer_option_template_response(self, test_answer_option_templates):
        # Find the correct answer option for math question 1
        correct_option = next(opt for opt in test_answer_option_templates["math_q1"] if opt.is_correct)
        
        option_response = AnswerOptionTemplate.from_orm(correct_option)
        
        assert option_response.id == correct_option.id
        assert option_response.uuid == correct_option.uuid
        assert option_response.text == "4"
        assert option_response.is_correct is True
        assert option_response.question_template_id == correct_option.question_template_id


class TestQuizSchemas:
    def test_quiz_create(self):
        # Test valid quiz creation
        quiz = QuizCreate(
            template_id=1,
            student_id="student-uuid-1",
            path_id="path-uuid-1"
        )
        assert quiz.template_id == 1
        assert quiz.student_id == "student-uuid-1"
        assert quiz.path_id == "path-uuid-1"
        
        # Test quiz creation without path_id
        quiz = QuizCreate(
            template_id=1,
            student_id="student-uuid-1"
        )
        assert quiz.template_id == 1
        assert quiz.student_id == "student-uuid-1"
        assert quiz.path_id is None
    
    def test_quiz_update(self):
        # Test partial update
        quiz_update = QuizUpdate(is_completed=True)
        assert quiz_update.is_completed is True
        assert quiz_update.student_id is None
        assert quiz_update.path_id is None
        
        # Test complete update
        quiz_update = QuizUpdate(
            student_id="new-student-uuid",
            path_id="new-path-uuid",
            is_completed=True
        )
        assert quiz_update.student_id == "new-student-uuid"
        assert quiz_update.path_id == "new-path-uuid"
        assert quiz_update.is_completed is True
    
    def test_quiz_response(self, test_quizzes):
        # Test conversion from ORM model
        math_quiz = test_quizzes["math"]
        quiz_response = Quiz.from_orm(math_quiz)
        
        assert quiz_response.id == math_quiz.id
        assert quiz_response.uuid == math_quiz.uuid
        assert quiz_response.template_id == math_quiz.template_id
        assert quiz_response.student_id == "student-uuid-1"
        assert quiz_response.is_completed is False
        
        # Test QuizSummary
        quiz_summary = QuizSummary(
            template_title="Quiz di algebra",
            question_count=2
        )
        assert quiz_summary.template_title == "Quiz di algebra"
        assert quiz_summary.question_count == 2


class TestQuizAttemptSchemas:
    def test_quiz_attempt_create(self):
        # Test valid attempt creation
        attempt = QuizAttemptCreate(quiz_id=1)
        assert attempt.quiz_id == 1
    
    def test_quiz_attempt_update(self):
        # Test partial update
        attempt_update = QuizAttemptUpdate(score=15.0)
        assert attempt_update.score == 15.0
        assert attempt_update.completed_at is None
        assert attempt_update.passed is None
        
        # Test complete update
        now = datetime.now()
        attempt_update = QuizAttemptUpdate(
            started_at=now,
            completed_at=now,
            score=15.0,
            max_score=20.0,
            passed=True,
            additional_data={"time_spent": 300}
        )
        assert attempt_update.started_at == now
        assert attempt_update.completed_at == now
        assert attempt_update.score == 15.0
        assert attempt_update.max_score == 20.0
        assert attempt_update.passed is True
        assert attempt_update.additional_data == {"time_spent": 300}
    
    def test_quiz_attempt_response(self, test_quiz_attempts):
        # Test conversion from ORM model
        math_attempt = test_quiz_attempts["math"]
        attempt_response = QuizAttempt.from_orm(math_attempt)
        
        assert attempt_response.id == math_attempt.id
        assert attempt_response.uuid == math_attempt.uuid
        assert attempt_response.quiz_id == math_attempt.quiz_id
        assert attempt_response.score == 0
        assert attempt_response.max_score == 20
        assert attempt_response.passed is False


class TestStudentAnswerSchemas:
    def test_student_answer_create(self):
        # Test valid student answer creation
        student_answer = StudentAnswerCreate(
            question_id=1,
            answer_data={"selected_option_id": 2},
            is_correct=True,
            score=5.0
        )
        assert student_answer.question_id == 1
        assert student_answer.answer_data == {"selected_option_id": 2}
        assert student_answer.is_correct is True
        assert student_answer.score == 5.0
    
    def test_student_answer_response(self):
        # Create a mock student answer with required attributes
        class MockStudentAnswer:
            id = 1
            uuid = "test-uuid"
            attempt_id = 1
            question_id = 1
            answer_data = {"selected_option_id": 2}
            is_correct = True
            score = 5.0
            additional_data = None
            answered_at = datetime.now()
        
        # Test conversion from mock ORM model
        mock_answer = MockStudentAnswer()
        answer_response = StudentAnswer.from_orm(mock_answer)
        
        assert answer_response.id == mock_answer.id
        assert answer_response.uuid == mock_answer.uuid
        assert answer_response.attempt_id == mock_answer.attempt_id
        assert answer_response.question_id == mock_answer.question_id
        assert answer_response.answer_data == {"selected_option_id": 2}
        assert answer_response.is_correct is True
        assert answer_response.score == 5.0


class TestSubmitQuizAnswersSchema:
    def test_submit_quiz_answers(self):
        # Test valid submission
        submission = SubmitQuizAnswers(
            quiz_id="quiz-uuid",
            answers=[
                {"question_id": "q1-uuid", "selected_option_id": "opt1-uuid"},
                {"question_id": "q2-uuid", "selected_option_ids": ["opt2-uuid", "opt3-uuid"]},
                {"question_id": "q3-uuid", "text_answer": "42"}
            ]
        )
        assert submission.quiz_id == "quiz-uuid"
        assert len(submission.answers) == 3
        assert submission.answers[0]["question_id"] == "q1-uuid"
        assert submission.answers[1]["selected_option_ids"] == ["opt2-uuid", "opt3-uuid"]
        assert submission.answers[2]["text_answer"] == "42"
