from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.db.models.quiz import (
    Quiz, Question, AnswerOption, 
    QuizAttempt, StudentAnswer, QuizTemplate
)
from app.schemas.quiz import (
    QuizCreate, QuizUpdate,
    QuestionCreate, QuestionUpdate,
    AnswerOptionCreate, AnswerOptionUpdate,
    QuizAttemptCreate, QuizAttemptUpdate,
    StudentAnswerCreate, StudentAnswerUpdate,
    SubmitQuizAnswers
)

class QuizRepository:
    """Repository per la gestione dei quiz concreti."""
    
    @staticmethod
    def get(db: Session, quiz_id: int) -> Optional[Quiz]:
        """Ottiene un quiz dal database per ID."""
        return db.query(Quiz).filter(Quiz.id == quiz_id).first()
    
    @staticmethod
    def get_by_uuid(db: Session, uuid: str) -> Optional[Quiz]:
        """Ottiene un quiz dal database per UUID."""
        return db.query(Quiz).filter(Quiz.uuid == uuid).first()
    
    @staticmethod
    def get_with_template(db: Session, quiz_id: int) -> Optional[Quiz]:
        """Ottiene un quiz con il suo template dal database per ID."""
        return db.query(Quiz).options(
            joinedload(Quiz.template)
        ).filter(Quiz.id == quiz_id).first()
    
    @staticmethod
    def get_with_questions(db: Session, quiz_id: int) -> Optional[Quiz]:
        """Ottiene un quiz con tutte le sue domande dal database per ID."""
        return db.query(Quiz).options(
            joinedload(Quiz.questions).joinedload(Question.answer_options)
        ).filter(Quiz.id == quiz_id).first()
    
    @staticmethod
    def get_with_attempt(db: Session, quiz_id: int) -> Optional[Quiz]:
        """Ottiene un quiz con il suo tentativo dal database per ID."""
        return db.query(Quiz).options(
            joinedload(Quiz.attempt).joinedload(QuizAttempt.student_answers)
        ).filter(Quiz.id == quiz_id).first()
    
    @staticmethod
    def get_all(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        student_id: Optional[str] = None,
        path_id: Optional[str] = None,
        template_id: Optional[int] = None,
        is_completed: Optional[bool] = None
    ) -> List[Quiz]:
        """
        Ottiene tutti i quiz dal database con filtri opzionali.
        
        Args:
            db: Sessione del database
            skip: Numero di record da saltare
            limit: Numero massimo di record da restituire
            student_id: Filtra per studente
            path_id: Filtra per percorso
            template_id: Filtra per template
            is_completed: Filtra per stato completato/non completato
        
        Returns:
            Lista di quiz
        """
        query = db.query(Quiz)
        
        # Applica i filtri se specificati
        if student_id is not None:
            query = query.filter(Quiz.student_id == student_id)
        
        if path_id is not None:
            query = query.filter(Quiz.path_id == path_id)
        
        if template_id is not None:
            query = query.filter(Quiz.template_id == template_id)
        
        if is_completed is not None:
            query = query.filter(Quiz.is_completed == is_completed)
        
        # Ordina per data di creazione (più recenti prima)
        query = query.order_by(Quiz.created_at.desc())
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def create_from_template(db: Session, quiz_create: QuizCreate) -> Quiz:
        """
        Crea un nuovo quiz concreto partendo da un template.
        
        Args:
            db: Sessione del database
            quiz_create: DTO per la creazione del quiz
        
        Returns:
            Il quiz creato
        
        Raises:
            ValueError: Se il template non esiste
        """
        # Ottieni il template
        template = db.query(QuizTemplate).options(
            joinedload(QuizTemplate.questions).joinedload(QuestionTemplate.answer_options)
        ).filter(QuizTemplate.id == quiz_create.template_id).first()
        
        if not template:
            raise ValueError(f"Il template con ID {quiz_create.template_id} non esiste")
        
        # Crea il quiz
        db_quiz = Quiz(
            template_id=template.id,
            student_id=quiz_create.student_id,
            path_id=quiz_create.path_id
        )
        db.add(db_quiz)
        db.commit()
        db.refresh(db_quiz)
        
        # Crea le domande e le opzioni di risposta
        for template_question in template.questions:
            # Crea la domanda
            db_question = Question(
                quiz_id=db_quiz.id,
                template_id=template_question.id,
                text=template_question.text,
                question_type=template_question.question_type,
                points=template_question.points,
                order=template_question.order,
                additional_data=template_question.additional_data
            )
            db.add(db_question)
            db.commit()
            db.refresh(db_question)
            
            # Crea le opzioni di risposta
            for template_option in template_question.answer_options:
                db_option = AnswerOption(
                    question_id=db_question.id,
                    template_id=template_option.id,
                    text=template_option.text,
                    is_correct=template_option.is_correct,
                    order=template_option.order,
                    additional_data=template_option.additional_data
                )
                db.add(db_option)
            
            db.commit()
        
        # Crea il tentativo vuoto
        db_attempt = QuizAttempt(
            quiz_id=db_quiz.id,
            max_score=sum(q.points for q in template.questions)
        )
        db.add(db_attempt)
        db.commit()
        
        # Ricarica il quiz con tutte le relazioni
        db.refresh(db_quiz)
        
        return db_quiz
    
    @staticmethod
    def update(db: Session, quiz: Quiz, quiz_update: QuizUpdate) -> Quiz:
        """Aggiorna un quiz esistente nel database."""
        # Aggiorna solo i campi forniti
        update_data = quiz_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(quiz, field, value)
        
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        
        return quiz
    
    @staticmethod
    def delete(db: Session, quiz_id: int) -> bool:
        """Elimina un quiz dal database."""
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if quiz:
            db.delete(quiz)
            db.commit()
            return True
        return False
    
    @staticmethod
    def count_questions(db: Session, quiz_id: int) -> int:
        """Conta il numero di domande in un quiz."""
        return db.query(func.count(Question.id)).filter(
            Question.quiz_id == quiz_id
        ).scalar() or 0
    
    @staticmethod
    def submit_answers(db: Session, student_id: str, submit_data: SubmitQuizAnswers) -> Tuple[QuizAttempt, bool]:
        """
        Invia le risposte per un quiz.
        
        Args:
            db: Sessione del database
            student_id: ID dello studente
            submit_data: Dati per l'invio delle risposte
        
        Returns:
            Tuple con il tentativo aggiornato e un flag che indica se il quiz è stato superato
        
        Raises:
            ValueError: Se il quiz non esiste o non appartiene allo studente
        """
        # Ottieni il quiz
        quiz = db.query(Quiz).options(
            joinedload(Quiz.template),
            joinedload(Quiz.questions).joinedload(Question.answer_options),
            joinedload(Quiz.attempt)
        ).filter(Quiz.uuid == submit_data.quiz_id).first()
        
        if not quiz:
            raise ValueError(f"Il quiz con UUID {submit_data.quiz_id} non esiste")
        
        if quiz.student_id != student_id:
            raise ValueError(f"Il quiz non appartiene allo studente {student_id}")
        
        if quiz.is_completed:
            raise ValueError(f"Il quiz è già stato completato")
        
        # Ottieni il tentativo
        attempt = quiz.attempt
        if not attempt:
            raise ValueError(f"Il tentativo per il quiz {submit_data.quiz_id} non esiste")
        
        # Se è il primo tentativo, registra l'orario di inizio
        if not attempt.started_at:
            from datetime import datetime
            attempt.started_at = datetime.now()
        
        # Mappa le domande per UUID
        questions_map = {q.uuid: q for q in quiz.questions}
        
        # Elabora le risposte
        total_score = 0
        max_score = 0
        
        for answer_data in submit_data.answers:
            question_uuid = answer_data.get("question_uuid")
            answer_value = answer_data.get("answer")
            
            if not question_uuid or question_uuid not in questions_map:
                continue
            
            question = questions_map[question_uuid]
            max_score += question.points
            
            # Valuta la risposta e assegna il punteggio
            is_correct, score = QuizRepository._evaluate_answer(question, answer_value)
            
            # Crea o aggiorna la risposta dello studente
            student_answer = db.query(StudentAnswer).filter(
                StudentAnswer.question_id == question.id,
                StudentAnswer.attempt_id == attempt.id
            ).first()
            
            if student_answer:
                student_answer.answer_data = {"value": answer_value}
                student_answer.is_correct = is_correct
                student_answer.score = score
                student_answer.answered_at = datetime.now()
            else:
                student_answer = StudentAnswer(
                    attempt_id=attempt.id,
                    question_id=question.id,
                    answer_data={"value": answer_value},
                    is_correct=is_correct,
                    score=score
                )
                db.add(student_answer)
            
            total_score += score
        
        # Aggiorna il tentativo
        attempt.completed_at = datetime.now()
        attempt.score = total_score
        attempt.max_score = max_score
        
        # Controlla se il quiz è stato superato
        percentage_score = (total_score / max_score * 100) if max_score > 0 else 0
        attempt.passed = percentage_score >= quiz.template.passing_score
        
        # Imposta il quiz come completato
        quiz.is_completed = True
        
        db.add(attempt)
        db.add(quiz)
        db.commit()
        db.refresh(attempt)
        
        return attempt, attempt.passed
    
    @staticmethod
    def _evaluate_answer(question: Question, answer_value: Any) -> Tuple[bool, float]:
        """
        Valuta la risposta a una domanda e restituisce se è corretta e il punteggio.
        
        Args:
            question: La domanda
            answer_value: Il valore della risposta
        
        Returns:
            Tuple con un flag che indica se la risposta è corretta e il punteggio
        """
        is_correct = False
        score = 0
        
        if question.question_type == "single_choice":
            # Per le domande a scelta singola, confronta l'ID selezionato con quello corretto
            correct_options = [opt for opt in question.answer_options if opt.is_correct]
            if correct_options and str(correct_options[0].uuid) == str(answer_value):
                is_correct = True
                score = question.points
        
        elif question.question_type == "multiple_choice":
            # Per le domande a scelta multipla, confronta gli ID selezionati con quelli corretti
            selected_ids = set(answer_value if isinstance(answer_value, list) else [])
            correct_ids = {str(opt.uuid) for opt in question.answer_options if opt.is_correct}
            
            if selected_ids and correct_ids:
                # Calcola la percentuale di opzioni corrette
                correct_selected = selected_ids.intersection(correct_ids)
                incorrect_selected = selected_ids - correct_ids
                
                # Punteggio proporzionale al numero di risposte corrette meno quelle sbagliate
                correctness = (len(correct_selected) - len(incorrect_selected)) / len(correct_ids)
                correctness = max(0, correctness)  # Non permettere punteggi negativi
                
                score = question.points * correctness
                is_correct = correctness >= 1.0  # Completamente corretta solo se tutte le scelte sono giuste
        
        elif question.question_type == "true_false":
            # Per le domande vero/falso, confronta il valore booleano
            correct_option = next((opt for opt in question.answer_options if opt.is_correct), None)
            if correct_option and ((correct_option.text.lower() == "vero" and answer_value is True) or 
                                   (correct_option.text.lower() == "falso" and answer_value is False)):
                is_correct = True
                score = question.points
        
        elif question.question_type == "text":
            # Per le domande a risposta libera, confronta il testo esatto (si potrebbe migliorare)
            # In futuro si potrebbe implementare una valutazione più sofisticata
            correct_answer = next((opt.text for opt in question.answer_options if opt.is_correct), "")
            if correct_answer and str(answer_value).lower().strip() == correct_answer.lower().strip():
                is_correct = True
                score = question.points
        
        elif question.question_type == "numeric":
            # Per le domande numeriche, confronta il valore numerico entro un margine di tolleranza
            try:
                user_value = float(answer_value)
                correct_option = next((opt for opt in question.answer_options if opt.is_correct), None)
                if correct_option:
                    correct_value = float(correct_option.text)
                    # Tolleranza del 1%
                    tolerance = abs(correct_value) * 0.01
                    if abs(user_value - correct_value) <= tolerance:
                        is_correct = True
                        score = question.points
            except (ValueError, TypeError):
                pass
        
        elif question.question_type == "matching":
            # Per le domande di abbinamento, confronta le coppie
            # Formato atteso: {id_opzione1: id_risposta1, id_opzione2: id_risposta2, ...}
            if isinstance(answer_value, dict):
                correct_pairings = {}
                
                # Costruisci i corretti abbinamenti dalle opzioni
                for option in question.answer_options:
                    if option.additional_data and "matches_to" in option.additional_data:
                        correct_pairings[str(option.uuid)] = str(option.additional_data["matches_to"])
                
                if correct_pairings:
                    # Conta gli abbinamenti corretti
                    correct_matches = sum(1 for k, v in answer_value.items() 
                                         if k in correct_pairings and correct_pairings[k] == v)
                    
                    # Calcola il punteggio proporzionale
                    if correct_pairings:
                        correctness = correct_matches / len(correct_pairings)
                        score = question.points * correctness
                        is_correct = correctness >= 1.0  # Completamente corretta solo se tutti gli abbinamenti sono giusti
        
        return is_correct, score

class QuizAttemptRepository:
    """Repository per la gestione dei tentativi di quiz."""
    
    @staticmethod
    def get(db: Session, attempt_id: int) -> Optional[QuizAttempt]:
        """Ottiene un tentativo di quiz dal database per ID."""
        return db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    
    @staticmethod
    def get_by_uuid(db: Session, uuid: str) -> Optional[QuizAttempt]:
        """Ottiene un tentativo di quiz dal database per UUID."""
        return db.query(QuizAttempt).filter(QuizAttempt.uuid == uuid).first()
    
    @staticmethod
    def get_by_quiz_id(db: Session, quiz_id: int) -> Optional[QuizAttempt]:
        """Ottiene un tentativo di quiz dal database per ID del quiz."""
        return db.query(QuizAttempt).filter(QuizAttempt.quiz_id == quiz_id).first()
    
    @staticmethod
    def get_with_answers(db: Session, attempt_id: int) -> Optional[QuizAttempt]:
        """Ottiene un tentativo di quiz con tutte le risposte dal database per ID."""
        return db.query(QuizAttempt).options(
            joinedload(QuizAttempt.student_answers)
        ).filter(QuizAttempt.id == attempt_id).first()
    
    @staticmethod
    def create(db: Session, quiz_id: int) -> QuizAttempt:
        """Crea un nuovo tentativo di quiz nel database."""
        db_attempt = QuizAttempt(quiz_id=quiz_id)
        db.add(db_attempt)
        db.commit()
        db.refresh(db_attempt)
        return db_attempt
    
    @staticmethod
    def update(db: Session, attempt: QuizAttempt, attempt_update: QuizAttemptUpdate) -> QuizAttempt:
        """Aggiorna un tentativo di quiz esistente nel database."""
        # Aggiorna solo i campi forniti
        update_data = attempt_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(attempt, field, value)
        
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        
        return attempt
