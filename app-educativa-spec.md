# Prompt iniziale

Voglio che sviluppi un app educativa basandoti sulle specifiche presenti nel file app-educativa-spec.md. 
Crea un readme.md che tenga traccia dell'avanzamento e contenga man mano le istruzioni per eseguire ogni comando.
Sviluppa l'app in locale con le tecnologie indicate e lascia la parte di dockerizzazione solo per il finale, quando ogni funzionalita' sara' testata e completa col mio ok.
Voglio che l'app abbia 3 tipologie di utenti. Studenti, genitori e admin. L'admin controlla tutto e carica i template di quiz da fornire agli utenti compreso il punteggio che il quiz deve avere al superamento. 
I genitori creano gli studenti e creano template di percorsi educativi composti da template dei singoli quiz attribuendo il valore in punteggio acquisito al completamento del percorso.
I genitori inoltre assegnano i percorsi ai loro studenti. Quando un percorso viene assegnato viene creato un percorso concreto contenente quiz concreti. Deve essere inoltre prevista la gestione di ricompense. Quindi  i genitori possono creare template di ricompense che hanno un costo in punteggio e che una volta assegnato ad uno studente diventano ricompense concrete nello shop dello studente e che possono essere riscattate dallo studente. Sara' poi il genitore a confermare il delivery della ricompensa.
Ogni template di quiz deve permettere la creazione di piu' quiz concreto e ogni template del percorso deve permettere la creazione di piu' percorsi concreti.
Gestisci lo start, stop e restart delle componenti software tramite uno script lancia-locale.sh e salva le istruzioni nel readme.
Usa un venv per la fase di sviluppo e python3 per l'esecuzione locale.

# Specifiche App Educativa

## Panoramica
App educativa per gestione quiz, percorsi didattici e sistema ricompense. Con ruoli differenziati.

## Specifiche Funzionali

### Ruoli e Permessi
1. **Admin**
   - Gestione template quiz
   - Supervisione globale piattaforma
   - Gestione utenti

2. **Genitori**
   - Creazione/gestione account studenti
   - Creazione template percorsi educativi (composti da template quiz)
   - Assegnazione percorsi a studenti
   - Creazione template ricompense con costo in punti
   - Approvazione consegna ricompense riscattate

3. **Studenti**
   - Completamento quiz/percorsi assegnati
   - Accumulo punti
   - Acquisto ricompense nello shop personale

### Entità Principali
- **Quiz**: template (admin) → quiz concreti (assegnati)
- **Percorsi**: template (genitori) → percorsi concreti (assegnati) 
- **Ricompense**: template (genitori) → ricompense concrete (shop)

### Flussi Operativi Chiave
1. Creazione contenuti educativi (Admin → Genitori → Studenti)
2. Ciclo di apprendimento (Assegnazione → Completamento → Punti)
3. Sistema ricompense (Acquisto → Approvazione → Consegna)

### Funzionalità CRUD
- Gestione completa con permessi differenziati per tutte le entità
- Integrità referenziale nelle modifiche/cancellazioni

## Specifiche Tecniche

### Stack Tecnologico
- **Backend**: FastAPI/Python
- **Database**: PostgreSQL con SQLAlchemy
- **Frontend**: React con Material-UI
- **Autenticazione**: JWT
- **Containerizzazione**: Docker/Kubernetes

### Architettura Microservizi
1. **auth-service**: Gestione utenti, autenticazione, profili
2. **quiz-service**: Template quiz, API CRUD
3. **path-service**: Percorsi educativi, progressi studenti
4. **reward-service**: Gestione ricompense, shop, transazioni
5. **api-gateway**: Routing, autenticazione centralizzata

### Database
- Schema relazionale PostgreSQL
- Modelli SQLAlchemy con relazioni appropriate
- Vincoli integrità per tutte le entità
- Indici per query frequenti

### API
- RESTful con documentazione OpenAPI/Swagger
- Versioning API
- Gestione errori standardizzata
- Rate limiting e protezione

## Metodologia Sviluppo

### Test-Driven Development
- Test unitari con pytest (Backend) e Jest (Frontend)
- Test integrazione per API e database
- Test E2E per flussi utente critici
- Coverage target: 80%+ 

### Git Workflow
- Feature branch + Pull Request
- Commit atomici e frequenti
- CI/CD pipeline su GitHub Actions facoltativa
- Code review facoltativa

## Struttura Progetto
```
/
├── backend/
│   ├── api-gateway/
│   │   ├── app/
│   │   ├── tests/
│   │   └── Dockerfile
│   ├── auth-service/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── endpoints/     # Router risorse
│   │   │   │   └── dependencies/  # Dipendenze condivise
│   │   │   ├── core/              # Config, security
│   │   │   ├── db/                # Database setup
│   │   │   │   ├── models/        # SQLAlchemy models
│   │   │   │   └── repositories/  # Query database
│   │   │   ├── schemas/           # Pydantic models
│   │   │   └── services/          # Business logic
│   │   ├── tests/
│   │   │   ├── conftest.py        # Fixture pytest
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── Dockerfile
│   │   └── pyproject.toml
│   ├── quiz-service/
│   │   ├── app/
│   │   ├── tests/
│   │   └── Dockerfile
│   ├── path-service/
│   │   ├── app/
│   │   ├── tests/
│   │   └── Dockerfile
│   ├── reward-service/
│   │   ├── app/
│   │   ├── tests/
│   │   └── Dockerfile
│   └── docker-compose.yml
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/           # Componenti riutilizzabili
│   │   │   ├── layout/           # Layout e struttura pagina
│   │   │   ├── admin/            # Componenti specifici admin
│   │   │   ├── parent/           # Componenti specifici genitori
│   │   │   └── student/          # Componenti specifici studenti
│   │   ├── contexts/             # Context API React
│   │   ├── hooks/                # Custom hooks
│   │   ├── pages/                # Pagine componenti
│   │   │   ├── admin/
│   │   │   ├── parent/
│   │   │   └── student/
│   │   ├── services/             # Chiamate API
│   │   ├── utils/                # Utility functions
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml            # Compose globale
└── README.md
```

## Prompt di Sviluppo

```
Sviluppa il microservizio [X] per app educativa con:
- FastAPI/PostgreSQL/SQLAlchemy backend
- Test-driven con pytest
- Git workflow con commit frequenti

Requisiti:
- Gestione [entità] con CRUD completo
- Autenticazione JWT e permessi per ruoli Admin/Genitori/Studenti
- Validazione dati con Pydantic
- Test unitari e integrazione

Fornisci:
1. Schema database e modelli
2. Test suite pytest completa
3. Implementazione endpoint API
4. Dockerfile e configurazione 
5. Esempi richieste/risposte
```