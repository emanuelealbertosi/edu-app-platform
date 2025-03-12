import { test, expect } from '@playwright/test';

/**
 * Test end-to-end completo che simula l'intero flusso dell'applicazione:
 * 1. Admin crea un nuovo parent e template percorso
 * 2. Parent crea uno studente e assegna il percorso
 * 3. Studente completa i quiz e acquista una ricompensa
 */
test.describe('Complete User Journey', () => {
  // Dati di test
  const adminCredentials = { email: 'admin@example.com', password: 'password123' };
  const parentCredentials = { 
    email: 'newparent@test.com', 
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
    title: 'Percorso Test',
    description: 'Percorso di test per end-to-end testing',
    subject: 'math',
    difficulty: 'medium',
    targetAgeMin: 8,
    targetAgeMax: 12,
    estimatedDays: 7
  };
  const quizTemplate = {
    title: 'Quiz Test',
    description: 'Quiz di test per end-to-end testing',
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
    title: 'Ricompensa Test',
    description: 'Ricompensa di test per end-to-end testing',
    points: 30,
    type: 'digital',
    imageUrl: 'https://example.com/image.jpg'
  };

  // Variabili per memorizzare gli ID creati durante il test
  let parentId, studentId, pathTemplateId, quizTemplateId, rewardTemplateId;

  test('Admin journey: create parent, path template, quiz template and reward template', async ({ page }) => {
    // Login come admin
    await page.goto('/login');
    await page.fill('input[type="email"]', adminCredentials.email);
    await page.fill('input[type="password"]', adminCredentials.password);
    await page.click('button[type="submit"]');

    // Verifica che siamo sulla dashboard admin
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('Admin Dashboard');

    // Crea un nuovo parent
    await page.click('text=Gestione Utenti');
    await expect(page).toHaveURL('/admin/users');
    
    await page.click('text=Aggiungi Utente');
    await page.fill('input[name="email"]', parentCredentials.email);
    await page.fill('input[name="firstName"]', parentCredentials.firstName);
    await page.fill('input[name="lastName"]', parentCredentials.lastName);
    await page.fill('input[name="password"]', parentCredentials.password);
    await page.selectOption('select[name="role"]', 'parent');
    await page.click('button:has-text("Salva")');
    
    // Verifica che la notifica di successo appaia
    await expect(page.locator('.notification-success')).toBeVisible();
    
    // Memorizza l'ID del parent appena creato
    const parentRow = page.locator(`tr:has-text("${parentCredentials.email}")`);
    parentId = await parentRow.getAttribute('data-user-id');
    
    // Crea un nuovo template percorso
    await page.click('text=Template Quiz');
    await expect(page).toHaveURL('/admin/quiz-templates');
    
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
    
    // Salva il quiz template
    await page.click('button:has-text("Salva Template")');
    
    // Verifica che la notifica di successo appaia
    await expect(page.locator('.notification-success')).toBeVisible();
    
    // Memorizza l'ID del quiz template appena creato
    const quizRow = page.locator(`tr:has-text("${quizTemplate.title}")`);
    quizTemplateId = await quizRow.getAttribute('data-quiz-id');
    
    // Crea un nuovo template percorso
    await page.click('text=Template Percorsi');
    await expect(page).toHaveURL('/admin/path-templates');
    
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
    
    // Verifica che il quiz sia stato aggiunto al percorso
    await expect(page.locator(`[data-quiz-id="${quizTemplateId}"]`)).toBeVisible();
    
    // Salva il template percorso
    await page.click('button:has-text("Salva Template")');
    
    // Verifica che la notifica di successo appaia
    await expect(page.locator('.notification-success')).toBeVisible();
    
    // Memorizza l'ID del template percorso appena creato
    const pathRow = page.locator(`tr:has-text("${pathTemplate.title}")`);
    pathTemplateId = await pathRow.getAttribute('data-path-id');
    
    // Crea un nuovo template ricompensa
    await page.click('text=Template Ricompense');
    await expect(page).toHaveURL('/admin/reward-templates');
    
    await page.click('text=Nuovo Template Ricompensa');
    await page.fill('input[name="title"]', rewardTemplate.title);
    await page.fill('textarea[name="description"]', rewardTemplate.description);
    await page.fill('input[name="points"]', rewardTemplate.points.toString());
    await page.selectOption('select[name="type"]', rewardTemplate.type);
    await page.fill('input[name="imageUrl"]', rewardTemplate.imageUrl);
    
    // Salva il template ricompensa
    await page.click('button:has-text("Salva Template")');
    
    // Verifica che la notifica di successo appaia
    await expect(page.locator('.notification-success')).toBeVisible();
    
    // Memorizza l'ID del template ricompensa appena creato
    const rewardRow = page.locator(`tr:has-text("${rewardTemplate.title}")`);
    rewardTemplateId = await rewardRow.getAttribute('data-reward-id');
    
    // Logout
    await page.click('[aria-label="account of current user"]');
    await page.click('text=Logout');
    
    // Verifica che siamo tornati alla pagina di login
    await expect(page).toHaveURL('/login');
  });

  test('Parent journey: create student, assign path and reward templates', async ({ page }) => {
    // Login come parent
    await page.goto('/login');
    await page.fill('input[type="email"]', parentCredentials.email);
    await page.fill('input[type="password"]', parentCredentials.password);
    await page.click('button[type="submit"]');

    // Verifica che siamo sulla dashboard parent
    await expect(page).toHaveURL('/parent');
    await expect(page.locator('h1')).toContainText('Parent Dashboard');

    // Crea un nuovo studente
    await page.click('text=Studenti');
    await expect(page).toHaveURL('/parent/students');
    
    await page.click('text=Aggiungi Studente');
    await page.fill('input[name="firstName"]', studentCredentials.firstName);
    await page.fill('input[name="lastName"]', studentCredentials.lastName);
    await page.fill('input[name="age"]', studentCredentials.age.toString());
    await page.click('button:has-text("Salva")');
    
    // Verifica che la notifica di successo appaia
    await expect(page.locator('.notification-success')).toBeVisible();
    
    // Memorizza l'ID dello studente appena creato
    const studentRow = page.locator(`tr:has-text("${studentCredentials.firstName} ${studentCredentials.lastName}")`);
    studentId = await studentRow.getAttribute('data-student-id');
    
    // Assegna il percorso allo studente
    await page.click('text=Assegna Percorsi');
    await expect(page).toHaveURL('/parent/assign-paths');
    
    // Seleziona lo studente
    await page.selectOption('select[name="studentId"]', studentId);
    
    // Seleziona il percorso
    const pathCard = page.locator(`[data-path-id="${pathTemplateId}"]`);
    await pathCard.locator('button:has-text("Seleziona")').click();
    
    // Conferma l'assegnazione
    await page.click('button:has-text("Conferma Assegnazione")');
    
    // Verifica che la notifica di successo appaia
    await expect(page.locator('.notification-success')).toBeVisible();
    
    // Assegna la ricompensa come disponibile per lo studente
    await page.click('text=Template Ricompense');
    await expect(page).toHaveURL('/parent/reward-templates');
    
    // Trova la ricompensa e la rende disponibile per lo studente
    const rewardCard = page.locator(`[data-reward-id="${rewardTemplateId}"]`);
    await rewardCard.locator('button:has-text("Rendi Disponibile")').click();
    
    // Seleziona lo studente
    await page.selectOption('select[name="studentId"]', studentId);
    
    // Conferma
    await page.click('button:has-text("Conferma")');
    
    // Verifica che la notifica di successo appaia
    await expect(page.locator('.notification-success')).toBeVisible();
    
    // Logout
    await page.click('[aria-label="account of current user"]');
    await page.click('text=Logout');
    
    // Verifica che siamo tornati alla pagina di login
    await expect(page).toHaveURL('/login');
  });

  test('Student journey: complete quiz and purchase reward', async ({ page }) => {
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

    // Verifica che siamo sulla dashboard studente
    await expect(page).toHaveURL('/student');
    await expect(page.locator('h1')).toContainText('Student Dashboard');
    
    // Verifica che il percorso assegnato sia visibile
    await expect(page.locator(`[data-path-title="${pathTemplate.title}"]`)).toBeVisible();
    
    // Vai ai percorsi
    await page.click('text=Miei Percorsi');
    await expect(page).toHaveURL('/student/paths');
    
    // Seleziona il percorso
    await page.click(`[data-path-title="${pathTemplate.title}"]`);
    
    // Inizia il quiz
    await page.click('text=Inizia Quiz');
    
    // Verifica che siamo nella pagina del quiz
    await expect(page.locator('h1')).toContainText(quizTemplate.title);
    
    // Rispondi alle domande
    // Prima domanda
    await page.click(`[data-question-index="0"] [data-option-index="${quizTemplate.questions[0].correctOptionIndex}"]`);
    await page.click('button:has-text("Prossima Domanda")');
    
    // Seconda domanda
    await page.click(`[data-question-index="1"] [data-option-index="${quizTemplate.questions[1].correctOptionIndex}"]`);
    await page.click('button:has-text("Invia Risposte")');
    
    // Verifica che la notifica di successo appaia
    await expect(page.locator('.notification-success')).toBeVisible();
    
    // Verifica il risultato del quiz
    await expect(page.locator('.quiz-result')).toContainText('2/2');
    await expect(page.locator('.quiz-points')).toContainText(quizTemplate.points.toString());
    
    // Torna alla dashboard
    await page.click('button:has-text("Torna alla Dashboard")');
    await expect(page).toHaveURL('/student');
    
    // Verifica che i punti siano stati aggiornati
    await expect(page.locator('.student-points')).toContainText(quizTemplate.points.toString());
    
    // Vai allo shop ricompense
    await page.click('text=Shop Ricompense');
    await expect(page).toHaveURL('/student/rewards');
    
    // Verifica che la ricompensa sia disponibile
    await expect(page.locator(`[data-reward-title="${rewardTemplate.title}"]`)).toBeVisible();
    
    // Acquista la ricompensa
    await page.click(`[data-reward-title="${rewardTemplate.title}"] button:has-text("Acquista")`);
    
    // Conferma l'acquisto
    await page.click('button:has-text("Conferma Acquisto")');
    
    // Verifica che la notifica di successo appaia
    await expect(page.locator('.notification-success')).toBeVisible();
    
    // Verifica che i punti siano stati aggiornati
    await expect(page.locator('.student-points')).toContainText((quizTemplate.points - rewardTemplate.points).toString());
    
    // Verifica che la ricompensa appaia tra quelle acquistate
    await page.click('text=Le Mie Ricompense');
    await expect(page.locator(`[data-reward-title="${rewardTemplate.title}"]`)).toBeVisible();
    
    // Logout
    await page.click('[aria-label="account of current user"]');
    await page.click('text=Logout');
    
    // Verifica che siamo tornati alla pagina di login
    await expect(page).toHaveURL('/login');
  });
});
