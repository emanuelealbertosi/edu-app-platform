#!/bin/bash

# Script per aggiornare i database dopo l'inizializzazione
# Autore: Claude
# Data: 2024-03-23

# Directory del progetto
PROJECT_DIR=$(pwd)
BACKEND_DIR="$PROJECT_DIR/backend"

echo "=== Script di post-inizializzazione dei database ==="

echo "1. Aggiornamento struttura database quiz-service..."
cd $BACKEND_DIR/quiz-service
python update_db.py
echo "   Database quiz-service aggiornato."

echo "=== Aggiornamenti completati con successo! ===" 