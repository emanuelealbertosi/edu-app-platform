import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AuthService from '../../src/services/AuthService';
import { NotificationsService } from '../../src/services/NotificationsService';

// Mock di NotificationsService
jest.mock('../../src/services/NotificationsService', () => ({
  NotificationsService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }
}));

describe('AuthService Integration Tests', () => {
  let mockAxios;
  
  beforeEach(() => {
    // Setup Mock di axios
    mockAxios = new MockAdapter(axios);
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
    
    // Pulizia localStorage
    localStorage.clear();
  });
  
  afterEach(() => {
    // Pulizia
    mockAxios.reset();
    localStorage.clear();
  });
  
  test('login dovrebbe autenticare l\'utente e salvare i token', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const mockResponse = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'parent',
        profile: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    };
    
    // Mock della risposta di login
    mockAxios.onPost('/api/auth/login').reply(200, mockResponse);
    
    // Chiamata al metodo da testare
    const result = await AuthService.login(credentials.email, credentials.password);
    
    // Verifica del risultato
    expect(result).toEqual(mockResponse);
    
    // Verifica che i token siano stati salvati nel localStorage
    expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user));
    
    // Verifica che la notifica di successo sia stata mostrata
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Login effettuato con successo!');
  });
  
  test('login dovrebbe gestire gli errori di autenticazione', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'wrong-password'
    };
    
    // Mock della risposta di errore
    mockAxios.onPost('/api/auth/login').reply(401, {
      detail: 'Credenziali non valide'
    });
    
    // Chiamata al metodo da testare con cattura dell'errore
    let error;
    try {
      await AuthService.login(credentials.email, credentials.password);
    } catch (e) {
      error = e;
    }
    
    // Verifica che sia stato catturato un errore
    expect(error).toBeDefined();
    
    // Verifica che il localStorage sia vuoto
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    
    // Verifica che la notifica di errore sia stata mostrata
    expect(NotificationsService.showError).toHaveBeenCalledWith('Errore di login: Credenziali non valide');
  });
  
  test('register dovrebbe registrare un nuovo utente', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'password123',
      role: 'parent',
      profile: {
        first_name: 'New',
        last_name: 'User'
      }
    };
    
    const mockResponse = {
      id: '2',
      email: 'newuser@example.com',
      role: 'parent',
      profile: {
        first_name: 'New',
        last_name: 'User'
      }
    };
    
    // Mock della risposta di registrazione
    mockAxios.onPost('/api/auth/register').reply(201, mockResponse);
    
    // Chiamata al metodo da testare
    const result = await AuthService.register(userData);
    
    // Verifica del risultato
    expect(result).toEqual(mockResponse);
    
    // Verifica che la notifica di successo sia stata mostrata
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Registrazione completata con successo!');
  });
  
  test('register dovrebbe gestire gli errori di validazione', async () => {
    const invalidUserData = {
      email: 'invalid-email',
      password: '123', // Password troppo corta
      role: 'parent',
      profile: {
        first_name: 'New',
        last_name: 'User'
      }
    };
    
    // Mock della risposta di errore
    mockAxios.onPost('/api/auth/register').reply(422, {
      detail: [
        {
          loc: ['body', 'email'],
          msg: 'Email non valida',
          type: 'value_error'
        },
        {
          loc: ['body', 'password'],
          msg: 'La password deve essere lunga almeno 8 caratteri',
          type: 'value_error'
        }
      ]
    });
    
    // Chiamata al metodo da testare con cattura dell'errore
    let error;
    try {
      await AuthService.register(invalidUserData);
    } catch (e) {
      error = e;
    }
    
    // Verifica che sia stato catturato un errore
    expect(error).toBeDefined();
    
    // Verifica che la notifica di errore sia stata mostrata
    expect(NotificationsService.showError).toHaveBeenCalledWith(
      expect.stringContaining('Errore di registrazione')
    );
  });
  
  test('logout dovrebbe cancellare i dati utente dal localStorage', async () => {
    // Setup dei dati di test nel localStorage
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      email: 'test@example.com',
      role: 'parent'
    }));
    
    // Chiamata al metodo da testare
    AuthService.logout();
    
    // Verifica che il localStorage sia stato ripulito
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    
    // Verifica che la notifica di informazione sia stata mostrata
    expect(NotificationsService.showInfo).toHaveBeenCalledWith('Logout effettuato con successo.');
  });
  
  test('refreshToken dovrebbe aggiornare il token di accesso', async () => {
    const refreshToken = 'mock-refresh-token';
    
    const mockResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      token_type: 'bearer'
    };
    
    // Mock della risposta di refresh token
    mockAxios.onPost('/api/auth/refresh').reply(200, mockResponse);
    
    // Chiamata al metodo da testare
    const result = await AuthService.refreshToken(refreshToken);
    
    // Verifica del risultato
    expect(result).toEqual(mockResponse);
    
    // Verifica che i nuovi token siano stati salvati nel localStorage
    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
  });
  
  test('refreshToken dovrebbe gestire gli errori di refresh', async () => {
    const refreshToken = 'invalid-refresh-token';
    
    // Mock della risposta di errore
    mockAxios.onPost('/api/auth/refresh').reply(401, {
      detail: 'Token di refresh non valido o scaduto'
    });
    
    // Chiamata al metodo da testare con cattura dell'errore
    let error;
    try {
      await AuthService.refreshToken(refreshToken);
    } catch (e) {
      error = e;
    }
    
    // Verifica che sia stato catturato un errore
    expect(error).toBeDefined();
    expect(error.response.status).toBe(401);
  });
  
  test('getCurrentUser dovrebbe restituire l\'utente corrente dal localStorage', () => {
    // Setup dei dati di test nel localStorage
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'parent',
      profile: {
        first_name: 'Test',
        last_name: 'User'
      }
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Chiamata al metodo da testare
    const result = AuthService.getCurrentUser();
    
    // Verifica del risultato
    expect(result).toEqual(mockUser);
  });
  
  test('isAuthenticated dovrebbe restituire true se l\'utente è autenticato', () => {
    // Setup dei dati di test nel localStorage
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    
    // Chiamata al metodo da testare
    const result = AuthService.isAuthenticated();
    
    // Verifica del risultato
    expect(result).toBe(true);
  });
  
  test('isAuthenticated dovrebbe restituire false se l\'utente non è autenticato', () => {
    // Chiamata al metodo da testare (localStorage è vuoto)
    const result = AuthService.isAuthenticated();
    
    // Verifica del risultato
    expect(result).toBe(false);
  });
  
  test('updateUserProfile dovrebbe aggiornare il profilo utente', async () => {
    // Setup dei dati di test nel localStorage
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      email: 'test@example.com',
      role: 'parent',
      profile: {
        first_name: 'Test',
        last_name: 'User'
      }
    }));
    
    const userId = '1';
    const profileData = {
      first_name: 'Updated',
      last_name: 'Name',
      phone_number: '123456789'
    };
    
    const mockResponse = {
      id: '1',
      email: 'test@example.com',
      role: 'parent',
      profile: {
        first_name: 'Updated',
        last_name: 'Name',
        phone_number: '123456789'
      }
    };
    
    // Mock della risposta di aggiornamento profilo
    mockAxios.onPut(`/api/users/${userId}/profile`).reply(200, mockResponse);
    
    // Chiamata al metodo da testare
    const result = await AuthService.updateUserProfile(userId, profileData);
    
    // Verifica del risultato
    expect(result).toEqual(mockResponse);
    
    // Verifica che l'utente aggiornato sia stato salvato nel localStorage
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockResponse);
    
    // Verifica che la notifica di successo sia stata mostrata
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Profilo aggiornato con successo!');
  });
});
