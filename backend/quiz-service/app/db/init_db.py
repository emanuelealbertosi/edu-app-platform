from sqlalchemy.orm import Session
import logging
from datetime import datetime

from app.db.base import Base, engine
from app.db.models.quiz import QuizCategory, QuizTemplate, QuestionTemplate, AnswerOptionTemplate
from app.db.repositories.quiz_template_repository import QuizCategoryRepository, QuizTemplateRepository

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Categorie predefinite
DEFAULT_CATEGORIES = [
    {"name": "Matematica", "description": "Quiz di matematica per diversi livelli"},
    {"name": "Italiano", "description": "Quiz di grammatica, lettura e comprensione italiana"},
    {"name": "Scienze", "description": "Quiz di scienze naturali, chimica e fisica"},
    {"name": "Storia", "description": "Quiz di storia mondiale e italiana"},
    {"name": "Geografia", "description": "Quiz di geografia mondiale e italiana"},
    {"name": "Inglese", "description": "Quiz di inglese e comprensione linguistica"}
]

# Quiz di esempio per iniziare
SAMPLE_QUIZZES = [
    {
        "title": "Quiz di Matematica Base",
        "description": "Quiz per testare le conoscenze di matematica di base",
        "instructions": "Rispondi alle seguenti domande. Puoi utilizzare carta e penna per i calcoli.",
        "difficulty_level": 1,
        "points": 10,
        "time_limit": 600,  # 10 minuti
        "passing_score": 60.0,
        "category_name": "Matematica",
        "created_by": "admin",  # Questo sarà l'UUID dell'admin, per ora usiamo una stringa
        "questions": [
            {
                "text": "Quanto fa 5 + 7?",
                "question_type": "single_choice",
                "points": 1,
                "order": 1,
                "answer_options": [
                    {"text": "10", "is_correct": False, "order": 1},
                    {"text": "12", "is_correct": True, "order": 2},
                    {"text": "15", "is_correct": False, "order": 3},
                    {"text": "11", "is_correct": False, "order": 4}
                ]
            },
            {
                "text": "Quanto fa 8 × 9?",
                "question_type": "single_choice",
                "points": 1,
                "order": 2,
                "answer_options": [
                    {"text": "63", "is_correct": False, "order": 1},
                    {"text": "72", "is_correct": True, "order": 2},
                    {"text": "81", "is_correct": False, "order": 3},
                    {"text": "64", "is_correct": False, "order": 4}
                ]
            },
            {
                "text": "Quali di questi numeri sono pari?",
                "question_type": "multiple_choice",
                "points": 2,
                "order": 3,
                "answer_options": [
                    {"text": "2", "is_correct": True, "order": 1},
                    {"text": "5", "is_correct": False, "order": 2},
                    {"text": "8", "is_correct": True, "order": 3},
                    {"text": "10", "is_correct": True, "order": 4},
                    {"text": "13", "is_correct": False, "order": 5}
                ]
            },
            {
                "text": "È vero che tutti i triangoli hanno tre lati?",
                "question_type": "true_false",
                "points": 1,
                "order": 4,
                "answer_options": [
                    {"text": "Vero", "is_correct": True, "order": 1},
                    {"text": "Falso", "is_correct": False, "order": 2}
                ]
            },
            {
                "text": "Quanto fa 20 ÷ 4?",
                "question_type": "numeric",
                "points": 1,
                "order": 5,
                "answer_options": [
                    {"text": "5", "is_correct": True, "order": 1}
                ]
            }
        ]
    },
    {
        "title": "Quiz di Italiano Base",
        "description": "Quiz per testare le conoscenze di grammatica italiana di base",
        "instructions": "Leggi attentamente le domande e scegli la risposta corretta.",
        "difficulty_level": 1,
        "points": 10,
        "time_limit": 600,  # 10 minuti
        "passing_score": 60.0,
        "category_name": "Italiano",
        "created_by": "admin",  # Questo sarà l'UUID dell'admin, per ora usiamo una stringa
        "questions": [
            {
                "text": "Quale di queste parole è scritta correttamente?",
                "question_type": "single_choice",
                "points": 1,
                "order": 1,
                "answer_options": [
                    {"text": "Aquila", "is_correct": True, "order": 1},
                    {"text": "Acquila", "is_correct": False, "order": 2},
                    {"text": "Acuila", "is_correct": False, "order": 3},
                    {"text": "Akuila", "is_correct": False, "order": 4}
                ]
            },
            {
                "text": "Quale di questi è un articolo determinativo?",
                "question_type": "single_choice",
                "points": 1,
                "order": 2,
                "answer_options": [
                    {"text": "Un", "is_correct": False, "order": 1},
                    {"text": "Il", "is_correct": True, "order": 2},
                    {"text": "Dei", "is_correct": False, "order": 3},
                    {"text": "Uno", "is_correct": False, "order": 4}
                ]
            },
            {
                "text": "Quali di queste sono congiunzioni?",
                "question_type": "multiple_choice",
                "points": 2,
                "order": 3,
                "answer_options": [
                    {"text": "E", "is_correct": True, "order": 1},
                    {"text": "O", "is_correct": True, "order": 2},
                    {"text": "Ma", "is_correct": True, "order": 3},
                    {"text": "In", "is_correct": False, "order": 4},
                    {"text": "Su", "is_correct": False, "order": 5}
                ]
            },
            {
                "text": "È vero che il plurale di 'uomo' è 'uomi'?",
                "question_type": "true_false",
                "points": 1,
                "order": 4,
                "answer_options": [
                    {"text": "Vero", "is_correct": False, "order": 1},
                    {"text": "Falso", "is_correct": True, "order": 2}
                ]
            },
            {
                "text": "Come si scrive correttamente?",
                "question_type": "single_choice",
                "points": 1,
                "order": 5,
                "answer_options": [
                    {"text": "Non c'è", "is_correct": True, "order": 1},
                    {"text": "Non ce", "is_correct": False, "order": 2},
                    {"text": "Non c'è", "is_correct": False, "order": 3},
                    {"text": "Non c'é", "is_correct": False, "order": 4}
                ]
            }
        ]
    }
]

def init_db(db: Session) -> None:
    """Inizializza il database con i valori predefiniti."""
    # Crea le tabelle se non esistono
    Base.metadata.create_all(bind=engine)
    
    # Aggiungi le categorie predefinite
    for category in DEFAULT_CATEGORIES:
        existing_category = QuizCategoryRepository.get_by_name(db, name=category["name"])
        if not existing_category:
            QuizCategoryRepository.create(
                db=db,
                name=category["name"],
                description=category.get("description")
            )
            logger.info(f"Creata categoria: {category['name']}")
    
    # Aggiungi i quiz di esempio
    for quiz_data in SAMPLE_QUIZZES:
        # Trova la categoria
        category_name = quiz_data.pop("category_name")
        category = QuizCategoryRepository.get_by_name(db, name=category_name)
        
        if not category:
            logger.warning(f"Categoria {category_name} non trovata, non posso creare il quiz")
            continue
        
        # Verifica se esiste già un quiz con lo stesso titolo
        existing_quizzes = QuizTemplateRepository.get_all(db)
        if any(quiz.title == quiz_data["title"] for quiz in existing_quizzes):
            logger.info(f"Quiz '{quiz_data['title']}' già esistente, salto la creazione")
            continue
        
        # Prepara i dati per la creazione del quiz
        questions_data = quiz_data.pop("questions")
        quiz_data["category_id"] = category.id
        
        # Costruisci l'oggetto per la creazione del quiz
        from app.schemas.quiz import QuizTemplateCreate, QuestionTemplateCreate, AnswerOptionTemplateCreate
        
        # Converti le domande
        questions = []
        for q_data in questions_data:
            answer_options_data = q_data.pop("answer_options")
            answer_options = [AnswerOptionTemplateCreate(**opt) for opt in answer_options_data]
            questions.append(QuestionTemplateCreate(**q_data, answer_options=answer_options))
        
        # Crea il quiz
        quiz_create = QuizTemplateCreate(**quiz_data, questions=questions)
        QuizTemplateRepository.create(db, quiz_create)
        
        logger.info(f"Creato quiz di esempio: {quiz_data['title']}")
    
    logger.info("Inizializzazione del database completata")

def main():
    """Funzione principale per l'inizializzazione del database."""
    from app.db.base import SessionLocal
    
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()
