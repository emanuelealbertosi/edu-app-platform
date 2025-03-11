# App Educativa

Questa è un'applicazione educativa con funzionalità di gestione quiz, percorsi didattici e sistema di ricompense per studenti. L'applicazione supporta tre tipi di utenti: amministratori, genitori e studenti, ciascuno con ruoli e autorizzazioni specifiche.

## Progresso Sviluppo

### Fase 1: Configurazione iniziale 
- Creazione struttura del progetto 
- Configurazione dell'ambiente di sviluppo 
- Creazione del README.md 

### Fase 2: Sviluppo del Backend
- [x] Configurazione database 
- [x] Servizio di autenticazione 
- [x] Servizio gestione quiz 
- [x] Servizio gestione percorsi 
- [x] Servizio gestione ricompense 
- [x] API Gateway 

### Fase 2.5: Modernizzazione del Codice
- [x] Aggiornamento a Pydantic V2 
  - [x] Path Service 
  - [x] Quiz Service 
  - [x] Reward Service 

### Fase 3: Sviluppo del Frontend
- [x] Configurazione React 
- [x] Componenti UI comuni 
  - [x] Layout principale con barra laterale e header 
  - [x] Context per gestione autenticazione 
  - [x] Protected Routes basate sui ruoli 
- [x] Interfaccia amministratore 
  - [x] Dashboard principale 
  - [x] Gestione quiz templates 
  - [x] Gestione utenti 
- [x] Interfaccia genitori 
  - [x] Dashboard principale 
  - [x] Gestione studenti 
  - [x] Gestione template percorsi 
  - [x] Gestione template ricompense 
  - [x] Assegnazione percorsi 
- [x] Interfaccia studenti 
  - [x] Dashboard principale 
  - [x] Visualizzazione percorsi assegnati 
  - [x] Interfaccia per svolgere quiz 
  - [x] Shop ricompense 

### Fase 4: Testing
- [x] Test unitari 
- [x] Test di integrazione 
- [x] Adattamento test per integrare autenticazione JWT 
- [x] Fix bug nei test del quiz-service 
- [x] Verifica funzionamento autenticazione tra servizi e API Gateway 
- [ ] Test end-to-end

### Fase 5: Containerizzazione
- [x] Creazione Dockerfile per ciascun servizio 
- [x] Docker Compose per ambiente di sviluppo 
- [ ] Docker Compose per produzione

## Architettura dell'Applicazione

L'applicazione è basata su un'architettura a microservizi:

1. **Frontend**: Applicazione React con interfaccia utente dinamica e responsive
2. **API Gateway**: Punto di accesso centralizzato che instrada le richieste ai servizi appropriati
3. **Backend Services**:
   - **auth-service**: Gestisce autenticazione, registrazione e autorizzazione degli utenti
   - **quiz-service**: Gestisce la creazione, modifica e somministrazione di quiz
   - **path-service**: Gestisce i percorsi educativi e le assegnazioni agli studenti
   - **reward-service**: Gestisce il sistema di ricompense e badge
4. **Database**: PostgreSQL come sistema di persistenza dati

## Tecnologie Utilizzate

- **Backend**: FastAPI/Python
- **Database**: PostgreSQL con SQLAlchemy
- **Frontend**: React con Material-UI
- **Autenticazione**: OAuth2 con JWT
- **Validation**: Pydantic V2
- **Containerizzazione**: Docker e Docker Compose (pianificata)

## Servizi Testati e Verificati

I seguenti servizi sono stati specificamente testati e verificati:

### Auth Service
Il servizio di autenticazione è stato completamente implementato e testato. Include:
- Registrazione utenti e login/logout con OAuth2 e JWT
- Accesso tramite JWT con token di accesso e refresh
- Gestione ruoli utente (admin, parent, student)
- Profili utente specifici per genitori e studenti
- Gestione token refresh
- Integrazione con PostgreSQL locale
- Integrazione con gli altri microservizi tramite API Gateway

### Path Service
Il servizio di percorsi educativi è stato aggiornato e verificato con:
- Compatibilità con Pydantic V2 (model_dump, model_validate, field_validator)
- Test unitari completi e funzionanti
- Integrazione con il sistema di autenticazione
- API RESTful per la gestione dei template e dei percorsi assegnati

### Reward Service
Il servizio di gestione ricompense è stato validato con:
- Integrazione con PostgreSQL in Docker
- Inizializzazione database con categorie e ricompense
- Test completi per tutte le API di categorie, ricompense e progressi
- Autenticazione con auth-service e gestione ruoli utente

## Servizi Implementati

### Quiz Service
Il servizio gestisce la creazione e somministrazione di quiz agli studenti.

**Funzionalità principali:**
- Creazione e gestione di template di quiz
- Categorie di quiz personalizzabili
- Diversi tipi di domande: scelta singola, scelta multipla, vero/falso, numerica
- Tracciamento dei tentativi e dei punteggi

**Endpoints:**
- `GET /api/quiz-templates/`: Lista di template di quiz
- `POST /api/quiz-templates/`: Creazione di un nuovo template
- `GET /api/quizzes/`: Lista di quiz assegnati
- `POST /api/quizzes/`: Creazione di un nuovo quiz da un template

### Path Service
Il servizio gestisce i percorsi educativi personalizzati per gli studenti.

**Funzionalità principali:**
- Creazione di percorsi educativi con nodi di diversi tipi
- Supporto per dipendenze tra nodi (sequenze di apprendimento)
- Diversi tipi di nodi: contenuto, quiz, attività, traguardi, ricompense
- Tracciamento dell'avanzamento e completamento
- Modernizzato con Pydantic V2 per una validazione dei dati più robusta

**Endpoints:**
- `GET /api/path-templates/`: Lista di template di percorsi
- `POST /api/path-templates/`: Creazione di un nuovo template di percorso
- `GET /api/paths/`: Lista di percorsi assegnati (richiede autenticazione)
- `POST /api/paths/`: Creazione di un nuovo percorso da un template
- `GET /api/path-templates/public`: Lista di template pubblici disponibili

### Reward Service
Il servizio gestisce il sistema di ricompense e badge per gli studenti.

**Funzionalità principali:**
- Gestione di diverse tipologie di ricompense: badge, certificati, trofei, privilegi
- Categorizzazione delle ricompense con livelli di rarità
- Assegnazione di ricompense agli utenti in base ai loro progressi
- Tracciamento del progresso verso lo sblocco delle ricompense

**Endpoints:**
- `GET /api/rewards/`: Lista di tutte le ricompense disponibili
- `POST /api/rewards/`: Creazione di una nuova ricompensa (admin)
- `GET /api/user-rewards/`: Lista delle ricompense assegnate a un utente
- `POST /api/user-rewards/progress/`: Aggiornamento del progresso verso una ricompensa

### Auth Service
Il servizio gestisce l'autenticazione e l'autorizzazione degli utenti dell'applicazione.

**Funzionalità principali:**
- Registrazione e gestione degli utenti
- Autenticazione OAuth2 con JWT (token di accesso e di refresh)
- Gestione dei ruoli utente (admin, parent, student)
- Profili specifici per genitori e studenti
- Protezione degli endpoint in base ai ruoli

**Endpoints:**
- `POST /api/auth/register`: Registrazione di un nuovo utente
- `POST /api/auth/login`: Login con username/email e password
- `POST /api/auth/refresh`: Refresh del token di accesso
- `POST /api/auth/logout`: Logout (revoca del token di refresh)
- `GET /api/users/me`: Ottiene i dati dell'utente corrente
- `GET /api/users/`: Lista di tutti gli utenti (solo admin)
- `GET /api/roles/`: Lista di tutti i ruoli (solo admin)

### API Gateway
Il gateway API funge da punto di ingresso unificato per tutti i servizi backend.

**Funzionalità principali:**
- Routing delle richieste ai microservizi appropriati
- Logging centralizzato delle richieste API
- Gestione degli errori di comunicazione tra i servizi
- Configurazione CORS per l'accesso dal frontend

**Routing:**
- `/api/auth/*`: Servizio di autenticazione
- `/api/quiz/*`: Servizio di gestione quiz
- `/api/paths/*`: Servizio di gestione percorsi
- `/api/rewards/*`: Servizio di gestione ricompense
- `/api/user-rewards/*`: Servizio di gestione ricompense (user rewards)

## Come Iniziare

### Prerequisiti
- Python 3.10 o superiore
- Docker e Docker Compose (opzionale, consigliato per il database)
- PostgreSQL 14 o superiore (solo se non si utilizza Docker)

### Configurazione Ambiente di Sviluppo

1. Clona il repository
```bash
git clone <repository_url>
cd edu_app
```

2. Crea e attiva un ambiente virtuale Python
```bash
python -m venv venv
source venv/bin/activate  # Per Linux/Mac
# o
# venv\Scripts\activate  # Per Windows
```

3. Configura il database PostgreSQL

#### Opzione 1: Usando Docker (Consigliato)
```bash
# Avvia tutti i servizi incluso il database con Docker Compose
cd edu_app
docker-compose -f docker-compose.dev.yml up -d postgres

# Crea gli altri database necessari (se non vengono creati automaticamente)
docker exec -it edu_app_postgres psql -U postgres -c "CREATE DATABASE edu_app_auth;"
docker exec -it edu_app_postgres psql -U postgres -c "CREATE DATABASE edu_app_quiz;"
docker exec -it edu_app_postgres psql -U postgres -c "CREATE DATABASE edu_app_path;"
docker exec -it edu_app_postgres psql -U postgres -c "CREATE DATABASE edu_app_reward;"
```

#### Opzione 2: Usando PostgreSQL Locale
```bash
# Crea database per ciascun servizio
psql -U postgres -c "CREATE DATABASE edu_app_auth;"
psql -U postgres -c "CREATE DATABASE edu_app_quiz;"
psql -U postgres -c "CREATE DATABASE edu_app_path;"
psql -U postgres -c "CREATE DATABASE edu_app_reward;"
```

**Nota**: Assicurarsi che la porta e le credenziali di accesso a PostgreSQL siano correttamente configurate nei file `.env` di ciascun servizio. Per impostazione predefinita, i servizi cercheranno di connettersi a PostgreSQL sulla porta 5432.

4. Configura e avvia ciascun servizio

### Testing dei Servizi

#### Inizializzazione dei Database

Prima di eseguire i servizi, è necessario inizializzare i database con le strutture e i dati iniziali:

```bash
# Per il servizio di autenticazione
cd backend/auth-service
python init_db.py

# Per il servizio di gestione quiz
cd backend/quiz-service
python init_db.py

# Per il servizio di gestione percorsi
cd backend/path-service
python init_db.py

# Per il servizio di gestione ricompense
cd backend/reward-service
python init_db.py
```

#### Testing Servizio di Autenticazione (auth-service)

Per testare il servizio di autenticazione, utilizzare i seguenti comandi:

1. Registrazione di un nuovo utente:
```bash
curl -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com", "password":"Password123!", "username":"testuser", "role":"student"}'
```

2. Login utente (nota: utilizza form-data, non JSON):
```bash
curl -X POST http://localhost:8000/api/auth/login -d "username=testuser&password=Password123!"
```

Questo restituirà un token di accesso e un token di refresh nel formato:
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

3. Accesso alle informazioni dell'utente:
```bash
export ACCESS_TOKEN="il_tuo_token_di_accesso"
curl -X GET http://localhost:8001/api/users/me -H "Authorization: Bearer $ACCESS_TOKEN"
```

4. Refresh del token:
```bash
curl -X POST http://localhost:8000/api/auth/refresh -H "Content-Type: application/json" -d '{"refresh_token":"il_tuo_token_di_refresh"}'
```

5. Logout:
```bash
curl -X POST http://localhost:8000/api/auth/logout -H "Content-Type: application/json" -d '{"refresh_token":"il_tuo_token_di_refresh"}'
```

#### Testing Servizio Quiz (quiz-service)

Per testare il servizio di quiz (richiede autenticazione):

```bash
# Avvia il servizio
cd backend/quiz-service
pip install -r requirements.txt
python run.py

# Ottieni un token dal servizio di autenticazione
# Sostituisci ACCESS_TOKEN con il token ottenuto dal servizio di autenticazione

# Elenco di tutte le categorie di quiz
curl -X GET http://localhost:8002/api/quiz-categories/ -H "Authorization: Bearer $ACCESS_TOKEN"

# Elenco di tutti i template di quiz
curl -X GET http://localhost:8002/api/quiz-templates/ -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Testing Servizio Percorsi (path-service)

Per testare il servizio di percorsi (richiede autenticazione):

```bash
# Avvia il servizio
cd backend/path-service
pip install -r requirements.txt
python run.py

# Ottieni un token dal servizio di autenticazione
# Sostituisci ACCESS_TOKEN con il token ottenuto dal servizio di autenticazione

# Elenco di tutti i template di percorsi
curl -X GET http://localhost:8003/api/path-templates/ -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Testing Servizio Ricompense (reward-service)

Per testare il servizio di ricompense (richiede autenticazione):

```bash
# Avvia il servizio
cd backend/reward-service
pip install -r requirements.txt
python run.py

# Ottieni un token dal servizio di autenticazione
# Sostituisci ACCESS_TOKEN con il token ottenuto dal servizio di autenticazione

# Elenco di tutte le categorie di ricompense
curl -X GET http://localhost:8004/api/rewards/categories/ -H "Authorization: Bearer $ACCESS_TOKEN"

# Elenco di tutte le ricompense disponibili
curl -X GET http://localhost:8004/api/rewards/ -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### API Gateway
```bash
cd backend/api-gateway
pip install -r requirements.txt
# Assicurati che le variabili nel file .env siano configurate correttamente
python run.py
```

5. Verifica che i servizi siano attivi
- API Gateway: http://localhost:8000
- Quiz Service: http://localhost:8002
- Path Service: http://localhost:8003
- Reward Service: http://localhost:8004

## Script Utili

Lo script `lancia-locale.sh` è disponibile per gestire i servizi dell'applicazione:

```bash
# Avvia tutti i servizi in ambiente di sviluppo
./lancia-locale.sh start

# Ferma tutti i servizi
./lancia-locale.sh stop

# Riavvia un servizio specifico
./lancia-locale.sh restart quiz-service
```

I seguenti servizi sono implementati ma richiedono ulteriori test:

- **Quiz Service** (quiz-service)
- **Path Service** (path-service)
- **API Gateway**

## Sviluppi Futuri

- Sviluppo del frontend in React
- Deployment con Docker Compose per produzione
- Implementazione di un sistema di notifiche
- Sviluppo di dashboard per genitori e insegnanti
- Integrazione con servizi di terze parti per contenuti educativi
