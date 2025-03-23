from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, JSON, Table, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.base import Base

# Enum per i tipi di domande
class QuestionType(str, enum.Enum):
    SINGLE_CHOICE = "single_choice"  # Scelta singola
    MULTIPLE_CHOICE = "multiple_choice"  # Scelta multipla
    TRUE_FALSE = "true_false"  # Vero/Falso
    TEXT = "text"  # Risposta testuale
    NUMERIC = "numeric"  # Risposta numerica
    MATCHING = "matching"  # Abbinamento

# Tabella per le categorie dei quiz
class QuizCategory(Base):
    __tablename__ = "quiz_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    
    # Relazione con i template dei quiz
    quiz_templates = relationship("QuizTemplate", back_populates="category")
    
    def __repr__(self):
        return f"<QuizCategory {self.name}>"

# Modello per i template dei quiz creati dagli amministratori
class QuizTemplate(Base):
    __tablename__ = "quiz_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    difficulty_level = Column(Integer, default=1)  # 1-5, dove 1 è facile e 5 è difficile
    points = Column(Integer, default=10)  # Punti assegnati al completamento
    time_limit = Column(Integer, nullable=True)  # Tempo limite in secondi (opzionale)
    passing_score = Column(Float, default=60.0)  # Percentuale minima per superare il quiz
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relazione con la categoria
    category_id = Column(Integer, ForeignKey("quiz_categories.id"), nullable=True)
    category = relationship("QuizCategory", back_populates="quiz_templates")
    
    # Relazione con le domande del template
    questions = relationship("QuestionTemplate", back_populates="quiz_template", cascade="all, delete-orphan")
    
    # Relazione con i quiz concreti creati da questo template
    quizzes = relationship("Quiz", back_populates="template")
    
    # Dati aggiuntivi in formato JSON
    additional_data = Column(JSON, nullable=True)
    
    # Creato da (ID amministratore)
    created_by = Column(String)  # UUID dell'amministratore
    
    def __repr__(self):
        return f"<QuizTemplate {self.title}>"

# Modello per le domande dei template dei quiz
class QuestionTemplate(Base):
    __tablename__ = "question_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    text = Column(Text)
    question_type = Column(Enum(QuestionType))
    points = Column(Integer, default=1)  # Punti assegnati alla domanda
    order = Column(Integer, default=0)  # Ordine della domanda nel quiz
    
    # Relazione con il template del quiz
    quiz_template_id = Column(Integer, ForeignKey("quiz_templates.id"))
    quiz_template = relationship("QuizTemplate", back_populates="questions")
    
    # Relazione con le opzioni di risposta
    answer_options = relationship("AnswerOptionTemplate", back_populates="question_template", cascade="all, delete-orphan")
    
    # Relazione con le domande concrete create da questo template
    questions = relationship("Question", back_populates="template")
    
    # Dati aggiuntivi in formato JSON
    additional_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<QuestionTemplate {self.text[:30]}...>"

# Modello per le opzioni di risposta dei template delle domande
class AnswerOptionTemplate(Base):
    __tablename__ = "answer_option_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    text = Column(Text)
    is_correct = Column(Boolean, default=False)
    order = Column(Integer, default=0)  # Ordine dell'opzione nella domanda
    
    # Relazione con il template della domanda
    question_template_id = Column(Integer, ForeignKey("question_templates.id"))
    question_template = relationship("QuestionTemplate", back_populates="answer_options")
    
    # Relazione con le opzioni di risposta concrete create da questo template
    answer_options = relationship("AnswerOption", back_populates="template")
    
    # Dati aggiuntivi in formato JSON (come il feedback specifico per questa risposta)
    additional_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<AnswerOptionTemplate {self.text[:30]}...>"

# Modello per i quiz concreti assegnati agli studenti
class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # Relazione con il template del quiz
    template_id = Column(Integer, ForeignKey("quiz_templates.id"))
    template = relationship("QuizTemplate", back_populates="quizzes")
    
    # Relazione con le domande del quiz
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    
    # Relazione con il tentativo del quiz
    attempt = relationship("QuizAttempt", back_populates="quiz", uselist=False, cascade="all, delete-orphan")
    
    # Collegamento con il percorso concreto (path-service)
    path_id = Column(String, nullable=True)  # UUID del percorso concreto
    node_uuid = Column(String, nullable=True)  # UUID del nodo specifico nel percorso
    
    # Studente a cui è assegnato il quiz
    student_id = Column(String)  # UUID dello studente
    
    # Quando è stato creato e assegnato
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Stato del quiz
    is_completed = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<Quiz {self.id} - template: {self.template_id}>"

# Modello per le domande concrete dei quiz
class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    text = Column(Text)
    question_type = Column(Enum(QuestionType))
    points = Column(Integer, default=1)
    order = Column(Integer, default=0)
    
    # Relazione con il quiz
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    quiz = relationship("Quiz", back_populates="questions")
    
    # Relazione con il template della domanda
    template_id = Column(Integer, ForeignKey("question_templates.id"))
    template = relationship("QuestionTemplate", back_populates="questions")
    
    # Relazione con le opzioni di risposta
    answer_options = relationship("AnswerOption", back_populates="question", cascade="all, delete-orphan")
    
    # Relazione con la risposta dello studente
    student_answer = relationship("StudentAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan")
    
    # Dati aggiuntivi in formato JSON
    additional_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<Question {self.text[:30]}...>"

# Modello per le opzioni di risposta concrete
class AnswerOption(Base):
    __tablename__ = "answer_options"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    text = Column(Text)
    is_correct = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    
    # Relazione con la domanda
    question_id = Column(Integer, ForeignKey("questions.id"))
    question = relationship("Question", back_populates="answer_options")
    
    # Relazione con il template dell'opzione di risposta
    template_id = Column(Integer, ForeignKey("answer_option_templates.id"))
    template = relationship("AnswerOptionTemplate", back_populates="answer_options")
    
    # Dati aggiuntivi in formato JSON
    additional_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<AnswerOption {self.text[:30]}...>"

# Modello per i tentativi di quiz degli studenti
class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # Relazione con il quiz
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), unique=True)
    quiz = relationship("Quiz", back_populates="attempt")
    
    # Relazione con le risposte dello studente
    student_answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")
    
    # Informazioni sul tentativo
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    score = Column(Float, default=0.0)  # Punteggio ottenuto
    max_score = Column(Float, default=0.0)  # Punteggio massimo possibile
    passed = Column(Boolean, default=False)  # Se il quiz è stato superato
    feedback = Column(Text, nullable=True)  # Feedback sul tentativo
    
    # Dati aggiuntivi in formato JSON
    additional_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<QuizAttempt {self.id} - score: {self.score}/{self.max_score}>"

# Modello per le risposte degli studenti
class StudentAnswer(Base):
    __tablename__ = "student_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # Relazione con il tentativo di quiz
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"))
    attempt = relationship("QuizAttempt", back_populates="student_answers")
    
    # Relazione con la domanda
    question_id = Column(Integer, ForeignKey("questions.id"), unique=True)
    question = relationship("Question", back_populates="student_answer")
    
    # Risposta dello studente
    # Per domande a scelta singola/multipla, contiene gli ID delle opzioni selezionate
    # Per domande testuali, contiene il testo della risposta
    # Per domande numeriche, contiene il valore numerico
    answer_data = Column(JSON, nullable=True)
    
    # Se la risposta è corretta
    is_correct = Column(Boolean, default=False)
    
    # Punteggio ottenuto per questa risposta
    score = Column(Float, default=0.0)
    
    # Dati aggiuntivi in formato JSON
    additional_data = Column(JSON, nullable=True)
    
    # Quando è stata data la risposta
    answered_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<StudentAnswer {self.id} - correct: {self.is_correct}>"
