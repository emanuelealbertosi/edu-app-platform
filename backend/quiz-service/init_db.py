#!/usr/bin/env python3
"""
Script per inizializzare il database del quiz-service.
Crea le tabelle e popola i dati iniziali.
"""

import os
import sys
from pathlib import Path

# Aggiungi la directory principale al PYTHONPATH
sys.path.append(str(Path(__file__).parent))

from app.db.init_db import main

if __name__ == "__main__":
    main()
    print("Database del quiz-service inizializzato con successo!")