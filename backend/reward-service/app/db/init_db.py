from sqlalchemy.orm import Session
import logging
from datetime import datetime, timedelta

from app.db.base import Base, engine
from app.db.models.reward import RewardCategory, Reward, RewardType, RewardRarity
from app.db.repositories.reward_repository import RewardCategoryRepository, RewardRepository

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Categorie predefinite di ricompense
DEFAULT_CATEGORIES = [
    {"name": "Badge", "description": "Badge che rappresentano traguardi e competenze acquisite"},
    {"name": "Certificati", "description": "Certificati di completamento per percorsi educativi"},
    {"name": "Trofei", "description": "Trofei per risultati speciali e eccellenza accademica"},
    {"name": "Privilegi", "description": "Privilegi speciali sbloccabili dagli studenti"},
    {"name": "Punti Esperienza", "description": "Punti che misurano il progresso generale dello studente"}
]

# Ricompense di esempio
SAMPLE_REWARDS = [
    {
        "name": "Matematico Principiante",
        "description": "Completa con successo il tuo primo percorso di matematica",
        "reward_type": RewardType.BADGE,
        "rarity": RewardRarity.COMMON,
        "icon_url": "/assets/badges/math-beginner.png",
        "points_value": 10,
        "is_active": True,
        "is_public": True,
        "category_name": "Badge",
        "created_by": "admin",  # Questo sarà l'UUID dell'admin, per ora usiamo una stringa
    },
    {
        "name": "Lettore Avido",
        "description": "Completa 5 percorsi di lettura",
        "reward_type": RewardType.BADGE,
        "rarity": RewardRarity.UNCOMMON,
        "icon_url": "/assets/badges/avid-reader.png",
        "points_value": 25,
        "requirements": {"percorsi_lettura_completati": 5},
        "is_active": True,
        "is_public": True,
        "category_name": "Badge",
        "created_by": "admin",
    },
    {
        "name": "Certificato di Matematica Elementare",
        "description": "Certifica le competenze matematiche di base",
        "reward_type": RewardType.CERTIFICATE,
        "rarity": RewardRarity.RARE,
        "image_url": "/assets/certificates/elementary-math.png",
        "points_value": 50,
        "is_active": True,
        "is_public": True,
        "category_name": "Certificati",
        "created_by": "admin",
    },
    {
        "name": "Stella della Scienza",
        "description": "Dimostra eccellenza nei percorsi scientifici",
        "reward_type": RewardType.TROPHY,
        "rarity": RewardRarity.EPIC,
        "icon_url": "/assets/trophies/science-star.png",
        "points_value": 100,
        "is_active": True,
        "is_public": True,
        "category_name": "Trofei",
        "created_by": "admin",
    },
    {
        "name": "Quiz Bonus",
        "description": "Sblocca accesso a quiz bonus nelle materie preferite",
        "reward_type": RewardType.PRIVILEGE,
        "rarity": RewardRarity.UNCOMMON,
        "icon_url": "/assets/privileges/bonus-quiz.png",
        "points_value": 20,
        "is_active": True,
        "is_public": True,
        "category_name": "Privilegi",
        "created_by": "admin",
    }
]

def init_db(db: Session) -> None:
    """Inizializza il database con i valori predefiniti."""
    # Crea le tabelle se non esistono
    Base.metadata.create_all(bind=engine)
    
    # Aggiungi le categorie predefinite
    for category in DEFAULT_CATEGORIES:
        existing_category = RewardCategoryRepository.get_by_name(db, name=category["name"])
        if not existing_category:
            RewardCategoryRepository.create(
                db=db,
                category_data=RewardCategoryRepository.create(
                    db=db,
                    category_data=category
                )
            )
            logger.info(f"Creata categoria: {category['name']}")
    
    # Aggiungi le ricompense di esempio
    for reward_data in SAMPLE_REWARDS:
        # Trova la categoria
        category_name = reward_data.pop("category_name")
        category = RewardCategoryRepository.get_by_name(db, name=category_name)
        
        if not category:
            logger.warning(f"Categoria {category_name} non trovata, non posso creare la ricompensa")
            continue
        
        # Prepara i dati per la creazione della ricompensa
        reward_data["category_id"] = category.id
        
        # Verifica se esiste già una ricompensa con lo stesso nome
        existing_rewards = RewardRepository.get_all(db)
        if any(reward.name == reward_data["name"] for reward in existing_rewards):
            logger.info(f"Ricompensa '{reward_data['name']}' già esistente, salto la creazione")
            continue
        
        # Crea la ricompensa
        from app.schemas.reward import RewardCreate
        reward_create = RewardCreate(**reward_data)
        RewardRepository.create(db, reward_create)
        
        logger.info(f"Creata ricompensa: {reward_data['name']}")
    
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
