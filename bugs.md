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

### Bug Aperti

#### PH-001 - Quiz non visualizzati nell'assegnamento al template del percorso
- **Stato**: 🔴 Aperto
- **Priorità**: P1
- **Componente**: Backend
- **Interfaccia**: Parent
- **Data**: 2025-03-14

**Descrizione**
Nella pagina Gestione Percorsi, quando si clicca sull'icona di assegnamento quiz al template del percorso, i quiz inseriti dall'admin non vengono visualizzati.

**Errore**
"GET /api/quiz/v1/templates HTTP/1.1" 404 Not Found

**URL**
http://localhost:3000/parent/paths

---

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

---

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

---

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

- **Totale Bug**: 7
- **Bug Aperti**: 6
- **Bug In Progress**: 0
- **Bug Risolti**: 1
- **Frontend**: 5
- **Backend**: 2

Ultimo aggiornamento: 2025-03-14
