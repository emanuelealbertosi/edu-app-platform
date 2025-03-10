from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Enum per i tipi di domande
class QuestionType(str, Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    TEXT = "text"
    NUMERIC = "numeric"
    MATCHING = "matching"

# Schemas per le categorie dei quiz
class QuizCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class QuizCategoryCreate(QuizCategoryBase):
    pass

class QuizCategoryUpdate(QuizCategoryBase):
    name: Optional[str] = None

class QuizCategoryInDBBase(QuizCategoryBase):
    id: int

    class Config:
        orm_mode = True

class QuizCategory(QuizCategoryInDBBase):
    pass

# Schemas per le opzioni di risposta dei template delle domande
class AnswerOptionTemplateBase(BaseModel):
    text: str
    is_correct: bool = False
    order: int = 0
    additional_data: Optional[Dict[str, Any]] = None

class AnswerOptionTemplateCreate(AnswerOptionTemplateBase):
    pass

class AnswerOptionTemplateUpdate(AnswerOptionTemplateBase):
    text: Optional[str] = None
    is_correct: Optional[bool] = None
    order: Optional[int] = None
    additional_data: Optional[Dict[str, Any]] = None

class AnswerOptionTemplateInDBBase(AnswerOptionTemplateBase):
    id: int
    uuid: str
    question_template_id: int

    class Config:
        orm_mode = True

class AnswerOptionTemplate(AnswerOptionTemplateInDBBase):
    pass

# Schemas per le domande dei template dei quiz
class QuestionTemplateBase(BaseModel):
    text: str
    question_type: QuestionType
    points: int = 1
    order: int = 0
    additional_data: Optional[Dict[str, Any]] = None

class QuestionTemplateCreate(QuestionTemplateBase):
    answer_options: List[AnswerOptionTemplateCreate] = []

    @validator('answer_options')
    def validate_answer_options(cls, v, values):
        # Se la domanda è a scelta singola, verifica che ci sia esattamente una risposta corretta
        if values.get('question_type') == QuestionType.SINGLE_CHOICE:
            correct_options = [option for option in v if option.is_correct]
            if len(correct_options) != 1:
                raise ValueError("Le domande a scelta singola devono avere esattamente una risposta corretta")
        
        # Se la domanda è vero/falso, verifica che ci siano esattamente due opzioni
        if values.get('question_type') == QuestionType.TRUE_FALSE:
            if len(v) != 2:
                raise ValueError("Le domande vero/falso devono avere esattamente due opzioni")
        
        # Per le domande a scelta multipla, verifica che ci sia almeno una risposta corretta
        if values.get('question_type') == QuestionType.MULTIPLE_CHOICE:
            correct_options = [option for option in v if option.is_correct]
            if not correct_options:
                raise ValueError("Le domande a scelta multipla devono avere almeno una risposta corretta")
        
        return v

class QuestionTemplateUpdate(QuestionTemplateBase):
    text: Optional[str] = None
    question_type: Optional[QuestionType] = None
    points: Optional[int] = None
    order: Optional[int] = None
    additional_data: Optional[Dict[str, Any]] = None

class QuestionTemplateInDBBase(QuestionTemplateBase):
    id: int
    uuid: str
    quiz_template_id: int

    class Config:
        orm_mode = True

class QuestionTemplate(QuestionTemplateInDBBase):
    answer_options: List[AnswerOptionTemplate] = []

# Schemas per i template dei quiz
class QuizTemplateBase(BaseModel):
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    difficulty_level: int = Field(1, ge=1, le=5)
    points: int = 10
    time_limit: Optional[int] = None
    passing_score: float = Field(60.0, ge=0.0, le=100.0)
    is_active: bool = True
    additional_data: Optional[Dict[str, Any]] = None
    category_id: Optional[int] = None

class QuizTemplateCreate(QuizTemplateBase):
    questions: List[QuestionTemplateCreate] = []
    created_by: str  # UUID dell'amministratore

class QuizTemplateUpdate(QuizTemplateBase):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    difficulty_level: Optional[int] = None
    points: Optional[int] = None
    time_limit: Optional[int] = None
    passing_score: Optional[float] = None
    is_active: Optional[bool] = None
    additional_data: Optional[Dict[str, Any]] = None
    category_id: Optional[int] = None
    created_by: Optional[str] = None

class QuizTemplateInDBBase(QuizTemplateBase):
    id: int
    uuid: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: str

    class Config:
        orm_mode = True

class QuizTemplateSummary(QuizTemplateInDBBase):
    category: Optional[QuizCategory] = None
    question_count: int = 0

class QuizTemplate(QuizTemplateInDBBase):
    category: Optional[QuizCategory] = None
    questions: List[QuestionTemplate] = []

# Schemas per le opzioni di risposta concrete
class AnswerOptionBase(BaseModel):
    text: str
    is_correct: bool = False
    order: int = 0
    additional_data: Optional[Dict[str, Any]] = None

class AnswerOptionCreate(AnswerOptionBase):
    template_id: int

class AnswerOptionUpdate(AnswerOptionBase):
    text: Optional[str] = None
    is_correct: Optional[bool] = None
    order: Optional[int] = None
    additional_data: Optional[Dict[str, Any]] = None

class AnswerOptionInDBBase(AnswerOptionBase):
    id: int
    uuid: str
    question_id: int
    template_id: int

    class Config:
        orm_mode = True

class AnswerOption(AnswerOptionInDBBase):
    pass

# Schemas per le domande concrete
class QuestionBase(BaseModel):
    text: str
    question_type: QuestionType
    points: int = 1
    order: int = 0
    additional_data: Optional[Dict[str, Any]] = None

class QuestionCreate(QuestionBase):
    template_id: int
    answer_options: List[AnswerOptionCreate] = []

class QuestionUpdate(QuestionBase):
    text: Optional[str] = None
    question_type: Optional[QuestionType] = None
    points: Optional[int] = None
    order: Optional[int] = None
    additional_data: Optional[Dict[str, Any]] = None

class QuestionInDBBase(QuestionBase):
    id: int
    uuid: str
    quiz_id: int
    template_id: int

    class Config:
        orm_mode = True

class Question(QuestionInDBBase):
    answer_options: List[AnswerOption] = []

# Schemas per i quiz concreti
class QuizBase(BaseModel):
    path_id: Optional[str] = None
    student_id: str

class QuizCreate(QuizBase):
    template_id: int

class QuizUpdate(QuizBase):
    path_id: Optional[str] = None
    student_id: Optional[str] = None
    is_completed: Optional[bool] = None

class QuizInDBBase(QuizBase):
    id: int
    uuid: str
    template_id: int
    created_at: datetime
    assigned_at: Optional[datetime] = None
    is_completed: bool = False

    class Config:
        orm_mode = True

class QuizSummary(QuizInDBBase):
    template_title: str
    question_count: int = 0

class Quiz(QuizInDBBase):
    questions: List[Question] = []

# Schemas per le risposte degli studenti
class StudentAnswerBase(BaseModel):
    answer_data: Dict[str, Any]
    is_correct: bool = False
    score: float = 0.0
    additional_data: Optional[Dict[str, Any]] = None

class StudentAnswerCreate(StudentAnswerBase):
    question_id: int

class StudentAnswerUpdate(StudentAnswerBase):
    answer_data: Optional[Dict[str, Any]] = None
    is_correct: Optional[bool] = None
    score: Optional[float] = None
    additional_data: Optional[Dict[str, Any]] = None

class StudentAnswerInDBBase(StudentAnswerBase):
    id: int
    uuid: str
    attempt_id: int
    question_id: int
    answered_at: datetime

    class Config:
        orm_mode = True

class StudentAnswer(StudentAnswerInDBBase):
    pass

# Schemas per i tentativi di quiz
class QuizAttemptBase(BaseModel):
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    score: float = 0.0
    max_score: float = 0.0
    passed: bool = False
    additional_data: Optional[Dict[str, Any]] = None

class QuizAttemptCreate(QuizAttemptBase):
    quiz_id: int

class QuizAttemptUpdate(QuizAttemptBase):
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    score: Optional[float] = None
    max_score: Optional[float] = None
    passed: Optional[bool] = None
    additional_data: Optional[Dict[str, Any]] = None

class QuizAttemptInDBBase(QuizAttemptBase):
    id: int
    uuid: str
    quiz_id: int

    class Config:
        orm_mode = True

class QuizAttempt(QuizAttemptInDBBase):
    student_answers: List[StudentAnswer] = []

# Schema per l'invio delle risposte dello studente
class SubmitQuizAnswers(BaseModel):
    quiz_id: str  # UUID del quiz
    answers: List[Dict[str, Any]]  # Lista di risposte (question_uuid -> risposta)
