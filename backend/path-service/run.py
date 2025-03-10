import uvicorn
import logging
from app.core.config import settings
from app.db.init_db import init_db
from app.db.base import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """
    Funzione principale per avviare il servizio dei percorsi educativi.
    Prima di avviare il server, inizializza il database.
    """
    logger.info("Inizializzazione del database...")
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    
    logger.info("Database inizializzato. Avvio del server...")
    uvicorn.run(
        "app.main:app", 
        host=settings.SERVER_HOST, 
        port=settings.SERVER_PORT,
        reload=True
    )

if __name__ == "__main__":
    main()
