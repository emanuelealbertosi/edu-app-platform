#!/bin/bash

# Script per la gestione dell'ambiente di sviluppo locale
# Autore: Cascade AI
# Data: 2025-03-10

# Directory del progetto
PROJECT_DIR=$(pwd)
VENV_DIR="$PROJECT_DIR/venv"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Funzione per mostrare messaggio di utilizzo
usage() {
    echo "Utilizzo: $0 [opzione]"
    echo ""
    echo "Opzioni:"
    echo "  setup      Configura l'ambiente di sviluppo (venv, dipendenze)"
    echo "  start      Avvia tutti i servizi (backend e frontend)"
    echo "  stop       Ferma tutti i servizi"
    echo "  restart    Riavvia tutti i servizi"
    echo "  backend    Avvia solo i servizi di backend"
    echo "  frontend   Avvia solo il frontend"
    echo "  status     Mostra lo stato dei servizi"
    echo "  help       Mostra questo messaggio di aiuto"
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
    echo "Configurazione dell'ambiente di sviluppo..."
    
    # Crea l'ambiente virtuale se non esiste
    if [ ! -d "$VENV_DIR" ]; then
        echo "Creazione ambiente virtuale Python..."
        python3 -m venv "$VENV_DIR"
    fi
    
    # Attiva l'ambiente virtuale
    activate_venv
    
    # Installa le dipendenze backend
    echo "Installazione dipendenze backend..."
    pip install -r "$BACKEND_DIR/requirements.txt"
    
    # Verifica se Node.js è installato
    if command -v node > /dev/null; then
        echo "Node.js trovato. Configurazione frontend..."
        if [ -f "$FRONTEND_DIR/package.json" ]; then
            cd "$FRONTEND_DIR" && npm install
        else
            echo "package.json non trovato in $FRONTEND_DIR. Frontend non configurato."
        fi
    else
        echo "Node.js non trovato. Installalo per configurare il frontend."
    fi
    
    echo "Configurazione completata!"
}

# Avvia i servizi di backend
start_backend() {
    echo "Avvio servizi backend..."
    activate_venv
    
    # Per ora avviamo i servizi in terminali separati
    echo "Avvio auth-service..."
    if [ -f "$BACKEND_DIR/auth-service/app/main.py" ]; then
        (cd "$BACKEND_DIR/auth-service" && source "$VENV_DIR/bin/activate" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001) &
    else
        echo "auth-service non disponibile."
    fi
    
    echo "Avvio quiz-service..."
    if [ -f "$BACKEND_DIR/quiz-service/app/main.py" ]; then
        (cd "$BACKEND_DIR/quiz-service" && source "$VENV_DIR/bin/activate" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8002) &
    else
        echo "quiz-service non disponibile."
    fi
    
    echo "Avvio path-service..."
    if [ -f "$BACKEND_DIR/path-service/app/main.py" ]; then
        (cd "$BACKEND_DIR/path-service" && source "$VENV_DIR/bin/activate" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8003) &
    else
        echo "path-service non disponibile."
    fi
    
    echo "Avvio reward-service..."
    if [ -f "$BACKEND_DIR/reward-service/app/main.py" ]; then
        (cd "$BACKEND_DIR/reward-service" && source "$VENV_DIR/bin/activate" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8004) &
    else
        echo "reward-service non disponibile."
    fi
    
    echo "Avvio api-gateway..."
    if [ -f "$BACKEND_DIR/api-gateway/app/main.py" ]; then
        (cd "$BACKEND_DIR/api-gateway" && source "$VENV_DIR/bin/activate" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000) &
    else
        echo "api-gateway non disponibile."
    fi
}

# Avvia il frontend
start_frontend() {
    echo "Avvio frontend..."
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        (cd "$FRONTEND_DIR" && npm start) &
    else
        echo "Frontend non configurato."
    fi
}

# Ferma tutti i servizi
stop_services() {
    echo "Arresto di tutti i servizi..."
    # Trova e termina i processi uvicorn per i servizi backend
    pkill -f "uvicorn app.main:app"
    # Trova e termina i processi npm per il frontend
    pkill -f "npm start"
    echo "Tutti i servizi arrestati."
}

# Mostra lo stato dei servizi
show_status() {
    echo "Stato dei servizi:"
    echo "Backend:"
    ps aux | grep "uvicorn app.main:app" | grep -v grep
    echo ""
    echo "Frontend:"
    ps aux | grep "npm start" | grep -v grep
}

# Verifica opzione passata
if [ $# -eq 0 ]; then
    usage
fi

case "$1" in
    setup)
        setup
        ;;
    start)
        start_backend
        start_frontend
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_backend
        start_frontend
        ;;
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
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
