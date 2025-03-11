from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func

from app.db.models.quiz import (
    QuizTemplate, QuestionTemplate, AnswerOptionTemplate, 
    QuizCategory
)
from app.schemas.quiz import (
    QuizTemplateCreate, QuizTemplateUpdate,
    QuestionTemplateCreate, QuestionTemplateUpdate,
    AnswerOptionTemplateCreate, AnswerOptionTemplateUpdate
)

class QuizTemplateRepository:
    """Repository per la gestione dei template dei quiz."""
    
    @staticmethod
    def get(db: Session, quiz_template_id: int) -> Optional[QuizTemplate]:
        """Ottiene un template di quiz dal database per ID."""
        return db.query(QuizTemplate).filter(QuizTemplate.id == quiz_template_id).first()
    
    @staticmethod
    def get_by_uuid(db: Session, uuid: str) -> Optional[QuizTemplate]:
        """Ottiene un template di quiz dal database per UUID."""
        return db.query(QuizTemplate).filter(QuizTemplate.uuid == uuid).first()
    
    @staticmethod
    def get_all(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        category_id: Optional[int] = None,
        created_by: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[QuizTemplate]:
        """
        Ottiene tutti i template di quiz dal database con filtri opzionali.
        
        Args:
            db: Sessione del database
            skip: Numero di record da saltare
            limit: Numero massimo di record da restituire
            category_id: Filtra per categoria
            created_by: Filtra per creatore
            is_active: Filtra per stato attivo/inattivo
        
        Returns:
            Lista di template di quiz
        """
        query = db.query(QuizTemplate)
        
        # Applica i filtri se specificati
        if category_id is not None:
            query = query.filter(QuizTemplate.category_id == category_id)
        
        if created_by is not None:
            query = query.filter(QuizTemplate.created_by == created_by)
        
        if is_active is not None:
            query = query.filter(QuizTemplate.is_active == is_active)
        
        # Ordina per data di creazione (più recenti prima)
        query = query.order_by(QuizTemplate.created_at.desc())
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, quiz_template_create: QuizTemplateCreate) -> QuizTemplate:
        """Crea un nuovo template di quiz nel database."""
        # Estrai le domande dal DTO di creazione
        questions_data = quiz_template_create.questions
        quiz_template_data = quiz_template_create.model_dump(exclude={"questions"})
        
        # Crea il template del quiz
        db_quiz_template = QuizTemplate(**quiz_template_data)
        db.add(db_quiz_template)
        db.commit()
        db.refresh(db_quiz_template)
        
        # Crea le domande associate al template
        for question_data in questions_data:
            # Estrai le opzioni di risposta dal DTO di creazione
            answer_options_data = question_data.answer_options
            question_data_dict = question_data.model_dump(exclude={"answer_options"})
            
            # Crea la domanda
            db_question = QuestionTemplate(**question_data_dict, quiz_template_id=db_quiz_template.id)
            db.add(db_question)
            db.commit()
            db.refresh(db_question)
            
            # Crea le opzioni di risposta associate alla domanda
            for option_data in answer_options_data:
                db_option = AnswerOptionTemplate(
                    **option_data.model_dump(),
                    question_template_id=db_question.id
                )
                db.add(db_option)
            
            db.commit()
        
        # Ricarica il template con tutte le relazioni
        db.refresh(db_quiz_template)
        
        return db_quiz_template
    
    @staticmethod
    def update(db: Session, quiz_template: QuizTemplate, quiz_template_update: QuizTemplateUpdate) -> QuizTemplate:
        """Aggiorna un template di quiz esistente nel database."""
        # Aggiorna solo i campi forniti
        update_data = quiz_template_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(quiz_template, field, value)
        
        db.add(quiz_template)
        db.commit()
        db.refresh(quiz_template)
        
        return quiz_template
    
    @staticmethod
    def delete(db: Session, quiz_template_id: int) -> bool:
        """Elimina un template di quiz dal database."""
        quiz_template = db.query(QuizTemplate).filter(QuizTemplate.id == quiz_template_id).first()
        if quiz_template:
            db.delete(quiz_template)
            db.commit()
            return True
        return False
    
    @staticmethod
    def count_questions(db: Session, quiz_template_id: int) -> int:
        """Conta il numero di domande in un template di quiz."""
        return db.query(func.count(QuestionTemplate.id)).filter(
            QuestionTemplate.quiz_template_id == quiz_template_id
        ).scalar() or 0
    
    @staticmethod
    def add_question(db: Session, quiz_template_id: int, question_create: QuestionTemplateCreate) -> QuestionTemplate:
        """Aggiunge una domanda a un template di quiz."""
        # Estrai le opzioni di risposta dal DTO di creazione
        answer_options_data = question_create.answer_options
        question_data = question_create.model_dump(exclude={"answer_options"})
        
        # Crea la domanda
        db_question = QuestionTemplate(**question_data, quiz_template_id=quiz_template_id)
        db.add(db_question)
        db.commit()
        db.refresh(db_question)
        
        # Crea le opzioni di risposta associate alla domanda
        for option_data in answer_options_data:
            db_option = AnswerOptionTemplate(
                **option_data.model_dump(),
                question_template_id=db_question.id
            )
            db.add(db_option)
        
        db.commit()
        db.refresh(db_question)
        
        return db_question
    
    @staticmethod
    def update_question(db: Session, question: QuestionTemplate, question_update: QuestionTemplateUpdate) -> QuestionTemplate:
        """Aggiorna una domanda di un template di quiz."""
        # Aggiorna solo i campi forniti
        update_data = question_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(question, field, value)
        
        db.add(question)
        db.commit()
        db.refresh(question)
        
        return question
    
    @staticmethod
    def delete_question(db: Session, question_id: int) -> bool:
        """Elimina una domanda di un template di quiz."""
        question = db.query(QuestionTemplate).filter(QuestionTemplate.id == question_id).first()
        if question:
            db.delete(question)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_question(db: Session, question_id: int) -> Optional[QuestionTemplate]:
        """Ottiene una domanda di un template di quiz con le sue opzioni di risposta."""
        # Carica esplicitamente le opzioni di risposta usando joinedload invece di selectinload
        question = db.query(QuestionTemplate).options(
            joinedload(QuestionTemplate.answer_options)
        ).filter(QuestionTemplate.id == question_id).first()
        
        # Forza il caricamento delle opzioni di risposta
        if question:
            _ = question.answer_options
            
        return question
    
    @staticmethod
    def get_question_by_uuid(db: Session, uuid: str) -> Optional[QuestionTemplate]:
        """Ottiene una domanda di un template di quiz per UUID."""
        return db.query(QuestionTemplate).filter(QuestionTemplate.uuid == uuid).first()
    
    @staticmethod
    def get_questions(db: Session, quiz_template_id: int) -> List[QuestionTemplate]:
        """Ottiene tutte le domande di un template di quiz."""
        return db.query(QuestionTemplate).filter(
            QuestionTemplate.quiz_template_id == quiz_template_id
        ).order_by(QuestionTemplate.order).all()

class QuizCategoryRepository:
    """Repository per la gestione delle categorie dei quiz."""
    
    @staticmethod
    def get(db: Session, category_id: int) -> Optional[QuizCategory]:
        """Ottiene una categoria di quiz dal database per ID."""
        return db.query(QuizCategory).filter(QuizCategory.id == category_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[QuizCategory]:
        """Ottiene una categoria di quiz dal database per nome."""
        return db.query(QuizCategory).filter(QuizCategory.name == name).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[QuizCategory]:
        """Ottiene tutte le categorie di quiz dal database."""
        return db.query(QuizCategory).offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, name: str, description: Optional[str] = None) -> QuizCategory:
        """Crea una nuova categoria di quiz nel database."""
        db_category = QuizCategory(name=name, description=description)
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    
    @staticmethod
    def update(db: Session, category_id: int, name: Optional[str] = None, description: Optional[str] = None) -> Optional[QuizCategory]:
        """Aggiorna una categoria di quiz esistente nel database."""
        db_category = db.query(QuizCategory).filter(QuizCategory.id == category_id).first()
        if db_category:
            if name is not None:
                db_category.name = name
            if description is not None:
                db_category.description = description
                
            db.add(db_category)
            db.commit()
            db.refresh(db_category)
            return db_category
        return None
    
    @staticmethod
    def delete(db: Session, category_id: int) -> bool:
        """Elimina una categoria di quiz dal database."""
        db_category = db.query(QuizCategory).filter(QuizCategory.id == category_id).first()
        if db_category:
            db.delete(db_category)
            db.commit()
            return True
        return False
