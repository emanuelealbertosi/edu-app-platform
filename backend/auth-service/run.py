import uvicorn
import os
import sys
from sqlalchemy.orm import Session

# Aggiungi la directory corrente al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.base import SessionLocal
from app.db.init_db import init_db

def init() -> None:
    """
    Inizializza il database prima di avviare l'applicazione.
    """
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()

def main() -> None:
    """
    Punto di ingresso principale per l'avvio del servizio.
    """
    print("Inizializzazione del database...")
    init()
    
    print("Avvio del servizio di autenticazione...")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )

if __name__ == "__main__":
    main()
