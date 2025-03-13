# App Educativa

Questa è un'applicazione educativa con funzionalità di gestione quiz, percorsi didattici e sistema di ricompense per studenti. L'applicazione supporta tre tipi di utenti: amministratori, genitori e studenti, ciascuno con ruoli e autorizzazioni specifiche.

## Progresso Sviluppo

### Fase 1: Configurazione iniziale 
- [x] Creazione struttura del progetto 
- [x] Configurazione dell'ambiente di sviluppo 
- [x] Creazione del README.md 

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
  - [x] Sistema di notifiche con animazioni
  - [x] Componenti di animazione riutilizzabili
    - [x] PageTransition per transizioni tra pagine
    - [x] FadeInLoader per caricamenti eleganti
    - [x] AnimatedCard per interazioni con carte
    - [x] SuccessAnimation e SuccessConfetti per feedback positivi
- [x] Interfaccia amministratore 
  - [x] Dashboard principale 
  - [x] Gestione quiz templates 
    - [x] Normalizzazione dati frontend/backend
    - [x] Mappatura materie-categorie
    - [x] Conteggio domande corretto
  - [x] Gestione utenti 
- [x] Interfaccia genitori 
  - [x] Dashboard principale 
  - [x] Gestione studenti 
    - [x] Visualizzazione lista studenti con card
    - [x] Creazione nuovo studente con validazione
    - [x] Modifica profilo studente esistente
    - [x] Fix problema inizializzazione componente
  - [x] Gestione template percorsi 
  - [x] Gestione template ricompense 
  - [x] Assegnazione percorsi 
- [x] Interfaccia studenti 
  - [x] Dashboard principale 
  - [x] Visualizzazione percorsi assegnati 
  - [x] Interfaccia per svolgere quiz 
  - [x] Shop ricompense 

### Fase 4: Integrazione Frontend-Backend
- [x] Servizi API per la comunicazione con il backend
  - [x] AuthService per integrazione con auth-service
  - [x] QuizService per integrazione con quiz-service
  - [x] PathService per integrazione con path-service
  - [x] RewardService per integrazione con reward-service
- [x] Componenti React integrati con dati reali
  - [x] AuthContext con AuthService
  - [x] Componenti dashboard studente
    - [x] StudentDashboard con dati da PathService e QuizService
    - [x] AssignedPaths con dati da PathService
    - [x] TakeQuiz con dati da QuizService (completato Marzo 2025)
    - [x] RewardShop con dati da RewardService
  - [x] Componenti dashboard genitore con dati reali
  - [x] Componenti dashboard admin con dati reali
- [x] Sistema di notifiche a livello applicativo
  - [x] NotificationsContext per gestione centralizzata
  - [x] NotificationsService per esposizione API
  - [x] Integrazione con sistema di gestione errori
  - [x] Componenti UI per visualizzazione notifiche
  - [x] Fix per notifiche duplicate durante errori di autenticazione
- [x] Miglioramenti dell'esperienza utente
  - [x] Sistema di animazioni e transizioni
  - [x] Componenti per il feedback visivo durante caricamenti
  - [x] Effetti hover e animazioni interattive
  - [x] Transizioni di pagina fluide

### Fase 5: Ottimizzazione e Perfezionamento (In Corso)
- [ ] Ottimizzazione delle prestazioni
  - [ ] Implementazione caching lato client
  - [ ] Caricamento ottimizzato delle risorse
  - [ ] Supporto modalità offline per funzionalità chiave
- [ ] UX/UI avanzata
  - [ ] Temi personalizzabili (chiaro/scuro)
  - [ ] Guide interattive per nuovi utenti
  - [ ] Miglioramenti accessibilità
- [ ] Analytics e reportistica
  - [ ] Dashboard analitiche avanzate
  - [ ] Sistema di reportistica per genitori/insegnanti
  - [ ] Visualizzazioni dettagliate progresso studenti

### Fase 6: Testing
- [x] Test unitari 
- [x] Test di integrazione 
- [x] Adattamento test per integrare autenticazione JWT 
- [x] Fix bug nei test del quiz-service 
- [x] Verifica funzionamento autenticazione tra servizi e API Gateway 
- [ ] Test end-to-end

### Fase 7: Containerizzazione
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
- **Animazioni**: Framer Motion
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

### Quiz Service
Il servizio gestisce la creazione e somministrazione di quiz agli studenti. È ora:
- Completamente integrato con il frontend
- Compatibile con Pydantic V2
- Testato con autenticazione JWT
- Verificato per il tracciamento corretto delle risposte e del completamento dei quiz

### Reward Service
Il servizio di gestione ricompense è stato validato con:
- Integrazione con PostgreSQL in Docker
- Inizializzazione database con categorie e ricompense
- Test completi per tutte le API di categorie, ricompense e progressi
- Autenticazione con auth-service e gestione ruoli utente

## Componenti Frontend Integrati

### Interfaccia Studente
- **StudentDashboard**: Visualizza una panoramica dei percorsi assegnati e quiz disponibili, utilizzando dati reali da PathService e QuizService
- **AssignedPaths**: Visualizza i percorsi educativi assegnati allo studente con funzionalità di filtro e ricerca, utilizzando dati da PathService
- **TakeQuiz**: Interfaccia completa per lo svolgimento dei quiz, con timer, display delle domande e invio delle risposte, completamente integrata con QuizService

### Gestione Autenticazione
- **AuthContext**: Gestisce lo stato di autenticazione dell'utente utilizzando AuthService per login, registrazione e logout
- **ProtectedRoute**: Controlla l'accesso alle rotte in base al ruolo dell'utente
- **LoginForm e RegisterForm**: Interfacce per l'autenticazione e registrazione degli utenti

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
- `/api/path-templates/*`: Servizio di gestione template percorsi
- `/api/rewards/*`: Servizio di gestione ricompense
- `/api/user-rewards/*`: Servizio di gestione ricompense (user rewards)

## Problemi Risolti Recentemente

### Dashboard Genitore e Microservizi

**Problema Originale**: Errori 404 Not Found nella dashboard genitore e problemi di routing dei microservizi:
1. Duplicazione dei prefissi di routing negli endpoint parent dei servizi auth e reward
2. Repository e schemi mancanti per i profili parent e student
3. Percorsi incoerenti tra frontend e API Gateway

**Soluzione Implementata**:
1. Per i problemi di routing:
   - Rimossi prefissi duplicati nei file router degli endpoint parent
   - Aggiornati i percorsi nell'API Gateway per mappare correttamente `/auth/parent/*` e `/reward/parent/*`
   - Corretti i percorsi nei servizi frontend StudentService e RewardService

2. Per i repository e gli schemi mancanti:
   - Implementati i repository `parent_profile_repository.py` e `student_profile_repository.py`
   - Creati gli schemi mancanti `parent_profile.py` e `student_profile.py`
   - Aggiunti modelli mock nel servizio reward per compatibilità con l'autenticazione

**Status**: ✅ RISOLTO. La dashboard genitore ora carica correttamente tutti i dati senza errori 404.

### Autenticazione JWT e Endpoint Percorsi Educativi

**Problema Originale**: Si verificavano due problemi critici nel sistema:
1. Incompatibilità tra il formato dei token JWT tra frontend e backend, causando errori 401 Unauthorized
2. Errori 422 Unprocessable Entity quando si accedeva agli endpoint dei template di percorsi educativi

**Soluzione Implementata**:
1. Per i problemi JWT:
   - Nel backend: Modificato il formato del campo `exp` da float a integer in `create_access_token` e `create_refresh_token`
   - Aggiornati i metodi di verifica token con `model_dump()` in tutti i servizi per compatibilità Pydantic V2

2. Per i problemi degli endpoint dei percorsi educativi:
   - Corretto il routing nell'API gateway aggiungendo `/api/path-templates/*` come percorso verso il path-service
   - Aggiornati i metodi `.dict()` a `.model_dump()` nel repository dei template di percorsi
   - Aggiornati gli endpoint nel servizio frontend PathService.ts

**Status**: ✅ RISOLTO. I test confermano che entrambi i problemi sono stati completamente risolti.

## Come Iniziare

### Prerequisiti
- Python 3.10 o superiore
- Docker e Docker Compose (opzionale, consigliato per il database)
- PostgreSQL 14 o superiore (solo se non si utilizza Docker)
- Node.js 16+ e npm per il frontend

### Configurazione dell'Ambiente

1. Clonare il repository:
```bash
git clone https://github.com/tuorepositorio/app-educativa.git
cd app-educativa
```

2. Avviare i database con Docker Compose:
```bash
docker-compose up -d db_auth db_quiz db_path db_reward
```

3. Configurare il file .env per ogni servizio (copia da .env.example)

4. Avviare i servizi backend:
```bash
# Terminale 1
cd auth-service
python -m venv venv
source venv/bin/activate  # In Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py

# Terminale 2
cd quiz-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Terminale 3
cd path-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Terminale 4
cd reward-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Terminale 5
cd api-gateway
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

5. Avviare il frontend:
```bash
cd frontend
npm install
npm start
```

## Utilizzo

### API dei Servizi

Per testare il servizio di autenticazione, utilizzare i seguenti comandi:

1. Registrazione di un nuovo utente:
```bash
curl -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com", "password":"Password123!", "username":"testuser", "role":"student"}'
```

2. Login:
```bash
curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{"username":"testuser", "password":"Password123!"}'
```

3. Utilizzare il token ottenuto per accedere ad altre API:
```bash
curl -X GET http://localhost:8000/api/users/me -H "Authorization: Bearer <token>"
```

### Interfaccia Utente

1. Accedi all'applicazione all'indirizzo: http://localhost:3000
2. Registrati o accedi con le credenziali di esempio
3. Naviga attraverso le diverse funzionalità in base al tuo ruolo:
   - Student: Accedi ai percorsi assegnati, svolgi quiz, acquista ricompense
   - Parent: Gestisci studenti, assegna percorsi, configura ricompense
   - Admin: Gestisci utenti, crea template di quiz, monitora l'utilizzo

## Prossimi Passi

Per i dettagli completi sui prossimi step di sviluppo, consulta il file `prossimecosedafare.md`

## Licenza

MIT
