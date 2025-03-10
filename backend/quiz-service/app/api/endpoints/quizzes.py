from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models.quiz import Quiz, Question, QuizAttempt
from app.schemas.quiz import (
    Quiz as QuizSchema,
    QuizSummary,
    QuizCreate,
    QuizUpdate,
    QuizAttempt as QuizAttemptSchema,
    SubmitQuizAnswers
)
from app.db.repositories.quiz_repository import QuizRepository, QuizAttemptRepository
from app.db.repositories.quiz_template_repository import QuizTemplateRepository
from app.api.dependencies.auth import get_current_admin, get_current_active_user, get_current_parent, get_current_student, TokenData

router = APIRouter()

# ENDPOINTS PER I QUIZ CONCRETI

@router.get("", response_model=List[QuizSummary])
async def get_quizzes(
    skip: int = 0,
    limit: int = 100,
    student_id: Optional[str] = None,
    path_id: Optional[str] = None,
    template_id: Optional[int] = None,
    is_completed: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Ottiene l'elenco dei quiz.
    Filtri:
    - Amministratori: possono vedere tutti i quiz
    - Genitori: possono vedere solo i quiz dei loro studenti
    - Studenti: possono vedere solo i propri quiz
    """
    # Applica i filtri in base al ruolo
    if current_user.role == "student":
        # Gli studenti vedono solo i propri quiz
        student_id = current_user.user_id
    
    # Ottieni i quiz
    quizzes = QuizRepository.get_all(
        db,
        skip=skip,
        limit=limit,
        student_id=student_id,
        path_id=path_id,
        template_id=template_id,
        is_completed=is_completed
    )
    
    # Aggiungi il conteggio delle domande e il titolo del template per ogni quiz
    result = []
    for quiz in quizzes:
        question_count = QuizRepository.count_questions(db, quiz.id)
        template = QuizTemplateRepository.get(db, quiz_template_id=quiz.template_id)
        template_title = template.title if template else "Template sconosciuto"
        
        result.append({
            **quiz.__dict__,
            "template_title": template_title,
            "question_count": question_count
        })
    
    return result

@router.post("", response_model=QuizSchema, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz: QuizCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_parent)
):
    """
    Crea un nuovo quiz concreto a partire da un template.
    Solo i genitori e gli amministratori possono creare quiz per gli studenti.
    """
    # Verifica che il template esista
    db_template = QuizTemplateRepository.get(db, quiz_template_id=quiz.template_id)
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template non trovato"
        )
    
    # Verifica che il template sia attivo
    if not db_template.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Il template non è attivo"
        )
    
    # TODO: Verifica che lo studente esista e sia un figlio del genitore (o che l'utente sia un amministratore)
    # Questa verifica dovrebbe essere fatta chiamando l'auth service
    
    try:
        # Crea il quiz
        db_quiz = QuizRepository.create_from_template(db, quiz)
        return db_quiz
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{quiz_id}", response_model=QuizSchema)
async def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Ottiene un quiz per ID.
    - Amministratori: possono vedere tutti i quiz
    - Genitori: possono vedere solo i quiz dei loro studenti
    - Studenti: possono vedere solo i propri quiz
    """
    # Ottieni il quiz con tutte le relazioni
    db_quiz = QuizRepository.get_with_questions(db, quiz_id=quiz_id)
    if not db_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz non trovato"
        )
    
    # Verifica i permessi in base al ruolo
    if current_user.role == "student" and db_quiz.student_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per visualizzare questo quiz"
        )
    
    # TODO: Se l'utente è un genitore, verifica che lo studente sia un suo figlio
    
    return db_quiz

@router.get("/by-uuid/{quiz_uuid}", response_model=QuizSchema)
async def get_quiz_by_uuid(
    quiz_uuid: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Ottiene un quiz per UUID.
    - Amministratori: possono vedere tutti i quiz
    - Genitori: possono vedere solo i quiz dei loro studenti
    - Studenti: possono vedere solo i propri quiz
    """
    # Ottieni il quiz con tutte le relazioni
    db_quiz = QuizRepository.get_by_uuid(db, uuid=quiz_uuid)
    if not db_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz non trovato"
        )
    
    # Carica il quiz completo con le domande
    db_quiz = QuizRepository.get_with_questions(db, quiz_id=db_quiz.id)
    
    # Verifica i permessi in base al ruolo
    if current_user.role == "student" and db_quiz.student_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per visualizzare questo quiz"
        )
    
    # TODO: Se l'utente è un genitore, verifica che lo studente sia un suo figlio
    
    return db_quiz

@router.put("/{quiz_id}", response_model=QuizSchema)
async def update_quiz(
    quiz_id: int,
    quiz: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_admin)
):
    """
    Aggiorna un quiz.
    Solo gli amministratori possono aggiornare quiz.
    """
    db_quiz = QuizRepository.get(db, quiz_id=quiz_id)
    if not db_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz non trovato"
        )
    
    # Aggiorna il quiz
    updated_quiz = QuizRepository.update(db, db_quiz, quiz)
    
    return updated_quiz

@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_admin)
):
    """
    Elimina un quiz.
    Solo gli amministratori possono eliminare quiz.
    """
    db_quiz = QuizRepository.get(db, quiz_id=quiz_id)
    if not db_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz non trovato"
        )
    
    # Elimina il quiz
    QuizRepository.delete(db, quiz_id=quiz_id)
    
    return None

# ENDPOINTS PER I TENTATIVI DI QUIZ

@router.get("/student/assigned", response_model=List[QuizSummary])
async def get_student_assigned_quizzes(
    skip: int = 0,
    limit: int = 100,
    is_completed: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_student)
):
    """
    Ottiene l'elenco dei quiz assegnati allo studente corrente.
    """
    # Ottieni i quiz assegnati allo studente
    quizzes = QuizRepository.get_all(
        db,
        skip=skip,
        limit=limit,
        student_id=current_user.user_id,
        is_completed=is_completed
    )
    
    # Aggiungi il conteggio delle domande e il titolo del template per ogni quiz
    result = []
    for quiz in quizzes:
        question_count = QuizRepository.count_questions(db, quiz.id)
        template = QuizTemplateRepository.get(db, quiz_template_id=quiz.template_id)
        template_title = template.title if template else "Template sconosciuto"
        
        result.append({
            **quiz.__dict__,
            "template_title": template_title,
            "question_count": question_count
        })
    
    return result

@router.get("/{quiz_id}/attempt", response_model=QuizAttemptSchema)
async def get_quiz_attempt(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Ottiene il tentativo di un quiz.
    - Amministratori: possono vedere tutti i tentativi
    - Genitori: possono vedere solo i tentativi dei loro studenti
    - Studenti: possono vedere solo i propri tentativi
    """
    # Ottieni il quiz
    db_quiz = QuizRepository.get(db, quiz_id=quiz_id)
    if not db_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz non trovato"
        )
    
    # Verifica i permessi in base al ruolo
    if current_user.role == "student" and db_quiz.student_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per visualizzare questo tentativo"
        )
    
    # TODO: Se l'utente è un genitore, verifica che lo studente sia un suo figlio
    
    # Ottieni il tentativo
    db_attempt = QuizAttemptRepository.get_by_quiz_id(db, quiz_id=quiz_id)
    if not db_attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tentativo non trovato"
        )
    
    # Carica il tentativo completo con le risposte
    db_attempt = QuizAttemptRepository.get_with_answers(db, attempt_id=db_attempt.id)
    
    return db_attempt

@router.post("/{quiz_id}/submit", response_model=QuizAttemptSchema)
async def submit_quiz_answers(
    quiz_id: int,
    submit_data: SubmitQuizAnswers,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_student)
):
    """
    Invia le risposte per un quiz.
    Solo gli studenti possono inviare risposte e solo per i propri quiz.
    """
    # Ottieni il quiz
    db_quiz = QuizRepository.get(db, quiz_id=quiz_id)
    if not db_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz non trovato"
        )
    
    # Verifica che il quiz appartenga allo studente
    if db_quiz.student_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per inviare risposte a questo quiz"
        )
    
    # Verifica che il quiz non sia già completato
    if db_quiz.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Il quiz è già stato completato"
        )
    
    try:
        # Invia le risposte
        db_attempt, is_passed = QuizRepository.submit_answers(
            db, 
            student_id=current_user.user_id, 
            submit_data=submit_data
        )
        return db_attempt
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
