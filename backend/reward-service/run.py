#!/usr/bin/env python3
"""
Script di avvio per il servizio di gestione ricompense dell'app educativa.
"""
import os
import uvicorn
from dotenv import load_dotenv
from app.db.base import Base, engine
from app.core.config import settings
import logging

# Configurazione del logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Carica le variabili d'ambiente dal file .env
load_dotenv(verbose=True)

def init_db():
    """Inizializza il database creando tutte le tabelle definite nei modelli."""
    try:
        # Crea le tabelle nel database
        Base.metadata.create_all(bind=engine)
        logger.info("Database inizializzato con successo.")
    except Exception as e:
        logger.error(f"Errore durante l'inizializzazione del database: {e}")
        raise

def main():
    """Funzione principale per l'avvio del servizio."""
    try:
        # Inizializza il database
        logger.info("Inizializzazione del database...")
        init_db()
        
        # Avvia il server web
        logger.info(f"Avvio del server su {settings.SERVER_HOST}:{settings.SERVER_PORT}")
        uvicorn.run(
            "app.main:app",
            host=settings.SERVER_HOST,
            port=int(settings.SERVER_PORT),
            reload=True if os.getenv("DEBUG", "False").lower() == "true" else False,
        )
    except Exception as e:
        logger.error(f"Errore durante l'avvio del servizio: {e}")
        raise

if __name__ == "__main__":
    main()
