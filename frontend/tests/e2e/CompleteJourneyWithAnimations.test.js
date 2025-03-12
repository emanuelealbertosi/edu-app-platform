import { test, expect } from '@playwright/test';

/**
 * Test end-to-end completo che verifica l'intero flusso dell'applicazione integrando anche
 * il controllo delle animazioni per migliorare l'esperienza utente:
 * 1. Admin crea parent, template quiz, percorso e ricompensa (verificando le animazioni)
 * 2. Parent crea uno studente e assegna percorso e ricompensa (verificando le animazioni)
 * 3. Studente completa quiz e acquista ricompensa (verificando le animazioni)
 * 
 * Il test verifica specificamente:
 * - Transizioni di pagina con animazioni
 * - Caricamento con indicatori visivi (LoadingSpinner)
 * - Feedback visivo durante le operazioni asincrone
 * - Notifiche con animazioni
 * - Effetti di apparizione degli elementi (FadeIn/SlideIn)
 */
test.describe('Complete User Journey with Animations', () => {
  // Dati di test
  const adminCredentials = { email: 'admin@example.com', password: 'password123' };
  const parentCredentials = { 
    email: 'testparent@example.com', 
    password: 'securepwd123',
    firstName: 'Test',
    lastName: 'Parent'
  };
  const studentCredentials = {
    firstName: 'Test',
    lastName: 'Student',
    age: 10
  };
  const pathTemplate = {
    title: 'Percorso Animato',
    description: 'Percorso di test per verificare le animazioni',
    subject: 'math',
    difficulty: 'medium',
    targetAgeMin: 8,
    targetAgeMax: 12,
    estimatedDays: 7
  };
  const quizTemplate = {
    title: 'Quiz Animato',
    description: 'Quiz di test per verificare le animazioni',
    subject: 'math',
    difficulty: 'medium',
    points: 50,
    questions: [
      {
        text: 'Quanto fa 2+2?',
        type: 'multiple_choice',
        options: ['3', '4', '5', '6'],
        correctOptionIndex: 1
      },
      {
        text: 'Quanto fa 5x5?',
        type: 'multiple_choice',
        options: ['20', '25', '30', '35'],
        correctOptionIndex: 1
      }
    ]
  };
  const rewardTemplate = {
    title: 'Ricompensa Animata',
    description: 'Ricompensa di test per verificare le animazioni',
    points: 30,
    type: 'digital',
    imageUrl: 'https://example.com/image.jpg'
  };

  // Variabili per memorizzare gli ID creati durante il test
  let parentId, studentId, pathTemplateId, quizTemplateId, rewardTemplateId;

  // Funzione helper per verificare le animazioni di un elemento
  async function verifyAnimationEffect(locator, page) {
    await expect(locator).toBeVisible();
    
    // Verifica che l'elemento abbia proprietà di animazione
    const hasAnimation = await locator.evaluate(el => {
      const style = window.getComputedStyle(el);
      return (
        // Framer Motion applica stili inline
        (el.getAttribute('style')?.includes('transform') || 
         el.getAttribute('style')?.includes('opacity') ||
         el.getAttribute('style')?.includes('transition')) ||
        // Oppure usa classi/attributi specifici
        (el.className.includes('motion') ||
         el.getAttribute('data-motion'))
      );
    });
    
    expect(hasAnimation).toBeTruthy('Elemento dovrebbe avere effetti di animazione');
  }

  // Funzione per verificare la presenza e l'animazione dello spinner di caricamento
  async function verifyLoadingAnimation(page) {
    // Verifica che lo spinner di caricamento sia visibile
    const spinner = page.locator('[data-testid="loading-spinner"]');
    await expect(spinner).toBeVisible();
    
    // Verifica che lo spinner abbia un'animazione di rotazione
    const hasRotation = await spinner.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.animation.includes('rotate') || 
             el.getAttribute('style')?.includes('rotate');
    });
    
    expect(hasRotation).toBeTruthy('Lo spinner dovrebbe avere un\'animazione di rotazione');
  }

  // Funzione per verificare le animazioni di notifica
  async function verifyNotificationAnimation(page) {
    const notification = page.locator('.notification-success');
    await expect(notification).toBeVisible();
    
    // Verifica che la notifica abbia un'animazione
    await verifyAnimationEffect(notification, page);
    
    // Opzionale: verifica che la notifica scompaia dopo un certo periodo
    // await expect(notification).toBeHidden({ timeout: 10000 });
  }

  // Funzione per rallentare la rete e rendere visibili le animazioni
  async function slowDownNetwork(page) {
    await page.route('**/*', (route) => {
      route.continue({ delay: 500 });
    });
  }

  test.beforeEach(async ({ page }) => {
    // Rallenta leggermente la rete per rendere visibili le animazioni
    await page.route('**/api/**', (route) => {
      route.continue({ delay: 300 });
    });
  });

  test('Admin journey with animations: create parent, path and quiz templates', async ({ page }) => {
    // Vai alla pagina di login verificando le animazioni di caricamento
    await page.goto('/login');
    
    // Verifica animazioni durante il caricamento della pagina
    const authContainer = page.locator('.auth-container');
    await verifyAnimationEffect(authContainer, page);
    
    // Login come admin
    await page.fill('input[type="email"]', adminCredentials.email);
    await page.fill('input[type="password"]', adminCredentials.password);
    
    // Rallenta la risposta di login per verificare lo spinner
    await page.route('**/api/auth/login', (route) => {
      route.continue({ delay: 1000 });
    }, { times: 1 });
    
    await page.click('button[type="submit"]');
    
    // Verifica lo spinner durante il login
    const loginButton = page.locator('button[type="submit"]');
    await verifyLoadingAnimation(page);
    
    // Verifica che siamo sulla dashboard admin
    await expect(page).toHaveURL('/admin');
    
    // Verifica animazione di PageTransition nella dashboard
    const dashboard = page.locator('main');
    await verifyAnimationEffect(dashboard, page);
    
    // Verifica notifica di login con successo
    await verifyNotificationAnimation(page);
    
    // Crea un nuovo parent
    await page.click('text=Gestione Utenti');
    
    // Verifica animazione transizione pagina
    await expect(page).toHaveURL('/admin/users');
    await verifyAnimationEffect(page.locator('main'), page);
    
    await page.click('text=Aggiungi Utente');
    await page.fill('input[name="email"]', parentCredentials.email);
    await page.fill('input[name="firstName"]', parentCredentials.firstName);
    await page.fill('input[name="lastName"]', parentCredentials.lastName);
    await page.fill('input[name="password"]', parentCredentials.password);
    await page.selectOption('select[name="role"]', 'parent');
    
    // Rallenta la risposta per verificare lo spinner
    await page.route('**/api/users', (route) => {
      route.continue({ delay: 1000 });
    }, { times: 1 });
    
    await page.click('button:has-text("Salva")');
    
    // Verifica lo spinner durante il salvataggio
    await verifyLoadingAnimation(page);
    
    // Verifica che la notifica di successo appaia con animazione
    await verifyNotificationAnimation(page);
    
    // Memorizza l'ID del parent appena creato
    const parentRow = page.locator(`tr:has-text("${parentCredentials.email}")`);
    parentId = await parentRow.getAttribute('data-user-id');
    
    // Crea un nuovo template quiz
    await page.click('text=Template Quiz');
    
    // Verifica animazione transizione pagina
    await expect(page).toHaveURL('/admin/quiz-templates');
    await verifyAnimationEffect(page.locator('main'), page);
    
    await page.click('text=Nuovo Template Quiz');
    await page.fill('input[name="title"]', quizTemplate.title);
    await page.fill('textarea[name="description"]', quizTemplate.description);
    await page.selectOption('select[name="subject"]', quizTemplate.subject);
    await page.selectOption('select[name="difficulty"]', quizTemplate.difficulty);
    await page.fill('input[name="points"]', quizTemplate.points.toString());
    
    // Aggiungi le domande
    await page.click('button:has-text("Aggiungi Domanda")');
    await page.fill('input[name="questions[0].text"]', quizTemplate.questions[0].text);
    await page.selectOption('select[name="questions[0].type"]', quizTemplate.questions[0].type);
    
    // Aggiungi le opzioni
    for (let i = 0; i < quizTemplate.questions[0].options.length; i++) {
      await page.fill(`input[name="questions[0].options[${i}]"]`, quizTemplate.questions[0].options[i]);
    }
    await page.selectOption('select[name="questions[0].correctOptionIndex"]', quizTemplate.questions[0].correctOptionIndex.toString());
    
    // Aggiungi seconda domanda
    await page.click('button:has-text("Aggiungi Domanda")');
    await page.fill('input[name="questions[1].text"]', quizTemplate.questions[1].text);
    await page.selectOption('select[name="questions[1].type"]', quizTemplate.questions[1].type);
    
    // Aggiungi le opzioni per la seconda domanda
    for (let i = 0; i < quizTemplate.questions[1].options.length; i++) {
      await page.fill(`input[name="questions[1].options[${i}]"]`, quizTemplate.questions[1].options[i]);
    }
    await page.selectOption('select[name="questions[1].correctOptionIndex"]', quizTemplate.questions[1].correctOptionIndex.toString());
    
    // Rallenta la risposta per verificare lo spinner
    await page.route('**/api/quiz-templates', (route) => {
      route.continue({ delay: 1000 });
    }, { times: 1 });
    
    await page.click('button:has-text("Salva Template")');
    
    // Verifica lo spinner durante il salvataggio
    await verifyLoadingAnimation(page);
    
    // Verifica che la notifica di successo appaia con animazione
    await verifyNotificationAnimation(page);
    
    // Memorizza l'ID del quiz template appena creato
    const quizRow = page.locator(`tr:has-text("${quizTemplate.title}")`);
    quizTemplateId = await quizRow.getAttribute('data-quiz-id');
    
    // Crea un nuovo template percorso
    await page.click('text=Template Percorsi');
    
    // Verifica animazione transizione pagina
    await expect(page).toHaveURL('/admin/path-templates');
    await verifyAnimationEffect(page.locator('main'), page);
    
    await page.click('text=Nuovo Template Percorso');
    await page.fill('input[name="title"]', pathTemplate.title);
    await page.fill('textarea[name="description"]', pathTemplate.description);
    await page.selectOption('select[name="subject"]', pathTemplate.subject);
    await page.selectOption('select[name="difficulty"]', pathTemplate.difficulty);
    await page.fill('input[name="targetAgeMin"]', pathTemplate.targetAgeMin.toString());
    await page.fill('input[name="targetAgeMax"]', pathTemplate.targetAgeMax.toString());
    await page.fill('input[name="estimatedDays"]', pathTemplate.estimatedDays.toString());
    
    // Aggiungi il quiz template al percorso
    await page.click('button:has-text("Aggiungi Quiz")');
    await page.selectOption('select[name="quizTemplates"]', quizTemplateId);
    await page.click('button:has-text("Aggiungi al Percorso")');
    
    // Verifica che il quiz sia stato aggiunto al percorso con animazione
    const quizItem = page.locator(`[data-quiz-id="${quizTemplateId}"]`);
    await expect(quizItem).toBeVisible();
    await verifyAnimationEffect(quizItem, page);
    
    // Rallenta la risposta per verificare lo spinner
    await page.route('**/api/path-templates', (route) => {
      route.continue({ delay: 1000 });
    }, { times: 1 });
    
    await page.click('button:has-text("Salva Template")');
    
    // Verifica lo spinner durante il salvataggio
    await verifyLoadingAnimation(page);
    
    // Verifica che la notifica di successo appaia con animazione
    await verifyNotificationAnimation(page);
    
    // Memorizza l'ID del template percorso appena creato
    const pathRow = page.locator(`tr:has-text("${pathTemplate.title}")`);
    pathTemplateId = await pathRow.getAttribute('data-path-id');
    
    // Crea un nuovo template ricompensa
    await page.click('text=Template Ricompense');
    
    // Verifica animazione transizione pagina
    await expect(page).toHaveURL('/admin/reward-templates');
    await verifyAnimationEffect(page.locator('main'), page);
    
    await page.click('text=Nuovo Template Ricompensa');
    await page.fill('input[name="title"]', rewardTemplate.title);
    await page.fill('textarea[name="description"]', rewardTemplate.description);
    await page.fill('input[name="points"]', rewardTemplate.points.toString());
    await page.selectOption('select[name="type"]', rewardTemplate.type);
    await page.fill('input[name="imageUrl"]', rewardTemplate.imageUrl);
    
    // Rallenta la risposta per verificare lo spinner
    await page.route('**/api/reward-templates', (route) => {
      route.continue({ delay: 1000 });
    }, { times: 1 });
    
    await page.click('button:has-text("Salva Template")');
    
    // Verifica lo spinner durante il salvataggio
    await verifyLoadingAnimation(page);
    
    // Verifica che la notifica di successo appaia con animazione
    await verifyNotificationAnimation(page);
    
    // Memorizza l'ID del template ricompensa appena creato
    const rewardRow = page.locator(`tr:has-text("${rewardTemplate.title}")`);
    rewardTemplateId = await rewardRow.getAttribute('data-reward-id');
    
    // Logout con animazione
    await page.click('[aria-label="account of current user"]');
    await page.click('text=Logout');
    
    // Verifica animazione di transizione alla pagina di login
    await expect(page).toHaveURL('/login');
    await verifyAnimationEffect(page.locator('.auth-container'), page);
  });

  test('Parent journey with animations: create student, assign path and reward', async ({ page }) => {
    // Login come parent
    await page.goto('/login');
    await page.fill('input[type="email"]', parentCredentials.email);
    await page.fill('input[type="password"]', parentCredentials.password);
    await page.click('button[type="submit"]');

    // Verifica animazione durante il login
    await verifyLoadingAnimation(page);
    
    // Verifica che siamo sulla dashboard parent con animazione
    await expect(page).toHaveURL('/parent');
    await verifyAnimationEffect(page.locator('main'), page);
    
    // Verifica notifica di login con successo
    await verifyNotificationAnimation(page);
    
    // Crea un nuovo studente
    await page.click('text=Studenti');
    
    // Verifica animazione transizione pagina
    await expect(page).toHaveURL('/parent/students');
    await verifyAnimationEffect(page.locator('main'), page);
    
    await page.click('text=Aggiungi Studente');
    await page.fill('input[name="firstName"]', studentCredentials.firstName);
    await page.fill('input[name="lastName"]', studentCredentials.lastName);
    await page.fill('input[name="age"]', studentCredentials.age.toString());
    
    // Rallenta la risposta per verificare lo spinner
    await page.route('**/api/students', (route) => {
      route.continue({ delay: 1000 });
    }, { times: 1 });
    
    await page.click('button:has-text("Salva")');
    
    // Verifica lo spinner durante il salvataggio
    await verifyLoadingAnimation(page);
    
    // Verifica che la notifica di successo appaia con animazione
    await verifyNotificationAnimation(page);
    
    // Memorizza l'ID dello studente appena creato
    const studentRow = page.locator(`tr:has-text("${studentCredentials.firstName} ${studentCredentials.lastName}")`);
    studentId = await studentRow.getAttribute('data-student-id');
    
    // Assegna il percorso allo studente
    await page.click('text=Assegna Percorsi');
    
    // Verifica animazione transizione pagina
    await expect(page).toHaveURL('/parent/assign-paths');
    await verifyAnimationEffect(page.locator('main'), page);
    
    // Seleziona lo studente
    await page.selectOption('select[name="studentId"]', studentId);
    
    // Verifica animazione caricamento percorsi disponibili
    await verifyLoadingAnimation(page);
    
    // Seleziona il percorso
    const pathCard = page.locator(`[data-path-id="${pathTemplateId}"]`);
    await pathCard.locator('button:has-text("Seleziona")').click();
    
    // Verifica animazione della selezione
    await verifyAnimationEffect(page.locator('.selected-path-card'), page);
    
    // Rallenta la risposta per verificare lo spinner
    await page.route('**/api/paths/assign', (route) => {
      route.continue({ delay: 1000 });
    }, { times: 1 });
    
    // Conferma l'assegnazione
    await page.click('button:has-text("Conferma Assegnazione")');
    
    // Verifica lo spinner durante il salvataggio
    await verifyLoadingAnimation(page);
    
    // Verifica che la notifica di successo appaia con animazione
    await verifyNotificationAnimation(page);
    
    // Assegna la ricompensa come disponibile per lo studente
    await page.click('text=Template Ricompense');
    
    // Verifica animazione transizione pagina
    await expect(page).toHaveURL('/parent/reward-templates');
    await verifyAnimationEffect(page.locator('main'), page);
    
    // Trova la ricompensa e la rende disponibile per lo studente
    const rewardCard = page.locator(`[data-reward-id="${rewardTemplateId}"]`);
    await rewardCard.locator('button:has-text("Rendi Disponibile")').click();
    
    // Seleziona lo studente
    await page.selectOption('select[name="studentId"]', studentId);
    
    // Rallenta la risposta per verificare lo spinner
    await page.route('**/api/rewards/make-available', (route) => {
      route.continue({ delay: 1000 });
    }, { times: 1 });
    
    // Conferma
    await page.click('button:has-text("Conferma")');
    
    // Verifica lo spinner durante il salvataggio
    await verifyLoadingAnimation(page);
    
    // Verifica che la notifica di successo appaia con animazione
    await verifyNotificationAnimation(page);
    
    // Logout con animazione
    await page.click('[aria-label="account of current user"]');
    await page.click('text=Logout');
    
    // Verifica animazione di transizione alla pagina di login
    await expect(page).toHaveURL('/login');
    await verifyAnimationEffect(page.locator('.auth-container'), page);
  });

  test('Student journey with animations: complete quiz and purchase reward', async ({ page }) => {
    // Login come studente
    await page.goto('/login');
    
    // Recupera le credenziali dello studente
    // Questo presuppone che esista un endpoint per recuperare le credenziali generate
    await page.goto(`/api/test/student-credentials/${studentId}`);
    const studentLoginData = JSON.parse(await page.textContent('body'));
    
    // Torna alla pagina di login
    await page.goto('/login');
    await page.fill('input[type="email"]', studentLoginData.email);
    await page.fill('input[type="password"]', studentLoginData.password);
    await page.click('button[type="submit"]');
    
    // Verifica animazione durante il login
    await verifyLoadingAnimation(page);
    
    // Verifica che siamo sulla dashboard studente con animazione
    await expect(page).toHaveURL('/student');
    await verifyAnimationEffect(page.locator('main'), page);
    
    // Verifica notifica di login con successo
    await verifyNotificationAnimation(page);
    
    // Verifica che il percorso assegnato sia visibile con animazione
    const assignedPath = page.locator(`[data-path-title="${pathTemplate.title}"]`);
    await expect(assignedPath).toBeVisible();
    await verifyAnimationEffect(assignedPath, page);
    
    // Vai ai percorsi
    await page.click('text=Miei Percorsi');
    
    // Verifica animazione transizione pagina
    await expect(page).toHaveURL('/student/paths');
    await verifyAnimationEffect(page.locator('main'), page);
    
    // Seleziona il percorso
    await page.click(`[data-path-title="${pathTemplate.title}"]`);
    
    // Inizia il quiz
    await page.click('text=Inizia Quiz');
    
    // Verifica animazione di transizione al quiz
    await verifyAnimationEffect(page.locator('h1'), page);
    
    // Verifica che siamo nella pagina del quiz
    await expect(page.locator('h1')).toContainText(quizTemplate.title);
    
    // Rispondi alle domande
    // Prima domanda con animazione
    const firstQuestion = page.locator('[data-question-index="0"]');
    await verifyAnimationEffect(firstQuestion, page);
    
    await firstQuestion.locator(`[data-option-index="${quizTemplate.questions[0].correctOptionIndex}"]`).click();
    await page.click('button:has-text("Prossima Domanda")');
    
    // Seconda domanda con animazione
    const secondQuestion = page.locator('[data-question-index="1"]');
    await verifyAnimationEffect(secondQuestion, page);
    
    await secondQuestion.locator(`[data-option-index="${quizTemplate.questions[1].correctOptionIndex}"]`).click();
    
    // Rallenta la risposta per verificare lo spinner
    await page.route('**/api/quizzes/*/submit', (route) => {
      route.continue({ delay: 1000 });
    }, { times: 1 });
    
    await page.click('button:has-text("Invia Risposte")');
    
    // Verifica lo spinner durante l'invio delle risposte
    await verifyLoadingAnimation(page);
    
    // Verifica che la notifica di successo appaia con animazione
    await verifyNotificationAnimation(page);
    
    // Verifica il risultato del quiz con animazione
    const quizResult = page.locator('.quiz-result');
    await verifyAnimationEffect(quizResult, page);
    
    await expect(quizResult).toContainText('2/2');
    await expect(page.locator('.quiz-points')).toContainText(quizTemplate.points.toString());
    
    // Torna alla dashboard
    await page.click('button:has-text("Torna alla Dashboard")');
    
    // Verifica animazione di transizione alla dashboard
    await expect(page).toHaveURL('/student');
    await verifyAnimationEffect(page.locator('main'), page);
    
    // Verifica che i punti siano stati aggiornati con animazione
    const pointsDisplay = page.locator('.student-points');
    await verifyAnimationEffect(pointsDisplay, page);
    await expect(pointsDisplay).toContainText(quizTemplate.points.toString());
    
    // Vai allo shop ricompense
    await page.click('text=Shop Ricompense');
    
    // Verifica animazione transizione pagina
    await expect(page).toHaveURL('/student/rewards');
    await verifyAnimationEffect(page.locator('main'), page);
    
    // Verifica che la ricompensa sia disponibile con animazione
    const rewardItem = page.locator(`[data-reward-title="${rewardTemplate.title}"]`);
    await expect(rewardItem).toBeVisible();
    await verifyAnimationEffect(rewardItem, page);
    
    // Acquista la ricompensa
    await rewardItem.locator('button:has-text("Acquista")').click();
    
    // Verifica animazione del modal di conferma
    const confirmModal = page.locator('.confirm-modal');
    await verifyAnimationEffect(confirmModal, page);
    
    // Rallenta la risposta per verificare lo spinner
    await page.route('**/api/rewards/*/purchase', (route) => {
      route.continue({ delay: 1000 });
    }, { times: 1 });
    
    // Conferma l'acquisto
    await page.click('button:has-text("Conferma Acquisto")');
    
    // Verifica lo spinner durante l'acquisto
    await verifyLoadingAnimation(page);
    
    // Verifica che la notifica di successo appaia con animazione
    await verifyNotificationAnimation(page);
    
    // Verifica che i punti siano stati aggiornati con animazione
    await verifyAnimationEffect(page.locator('.student-points'), page);
    await expect(page.locator('.student-points')).toContainText((quizTemplate.points - rewardTemplate.points).toString());
    
    // Vai alle ricompense acquistate
    await page.click('text=Le Mie Ricompense');
    
    // Verifica animazione transizione pagina
    await verifyAnimationEffect(page.locator('main'), page);
    
    // Verifica che la ricompensa appaia tra quelle acquistate con animazione
    const purchasedReward = page.locator(`[data-reward-title="${rewardTemplate.title}"]`);
    await expect(purchasedReward).toBeVisible();
    await verifyAnimationEffect(purchasedReward, page);
    
    // Logout con animazione
    await page.click('[aria-label="account of current user"]');
    await page.click('text=Logout');
    
    // Verifica animazione di transizione alla pagina di login
    await expect(page).toHaveURL('/login');
    await verifyAnimationEffect(page.locator('.auth-container'), page);
  });
});
