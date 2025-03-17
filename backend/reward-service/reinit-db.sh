#!/bin/bash

# Attiva l'ambiente virtuale
source /home/emanuele/claude/edu_app/venv/bin/activate

# CD alla directory corrente
cd "$(dirname "$0")"

# Esegui lo script di inizializzazione del database
export PYTHONPATH=$PYTHONPATH:/home/emanuele/claude/edu_app/backend/reward-service
python -m app.db.init_db

echo "Database reinizializzato con successo!"
