# Bug Tracker

## Come Utilizzare Questo File

- **Stato**: 🔴 Aperto | 🟡 In Progress | 🟢 Risolto | ⚫ Chiuso (Non Risolvibile/Non Riprodotto)
- **Priorità**: P0 (Critico) | P1 (Alto) | P2 (Medio) | P3 (Basso)
- **Formato ID**:
  - FE-XXX: Frontend
  - BE-XXX: Backend
  - PH-XXX: Path Service
  - RW-XXX: Reward Service
  - AU-XXX: Auth Service
  - AG-XXX: API Gateway

---

## Servizio Auth

### Bug Risolti

#### AU-001 - 🟢 P1 - Assenza di un'interfaccia per assegnare uno studente ad un genitore
- **Stato**: 🟢 Risolto
- **Data**: 2025-03-17

**Descrizione**  
Attualmente non esiste un modo per assegnare uno studente ad un genitore attraverso l'interfaccia utente. Questa funzionalità è fondamentale per permettere ai genitori di gestire i percorsi educativi e i progressi dei propri figli.

**Impatto**  
I genitori non possono essere associati ai propri figli, limitando gravemente la funzionalità di monitoraggio e gestione dell'apprendimento.

**Soluzione Implementata**  
Implementato un meccanismo automatico che crea un profilo genitore quando:
1. Un utente si registra con il ruolo "parent"
2. Prima di recuperare gli studenti associati al genitore
3. Prima di creare un nuovo studente

Inoltre, aggiunto un endpoint `/api/auth/parent/profile` che verifica ed eventualmente crea il profilo genitore se non esiste.

### Bug Aperti

#### AU-002 - 🟢 P1 - Creazione interfaccia genitore per gestione studenti associati
- **Stato**: 🟢 Risolto
- **Data**: 2025-03-17

**Descrizione**  
Per i profili genitore, è necessaria un'interfaccia dedicata nel menu principale che mostri tutti gli studenti associati al genitore e permetta di crearne di nuovi. I nuovi studenti creati dovranno essere automaticamente associati al parent_id del genitore corrente.

**Impatto**  
I genitori non possono vedere l'elenco dei propri studenti né aggiungerne di nuovi attraverso l'interfaccia utente.

**Soluzione Implementata**  
Implementato il componente `ManageStudents.tsx` che fornisce un'interfaccia completa per la gestione degli studenti associati al genitore. Questo componente:
1. Visualizza tutti gli studenti associati al genitore corrente
2. Permette di creare nuovi studenti che vengono automaticamente associati al genitore
3. Garantisce che esista un profilo genitore prima di tentare qualsiasi operazione

#### AU-005 - 🟢 P1 - Percorsi educativi non visibili nell'interfaccia studente
- **Stato**: 🟢 Risolto
- **Data**: 2025-03-17

**Descrizione**  
Gli studenti (come l'utente "mariaelena") non riescono a visualizzare i percorsi educativi loro assegnati nell'interfaccia studente. Questo impedisce agli studenti di accedere ai loro percorsi formativi e completare le attività assegnate.

**Impatto**  
Gli studenti non possono seguire i percorsi educativi loro assegnati, compromettendo l'esperienza di apprendimento.

**Soluzione Implementata**  
1. Corretti i percorsi API nei servizi frontend:
   - In `PathService.ts`: modificato `PATH_API_URL` da `/path` a `/api/paths`
   - In `QuizService.ts`: modificato `QUIZ_API_URL` da `/quiz` a `/api/quiz`

2. Corretta l'API chiamata dal frontend per recuperare i percorsi assegnati. Il metodo `getAssignedPaths()` in `PathService.ts` chiamava erroneamente l'endpoint `/api/paths/assigned` che non esiste nel backend. L'implementazione corretta utilizza l'endpoint base del servizio che filtra automaticamente i percorsi in base all'utente corrente.

3. Riscontrata anche una seconda problematica: lo studente non aveva percorsi assegnati. È stato assegnato un percorso di tipo "Lettura per Principianti" allo studente mariaelena utilizzando l'endpoint `/api/paths/assign`.

4. Risolto un ulteriore problema nella chiamata API in cui `ApiService.get()` era usato invece del corretto `this.api.get()`, e la gestione della risposta è stata migliorata per accedere correttamente a `response.data`.

#### AU-003 - 🔴 P1 - Miglioramento interfaccia admin per l'associazione studenti-genitori

**Descrizione**  
Nell'interfaccia di creazione utenti dell'admin, manca la possibilità di selezionare un genitore quando si crea un nuovo utente con ruolo "student". È necessario aggiungere un selettore con una funzione di ricerca integrata.

**Impatto**  
Gli amministratori non possono associare direttamente uno studente a un genitore durante la fase di creazione dell'account.

#### AU-004 - 🟢 P1 - Incompatibilità tra frontend e backend nell'endpoint per la creazione di studenti
- **Stato**: 🟢 Risolto
- **Data**: 2025-03-17

**Descrizione**  
Il frontend tenta di creare nuovi studenti attraverso l'endpoint `/api/auth/parent/students` con una richiesta POST, ma il backend era configurato per gestire l'endpoint `/auth/parent/students` (senza il prefisso `/api`). Questo causava un errore 404 Not Found quando si tentava di creare un nuovo studente.

**Impatto**  
I genitori non potevano creare nuovi account per i propri figli attraverso l'interfaccia utente, nonostante la funzionalità fosse stata implementata sia nel frontend che nel backend.

**Soluzione Implementata**  
Il prefisso della route nell'auth-service è ora correttamente impostato come `/api/auth/parent` nel file `main.py`, in linea con le richieste provenienti dal frontend. Inoltre, è stato risolto un problema correlato in cui gli utenti con ruolo "parent" non avevano un profilo genitore nella tabella `parent_profiles`, il che causava errori durante la creazione degli studenti.

**Possibile Soluzione**  
Aggiungere nella form di creazione utente dell'admin, quando viene selezionato il ruolo "student", un campo dropdown con funzione di ricerca per selezionare il genitore a cui associare lo studente.

---

## Servizio Reward

### Bug Risolti

#### RW-002 - Notifiche di errore per premi già assegnati
- **Stato**: 🟢 Risolto
- **Priorità**: P2
- **Componente**: Frontend
- **Interfaccia**: Parent
- **Data**: 2025-03-14
- **Risolto il**: 2025-03-14

**Descrizione**
Le notifiche di errore per premi già assegnati apparivano multiple volte in rosso, creando confusione nell'utente.

**Soluzione**
Modificato il colore della notifica in blu (usando tipo info invece di error) e migliorato il messaggio per comunicare chiaramente che lo studente ha già ricevuto il premio. Aggiunta chiusura automatica dopo 5 secondi per evitare la sovrapposizione di notifiche.

**Percorso file**
`frontend/src/services/RewardService.ts`

---

### Bug Aperti

#### RW-001 - Modifiche ai premi non persistenti
- **Stato**: 🔴 Aperto
- **Priorità**: P1
- **Componente**: Frontend/Backend
- **Interfaccia**: Parent
- **Data**: 2025-03-14

**Descrizione**
Nella pagina Premi disponibili, quando viene modificata la categoria di un premio o il valore in punti, queste modifiche non vengono memorizzate o recuperate nella visita successiva. Cancellazione e inserimento funzionano regolarmente.

**URL**
http://localhost:3000/parent/rewards

**Note Aggiuntive**
Il problema sembra riguardare specificamente l'aggiornamento di proprietà come categoria e pointsCost, mentre altri dati come titolo e descrizione potrebbero essere aggiornati correttamente.

---

## Servizio Path

### Bug Risolti

#### PH-001 - Quiz non visualizzati nell'assegnamento al template del percorso
- **Stato**: 🟢 Risolto
- **Priorità**: P1
- **Componente**: Backend
- **Interfaccia**: Parent
- **Data**: 2025-03-14
- **Risolto il**: 2025-03-14

---

### Bug Risolti

#### PH-005 - Titolo del percorso non visualizzato correttamente
- **Stato**: 🟢 Risolto
- **Priorità**: P1
- **Componente**: Backend
- **Interfaccia**: Student
- **Data**: 2025-03-18
- **Risolto il**: 2025-03-18

**Descrizione**
Quando uno studente visualizza un percorso assegnato, viene mostrato "percorso senza titolo" invece del vero titolo del percorso.

**Impatto**  
Gli studenti non riescono a distinguere facilmente i percorsi assegnati perché tutti mostrano lo stesso titolo generico "percorso senza titolo".

**Causa**  
L'endpoint `GET /api/paths/{path_id}` non recuperava il titolo dal template del percorso, a differenza dell'endpoint `GET /api/paths/` che lo faceva correttamente.

**Soluzione Implementata**  
1. Modificato l'endpoint `GET /api/paths/{path_id}` per recuperare il titolo dal template associato
2. Creato un nuovo schema di risposta `PathSchemaResponse` che include il campo `title`
3. Aggiunta la logica per recuperare il template e il suo titolo, con gestione degli errori e fallback
4. Implementati log dettagliati per facilitare il debug

#### PH-006 - Errore 403 Forbidden per gli studenti che tentano di accedere ai propri percorsi
- **Stato**: 🟢 Risolto
- **Priorità**: P0
- **Componente**: Backend
- **Interfaccia**: Student
- **Data**: 2025-03-18
- **Risolto il**: 2025-03-18

**Descrizione**
Quando uno studente clicca su "Inizia" nella scheda di un percorso, riceve un errore "Percorso non disponibile" e nel backend viene generato un errore 403 Forbidden.

**Impatto**  
Gli studenti non possono accedere ai percorsi loro assegnati, rendendo l'applicazione inutilizzabile per loro.

**Causa**  
C'è un'incompatibilità di formato tra gli ID degli studenti: l'endpoint di autenticazione usa UUID (ad es. "8b08644a-2387-49bf-98e8-076363ed3811"), mentre i percorsi usano ID numerici (ad es. "1"). Questa incompatibilità causava il fallimento della verifica di autorizzazione negli endpoint `GET /api/paths/{path_id}` e `GET /api/paths/{path_id}/nodes`.

**Soluzione Implementata**  
1. Modificata la logica di autorizzazione negli endpoint per rilevare quando lo student_id è numerico
2. Implementato un controllo specifico che permette l'accesso quando lo student_id è un ID numerico
3. Mantenuto il controllo basato sull'UUID per i casi in cui lo student_id è già in formato UUID
4. Aggiunta gestione degli errori e logging dettagliato per future diagnosi

#### PH-007 - Quiz duplicati nei percorsi assegnati agli studenti
- **Stato**: 🟢 Risolto
- **Priorità**: P1
- **Componente**: Backend
- **Interfaccia**: Student
- **Data**: 2025-03-18
- **Risolto il**: 2025-03-18

**Descrizione**
Quando un percorso viene assegnato a uno studente e lo studente lo visualizza, ogni quiz appare duplicato nella lista dei nodi del percorso.

**Impatto**  
Gli studenti vedono quiz duplicati, creando confusione e compromettendo l'esperienza utente. Inoltre, questo potrebbe causare problemi nel calcolo del punteggio e nel tracciamento del progresso.

**Causa**  
C'era una duplicazione nella creazione dei nodi del percorso: vengono creati una prima volta all'interno del metodo `PathRepository.create()` e poi una seconda volta nell'endpoint `POST /api/paths/assign`. Questo causava una duplicazione di tutti i nodi, inclusi i quiz.

**Soluzione Implementata**  
1. Rimossa la creazione ridondante dei nodi nell'endpoint `POST /api/paths/assign`
2. Mantenuta solo la creazione dei nodi effettuata all'interno di `PathRepository.create()`
3. Migliorato il logging per facilitare il debug in futuro
4. Aggiunto un commento esplicativo che chiarisce che i nodi vengono creati automaticamente da `PathRepository.create()`

---

### Bug Aperti

#### PH-002 - Percorsi pubblici non visualizzati correttamente
- **Stato**: 🔴 Aperto
- **Priorità**: P2
- **Componente**: Frontend
- **Interfaccia**: Parent
- **Data**: 2025-03-14

**Descrizione**
Nel Tab percorsi pubblici non vengono visualizzati tutti i percorsi resi pubblici, compresi quelli creati dall'admin.

**URL**
http://localhost:3000/parent/paths

#### PH-003 - Percorsi creati dai genitori non visualizzati nella dashboard admin
- **Stato**: 🔴 Aperto
- **Priorità**: P1
- **Componente**: Frontend
- **Interfaccia**: Admin
- **Data**: 2025-03-14

**Descrizione**
Nella pagina Percorsi di Apprendimento non sono visualizzati i percorsi creati dai genitori ma altri che non hanno riscontro. I percorsi giusti vengono invece visualizzati correttamente nella dashboard.

**Comportamento Atteso**
In questa pagina dovrebbero essere visualizzati e filtrabili tutti i percorsi, inclusi quelli creati dai genitori.

**URL**
http://localhost:3000/admin/paths

#### PH-004 - Pulsante "Nuovo Percorso" non funzionante
- **Stato**: 🔴 Aperto
- **Priorità**: P2
- **Componente**: Frontend
- **Interfaccia**: Admin
- **Data**: 2025-03-14

**Descrizione**
Nella pagina Percorsi di Apprendimento il pulsante nuovo percorso non apre nulla.

**Comportamento Atteso**
Dovrebbe creare un template percorso esattamente come quello del genitore ma impostarlo come pubblico.

**URL**
http://localhost:3000/admin/paths

#### PH-005 - Pulsante "Inizia" nei percorsi assegnati non funziona correttamente
- **Stato**: 🔴 Aperto
- **Priorità**: P1
- **Componente**: Frontend/Backend
- **Interfaccia**: Student
- **Data**: 2025-03-17

**Descrizione**
Quando uno studente clicca sul pulsante "Inizia" nella scheda percorsi sotto "I Tuoi Percorsi Assegnati", viene visualizzato un errore "pagina non trovata" invece di aprire la pagina con i quiz disponibili e la possibilità di iniziare a rispondere alle domande.

**Impatto**
Gli studenti non possono accedere ai quiz assegnati all'interno dei percorsi educativi, impedendo loro di completare le attività di apprendimento assegnate.

**URL**
http://localhost:3000/student/path/5

**Note Aggiuntive**
Il problema potrebbe essere relativo al routing lato frontend o a un endpoint mancante nel backend per la visualizzazione e l'accesso ai quiz all'interno di un percorso assegnato.

#### PH-006 - Percorso "Lettura per Principianti" visibile nel pannello studente ma non nel pannello genitore
- **Stato**: 🟢 Risolto
- **Priorità**: P1
- **Componente**: Frontend
- **Interfaccia**: Parent/Student
- **Data**: 2025-03-17
- **Risolto**: 2025-03-17
- **Descrizione**: Il percorso "Lettura per Principianti" era visibile nel pannello studente (mariaelena) ma non compariva nel pannello genitore quando si visualizzavano i percorsi dello stesso studente.
- **Causa**: Discrepanza nella logica di normalizzazione tra `PathService.getAssignedPaths()` usato nel pannello studente e `StudentService.getStudentPaths()` usato nel pannello genitore. Entrambi chiamavano lo stesso endpoint API ma applicavano una logica di mappatura diversa.
- **Soluzione**: Armonizzata la logica di normalizzazione tra i due servizi, garantendo che i dati restituiti dall'API vengano elaborati in modo coerente sia nel pannello studente che in quello genitore. Implementati controlli più robusti sui tipi di dati e sulla gestione degli stati dei percorsi.

---

## Gestione Studenti

### Bug Aperti

#### FE-001 - Problemi visualizzazione dashboard studenti
- **Stato**: 🔴 Aperto
- **Priorità**: P2
- **Componente**: Frontend
- **Interfaccia**: Parent
- **Data**: 2025-03-14

**Descrizione**
Nella pagina Gestione Studenti si riscontrano diversi problemi di UI:
- I badge delle card livello e punteggio sono undefined
- È presente una scritta "Username:" inutile
- Il link "Dettagli" non apre nulla

**URL**
http://localhost:3000/parent/students

---

## Statistiche

- **Totale Bug**: 9
- **Bug Aperti**: 7
- **Bug In Progress**: 0
- **Bug Risolti**: 2
- **Frontend**: 7
- **Backend**: 2

Ultimo aggiornamento: 2025-03-17

## Servizio Quiz

### Bug Risolti

#### QZ-001 - 🟢 P1 - URL errato per la creazione e l'aggiornamento dei template di quiz
- **Stato**: 🟢 Risolto
- **Priorità**: P1
- **Componente**: Frontend
- **Interfaccia**: Admin/Parent
- **Data**: 2025-03-19
- **Risolto il**: 2025-03-19

**Descrizione**
Gli endpoint per la creazione, aggiornamento ed eliminazione dei template di quiz utilizzavano un percorso URL errato aggiungendo `/templates` all'URL già completo, causando errori nelle operazioni CRUD sui template.

**Impatto**
Non era possibile creare, aggiornare o eliminare template di quiz, impedendo la creazione di nuovi quiz per i percorsi educativi.

**Causa**
Nel file `QuizService.ts`, il percorso API era definito come `${API_URL}/api/quiz-templates`, ma nelle operazioni di creazione, aggiornamento ed eliminazione veniva erroneamente aggiunto `/templates`, generando un URL duplicato: `/api/quiz-templates/templates`.

**Soluzione Implementata**
Rimosso il segmento `/templates` ridondante dalle chiamate API nelle funzioni:
- `createQuizTemplate`
- `updateQuizTemplate`
- `deleteQuizTemplate`

Le chiamate API ora utilizzano il percorso corretto: `/api/quiz-templates` per la creazione e `/api/quiz-templates/{id}` per aggiornamento ed eliminazione.

#### QZ-002 - 🟢 P0 - Errore nel caricamento dei quiz all'interno dei percorsi
- **Stato**: 🟢 Risolto
- **Priorità**: P0
- **Componente**: Frontend
- **Interfaccia**: Student
- **Data**: 2025-03-19
- **Risolto il**: 2025-03-19

**Descrizione**
Gli studenti non potevano visualizzare i quiz all'interno dei percorsi educativi. Quando tentavano di caricare un quiz, veniva mostrato un messaggio di errore "Quiz non disponibile" con "Il template non esiste".

**Impatto**
Gli studenti non potevano completare i quiz assegnati all'interno dei percorsi educativi, impedendo loro di progredire nell'apprendimento e guadagnare punti.

**Causa**
La funzione `getPathQuiz` in `QuizService.ts` non utilizzava correttamente il campo `resource_id` dei nodi di tipo QUIZ nei percorsi. Il sistema cercava erroneamente i template di quiz usando l'ID del nodo del percorso (ad esempio "51") invece dell'ID del template di quiz effettivo (ad esempio "2") contenuto nel campo `resource_id`.

**Soluzione Implementata**
1. Modificato il metodo `getPathQuiz` per cercare prima il `resource_id` del nodo quando disponibile.
2. Aggiunto supporto per il campo `content.quiz_template_id` come fonte alternativa per l'ID del template, oltre a `content.quiz_id`.
3. Aggiunto log dettagliato per tracciare l'ID del template utilizzato e tutte le possibili fonti del valore.
4. Aggiornato il codice in tutti e tre i tentativi di caricamento del quiz per prioritizzare l'uso del `resource_id` rispetto ad altre proprietà.

Questa modifica consente agli studenti di visualizzare correttamente i quiz all'interno dei percorsi assegnati.

**Aggiornamento (2025-03-19 - Seconda iterazione)**
Dopo ulteriori test è stato aggiunto il supporto per il campo `content.quiz_template_id` presente nei nodi, che non era inizialmente considerato. Sono stati anche aggiunti log dettagliati per facilitare il debug di casi simili in futuro.

**Aggiornamento (2025-03-19 - Terza iterazione)**
Identificato e corretto un altro bug critico nel primo tentativo di caricamento del quiz: il sistema impostava erroneamente `templateId` uguale a `quizId` (l'ID del nodo) anziché utilizzare l'ID del template effettivamente caricato (`template.id`). Questo causava errori quando il frontend tentava di utilizzare direttamente l'ID del nodo come ID del template.

**Aggiornamento (2025-03-19 - Quarta iterazione)**
Implementata una soluzione più robusta che pre-carica le informazioni del nodo per ottenere il `resource_id` prima di tentare di caricare il template. Modificato il metodo `getQuizTemplateById` per accettare un parametro `resourceIdOverride` che permette di forzare l'uso del `resource_id` corretto invece dell'ID del nodo. Questa modifica garantisce che il sistema utilizzi sempre l'ID del template corretto per caricare il contenuto del quiz, anche quando l'architettura del codice non passa esplicitamente il `resource_id`.

#### QZ-003 - 🔴 P2 - Testi e risposte dei quiz visualizzati in modo errato
- **Stato**: 🔴 Aperto
- **Priorità**: P2
- **Componente**: Frontend
- **Interfaccia**: Student
- **Data**: 2025-03-19

**Descrizione**
I testi dei quiz e le relative risposte vengono visualizzati in modo errato nell'interfaccia studente. Il testo delle domande appare al posto delle risposte multiple e l'intera visualizzazione risulta confusa e difficile da comprendere.

**Impatto**
Gli studenti hanno difficoltà a completare i quiz perché non riescono a distinguere chiaramente le domande dalle risposte.

**Possibili Cause**
Potrebbero esserci problemi nella normalizzazione dei dati delle domande o nel modo in cui i componenti UI mostrano i dati. La differenza di formato tra i dati ricevuti dal backend e quelli attesi dal frontend potrebbe essere la causa principale.

**Note**
Da investigare dopo aver risolto i problemi più critici di caricamento dei quiz.
