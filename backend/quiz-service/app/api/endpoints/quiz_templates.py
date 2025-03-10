from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models.quiz import QuizTemplate, QuestionTemplate, AnswerOptionTemplate
from app.schemas.quiz import (
    QuizTemplate as QuizTemplateSchema,
    QuizTemplateSummary,
    QuizTemplateCreate,
    QuizTemplateUpdate,
    QuestionTemplate as QuestionTemplateSchema,
    QuestionTemplateCreate,
    QuestionTemplateUpdate,
    QuizCategory as QuizCategorySchema,
    QuizCategoryCreate,
    QuizCategoryUpdate
)
from app.db.repositories.quiz_template_repository import QuizTemplateRepository, QuizCategoryRepository
from app.api.dependencies.auth import get_current_admin, get_current_active_user, TokenData

router = APIRouter()

# ENDPOINTS PER LE CATEGORIE DEI QUIZ

@router.get("/categories", response_model=List[QuizCategorySchema])
async def get_quiz_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Ottiene l'elenco delle categorie dei quiz.
    Tutti gli utenti autenticati possono vedere le categorie.
    """
    categories = QuizCategoryRepository.get_all(db, skip=skip, limit=limit)
    return categories

@router.post("/categories", response_model=QuizCategorySchema, status_code=status.HTTP_201_CREATED)
async def create_quiz_category(
    category: QuizCategoryCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_admin)
):
    """
    Crea una nuova categoria di quiz.
    Solo gli amministratori possono creare categorie.
    """
    # Controlla se esiste già una categoria con lo stesso nome
    db_category = QuizCategoryRepository.get_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esiste già una categoria con questo nome"
        )
    
    # Crea la nuova categoria
    db_category = QuizCategoryRepository.create(
        db=db,
        name=category.name,
        description=category.description
    )
    
    return db_category

@router.get("/categories/{category_id}", response_model=QuizCategorySchema)
async def get_quiz_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Ottiene una categoria di quiz per ID.
    Tutti gli utenti autenticati possono vedere le categorie.
    """
    db_category = QuizCategoryRepository.get(db, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria non trovata"
        )
    
    return db_category

@router.put("/categories/{category_id}", response_model=QuizCategorySchema)
async def update_quiz_category(
    category_id: int,
    category: QuizCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_admin)
):
    """
    Aggiorna una categoria di quiz.
    Solo gli amministratori possono aggiornare categorie.
    """
    db_category = QuizCategoryRepository.get(db, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria non trovata"
        )
    
    # Se aggiorniamo il nome, verifica che non esista già
    if category.name and category.name != db_category.name:
        existing_category = QuizCategoryRepository.get_by_name(db, name=category.name)
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esiste già una categoria con questo nome"
            )
    
    # Aggiorna la categoria
    updated_category = QuizCategoryRepository.update(
        db=db,
        category_id=category_id,
        name=category.name,
        description=category.description
    )
    
    return updated_category

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_admin)
):
    """
    Elimina una categoria di quiz.
    Solo gli amministratori possono eliminare categorie.
    """
    db_category = QuizCategoryRepository.get(db, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria non trovata"
        )
    
    # Elimina la categoria
    QuizCategoryRepository.delete(db, category_id=category_id)
    
    return None

# ENDPOINTS PER I TEMPLATE DEI QUIZ

@router.get("", response_model=List[QuizTemplateSummary])
async def get_quiz_templates(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Ottiene l'elenco dei template dei quiz.
    Tutti gli utenti autenticati possono vedere i template.
    """
    # Gli amministratori vedono tutti i template
    # Gli altri ruoli vedono solo i template attivi
    if current_user.role != "admin" and is_active is None:
        is_active = True
    
    quiz_templates = QuizTemplateRepository.get_all(
        db, 
        skip=skip, 
        limit=limit, 
        category_id=category_id,
        is_active=is_active
    )
    
    # Aggiungi il conteggio delle domande per ogni template
    result = []
    for template in quiz_templates:
        question_count = QuizTemplateRepository.count_questions(db, template.id)
        result.append({
            **template.__dict__,
            "question_count": question_count
        })
    
    return result

@router.post("", response_model=QuizTemplateSchema, status_code=status.HTTP_201_CREATED)
async def create_quiz_template(
    quiz_template: QuizTemplateCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_admin)
):
    """
    Crea un nuovo template di quiz.
    Solo gli amministratori possono creare template.
    """
    # Verifica che la categoria esista (se specificata)
    if quiz_template.category_id:
        db_category = QuizCategoryRepository.get(db, category_id=quiz_template.category_id)
        if not db_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categoria non trovata"
            )
    
    # Imposta l'ID dell'amministratore come creatore
    quiz_template_data = quiz_template.dict()
    quiz_template_data["created_by"] = current_user.user_id
    
    # Crea il template
    db_quiz_template = QuizTemplateRepository.create(db, quiz_template)
    
    return db_quiz_template

@router.get("/{template_id}", response_model=QuizTemplateSchema)
async def get_quiz_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Ottiene un template di quiz per ID.
    Tutti gli utenti autenticati possono vedere i template.
    """
    db_quiz_template = QuizTemplateRepository.get(db, quiz_template_id=template_id)
    if not db_quiz_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trovato"
        )
    
    # Verifica che il template sia attivo o che l'utente sia un amministratore
    if not db_quiz_template.is_active and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per visualizzare questo template"
        )
    
    return db_quiz_template

@router.get("/by-uuid/{template_uuid}", response_model=QuizTemplateSchema)
async def get_quiz_template_by_uuid(
    template_uuid: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Ottiene un template di quiz per UUID.
    Tutti gli utenti autenticati possono vedere i template.
    """
    db_quiz_template = QuizTemplateRepository.get_by_uuid(db, uuid=template_uuid)
    if not db_quiz_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trovato"
        )
    
    # Verifica che il template sia attivo o che l'utente sia un amministratore
    if not db_quiz_template.is_active and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per visualizzare questo template"
        )
    
    return db_quiz_template

@router.put("/{template_id}", response_model=QuizTemplateSchema)
async def update_quiz_template(
    template_id: int,
    quiz_template: QuizTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_admin)
):
    """
    Aggiorna un template di quiz.
    Solo gli amministratori possono aggiornare template.
    """
    db_quiz_template = QuizTemplateRepository.get(db, quiz_template_id=template_id)
    if not db_quiz_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trovato"
        )
    
    # Verifica che la categoria esista (se specificata)
    if quiz_template.category_id:
        db_category = QuizCategoryRepository.get(db, category_id=quiz_template.category_id)
        if not db_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categoria non trovata"
            )
    
    # Aggiorna il template
    updated_quiz_template = QuizTemplateRepository.update(db, db_quiz_template, quiz_template)
    
    return updated_quiz_template

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_admin)
):
    """
    Elimina un template di quiz.
    Solo gli amministratori possono eliminare template.
    """
    db_quiz_template = QuizTemplateRepository.get(db, quiz_template_id=template_id)
    if not db_quiz_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trovato"
        )
    
    # Elimina il template
    QuizTemplateRepository.delete(db, quiz_template_id=template_id)
    
    return None

# ENDPOINTS PER LE DOMANDE DEI TEMPLATE

@router.get("/{template_id}/questions", response_model=List[QuestionTemplateSchema])
async def get_template_questions(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Ottiene l'elenco delle domande di un template di quiz.
    Tutti gli utenti autenticati possono vedere le domande.
    """
    # Verifica che il template esista
    db_quiz_template = QuizTemplateRepository.get(db, quiz_template_id=template_id)
    if not db_quiz_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trovato"
        )
    
    # Verifica che il template sia attivo o che l'utente sia un amministratore
    if not db_quiz_template.is_active and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per visualizzare questo template"
        )
    
    # Ottieni le domande
    questions = QuizTemplateRepository.get_questions(db, quiz_template_id=template_id)
    
    return questions

@router.post("/{template_id}/questions", response_model=QuestionTemplateSchema, status_code=status.HTTP_201_CREATED)
async def add_template_question(
    template_id: int,
    question: QuestionTemplateCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_admin)
):
    """
    Aggiunge una domanda a un template di quiz.
    Solo gli amministratori possono aggiungere domande.
    """
    # Verifica che il template esista
    db_quiz_template = QuizTemplateRepository.get(db, quiz_template_id=template_id)
    if not db_quiz_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trovato"
        )
    
    # Aggiungi la domanda
    db_question = QuizTemplateRepository.add_question(db, template_id, question)
    
    return db_question

@router.get("/{template_id}/questions/{question_id}", response_model=QuestionTemplateSchema)
async def get_template_question(
    template_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Ottiene una domanda di un template di quiz.
    Tutti gli utenti autenticati possono vedere le domande.
    """
    # Verifica che il template esista
    db_quiz_template = QuizTemplateRepository.get(db, quiz_template_id=template_id)
    if not db_quiz_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trovato"
        )
    
    # Verifica che il template sia attivo o che l'utente sia un amministratore
    if not db_quiz_template.is_active and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per visualizzare questo template"
        )
    
    # Ottieni la domanda
    db_question = QuizTemplateRepository.get_question(db, question_id=question_id)
    if not db_question or db_question.quiz_template_id != template_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domanda non trovata"
        )
    
    return db_question

@router.put("/{template_id}/questions/{question_id}", response_model=QuestionTemplateSchema)
async def update_template_question(
    template_id: int,
    question_id: int,
    question: QuestionTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_admin)
):
    """
    Aggiorna una domanda di un template di quiz.
    Solo gli amministratori possono aggiornare domande.
    """
    # Verifica che il template esista
    db_quiz_template = QuizTemplateRepository.get(db, quiz_template_id=template_id)
    if not db_quiz_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trovato"
        )
    
    # Ottieni la domanda
    db_question = QuizTemplateRepository.get_question(db, question_id=question_id)
    if not db_question or db_question.quiz_template_id != template_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domanda non trovata"
        )
    
    # Aggiorna la domanda
    updated_question = QuizTemplateRepository.update_question(db, db_question, question)
    
    return updated_question

@router.delete("/{template_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template_question(
    template_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_admin)
):
    """
    Elimina una domanda di un template di quiz.
    Solo gli amministratori possono eliminare domande.
    """
    # Verifica che il template esista
    db_quiz_template = QuizTemplateRepository.get(db, quiz_template_id=template_id)
    if not db_quiz_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trovato"
        )
    
    # Ottieni la domanda
    db_question = QuizTemplateRepository.get_question(db, question_id=question_id)
    if not db_question or db_question.quiz_template_id != template_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domanda non trovata"
        )
    
    # Elimina la domanda
    QuizTemplateRepository.delete_question(db, question_id=question_id)
    
    return None
