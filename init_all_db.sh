#!/bin/bash

# Script per inizializzare tutti i database per edu_app
# Autore: Claude
# Data: 2024-03-20
# Modificato per utilizzare PostgreSQL locale anziché Docker
# Modificato per assumere che PostgreSQL sia già in esecuzione

# Directory del progetto
PROJECT_DIR=$(pwd)
BACKEND_DIR="$PROJECT_DIR/backend"

# Configurazione PostgreSQL locale
PG_USER="postgres"
PG_HOST="localhost"
PG_PORT="5432"

echo "=== Inizializzazione dei database per edu_app ==="

echo "1. Verifico connessione a PostgreSQL..."
if ! sudo -u postgres pg_isready -h $PG_HOST -p $PG_PORT &>/dev/null; then
    echo "❌ Impossibile connettersi a PostgreSQL locale. Assicurati che sia in esecuzione."
    echo "   Avvia PostgreSQL manualmente e riprova."
    exit 1
else
    echo "✅ Connessione a PostgreSQL stabilita."
fi

echo "2. Creazione dei database se non esistono..."

# Elenco dei database da creare
DATABASES=("edu_app_auth" "edu_app_quiz" "edu_app_path" "edu_app_reward")

for DB in "${DATABASES[@]}"; do
    echo "   - Verifico database $DB..."
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB; then
        echo "     Creo database $DB..."
        sudo -u postgres psql -c "CREATE DATABASE $DB;"
    else
        echo "     Database $DB già esiste."
    fi
done

echo "3. Preparazione delle variabili d'ambiente per i servizi..."
export POSTGRES_SERVER=$PG_HOST
export POSTGRES_PORT=$PG_PORT
export POSTGRES_USER=$PG_USER

echo "4. Inizializzazione del database auth-service..."
cd $BACKEND_DIR/auth-service
python run.py &
sleep 5
pkill -f "python run.py"
echo "   Database auth-service inizializzato."

echo "5. Inizializzazione del database quiz-service..."
cd $BACKEND_DIR/quiz-service
python init_db.py
echo "   Database quiz-service inizializzato."

echo "6. Inizializzazione del database path-service..."
cd $BACKEND_DIR/path-service
python init_db.py
echo "   Database path-service inizializzato."

echo "7. Inizializzazione del database reward-service..."
cd $BACKEND_DIR/reward-service
python init_db.py
echo "   Database reward-service inizializzato."

echo "=== Tutti i database sono stati inizializzati con successo! ==="
echo "Ora puoi avviare i servizi con lo script lancia-locale.sh" 