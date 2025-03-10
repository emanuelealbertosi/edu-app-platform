#!/usr/bin/env python3
"""
Script di avvio per l'API Gateway dell'app educativa.
"""
import os
import uvicorn
from dotenv import load_dotenv
import logging
from app.core.config import settings

# Configurazione del logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Carica le variabili d'ambiente dal file .env
load_dotenv(verbose=True)

def main():
    """Funzione principale per l'avvio del servizio."""
    try:
        # Avvia il server web
        logger.info(f"Avvio del server API Gateway su {settings.SERVER_HOST}:{settings.SERVER_PORT}")
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
