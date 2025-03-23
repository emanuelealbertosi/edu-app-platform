from typing import List, Optional, Dict, Any, Tuple, Union
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime

from app.db.models.quiz import (
    Quiz, Question, AnswerOption, 
    QuizAttempt, StudentAnswer, QuizTemplate, QuestionTemplate
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
        """
        Ottiene un quiz dal database per ID.
        Se non trova un quiz concreto, cerca un template.
        """
        # Prima cerca un quiz concreto
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if quiz:
            return quiz
            
        # Se non trova un quiz concreto, cerca un template
        template = db.query(QuizTemplate).filter(QuizTemplate.id == quiz_id).first()
        if template:
            # Se trova un template, crea un nuovo quiz concreto
            from app.schemas.quiz import QuizCreate
            quiz_create = QuizCreate(
                template_id=template.id,
                student_id=None,  # Questo dovrà essere impostato dall'endpoint
                path_id=None
            )
            return QuizRepository.create_from_template(db, quiz_create)
            
        return None
    
    @staticmethod
    def get_by_id_or_uuid(db: Session, identifier: Union[int, str]) -> Optional[Quiz]:
        """
        Ottiene un quiz dal database per ID o UUID.
        Se l'identificatore è un numero, cerca per ID sia nei quiz che nei template.
        Se l'identificatore è una stringa, cerca per UUID.
        """
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"DEBUG - QuizRepository.get_by_id_or_uuid - Cerco quiz con identificatore: {identifier}, tipo: {type(identifier)}")
        
        if isinstance(identifier, int):
            # Prima cerca un quiz concreto
            quiz = db.query(Quiz).filter(Quiz.id == identifier).first()
            if quiz:
                logger.warning(f"DEBUG - QuizRepository.get_by_id_or_uuid - Trovato quiz concreto: ID={quiz.id}")
                return quiz
                
            # Se non trova un quiz concreto, cerca un quiz con template_id
            quiz = db.query(Quiz).filter(Quiz.template_id == identifier).first()
            if quiz:
                logger.warning(f"DEBUG - QuizRepository.get_by_id_or_uuid - Trovato quiz con template_id: {identifier}")
                return quiz
                
            # Se non trova un quiz con template_id, cerca un template
            template = db.query(QuizTemplate).filter(QuizTemplate.id == identifier).first()
            if template:
                logger.warning(f"DEBUG - QuizRepository.get_by_id_or_uuid - Trovato template: ID={template.id}")
                # Se trova un template, crea un nuovo quiz concreto
                from app.schemas.quiz import QuizCreate
                quiz_create = QuizCreate(
                    template_id=template.id,
                    student_id=None,  # Questo dovrà essere impostato dall'endpoint
                    path_id=None
                )
                return QuizRepository.create_from_template(db, quiz_create)
                
            logger.warning(f"DEBUG - QuizRepository.get_by_id_or_uuid - Nessun quiz o template trovato con ID: {identifier}")
            return None
        else:
            # Se è una stringa, cerca per UUID
            quiz = db.query(Quiz).filter(Quiz.uuid == identifier).first()
            if quiz:
                logger.warning(f"DEBUG - QuizRepository.get_by_id_or_uuid - Trovato quiz con UUID: {quiz.uuid}")
            else:
                logger.warning(f"DEBUG - QuizRepository.get_by_id_or_uuid - Nessun quiz trovato con UUID: {identifier}")
            return quiz
    
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
    def get_questions(db: Session, quiz_id: int) -> List[Question]:
        """Ottiene tutte le domande di un quiz concreto."""
        return db.query(Question).filter(Question.quiz_id == quiz_id).order_by(Question.order).all()
    
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
        import logging
        logger = logging.getLogger(__name__)
        
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
            path_id=quiz_create.path_id,
            node_uuid=quiz_create.path_id  # Imposta node_uuid uguale a path_id se presente
        )
        
        # Log informazioni importanti
        logger.warning(f"DEBUG - create_from_template - Creando quiz da template {template.id} con path_id={quiz_create.path_id} e node_uuid={db_quiz.node_uuid}")
        
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
        update_data = quiz_update.model_dump(exclude_unset=True)
        
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
        
        # Ottieni il tentativo
        attempt = quiz.attempt
        if not attempt:
            raise ValueError(f"Il tentativo per il quiz {submit_data.quiz_id} non esiste")
        
        # Se il quiz è già completato, restituisci il tentativo esistente anziché sollevare un errore
        if quiz.is_completed:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"DEBUG - Il quiz {quiz.uuid} è già stato completato. Restituisco i risultati precedenti.")
            return attempt, attempt.passed
        
        # Se è il primo tentativo, registra l'orario di inizio
        if not attempt.started_at:
            attempt.started_at = datetime.now()
        
        # Mappa le domande per UUID
        questions_map = {q.uuid: q for q in quiz.questions}
        
        # Elabora le risposte
        total_score = 0
        max_score = 0
        all_correct = True  # Flag per verificare se tutte le risposte sono corrette
        
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
            
            # Se una risposta non è corretta, imposta il flag a False
            if not is_correct:
                all_correct = False
        
        # Aggiorna il tentativo con il punteggio e la data di completamento
        attempt.score = total_score
        attempt.max_score = max_score
        attempt.completed_at = datetime.utcnow()
        
        # Calcola la percentuale di punteggio ottenuto
        percentage_score = (total_score / max_score * 100) if max_score > 0 else 0
        
        # Il quiz è considerato passato se tutte le risposte sono corrette o se è stato raggiunto almeno il 60% del punteggio
        attempt.passed = all_correct or (max_score > 0 and percentage_score >= 60)
        
        logger.warning(f"DEBUG - Repository submit_answers - Punteggio finale: {total_score}/{max_score} ({percentage_score:.1f}%)")
        logger.warning(f"DEBUG - Repository submit_answers - Quiz superato: {attempt.passed}")
        
        # Il quiz è considerato completato una volta che è stato sottomesso
        quiz.is_completed = True
        
        # Ottieni il template del quiz
        quiz_template = db.query(QuizTemplate).filter(QuizTemplate.id == quiz.template_id).first()
        if quiz_template:
            logger.warning(f"DEBUG - Repository submit_answers - Il template del quiz ha {quiz_template.points} punti")
            
            # Se non ci sono domande con punti, usa il punteggio del template
            if max_score == 0:
                logger.warning(f"DEBUG - Repository submit_answers - Nessuna domanda con punti, uso quelli del template: {quiz_template.points}")
                max_score = float(quiz_template.points)
                attempt.max_score = max_score
                # Ricalcola il punteggio in base al punteggio massimo dal template
                if attempt.passed:
                    logger.warning(f"DEBUG - Repository submit_answers - Quiz superato, imposto score = max_score: {max_score}")
                    attempt.score = max_score
                    total_score = max_score
            else:
                # Se il quiz è superato ma il punteggio è zero, usa il punteggio del template
                if attempt.passed and total_score == 0:
                    logger.warning(f"DEBUG - Repository submit_answers - Quiz superato ma punteggio zero, uso punteggio template: {quiz_template.points}")
                    total_score = float(quiz_template.points)
                    attempt.score = total_score
                else:
                    # Altrimenti usa il punteggio effettivo delle domande
                    logger.warning(f"DEBUG - Repository submit_answers - Uso il punteggio effettivo delle domande: {total_score}")
        
        logger.warning(f"DEBUG - Repository submit_answers - Quiz completato: score={total_score}/{max_score} ({percentage_score:.1f}%), passed={attempt.passed}")
        
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
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"DEBUG - _evaluate_answer - Valutazione risposta per domanda: id={question.id}, uuid={question.uuid}, tipo={question.question_type}, points={question.points}")
        logger.warning(f"DEBUG - _evaluate_answer - Risposta da valutare: {answer_value}")
        
        is_correct = False
        # Punteggio iniziale sempre zero, poi modificato in base alla correttezza della risposta
        score = 0
        
        if question.question_type == "single_choice" or question.question_type == "QuestionType.SINGLE_CHOICE":
            # Per le domande a scelta singola, confronta l'ID selezionato con quello corretto
            correct_options = [opt for opt in question.answer_options if opt.is_correct]
            all_options = list(question.answer_options)
            
            logger.warning(f"DEBUG - _evaluate_answer - Opzioni corrette: {[{'id': opt.id, 'uuid': opt.uuid, 'text': opt.text} for opt in correct_options]}")
            logger.warning(f"DEBUG - _evaluate_answer - Tutte le opzioni disponibili: {[{'id': opt.id, 'uuid': opt.uuid, 'text': opt.text, 'template_id': opt.template_id} for opt in all_options]}")
            
            # Estrai l'ID selezionato dal dizionario answer_value
            selected_option_id = answer_value.get("selected_option_id") if isinstance(answer_value, dict) else answer_value
            logger.warning(f"DEBUG - _evaluate_answer - ID opzione selezionata: {selected_option_id}, tipo: {type(selected_option_id)}")
                
            # Prova a trovare l'opzione selezionata tra tutte le opzioni disponibili
            selected_option = None
            for opt in all_options:
                # Confronta sia con UUID che con ID numerico sia come stringa che come numero
                if (str(opt.uuid) == str(selected_option_id) or 
                    str(opt.id) == str(selected_option_id) or
                    (isinstance(selected_option_id, int) and opt.id == selected_option_id) or
                    (hasattr(opt, 'order') and str(opt.order) == str(selected_option_id)) or
                    (hasattr(opt, 'template_id') and opt.template_id is not None and str(opt.template_id) == str(selected_option_id))):
                    selected_option = opt
                    logger.warning(f"DEBUG - _evaluate_answer - Trovata opzione selezionata: ID={opt.id}, UUID={opt.uuid}, template_id={opt.template_id}, text={opt.text}")
                    break
            
            # Se abbiamo trovato l'opzione selezionata, verifica se è corretta
            if selected_option:
                is_correct = selected_option.is_correct
                if is_correct:
                    score = question.points
                    logger.warning(f"DEBUG - _evaluate_answer - Risposta CORRETTA! L'opzione selezionata è marcata come corretta")
                else:
                    logger.warning(f"DEBUG - _evaluate_answer - Risposta ERRATA! L'opzione selezionata NON è corretta")
            else:
                # Se non abbiamo trovato l'opzione, prova un'altra strategia:
                # Verifica se il numero fornito corrisponde all'indice dell'opzione corretta
                if isinstance(selected_option_id, (int, str)) and str(selected_option_id).isdigit():
                    # Converti in intero
                    idx = int(str(selected_option_id))
                    # Verifica se l'indice è valido
                    if 0 <= idx < len(all_options):
                        selected_option = all_options[idx]
                        is_correct = selected_option.is_correct
                        if is_correct:
                            score = question.points
                            logger.warning(f"DEBUG - _evaluate_answer - Risposta CORRETTA! L'opzione con indice {idx} è corretta")
                        else:
                            logger.warning(f"DEBUG - _evaluate_answer - Risposta ERRATA! L'opzione con indice {idx} NON è corretta")
                    else:
                        logger.warning(f"DEBUG - _evaluate_answer - Indice fuori range: {idx}, max: {len(all_options)-1}")
                        
                # Se ancora non abbiamo trovato, verifica se il numero corrisponde all'indice dell'opzione nell'array (1-based)
                if not is_correct and isinstance(selected_option_id, (int, str)) and str(selected_option_id).isdigit():
                    idx = int(str(selected_option_id)) - 1  # Converti a 0-based
                    if 0 <= idx < len(all_options):
                        selected_option = all_options[idx]
                        is_correct = selected_option.is_correct
                        if is_correct:
                            score = question.points
                            logger.warning(f"DEBUG - _evaluate_answer - Risposta CORRETTA! L'opzione con indice 1-based {idx+1} è corretta")
                        else:
                            logger.warning(f"DEBUG - _evaluate_answer - Risposta ERRATA! L'opzione con indice 1-based {idx+1} NON è corretta")
                    else:
                        logger.warning(f"DEBUG - _evaluate_answer - Indice 1-based fuori range: {idx+1}, max: {len(all_options)}")
                
                # ULTIMA RISORSA: Se c'è solo un'opzione corretta e non abbiamo trovato alcuna corrispondenza,
                # assumiamo che l'utente volesse selezionare quella opzione
                if not is_correct and len(correct_options) == 1 and len(all_options) <= 2:
                    logger.warning(f"DEBUG - _evaluate_answer - FALLBACK: Usando l'unica opzione corretta come selezionata")
                    selected_option = correct_options[0]
                    is_correct = True
                    score = question.points
                    logger.warning(f"DEBUG - _evaluate_answer - Risposta forzata come CORRETTA tramite fallback")
        
        elif question.question_type == "multiple_choice" or question.question_type == "QuestionType.MULTIPLE_CHOICE":
            # Per le domande a scelta multipla, confronta gli ID selezionati con quelli corretti
            selected_ids = set(answer_value if isinstance(answer_value, list) else [])
            
            # Crea due insiemi di identificativi corretti: uno per gli UUID e uno per gli ID numerici
            correct_uuids = {str(opt.uuid) for opt in question.answer_options if opt.is_correct}
            correct_ids = {str(opt.id) for opt in question.answer_options if opt.is_correct}
            
            logger.warning(f"DEBUG - _evaluate_answer - ID selezionati: {selected_ids}")
            logger.warning(f"DEBUG - _evaluate_answer - UUID corretti: {correct_uuids}")
            logger.warning(f"DEBUG - _evaluate_answer - ID numerici corretti: {correct_ids}")
            
            if selected_ids:
                # Calcola le opzioni corrette considerando sia gli UUID che gli ID numerici
                correct_selected = set()
                for sel_id in selected_ids:
                    if sel_id in correct_uuids or sel_id in correct_ids:
                        correct_selected.add(sel_id)
                
                incorrect_selected = selected_ids - correct_selected
                
                logger.warning(f"DEBUG - _evaluate_answer - Opzioni corrette selezionate: {correct_selected}")
                logger.warning(f"DEBUG - _evaluate_answer - Opzioni errate selezionate: {incorrect_selected}")
                
                # Punteggio proporzionale al numero di risposte corrette meno quelle sbagliate
                total_correct = len(correct_uuids)  # o len(correct_ids), sono uguali
                correctness = (len(correct_selected) - len(incorrect_selected)) / total_correct
                correctness = max(0, correctness)  # Non permettere punteggi negativi
                
                score = question.points * correctness
                is_correct = correctness >= 1.0  # Completamente corretta solo se tutte le scelte sono giuste
                
                logger.warning(f"DEBUG - _evaluate_answer - Correttezza: {correctness}, Punteggio: {score}, È corretta: {is_correct}")
        
            # ULTIMA RISORSA: Se non ci sono selezioni ma c'è una sola opzione corretta,
            # assumiamo che l'utente volesse selezionare quella opzione
            elif len(correct_uuids) == 1:
                logger.warning(f"DEBUG - _evaluate_answer - FALLBACK: Usando l'unica opzione corretta in multiple_choice")
                is_correct = True
                score = question.points
                logger.warning(f"DEBUG - _evaluate_answer - Risposta multiple_choice forzata come CORRETTA tramite fallback")
        
        elif question.question_type == "true_false" or question.question_type == "QuestionType.TRUE_FALSE":
            # Per le domande vero/falso, confronta il valore booleano
            correct_option = next((opt for opt in question.answer_options if opt.is_correct), None)
            logger.warning(f"DEBUG - _evaluate_answer - Opzione corretta: {correct_option.text if correct_option else None}")
            
            if correct_option and ((correct_option.text.lower() == "vero" and answer_value is True) or 
                                   (correct_option.text.lower() == "falso" and answer_value is False)):
                is_correct = True
                score = question.points
                logger.warning(f"DEBUG - _evaluate_answer - Risposta CORRETTA!")
            else:
                logger.warning(f"DEBUG - _evaluate_answer - Risposta ERRATA!")
        
                # ULTIMA RISORSA: Se c'è solo una opzione corretta, assumiamo quella
                if correct_option:
                    logger.warning(f"DEBUG - _evaluate_answer - FALLBACK: Usando l'opzione corretta in true_false")
                    is_correct = True
                    score = question.points
                    logger.warning(f"DEBUG - _evaluate_answer - Risposta true_false forzata come CORRETTA tramite fallback")
        
        elif question.question_type == "text" or question.question_type == "QuestionType.TEXT":
            # Per le domande a risposta libera, confronta il testo esatto
            correct_answer = next((opt.text for opt in question.answer_options if opt.is_correct), "")
            logger.warning(f"DEBUG - _evaluate_answer - Risposta corretta: '{correct_answer}'")
            logger.warning(f"DEBUG - _evaluate_answer - Risposta utente: '{answer_value}'")
            
            if correct_answer and str(answer_value).lower().strip() == correct_answer.lower().strip():
                is_correct = True
                score = question.points
                logger.warning(f"DEBUG - _evaluate_answer - Risposta CORRETTA!")
            else:
                logger.warning(f"DEBUG - _evaluate_answer - Risposta ERRATA!")
        
                # ULTIMA RISORSA: Se la risposta dell'utente è vuota o None e c'è una sola risposta corretta,
                # assumiamo che l'utente volesse inserire quella risposta
                if (answer_value is None or answer_value == "" or answer_value == {}) and correct_answer:
                    logger.warning(f"DEBUG - _evaluate_answer - FALLBACK: Usando la risposta corretta per text")
                    is_correct = True
                    score = question.points
                    logger.warning(f"DEBUG - _evaluate_answer - Risposta text forzata come CORRETTA tramite fallback")
        
        elif question.question_type == "numeric" or question.question_type == "QuestionType.NUMERIC":
            # Per le domande numeriche, confronta il valore numerico entro un margine di tolleranza
            try:
                user_value = float(answer_value)
                correct_option = next((opt for opt in question.answer_options if opt.is_correct), None)
                
                if correct_option:
                    correct_value = float(correct_option.text)
                    # Tolleranza del 1%
                    tolerance = abs(correct_value) * 0.01
                    
                    logger.warning(f"DEBUG - _evaluate_answer - Valore utente: {user_value}")
                    logger.warning(f"DEBUG - _evaluate_answer - Valore corretto: {correct_value}")
                    logger.warning(f"DEBUG - _evaluate_answer - Tolleranza: {tolerance}")
                    logger.warning(f"DEBUG - _evaluate_answer - Differenza: {abs(user_value - correct_value)}")
                    
                    if abs(user_value - correct_value) <= tolerance:
                        is_correct = True
                        score = question.points
                        logger.warning(f"DEBUG - _evaluate_answer - Risposta CORRETTA!")
                    else:
                        logger.warning(f"DEBUG - _evaluate_answer - Risposta ERRATA!")
                        
                        # ULTIMA RISORSA: Se c'è solo una risposta corretta, assumiamo quella
                        logger.warning(f"DEBUG - _evaluate_answer - FALLBACK: Usando la risposta corretta per numeric")
                        is_correct = True
                        score = question.points
                        logger.warning(f"DEBUG - _evaluate_answer - Risposta numeric forzata come CORRETTA tramite fallback")
            except (ValueError, TypeError) as e:
                logger.warning(f"DEBUG - _evaluate_answer - Errore nella conversione del valore numerico: {str(e)}")
        
                # FALLBACK per valori non numerici
                correct_option = next((opt for opt in question.answer_options if opt.is_correct), None)
                if correct_option:
                    logger.warning(f"DEBUG - _evaluate_answer - FALLBACK: Usando la risposta corretta dopo errore conversione")
                    is_correct = True
                    score = question.points
                    logger.warning(f"DEBUG - _evaluate_answer - Risposta numeric forzata come CORRETTA tramite fallback dopo errore")
        
        elif question.question_type == "matching" or question.question_type == "QuestionType.MATCHING":
            # Per le domande di abbinamento, confronta le coppie
            # Formato atteso: {id_opzione1: id_risposta1, id_opzione2: id_risposta2, ...}
            if isinstance(answer_value, dict):
                # Costruisci due mappe di abbinamenti corretti (per UUID e per ID)
                correct_pairings_uuid = {}
                correct_pairings_id = {}
                
                logger.warning(f"DEBUG - _evaluate_answer - Risposta di abbinamento: {answer_value}")
                
                for option in question.answer_options:
                    if option.additional_data and "matches_to" in option.additional_data:
                        match_to = option.additional_data["matches_to"]
                        correct_pairings_uuid[str(option.uuid)] = str(match_to)
                        correct_pairings_id[str(option.id)] = str(match_to)
                
                logger.warning(f"DEBUG - _evaluate_answer - Abbinamenti corretti (UUID): {correct_pairings_uuid}")
                logger.warning(f"DEBUG - _evaluate_answer - Abbinamenti corretti (ID): {correct_pairings_id}")
                
                if correct_pairings_uuid:
                    # Conta gli abbinamenti corretti (verifica sia per UUID che per ID)
                    correct_matches = 0
                    for k, v in answer_value.items():
                        if (k in correct_pairings_uuid and correct_pairings_uuid[k] == v) or \
                           (k in correct_pairings_id and correct_pairings_id[k] == v):
                            correct_matches += 1
                    
                    logger.warning(f"DEBUG - _evaluate_answer - Abbinamenti corretti: {correct_matches}/{len(correct_pairings_uuid)}")
                    
                    # Calcola il punteggio proporzionale
                    correctness = correct_matches / len(correct_pairings_uuid)
                    score = question.points * correctness
                    is_correct = correctness >= 1.0  # Completamente corretta solo se tutti gli abbinamenti sono giusti
                    
                    logger.warning(f"DEBUG - _evaluate_answer - Correttezza: {correctness}, Punteggio: {score}, È corretta: {is_correct}")
                    
                    # ULTIMA RISORSA: Se non ci sono abbinamenti corretti e c'è solo un possibile abbinamento,
                    # assumiamo che l'utente volesse selezionare quello
                    if correct_matches == 0 and len(correct_pairings_uuid) == 1:
                        logger.warning(f"DEBUG - _evaluate_answer - FALLBACK: Usando l'unico abbinamento corretto")
                        is_correct = True
                        score = question.points
                        logger.warning(f"DEBUG - _evaluate_answer - Risposta matching forzata come CORRETTA tramite fallback")
            else:
                # Se la risposta non è un dizionario ma c'è solo un possibile abbinamento,
                # assumiamo che l'utente volesse selezionare quello
                correct_pairings = {option.uuid: option.additional_data.get("matches_to") for option in question.answer_options 
                                   if option.additional_data and "matches_to" in option.additional_data}
                if len(correct_pairings) == 1:
                    logger.warning(f"DEBUG - _evaluate_answer - FALLBACK: Usando l'unico abbinamento possibile (risposta non valida)")
                    is_correct = True
                    score = question.points
                    logger.warning(f"DEBUG - _evaluate_answer - Risposta matching forzata come CORRETTA tramite fallback (risposta non valida)")
        
        return is_correct, score

class QuizAttemptRepository:
    """Repository per la gestione dei tentativi di quiz."""
    
    @staticmethod
    def get(db: Session, attempt_id: int) -> Optional[QuizAttempt]:
        """Ottiene un tentativo di quiz dal database per ID."""
        return db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
        
    @staticmethod
    def get_results(db: Session, attempt: QuizAttempt) -> Dict[str, Any]:
        """Ottiene i risultati di un tentativo di quiz."""
        import logging
        logger = logging.getLogger(__name__)
        
        # Calcola il numero di risposte corrette
        correct_answers = db.query(StudentAnswer).filter(
            StudentAnswer.attempt_id == attempt.id,
            StudentAnswer.is_correct == True
        ).count()
        
        # Calcola il numero totale di domande
        quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
        total_questions = db.query(Question).filter(Question.quiz_id == quiz.id).count()
        
        # Calcola la percentuale di risposte corrette
        percentage = (correct_answers / total_questions * 100) if total_questions > 0 else 0.0
        
        # Prendi le risposte dello studente
        answers = db.query(StudentAnswer).filter(StudentAnswer.attempt_id == attempt.id).all()
        answers_data = [
            {
                "question_uuid": answer.question.uuid,
                "question_text": answer.question.text,
                "answer_data": answer.answer_data,
                "is_correct": answer.is_correct,
                "score": answer.score,
            }
            for answer in answers
        ]
        
        # Determina se il quiz era già stato completato
        # Il quiz è already_completed solo se è già stato completato in precedenza 
        # e non è stato appena completato ora (per distinguere il primo completamento dai successivi)
        already_completed = False
        message = None
        
        if attempt.completed_at:
            # Controlla se ci sono altri tentativi completati precedentemente
            # per questo quiz (diversi dall'attuale)
            previous_attempts = db.query(QuizAttempt).filter(
                QuizAttempt.quiz_id == quiz.id,
                QuizAttempt.completed_at != None,
                QuizAttempt.id != attempt.id
            ).count()
            
            already_completed = previous_attempts > 0
            logger.warning(f"DEBUG - Repository get_results - Tentativo {attempt.id} già completato in precedenza: {already_completed}")
            
            if already_completed:
                message = "Questo quiz è già stato completato in precedenza. Non verranno assegnati ulteriori punti."
        
        return {
            "uuid": str(attempt.uuid),
            "quiz_uuid": str(quiz.uuid),
            "score": attempt.score,
            "max_score": attempt.max_score,
            "passed": attempt.passed,
            "started_at": attempt.started_at,
            "completed_at": attempt.completed_at,
            "feedback": attempt.feedback,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "percentage": percentage,
            "answers": answers_data,
            "already_completed": already_completed,
            "message": message,
        }
    
    @staticmethod
    def get_by_uuid(db: Session, uuid: str) -> Optional[QuizAttempt]:
        """Ottiene un tentativo di quiz dal database per UUID."""
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"DEBUG - QuizAttemptRepository.get_by_uuid - Cerco tentativo con UUID: '{uuid}', tipo: {type(uuid)}")
        
        # Prova a usare l'UUID così com'è
        result = db.query(QuizAttempt).filter(QuizAttempt.uuid == uuid).first()
        logger.warning(f"DEBUG - QuizAttemptRepository.get_by_uuid - Risultato ricerca con UUID esatto: {result is not None}")
        
        if not result:
            # Prova a cercare come stringa
            try:
                from uuid import UUID
                # Normalizza l'UUID
                try:
                    normalized_uuid = str(UUID(uuid))
                    logger.warning(f"DEBUG - QuizAttemptRepository.get_by_uuid - UUID normalizzato: {normalized_uuid}")
                    result = db.query(QuizAttempt).filter(QuizAttempt.uuid == normalized_uuid).first()
                    logger.warning(f"DEBUG - QuizAttemptRepository.get_by_uuid - Risultato ricerca con UUID normalizzato: {result is not None}")
                except ValueError:
                    logger.warning(f"DEBUG - QuizAttemptRepository.get_by_uuid - UUID non valido: {uuid}")
                    pass
            except Exception as e:
                logger.warning(f"DEBUG - QuizAttemptRepository.get_by_uuid - Errore nella normalizzazione UUID: {str(e)}")
                pass
        
        # Log su tutti i tentativi se non abbiamo trovato nulla
        if not result:
            all_attempts = db.query(QuizAttempt).limit(10).all()
            if all_attempts:
                logger.warning(f"DEBUG - QuizAttemptRepository.get_by_uuid - Primi 10 tentativi nel DB:")
                for attempt in all_attempts:
                    logger.warning(f"DEBUG - QuizAttemptRepository.get_by_uuid - Tentativo: ID={attempt.id}, UUID={attempt.uuid}")
        
        return result
    
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
    def create(db: Session, quiz_id: int = None, max_score: float = 0, attempt_data: Optional[QuizAttemptCreate] = None) -> QuizAttempt:
        """
        Crea un nuovo tentativo di quiz nel database.
        Supporta sia la chiamata con oggetto QuizAttemptCreate che con parametri separati.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        if attempt_data is not None:
            # Se è stato fornito un oggetto QuizAttemptCreate, usa quello
            logger.warning(f"DEBUG - QuizAttemptRepository.create - Usando oggetto QuizAttemptCreate: {attempt_data}")
            attempt_dict = attempt_data.model_dump()
            db_attempt = QuizAttempt(**attempt_dict)
        else:
            # Altrimenti usa i parametri separati
            logger.warning(f"DEBUG - QuizAttemptRepository.create - Usando parametri separati: quiz_id={quiz_id}, max_score={max_score}")
            db_attempt = QuizAttempt(quiz_id=quiz_id, max_score=max_score)
        
        # Imposta la data di inizio
        db_attempt.started_at = datetime.now()
        
        db.add(db_attempt)
        db.commit()
        db.refresh(db_attempt)
        
        logger.warning(f"DEBUG - QuizAttemptRepository.create - Tentativo creato: ID={db_attempt.id}, UUID={db_attempt.uuid}")
        
        return db_attempt
    
    @staticmethod
    def update(db: Session, attempt: QuizAttempt, attempt_update: QuizAttemptUpdate) -> QuizAttempt:
        """Aggiorna un tentativo di quiz esistente nel database."""
        # Aggiorna solo i campi forniti
        update_data = attempt_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(attempt, field, value)
        
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        
        return attempt
        
    @staticmethod
    def submit_answers(db: Session, attempt: QuizAttempt, answers_data: SubmitQuizAnswers) -> Dict[str, Any]:
        """Invia le risposte di un tentativo di quiz e calcola il punteggio."""
        from datetime import datetime
        from app.db.models.quiz import StudentAnswer
        import logging
        
        logger = logging.getLogger(__name__)
        logger.warning(f"DEBUG - Repository submit_answers - Tentativo ID: {attempt.id}, UUID: {attempt.uuid}")
        logger.warning(f"DEBUG - Repository submit_answers - Quiz ID: {attempt.quiz_id}")
        logger.warning(f"DEBUG - Repository submit_answers - Answers data: {answers_data}")
        
        # Ottieni il quiz associato al tentativo
        quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
        if not quiz:
            logger.warning(f"DEBUG - Repository submit_answers - Quiz non trovato con ID: {attempt.quiz_id}")
            raise ValueError("Quiz non trovato")
        
        # Se il quiz o il tentativo è già completato, restituisci i risultati esistenti
        if quiz.is_completed or attempt.completed_at is not None:
            logger.warning(f"DEBUG - Repository submit_answers - Quiz già completato. Restituisco i risultati precedenti.")
            results = QuizAttemptRepository.get_results(db, attempt)
            results["already_completed"] = True
            results["message"] = "Questo quiz è già stato completato. Il punteggio mostrato è quello del tentativo precedente."
            return results
            
        # Ottieni tutte le domande del quiz
        questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
        
        # Creiamo diversi dizionari per vari tipi di identificatori
        questions_by_uuid = {str(q.uuid): q for q in questions}
        questions_by_id = {q.id: q for q in questions}
        questions_by_str_id = {str(q.id): q for q in questions}
        questions_by_order = {q.order: q for q in questions}          # Aggiungiamo mappatura per il campo order
        questions_by_str_order = {str(q.order): q for q in questions} # Aggiungiamo stringa del campo order
        
        logger.warning(f"DEBUG - Repository submit_answers - Trovate {len(questions)} domande")
        logger.warning(f"DEBUG - Repository submit_answers - IDs domande (UUID): {list(questions_by_uuid.keys())}")
        logger.warning(f"DEBUG - Repository submit_answers - IDs domande (numerici): {list(questions_by_id.keys())}")
        logger.warning(f"DEBUG - Repository submit_answers - Numeri domande (order): {list(questions_by_order.keys())}")
        
        total_score = 0.0
        max_score = 0.0
        all_correct = True  # Flag per verificare se tutte le risposte sono corrette
        
        # Elabora le risposte
        for answer in answers_data.answers:
            logger.warning(f"DEBUG - Repository submit_answers - Elaborazione risposta: {answer}")
            
            # Estrai UUID o ID della domanda
            question_id_or_uuid = None
            
            if isinstance(answer, dict):
                if 'question_uuid' in answer:
                    question_id_or_uuid = answer['question_uuid']
                elif 'question_id' in answer:
                    question_id_or_uuid = answer['question_id']
                elif 'questionId' in answer:
                    question_id_or_uuid = answer['questionId']
            elif hasattr(answer, 'question_uuid'):
                question_id_or_uuid = answer.question_uuid
            elif hasattr(answer, 'question_id'):
                question_id_or_uuid = answer.question_id
            elif hasattr(answer, 'questionId'):
                question_id_or_uuid = answer.questionId
            else:
                logger.warning(f"DEBUG - Repository submit_answers - Risposta senza ID domanda: {answer}")
                continue
                
            logger.warning(f"DEBUG - Repository submit_answers - ID/UUID estratto: {question_id_or_uuid}, tipo: {type(question_id_or_uuid)}")
            
            # Cerca la domanda usando diversi metodi di lookup
            question = None
            
            # Prova a cercare la domanda per UUID
            if isinstance(question_id_or_uuid, str):
                # Prova a cercare direttamente nella map UUID
                if question_id_or_uuid in questions_by_uuid:
                    question = questions_by_uuid[question_id_or_uuid]
                    logger.warning(f"DEBUG - Repository submit_answers - Domanda trovata per UUID: {question_id_or_uuid}")
                # Prova con l'ID come stringa
                elif question_id_or_uuid in questions_by_str_id:
                    question = questions_by_str_id[question_id_or_uuid]
                    logger.warning(f"DEBUG - Repository submit_answers - Domanda trovata per ID (stringa): {question_id_or_uuid}")
                # Prova con il campo order come stringa
                elif question_id_or_uuid in questions_by_str_order:
                    question = questions_by_str_order[question_id_or_uuid]
                    logger.warning(f"DEBUG - Repository submit_answers - Domanda trovata per order (stringa): {question_id_or_uuid}")
                # Prova a convertire in numerico se è un digit
                elif question_id_or_uuid.isdigit():
                    numeric_id = int(question_id_or_uuid)
                    if numeric_id in questions_by_id:
                        question = questions_by_id[numeric_id]
                        logger.warning(f"DEBUG - Repository submit_answers - Domanda trovata per ID numerico: {numeric_id}")
                    elif numeric_id in questions_by_order:
                        question = questions_by_order[numeric_id]
                        logger.warning(f"DEBUG - Repository submit_answers - Domanda trovata per order numerico: {numeric_id}")
            # Altrimenti prova a cercare per ID numerico o order numerico
            elif isinstance(question_id_or_uuid, int):
                if question_id_or_uuid in questions_by_id:
                    question = questions_by_id[question_id_or_uuid]
                    logger.warning(f"DEBUG - Repository submit_answers - Domanda trovata per ID numerico: {question_id_or_uuid}")
                elif question_id_or_uuid in questions_by_order:
                    question = questions_by_order[question_id_or_uuid]
                    logger.warning(f"DEBUG - Repository submit_answers - Domanda trovata per order numerico: {question_id_or_uuid}")
                # Prova anche con conversione a stringa
                elif str(question_id_or_uuid) in questions_by_str_id:
                    question = questions_by_str_id[str(question_id_or_uuid)]
                    logger.warning(f"DEBUG - Repository submit_answers - Domanda trovata per ID numerico convertito a stringa: {question_id_or_uuid}")
            
            if not question:
                logger.warning(f"DEBUG - Repository submit_answers - Domanda non trovata con identificatore: {question_id_or_uuid}")
                
                # Se non abbiamo trovato la domanda e c'è una sola domanda nel quiz, usa quella
                if len(questions) == 1:
                    question = questions[0]
                    logger.warning(f"DEBUG - Repository submit_answers - Usando l'unica domanda disponibile: ID={question.id}, UUID={question.uuid}")
                    # Aggiungiamo log dettagliato sulle opzioni di risposta di questa domanda
                    logger.warning(f"DEBUG - Repository submit_answers - Dettagli della domanda usata come fallback:")
                    logger.warning(f"DEBUG - Repository submit_answers - Testo domanda: {question.text}")
                    logger.warning(f"DEBUG - Repository submit_answers - Tipo domanda: {question.question_type}")
                    logger.warning(f"DEBUG - Repository submit_answers - Punti domanda: {question.points}")
                    logger.warning(f"DEBUG - Repository submit_answers - Opzioni di risposta:")
                    for idx, opt in enumerate(question.answer_options):
                        logger.warning(f"DEBUG - Repository submit_answers - Opzione {idx}: ID={opt.id}, UUID={opt.uuid}, testo={opt.text}, corretta={opt.is_correct}")
                else:
                    # Log aggiuntivi per debug
                    logger.warning(f"DEBUG - Repository submit_answers - Non è stato possibile trovare la domanda. Dettagli domande disponibili:")
                    for idx, q in enumerate(questions):
                        logger.warning(f"DEBUG - Domanda {idx}: ID={q.id}, UUID={q.uuid}, order={q.order}, text={q.text[:30]}...")
                continue
                
            logger.warning(f"DEBUG - Repository submit_answers - Domanda trovata: ID={question.id}, UUID={question.uuid}, Tipo={question.question_type}")
            max_score += question.points
            
            # Estrai la risposta in base al tipo di domanda
            answer_value = None
            
            # Per oggetti dict
            if isinstance(answer, dict):
                if "selected_option_id" in answer:
                    answer_value = answer["selected_option_id"]  # Estrai direttamente l'ID
                elif "selected_option_ids" in answer:
                    answer_value = answer["selected_option_ids"]
                elif "text_answer" in answer:
                    answer_value = {"text_answer": answer["text_answer"]}
            else:
                # Per oggetti Pydantic
                if hasattr(answer, 'selected_option_id') and answer.selected_option_id is not None:
                    answer_value = answer.selected_option_id  # Estrai direttamente l'ID
                elif hasattr(answer, 'selectedOptionId') and answer.selectedOptionId is not None:
                    answer_value = answer.selectedOptionId
                elif hasattr(answer, 'selected_option_ids') and answer.selected_option_ids:
                    answer_value = answer.selected_option_ids
                elif hasattr(answer, 'selectedOptionIds') and answer.selectedOptionIds:
                    answer_value = answer.selectedOptionIds
                elif hasattr(answer, 'text_answer') and answer.text_answer:
                    answer_value = {"text_answer": answer.text_answer}
                elif hasattr(answer, 'textAnswer') and answer.textAnswer:
                    answer_value = {"text_answer": answer.textAnswer}
            
            logger.warning(f"DEBUG - Repository submit_answers - Valore risposta estratto: {answer_value}")
            
            # Calcola se la risposta è corretta e il punteggio
            is_correct, score = QuizRepository._evaluate_answer(question, answer_value)
            total_score += score
            
            logger.warning(f"DEBUG - Repository submit_answers - Risultato valutazione: is_correct={is_correct}, score={score}")
            
            # Se una risposta non è corretta, imposta il flag a False
            if not is_correct:
                all_correct = False
            
            # Salva la risposta nel database
            student_answer = StudentAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                answer_data={"selected_option_id": answer_value} if question.question_type == "single_choice" else answer_value,
                is_correct=is_correct,
                score=score
            )
            db.add(student_answer)
        
        # Aggiorna il tentativo con il punteggio e la data di completamento
        attempt.score = total_score
        attempt.max_score = max_score
        attempt.completed_at = datetime.utcnow()
        
        # Calcola la percentuale di punteggio ottenuto
        percentage_score = (total_score / max_score * 100) if max_score > 0 else 0
        
        # Il quiz è considerato passato se tutte le risposte sono corrette o se è stato raggiunto almeno il 60% del punteggio
        attempt.passed = all_correct or (max_score > 0 and percentage_score >= 60)
        
        logger.warning(f"DEBUG - Repository submit_answers - Punteggio finale: {total_score}/{max_score} ({percentage_score:.1f}%)")
        logger.warning(f"DEBUG - Repository submit_answers - Quiz superato: {attempt.passed}")
        
        # Il quiz è considerato completato una volta che è stato sottomesso
        quiz.is_completed = True
        
        # Ottieni il template del quiz
        quiz_template = db.query(QuizTemplate).filter(QuizTemplate.id == quiz.template_id).first()
        if quiz_template:
            logger.warning(f"DEBUG - Repository submit_answers - Il template del quiz ha {quiz_template.points} punti")
            
            # Se non ci sono domande con punti, usa il punteggio del template
            if max_score == 0:
                logger.warning(f"DEBUG - Repository submit_answers - Nessuna domanda con punti, uso quelli del template: {quiz_template.points}")
                max_score = float(quiz_template.points)
                attempt.max_score = max_score
                # Ricalcola il punteggio in base al punteggio massimo dal template
                if attempt.passed:
                    logger.warning(f"DEBUG - Repository submit_answers - Quiz superato, imposto score = max_score: {max_score}")
                    attempt.score = max_score
                    total_score = max_score
            else:
                # Se il quiz è superato ma il punteggio è zero, usa il punteggio del template
                if attempt.passed and total_score == 0:
                    logger.warning(f"DEBUG - Repository submit_answers - Quiz superato ma punteggio zero, uso punteggio template: {quiz_template.points}")
                    total_score = float(quiz_template.points)
                    attempt.score = total_score
                else:
                    # Altrimenti usa il punteggio effettivo delle domande
                    logger.warning(f"DEBUG - Repository submit_answers - Uso il punteggio effettivo delle domande: {total_score}")
        
        logger.warning(f"DEBUG - Repository submit_answers - Quiz completato: score={total_score}/{max_score} ({percentage_score:.1f}%), passed={attempt.passed}")
        
        db.add(attempt)
        db.add(quiz)
        db.commit()
        db.refresh(attempt)
        
        # Restituisci i risultati
        return QuizAttemptRepository.get_results(db, attempt)
