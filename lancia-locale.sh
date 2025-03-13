#!/bin/bash

# Script per la gestione dell'ambiente di sviluppo locale
# Autore: Cascade AI
# Data: 2025-03-10

# Directory del progetto
PROJECT_DIR=$(pwd)
VENV_DIR="$PROJECT_DIR/venv"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOG_FILE="$PROJECT_DIR/edu_app.log"

# Nome del container PostgreSQL
DB_CONTAINER_NAME="edu_app_postgres"

# Inizializza/resetta il file di log
init_logfile() {
    echo "--- Log di edu_app iniziato il $(date) ---" > "$LOG_FILE"
    echo "Logs verranno salvati in: $LOG_FILE"
}

# Verifica se il database Docker è in esecuzione e lo avvia se necessario
check_and_start_db() {
    echo "Verifico lo stato del database PostgreSQL..." | tee -a "$LOG_FILE"
    
    # Controlla se il container esiste e il suo stato
    if docker ps -a --format "{{.Names}}" | grep -q "^${DB_CONTAINER_NAME}$"; then
        # Il container esiste, verifica se è in esecuzione
        if ! docker ps --format "{{.Names}}" | grep -q "^${DB_CONTAINER_NAME}$"; then
            echo "Il database Docker esiste ma non è in esecuzione. Avvio..." | tee -a "$LOG_FILE"
            docker start ${DB_CONTAINER_NAME} | tee -a "$LOG_FILE"
        else
            echo "Il database Docker è già in esecuzione." | tee -a "$LOG_FILE"
        fi
    else
        # Il container non esiste, deve essere creato con docker-compose
        echo "Il container del database non esiste. Avvio con docker-compose..." | tee -a "$LOG_FILE"
        docker-compose -f "$PROJECT_DIR/docker-compose.dev.yml" up -d postgres | tee -a "$LOG_FILE"
    fi
    
    # Aspetta che il database sia pronto
    echo "Attesa che il database sia pronto..." | tee -a "$LOG_FILE"
    for i in {1..30}; do
        if docker exec ${DB_CONTAINER_NAME} pg_isready -U postgres &>/dev/null; then
            echo "Database PostgreSQL pronto!" | tee -a "$LOG_FILE"
            return 0
        fi
        echo -n "." | tee -a "$LOG_FILE"
        sleep 1
    done
    
    echo "\nImpossibile connettersi al database dopo 30 secondi." | tee -a "$LOG_FILE"
    return 1
}

# Funzione per mostrare messaggio di utilizzo
usage() {
    echo "Utilizzo: $0 [opzione]"
    echo ""
    echo "Opzioni:"
    echo "  setup           Configura l'ambiente di sviluppo (venv, dipendenze)"
    echo "  start           Avvia tutti i servizi (backend e frontend)"
    echo "  stop            Ferma tutti i servizi"
    echo "  restart         Riavvia tutti i servizi"
    echo "  backend         Avvia solo i servizi di backend"
    echo "  frontend        Avvia solo il frontend"
    echo "  stop-frontend   Ferma solo il frontend"
    echo "  restart-frontend Riavvia solo il frontend"
    echo "  stop-backend    Ferma solo i servizi backend"
    echo "  restart-backend Riavvia solo i servizi backend"
    echo "  status          Mostra lo stato dei servizi"
    echo "  help            Mostra questo messaggio di aiuto"
    exit 1
}

# Verifica se l'ambiente virtuale esiste e lo attiva
activate_venv() {
    if [ ! -d "$VENV_DIR" ]; then
        echo "Ambiente virtuale non trovato. Esegui prima '$0 setup'"
        exit 1
    fi
    
    source "$VENV_DIR/bin/activate"
    echo "Ambiente virtuale attivato."
}

# Configura l'ambiente di sviluppo
setup() {
    echo "Configurazione dell'ambiente di sviluppo..." | tee -a "$LOG_FILE"
    
    # Crea l'ambiente virtuale se non esiste
    if [ ! -d "$VENV_DIR" ]; then
        echo "Creazione ambiente virtuale Python..." | tee -a "$LOG_FILE"
        python3 -m venv "$VENV_DIR"
    fi
    
    # Attiva l'ambiente virtuale
    activate_venv
    
    # Installa le dipendenze backend
    echo "Installazione dipendenze backend..." | tee -a "$LOG_FILE"
    pip install -r "$BACKEND_DIR/requirements.txt" | tee -a "$LOG_FILE"
    
    # Verifica se Node.js è installato
    if command -v node > /dev/null; then
        echo "Node.js trovato. Configurazione frontend..." | tee -a "$LOG_FILE"
        if [ -f "$FRONTEND_DIR/package.json" ]; then
            cd "$FRONTEND_DIR" && npm install | tee -a "$LOG_FILE"
        else
            echo "package.json non trovato in $FRONTEND_DIR. Frontend non configurato." | tee -a "$LOG_FILE"
        fi
    else
        echo "Node.js non trovato. Installalo per configurare il frontend." | tee -a "$LOG_FILE"
    fi
    
    # Verifica e avvia il database Docker
    check_and_start_db
    
    echo "Configurazione completata!" | tee -a "$LOG_FILE"
}

# Avvia i servizi di backend
start_backend() {
    echo "Avvio servizi backend..." | tee -a "$LOG_FILE"
    activate_venv
    
    # Verifica e avvia il database se necessario
    if ! check_and_start_db; then
        echo "ERRORE: Impossibile avviare o connettersi al database. I servizi backend potrebbero non funzionare correttamente." | tee -a "$LOG_FILE"
    fi
    
    # Per ora avviamo i servizi in terminali separati
    echo "Avvio auth-service..." | tee -a "$LOG_FILE"
    if [ -f "$BACKEND_DIR/auth-service/app/main.py" ]; then
        (cd "$BACKEND_DIR/auth-service" && source "$VENV_DIR/bin/activate" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 2>&1 | tee -a "$LOG_FILE") &
    else
        echo "auth-service non disponibile." | tee -a "$LOG_FILE"
    fi
    
    echo "Avvio quiz-service..." | tee -a "$LOG_FILE"
    if [ -f "$BACKEND_DIR/quiz-service/app/main.py" ]; then
        (cd "$BACKEND_DIR/quiz-service" && source "$VENV_DIR/bin/activate" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8002 2>&1 | tee -a "$LOG_FILE") &
    else
        echo "quiz-service non disponibile." | tee -a "$LOG_FILE"
    fi
    
    echo "Avvio path-service..." | tee -a "$LOG_FILE"
    if [ -f "$BACKEND_DIR/path-service/app/main.py" ]; then
        (cd "$BACKEND_DIR/path-service" && source "$VENV_DIR/bin/activate" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8003 2>&1 | tee -a "$LOG_FILE") &
    else
        echo "path-service non disponibile." | tee -a "$LOG_FILE"
    fi
    
    echo "Avvio reward-service..." | tee -a "$LOG_FILE"
    if [ -f "$BACKEND_DIR/reward-service/app/main.py" ]; then
        (cd "$BACKEND_DIR/reward-service" && source "$VENV_DIR/bin/activate" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8004 2>&1 | tee -a "$LOG_FILE") &
    else
        echo "reward-service non disponibile." | tee -a "$LOG_FILE"
    fi
    
    echo "Avvio api-gateway..." | tee -a "$LOG_FILE"
    if [ -f "$BACKEND_DIR/api-gateway/app/main.py" ]; then
        (cd "$BACKEND_DIR/api-gateway" && source "$VENV_DIR/bin/activate" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 2>&1 | tee -a "$LOG_FILE") &
    else
        echo "api-gateway non disponibile." | tee -a "$LOG_FILE"
    fi
}

# Avvia il frontend
start_frontend() {
    echo "Avvio frontend..." | tee -a "$LOG_FILE"
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        (cd "$FRONTEND_DIR" && npm start 2>&1 | tee -a "$LOG_FILE") &
    else
        echo "Frontend non configurato." | tee -a "$LOG_FILE"
    fi
}

# Ferma solo i servizi backend
stop_backend() {
    echo "Arresto dei servizi backend..." | tee -a "$LOG_FILE"
    # Trova e termina i processi uvicorn per i servizi backend
    pkill -f "uvicorn app.main:app"
    echo "Servizi backend arrestati." | tee -a "$LOG_FILE"
}

# Ferma solo il frontend
stop_frontend() {
    echo "Arresto del frontend..." | tee -a "$LOG_FILE"
    # Trova e termina i processi npm per il frontend
    pkill -f "npm start"
    # Termina anche i processi Node.js relativi a react-scripts
    pkill -f "react-scripts start"
    # Termina tutti i processi Node.js relativi a frontend
    pkill -f "node.*frontend.*node_modules"
    echo "Frontend arrestato." | tee -a "$LOG_FILE"
}

# Ferma tutti i servizi
stop_services() {
    echo "Arresto di tutti i servizi..." | tee -a "$LOG_FILE"
    stop_backend
    stop_frontend
    echo "Tutti i servizi arrestati." | tee -a "$LOG_FILE"
}

# Mostra lo stato dei servizi
show_status() {
    echo "Stato dei servizi:" | tee -a "$LOG_FILE"
    
    # Controllo stato del database
    echo "Database PostgreSQL:" | tee -a "$LOG_FILE"
    if docker ps --format "{{.Names}}" | grep -q "^${DB_CONTAINER_NAME}$"; then
        echo "✅ Database Docker (${DB_CONTAINER_NAME}) è in esecuzione" | tee -a "$LOG_FILE"
        
        # Controlla se il database è pronto per le connessioni
        if docker exec ${DB_CONTAINER_NAME} pg_isready -U postgres &>/dev/null; then
            echo "✅ Database accetta connessioni" | tee -a "$LOG_FILE"
        else
            echo "❌ Database in esecuzione ma non accetta connessioni" | tee -a "$LOG_FILE"
        fi
        
        # Mostra informazioni sul container
        echo "Dettagli:" | tee -a "$LOG_FILE"
        docker ps --filter "name=${DB_CONTAINER_NAME}" --format "ID: {{.ID}}\nPort: {{.Ports}}\nStatus: {{.Status}}\nCreated: {{.CreatedAt}}" | tee -a "$LOG_FILE"
    else
        echo "❌ Database Docker (${DB_CONTAINER_NAME}) non è in esecuzione" | tee -a "$LOG_FILE"
    fi
    
    echo "" | tee -a "$LOG_FILE"
    
    # Controllo stato dei servizi backend
    echo "Backend:" | tee -a "$LOG_FILE"
    BACKEND_RUNNING=false
    for service in "auth-service:8001" "quiz-service:8002" "path-service:8003" "reward-service:8004" "api-gateway:8000"; do
        SERVICE_NAME=$(echo $service | cut -d':' -f1)
        SERVICE_PORT=$(echo $service | cut -d':' -f2)
        
        # Cerca il processo del servizio
        if ps aux | grep "uvicorn app.main:app --host 0.0.0.0 --port ${SERVICE_PORT}" | grep -v grep > /dev/null; then
            echo "✅ ${SERVICE_NAME} è in esecuzione (porta ${SERVICE_PORT})" | tee -a "$LOG_FILE"
            BACKEND_RUNNING=true
        else
            echo "❌ ${SERVICE_NAME} non è in esecuzione" | tee -a "$LOG_FILE"
        fi
    done
    
    # Se non ci sono servizi in esecuzione, mostra un messaggio riepilogativo
    if [ "$BACKEND_RUNNING" = false ]; then
        echo "Nessun servizio backend in esecuzione" | tee -a "$LOG_FILE"
    fi
    
    echo "" | tee -a "$LOG_FILE"
    
    # Controllo stato del frontend
    echo "Frontend:" | tee -a "$LOG_FILE"
    if ps aux | grep "react-scripts start" | grep -v grep > /dev/null; then
        echo "✅ Frontend React è in esecuzione" | tee -a "$LOG_FILE"
        # Cerca la porta su cui è in esecuzione il frontend
        FRONTEND_PORT=$(ps aux | grep "react-scripts start" | grep -v grep | grep -o "localhost:[0-9]\+" | head -1 | cut -d':' -f2)
        if [ ! -z "$FRONTEND_PORT" ]; then
            echo "Frontend accessibile su http://localhost:${FRONTEND_PORT}" | tee -a "$LOG_FILE"
        fi
        ps aux | grep "react-scripts start" | grep -v grep | head -1 | tee -a "$LOG_FILE"
    elif ps aux | grep "npm start" | grep -v grep > /dev/null; then
        echo "✅ Frontend (npm) è in esecuzione" | tee -a "$LOG_FILE"
        ps aux | grep "npm start" | grep -v grep | head -1 | tee -a "$LOG_FILE"
    else
        echo "❌ Frontend non è in esecuzione" | tee -a "$LOG_FILE"
    fi
}

# Verifica opzione passata
if [ $# -eq 0 ]; then
    usage
fi

case "$1" in
    setup)
        init_logfile
        setup
        ;;
    start)
        init_logfile
        start_backend
        start_frontend
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        init_logfile
        start_backend
        start_frontend
        ;;
    backend)
        init_logfile
        start_backend
        ;;
    frontend)
        init_logfile
        start_frontend
        ;;
    stop-frontend)
        stop_frontend
        ;;
    restart-frontend)
        stop_frontend
        sleep 2
        init_logfile
        start_frontend
        ;;
    stop-backend)
        stop_backend
        ;;
    restart-backend)
        stop_backend
        sleep 2
        init_logfile
        start_backend
        ;;
    status)
        show_status
        ;;
    help)
        usage
        ;;
    *)
        echo "Opzione non valida: $1"
        usage
        ;;
esac

exit 0
