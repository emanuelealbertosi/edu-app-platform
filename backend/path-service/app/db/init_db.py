from sqlalchemy.orm import Session
import logging
from datetime import datetime, timedelta

from app.db.base import Base, engine
from app.db.models.path import PathCategory, PathTemplate, PathNodeTemplate, PathNodeType
from app.db.repositories.path_template_repository import PathCategoryRepository, PathTemplateRepository

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Categorie predefinite
DEFAULT_CATEGORIES = [
    {"name": "Elementari", "description": "Percorsi educativi per alunni della scuola elementare"},
    {"name": "Medie", "description": "Percorsi educativi per studenti della scuola media"},
    {"name": "Liceo", "description": "Percorsi educativi per studenti del liceo"},
    {"name": "Lettura", "description": "Percorsi di lettura per tutte le età"},
    {"name": "Scienze", "description": "Percorsi di apprendimento scientifico"},
    {"name": "Matematica", "description": "Percorsi per migliorare le competenze matematiche"},
    {"name": "Lingue", "description": "Percorsi per l'apprendimento delle lingue"}
]

# Percorsi di esempio
SAMPLE_TEMPLATES = [
    {
        "title": "Introduzione alla Matematica",
        "description": "Un percorso base per introdurre i concetti fondamentali della matematica",
        "instructions": "Completa i quiz e le attività in ordine. Ogni tappa richiede il completamento della precedente.",
        "difficulty_level": 1,
        "points": 100,
        "estimated_days": 14,
        "is_active": True,
        "is_public": True,
        "category_name": "Elementari",
        "created_by": "admin",  # Questo sarà l'UUID dell'admin, per ora usiamo una stringa
        "created_by_role": "admin",
        "nodes": [
            {
                "title": "I numeri da 1 a 10",
                "description": "Impara a riconoscere e contare i numeri da 1 a 10",
                "node_type": PathNodeType.CONTENT,
                "points": 5,
                "order": 1,
                "content": {
                    "content": "In questa lezione imparerai a riconoscere e contare i numeri da 1 a 10.",
                    "content_type": "text"
                },
                "estimated_time": 15
            },
            {
                "title": "Quiz sui numeri",
                "description": "Verifica la tua conoscenza dei numeri da 1 a 10",
                "node_type": PathNodeType.QUIZ,
                "points": 10,
                "order": 2,
                "dependencies": {"dependencies": ["1"]},  # Dipende dal nodo 1
                "content": {
                    "quiz_template_id": "quiz-template-id-1"  # ID fittizio, sarà sostituito da uno reale
                },
                "estimated_time": 20
            },
            {
                "title": "Le operazioni di base",
                "description": "Impara le operazioni di addizione e sottrazione",
                "node_type": PathNodeType.CONTENT,
                "points": 5,
                "order": 3,
                "dependencies": {"dependencies": ["2"]},  # Dipende dal nodo 2
                "content": {
                    "content": "In questa lezione imparerai a fare addizioni e sottrazioni semplici.",
                    "content_type": "text"
                },
                "estimated_time": 30
            },
            {
                "title": "Esercizio pratico",
                "description": "Applica ciò che hai imparato con un esercizio pratico",
                "node_type": PathNodeType.TASK,
                "points": 15,
                "order": 4,
                "dependencies": {"dependencies": ["3"]},  # Dipende dal nodo 3
                "content": {
                    "task_description": "Risolvi 10 problemi di addizione e sottrazione su un foglio di carta. Chiedi a un genitore di verificare le tue risposte.",
                    "verification_type": "manual"
                },
                "estimated_time": 45
            },
            {
                "title": "Quiz finale",
                "description": "Verifica finale sulle operazioni di base",
                "node_type": PathNodeType.QUIZ,
                "points": 20,
                "order": 5,
                "dependencies": {"dependencies": ["4"]},  # Dipende dal nodo 4
                "content": {
                    "quiz_template_id": "quiz-template-id-2"  # ID fittizio, sarà sostituito da uno reale
                },
                "estimated_time": 30
            },
            {
                "title": "Attestato di completamento",
                "description": "Congratulazioni per aver completato il percorso!",
                "node_type": PathNodeType.REWARD,
                "points": 50,
                "order": 6,
                "dependencies": {"dependencies": ["5"]},  # Dipende dal nodo 5
                "content": {
                    "reward_id": "badge-math-basics",
                    "reward_type": "badge"
                },
                "estimated_time": 5
            }
        ]
    },
    {
        "title": "Lettura per Principianti",
        "description": "Un percorso per sviluppare le capacità di lettura nei bambini",
        "instructions": "Leggi i testi suggeriti e completa le attività. Chiedi aiuto a un adulto se necessario.",
        "difficulty_level": 1,
        "points": 80,
        "estimated_days": 21,
        "is_active": True,
        "is_public": True,
        "category_name": "Lettura",
        "created_by": "admin",  # Questo sarà l'UUID dell'admin, per ora usiamo una stringa
        "created_by_role": "admin",
        "nodes": [
            {
                "title": "Lettere dell'alfabeto",
                "description": "Impara a riconoscere le lettere dell'alfabeto",
                "node_type": PathNodeType.CONTENT,
                "points": 5,
                "order": 1,
                "content": {
                    "content": "In questa lezione imparerai a riconoscere tutte le lettere dell'alfabeto.",
                    "content_type": "text"
                },
                "estimated_time": 20
            },
            {
                "title": "Quiz sulle lettere",
                "description": "Verifica la tua conoscenza delle lettere dell'alfabeto",
                "node_type": PathNodeType.QUIZ,
                "points": 10,
                "order": 2,
                "dependencies": {"dependencies": ["1"]},  # Dipende dal nodo 1
                "content": {
                    "quiz_template_id": "quiz-template-id-3"  # ID fittizio, sarà sostituito da uno reale
                },
                "estimated_time": 15
            },
            {
                "title": "Sillabe e parole semplici",
                "description": "Impara a formare sillabe e parole semplici",
                "node_type": PathNodeType.CONTENT,
                "points": 10,
                "order": 3,
                "dependencies": {"dependencies": ["2"]},  # Dipende dal nodo 2
                "content": {
                    "content": "In questa lezione imparerai a combinare le lettere per formare sillabe e parole semplici.",
                    "content_type": "text"
                },
                "estimated_time": 30
            },
            {
                "title": "Lettura guidata",
                "description": "Leggi un breve testo con l'aiuto di un adulto",
                "node_type": PathNodeType.TASK,
                "points": 15,
                "order": 4,
                "dependencies": {"dependencies": ["3"]},  # Dipende dal nodo 3
                "content": {
                    "task_description": "Leggi un breve racconto insieme a un adulto, chiedendo aiuto quando necessario.",
                    "verification_type": "manual"
                },
                "estimated_time": 45
            },
            {
                "title": "Comprensione del testo",
                "description": "Verifica la comprensione del testo letto",
                "node_type": PathNodeType.QUIZ,
                "points": 20,
                "order": 5,
                "dependencies": {"dependencies": ["4"]},  # Dipende dal nodo 4
                "content": {
                    "quiz_template_id": "quiz-template-id-4"  # ID fittizio, sarà sostituito da uno reale
                },
                "estimated_time": 20
            },
            {
                "title": "Attestato di lettura",
                "description": "Congratulazioni per aver completato il percorso di lettura!",
                "node_type": PathNodeType.REWARD,
                "points": 20,
                "order": 6,
                "dependencies": {"dependencies": ["5"]},  # Dipende dal nodo 5
                "content": {
                    "reward_id": "badge-reading-basics",
                    "reward_type": "badge"
                },
                "estimated_time": 5
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
        existing_category = PathCategoryRepository.get_by_name(db, name=category["name"])
        if not existing_category:
            PathCategoryRepository.create(
                db=db,
                name=category["name"],
                description=category.get("description")
            )
            logger.info(f"Creata categoria: {category['name']}")
    
    # Aggiungi i template di percorso di esempio
    for template_data in SAMPLE_TEMPLATES:
        # Trova la categoria
        category_name = template_data.pop("category_name")
        category = PathCategoryRepository.get_by_name(db, name=category_name)
        
        if not category:
            logger.warning(f"Categoria {category_name} non trovata, non posso creare il template")
            continue
        
        # Verifica se esiste già un template con lo stesso titolo
        existing_templates = PathTemplateRepository.get_all(db)
        if any(template.title == template_data["title"] for template in existing_templates):
            logger.info(f"Template '{template_data['title']}' già esistente, salto la creazione")
            continue
        
        # Prepara i dati per la creazione del template
        nodes_data = template_data.pop("nodes")
        template_data["category_id"] = category.id
        
        # Costruisci l'oggetto per la creazione del template
        from app.schemas.path import PathTemplateCreate, PathNodeTemplateCreate
        
        # Converti i nodi
        nodes = []
        for node_data in nodes_data:
            nodes.append(PathNodeTemplateCreate(**node_data))
        
        # Crea il template
        template_create = PathTemplateCreate(**template_data, nodes=nodes)
        PathTemplateRepository.create(db, template_create)
        
        logger.info(f"Creato template di percorso: {template_data['title']}")
    
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
