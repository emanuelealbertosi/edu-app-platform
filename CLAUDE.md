# CLAUDE.md - Educational App Codebase Guide

## AGGIORNAMENTI RECENTI (13 marzo 2025)

### Fix per il componente ManageStudents

1. **Risolto problema di inizializzazione**:
   - Corretto l'errore "can't access lexical declaration '__WEBPACK_DEFAULT_EXPORT__' before initialization"
   - Risolto migliorando la struttura del componente TabPanel
   - Rinominato il componente a StudentTabPanel per evitare conflitti
   - Sistemati i riferimenti al componente in tutto il file

2. **Miglioramenti strutturali**:
   - Riorganizzato il codice per evitare dipendenze circolari
   - Sistemato l'ordine di inizializzazione dei componenti
   - Rimossi import non utilizzati per migliorare le prestazioni

### Correzioni sulla Dashboard Genitore

1. **Risolto problema di routing dei microservizi**:
   - Corretti gli errori 404 sulla dashboard genitore
   - Fissati i percorsi degli endpoint per evitare duplicazione dei prefissi
   - I router in auth-service e reward-service ora usano il prefisso corretto senza duplicazioni
   - Aggiornati anche i mapping nell'API Gateway per reindirizzare correttamente

2. **Implementati repository e schemi mancanti**:
   - Creati i repository mancanti: `parent_profile_repository.py` e `student_profile_repository.py`
   - Aggiunti gli schemi necessari: `parent_profile.py` e `student_profile.py`
   - Corretti i percorsi di importazione nei file endpoint parent

3. **Modifiche architetturali microservizi**:
   - Rimosso il prefisso duplicato nei file router per garantire coerenza
   - Creato un modello user.py nel servizio reward per compatibilità
   - Sistemati i percorsi di autenticazione tra i diversi servizi

Tutti i problemi di navigazione e API nella dashboard genitore sono ora risolti.

### Correzioni sui Quiz Template

1. **Problema del category_id risolto**: 
   - È stato risolto il problema della visualizzazione della materia nei quiz template
   - La soluzione implementa una corretta mappatura della materia (subject) al relativo category_id numerico
   - La correzione è stata applicata sia al metodo `normalizeQuizData` che al metodo `handleSave` in `AdminQuizForm.tsx`
   - Ora quando si crea o si modifica un quiz, il database riceve sempre un valore valido per `category_id`

2. **Visualizzazione corretta del conteggio domande**:
   - Corretto il problema della visualizzazione del numero di domande in AdminQuizzes.tsx
   - Modificato il componente per utilizzare `quiz.totalQuestions` invece di `quiz.questions?.length`
   - Questa modifica garantisce che il conteggio mostrato rifletta il numero effettivo di domande normalizzate

## NOTO PROBLEMA CON L'AGGIORNAMENTO DEI QUIZ

Esiste un problema noto con l'aggiornamento dei quiz nell'applicazione:

1. **Sintomo**: Quando si modifica un quiz esistente, le modifiche sembrano essere salvate correttamente (nessun errore viene mostrato), ma al caricamento successivo, le modifiche alla materia (subject) e alle opzioni delle domande non vengono preservate.

2. **Causa**: Il problema sembra essere legato alla struttura dei dati nel database o nella gestione delle risposte API. Nonostante numerosi tentativi di risolvere il problema lato frontend, il problema persiste.

3. **Soluzione temporanea**: Per modificare un quiz esistente, è consigliabile:
   - Prendere nota delle informazioni del quiz esistente
   - Eliminare il quiz
   - Creare un nuovo quiz con le modifiche desiderate

4. **Piano d'azione**: Un'analisi più approfondita del backend è necessaria per risolvere definitivamente il problema. In particolare, verificare:
   - La struttura delle tabelle nel database PostgreSQL
   - Il comportamento degli endpoint di aggiornamento in `quiz-service`
   - La gestione delle relazioni tra quiz, domande e opzioni

I tentativi di risoluzione finora hanno incluso:
- Normalizzazione dei dati nel frontend
- Approccio DELETE + CREATE per l'aggiornamento
- Invio dei dati nel formato esatto richiesto dal backend
- Debug esteso in tutte le fasi dell'aggiornamento

Il problema potrebbe richiedere un'analisi del database o una correzione del codice backend.

## Build/Run Commands
- Frontend: `cd frontend && npm start` - Runs React frontend
- Backend: `./lancia-locale.sh backend` - Starts all microservices
- All Services: `./lancia-locale.sh start` - Starts frontend and backend
- Setup: `./lancia-locale.sh setup` - Initialize development environment
- Status: `./lancia-locale.sh status` - Check service status
- Stop: `./lancia-locale.sh stop` - Stop all services

## Test Commands
- Frontend Tests: `cd frontend && npm test` (Jest)
- Single Frontend Test: `cd frontend && npm test -- -t "test name"` 
- E2E Tests: `cd frontend && npm test tests/e2e/TestName.test.js`
- Backend Tests: `cd backend/[service-name] && pytest` (e.g., `cd backend/auth-service && pytest`)
- Single Backend Test: `cd backend/[service-name] && pytest tests/unit/test_file.py::test_function`

## Linting/Formatting
- Frontend: Uses ESLint with React App config (extends react-app)
- TypeScript: `cd frontend && npx tsc --noEmit` - Type checking

## Code Style Guidelines
- TypeScript: Strict mode enabled, use proper types
- React: Functional components with hooks, use Framer Motion for animations
- Backend: FastAPI with SQLAlchemy ORM, Pydantic V2
- Authentication: OAuth2 with JWT tokens, refresh mechanism, role-based access control
- Imports: Use absolute imports from 'src/' in frontend
- Error handling: Use ApiErrorHandler with NotificationsContext for frontend errors
- Naming: PascalCase for components, camelCase for variables/functions
- Services: Always implement proper error handling and authentication

## Architecture
- Microservices: auth-service, quiz-service, path-service, reward-service, api-gateway
- Frontend: React with MUI, Context API for state management
- Animations: Framer Motion library for transitions and UX elements
- Testing: Jest/React Testing Library (frontend), pytest (backend)

