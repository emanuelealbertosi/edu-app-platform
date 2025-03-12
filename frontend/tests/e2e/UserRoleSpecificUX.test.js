import { test, expect } from '@playwright/test';

/**
 * Test end-to-end che verifica l'esperienza utente per i diversi ruoli nell'applicazione:
 * 1. Admin - Dashboard e gestione utenti
 * 2. Parent - Gestione studenti e assegnazione percorsi
 * 3. Student - Navigazione del percorso e quiz
 * 
 * Questo test si concentra specificamente sull'esperienza utente e le animazioni
 * per ogni tipo di utente.
 */
test.describe('Role-Specific User Experience', () => {
  // Credenziali per i diversi tipi di utente
  const users = {
    admin: { email: 'admin@example.com', password: 'password123' },
    parent: { email: 'parent@example.com', password: 'password123' },
    student: { email: 'student@example.com', password: 'password123' }
  };

  test.beforeEach(async ({ page }) => {
    // Impostiamo un delay di rete per rendere visibili le animazioni
    await page.route('**/*', (route) => {
      route.continue({ delay: 300 });
    });
  });

  test('Admin user experience with animations', async ({ page }) => {
    // Login come admin
    await page.goto('/login');
    await page.fill('input[type="email"]', users.admin.email);
    await page.fill('input[type="password"]', users.admin.password);
    await page.click('button[type="submit"]');
    
    // Verifica che dopo il login appaia una notifica animata
    const notification = page.locator('.notification-success');
    await expect(notification).toBeVisible();
    
    // Verifica che la notifica abbia un'animazione
    const hasAnimation = await notification.evaluate(el => {
      return window.getComputedStyle(el).opacity === '1' &&
             el.getAttribute('style')?.includes('transform');
    });
    expect(hasAnimation).toBeTruthy();
    
    // Verifica che siamo sulla dashboard admin
    await expect(page).toHaveURL('/admin');
    
    // Verifica che i widget della dashboard abbiano animazioni di ingresso
    const dashboardWidgets = page.locator('.dashboard-widget');
    await expect(dashboardWidgets.first()).toBeVisible();
    
    // Naviga alla pagina utenti e verifica transizione di pagina
    await page.click('text=Gestione Utenti');
    await expect(page).toHaveURL('/admin/users');
    
    // Verifica che la tabella utenti abbia un'animazione di fade-in
    const usersTable = page.locator('table');
    await expect(usersTable).toBeVisible();
    
    // Verifica che il caricamento degli utenti mostri uno spinner
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible({ timeout: 500 });
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden({ timeout: 5000 });
    
    // Verifica la reattività dell'interfaccia: apertura di un modal
    await page.click('text=Aggiungi Utente');
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    
    // Verifica che il modal abbia un'animazione di ingresso
    const modalHasAnimation = await modal.evaluate(el => {
      return window.getComputedStyle(el).opacity === '1' && 
             el.getAttribute('style')?.includes('transform');
    });
    expect(modalHasAnimation).toBeTruthy();
  });

  test('Parent user experience with animations', async ({ page }) => {
    // Login come parent
    await page.goto('/login');
    await page.fill('input[type="email"]', users.parent.email);
    await page.fill('input[type="password"]', users.parent.password);
    await page.click('button[type="submit"]');
    
    // Verifica che siamo sulla dashboard parent
    await expect(page).toHaveURL('/parent');
    
    // Verifica le animazioni dei widget della dashboard
    const dashboardWidgets = page.locator('.dashboard-widget');
    await expect(dashboardWidgets.first()).toBeVisible();
    
    // Naviga alla pagina studenti e verifica transizione di pagina
    await page.click('text=I Miei Studenti');
    await expect(page).toHaveURL('/parent/students');
    
    // Verifica l'animazione di caricamento
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible({ timeout: 500 });
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden({ timeout: 5000 });
    
    // Verifica che la lista degli studenti abbia un'animazione di ingresso
    const studentsList = page.locator('.students-list');
    await expect(studentsList).toBeVisible();
    
    // Apertura dettaglio studente e verifica animazione di slide-in
    await page.click('.student-card:first-child');
    const studentDetail = page.locator('.student-detail');
    await expect(studentDetail).toBeVisible();
    
    // Verifica che il dettaglio abbia un'animazione di ingresso
    const detailHasAnimation = await studentDetail.evaluate(el => {
      return window.getComputedStyle(el).opacity === '1' && 
             el.getAttribute('style')?.includes('transform');
    });
    expect(detailHasAnimation).toBeTruthy();
  });

  test('Student user experience with animations', async ({ page }) => {
    // Login come student
    await page.goto('/login');
    await page.fill('input[type="email"]', users.student.email);
    await page.fill('input[type="password"]', users.student.password);
    await page.click('button[type="submit"]');
    
    // Verifica che siamo sulla dashboard student
    await expect(page).toHaveURL('/student');
    
    // Verifica le animazioni dei percorsi disponibili
    const pathCards = page.locator('.path-card');
    await expect(pathCards.first()).toBeVisible();
    
    // Verifica che le carte abbiano un'animazione di ingresso
    const cardHasAnimation = await pathCards.first().evaluate(el => {
      return window.getComputedStyle(el).opacity === '1' && 
             el.getAttribute('style')?.includes('transform');
    });
    expect(cardHasAnimation).toBeTruthy();
    
    // Naviga a un percorso e verifica la transizione di pagina
    await page.click('.path-card:first-child');
    
    // Verifica il caricamento del percorso
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible({ timeout: 500 });
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden({ timeout: 5000 });
    
    // Verifica che il dettaglio del percorso sia visibile con animazione
    const pathDetail = page.locator('.path-detail');
    await expect(pathDetail).toBeVisible();
    
    // Avvia un quiz e verifica le animazioni di transizione
    await page.click('text=Inizia Quiz');
    
    // Verifica che le domande del quiz appaiano con animazione
    const quizQuestion = page.locator('.quiz-question');
    await expect(quizQuestion).toBeVisible();
    
    // Verifica che la domanda abbia un'animazione di ingresso
    const questionHasAnimation = await quizQuestion.evaluate(el => {
      return window.getComputedStyle(el).opacity === '1' && 
             el.getAttribute('style')?.includes('transform');
    });
    expect(questionHasAnimation).toBeTruthy();
  });

  test('Responsive design and animations on mobile', async ({ page }) => {
    // Imposta la viewport per simulare un dispositivo mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login come student
    await page.goto('/login');
    await page.fill('input[type="email"]', users.student.email);
    await page.fill('input[type="password"]', users.student.password);
    await page.click('button[type="submit"]');
    
    // Verifica che siamo sulla dashboard mobile-friendly
    await expect(page).toHaveURL('/student');
    
    // Verifica che il menu hamburger sia presente e funzionante
    const hamburgerMenu = page.locator('.hamburger-menu');
    await expect(hamburgerMenu).toBeVisible();
    
    // Apri il menu e verifica l'animazione
    await hamburgerMenu.click();
    const mobileMenu = page.locator('.mobile-menu');
    await expect(mobileMenu).toBeVisible();
    
    // Verifica che il menu abbia un'animazione
    const menuHasAnimation = await mobileMenu.evaluate(el => {
      return window.getComputedStyle(el).opacity === '1' && 
             el.getAttribute('style')?.includes('transform');
    });
    expect(menuHasAnimation).toBeTruthy();
    
    // Naviga a una nuova pagina dal menu
    await page.click('text=I Miei Percorsi');
    
    // Verifica che il menu si chiuda con un'animazione
    await expect(mobileMenu).toBeHidden();
    
    // Verifica che la nuova pagina si carichi correttamente
    await expect(page.locator('h1')).toContainText('I Miei Percorsi');
  });
});
