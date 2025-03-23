#!/usr/bin/env python3
"""
Script per inizializzare il database dell'auth-service.
Crea le tabelle e popola i dati iniziali.
"""

import os
import sys
from pathlib import Path

# Aggiungi la directory principale al PYTHONPATH
sys.path.append(str(Path(__file__).parent))

def main():
    from app.db.base import Base, engine
    from app.db.init_db import init_db
    from app.db.base import SessionLocal
    
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()
    print("Database dell'auth-service inizializzato con successo!") 