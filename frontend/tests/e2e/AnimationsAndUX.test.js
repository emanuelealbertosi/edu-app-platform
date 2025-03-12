import { test, expect } from '@playwright/test';

/**
 * Test end-to-end che verifica le animazioni e l'esperienza utente nell'applicazione:
 * 1. Verifica delle animazioni durante il caricamento delle pagine
 * 2. Verifica dell'esperienza di login con feedback visivi
 * 3. Verifica delle transizioni tra pagine
 * 4. Verifica della visualizzazione corretta delle notifiche
 */
test.describe('Animations and User Experience', () => {
  const userCredentials = { email: 'admin@example.com', password: 'password123' };
  
  test('Page loading animations are displayed correctly', async ({ page }) => {
    // Rallentiamo la rete per rendere più visibili le animazioni di caricamento
    await page.route('**/*', (route) => {
      route.continue({ delay: 500 });
    });
    
    // Vai alla pagina di login
    await page.goto('/login');
    
    // Verifica che il componente LoadingSpinner sia visibile durante il caricamento della pagina
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Verifica che l'elemento principale appaia con un'animazione di fade-in
    // (verifichiamo che abbia la classe CSS o l'attributo associato a framer-motion)
    const mainContent = page.locator('.auth-container');
    await expect(mainContent).toBeVisible();
    
    // Verifica che la classe di animazione o l'attributo associato sia presente
    const hasAnimation = await mainContent.evaluate(el => {
      return window.getComputedStyle(el).opacity === '1' && 
             (el.getAttribute('style')?.includes('opacity') || 
              el.className.includes('motion') ||
              el.getAttribute('data-motion'));
    });
    
    expect(hasAnimation).toBeTruthy();
  });

  test('Login form shows visual feedback during submission', async ({ page }) => {
    await page.goto('/login');
    
    // Compila il form di login
    await page.fill('input[type="email"]', userCredentials.email);
    await page.fill('input[type="password"]', userCredentials.password);
    
    // Rallenta la rete per rendere più visibili le animazioni
    await page.route('**/api/auth/login', (route) => {
      route.continue({ delay: 1000 });
    }, { times: 1 });
    
    // Clicca sul pulsante di login e verifica che appaia un indicatore di caricamento
    await page.click('button[type="submit"]');
    
    // Verifica che il pulsante mostri uno stato di caricamento
    await expect(page.locator('button[type="submit"] [data-testid="loading-spinner"]')).toBeVisible();
    
    // Verifica che dopo il login venga mostrata una notifica di successo
    await expect(page.locator('.notification-success')).toBeVisible();
    
    // Verifica che siamo reindirizzati alla dashboard
    await expect(page).toHaveURL('/admin');
  });

  test('Page transitions occur with animations', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', userCredentials.email);
    await page.fill('input[type="password"]', userCredentials.password);
    await page.click('button[type="submit"]');
    
    // Verificare che siamo sulla dashboard
    await expect(page).toHaveURL('/admin');
    
    // Intercetta le transizioni di pagina per verificare le animazioni
    let pageTransitionDetected = false;
    
    await page.evaluate(() => {
      window.__pageTransitionDetected = false;
      
      // Aggiungiamo un listener per intercettare le animazioni
      const originalPushState = history.pushState;
      history.pushState = function() {
        window.__pageTransitionDetected = true;
        return originalPushState.apply(this, arguments);
      };
    });
    
    // Naviga a una nuova pagina
    await page.click('text=Gestione Utenti');
    
    // Verifica che la pagina sia cambiata
    await expect(page).toHaveURL('/admin/users');
    
    // Verifica che sia stata rilevata una transizione di pagina con animazione
    pageTransitionDetected = await page.evaluate(() => window.__pageTransitionDetected);
    expect(pageTransitionDetected).toBeTruthy();
    
    // Verifica che l'elemento principale della nuova pagina sia visibile con animazione
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('Notifications appear with animations', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', userCredentials.email);
    await page.fill('input[type="password"]', userCredentials.password);
    await page.click('button[type="submit"]');
    
    // Verifica che siamo sulla dashboard
    await expect(page).toHaveURL('/admin');
    
    // Testa la notifica di successo dopo un'azione (es. salvataggio di un'impostazione)
    await page.click('text=Impostazioni');
    await expect(page).toHaveURL('/admin/settings');
    
    // Trova un pulsante di salvataggio e cliccalo
    await page.click('button:has-text("Salva Impostazioni")');
    
    // Verifica che appaia una notifica con animazione
    const notification = page.locator('.notification');
    await expect(notification).toBeVisible();
    
    // Verifica che la notifica abbia un'animazione di entrata
    const hasAnimation = await notification.evaluate(el => {
      return window.getComputedStyle(el).opacity === '1' && 
             (el.getAttribute('style')?.includes('transform') || 
              el.className.includes('motion') ||
              el.getAttribute('data-motion'));
    });
    
    expect(hasAnimation).toBeTruthy();
    
    // Verifica che la notifica scompaia dopo un certo periodo
    await expect(notification).toBeHidden({ timeout: 10000 });
  });

  test('LoadingSpinner appears during async operations', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', userCredentials.email);
    await page.fill('input[type="password"]', userCredentials.password);
    await page.click('button[type="submit"]');
    
    // Rallenta la rete per rendere più visibili le animazioni di caricamento
    await page.route('**/api/**', (route) => {
      route.continue({ delay: 1000 });
    });
    
    // Vai a una pagina che richiede caricamento dati
    await page.click('text=Gestione Utenti');
    
    // Verifica che lo spinner di caricamento sia visibile durante il caricamento dei dati
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Verifica che, una volta completato il caricamento, lo spinner scompaia
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden({ timeout: 5000 });
    
    // Verifica che i dati siano visibili
    await expect(page.locator('table')).toBeVisible();
  });
});
