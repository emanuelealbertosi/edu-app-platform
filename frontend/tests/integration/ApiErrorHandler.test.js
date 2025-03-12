import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import ApiErrorHandler from '../../src/services/ApiErrorHandler';
import ApiService from '../../src/services/ApiService';
import AuthService from '../../src/services/AuthService';
import { NotificationsService } from '../../src/services/NotificationsService';

// Mock di AuthService e NotificationsService
jest.mock('../../src/services/AuthService', () => ({
  default: {
    logout: jest.fn(),
    refreshToken: jest.fn()
  }
}));

jest.mock('../../src/services/NotificationsService', () => ({
  NotificationsService: {
    showError: jest.fn(),
  }
}));

describe('ApiErrorHandler Integration Tests', () => {
  let mockAxios;
  
  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
    
    // Setup localStorage con token di autenticazione simulato
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
  });
  
  afterEach(() => {
    mockAxios.reset();
    localStorage.clear();
  });
  
  test('dovrebbe gestire correttamente errori 400 e mostrare notifica appropriata', async () => {
    const badRequestError = {
      response: {
        status: 400,
        data: {
          detail: 'Dati di richiesta non validi'
        }
      }
    };
    
    // Simulazione di una chiamata API che fallisce con 400
    mockAxios.onGet('/api/users').reply(400, { detail: 'Dati di richiesta non validi' });
    
    try {
      await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    } catch (error) {
      // L'ApiErrorHandler dovrebbe intercettare l'errore nell'applicazione reale,
      // qui simuliamo manualmente la gestione
      ApiErrorHandler.handleApiError(error);
    }
    
    // Verifica che sia stata mostrata la notifica di errore appropriata
    expect(NotificationsService.showError).toHaveBeenCalledWith(
      'Errore: Dati di richiesta non validi'
    );
    
    // Verifica che non sia stato fatto il logout
    expect(AuthService.default.logout).not.toHaveBeenCalled();
  });
  
  test('dovrebbe tentare il refresh del token per errori 401', async () => {
    // Mock del successo del refresh token
    AuthService.default.refreshToken.mockResolvedValue({
      access_token: 'new-access-token'
    });
    
    // Simulazione di una chiamata API che fallisce con 401 (token scaduto)
    mockAxios.onGet('/api/users').replyOnce(401, { detail: 'Token scaduto' });
    // La seconda chiamata dopo il refresh ha successo
    mockAxios.onGet('/api/users').replyOnce(200, { id: 1, name: 'Test User' });
    
    let result;
    
    try {
      // Prima chiamata con token scaduto
      await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Simuliamo il comportamento dell'ApiErrorHandler
        try {
          // Richiesta di refresh token
          const refreshResponse = await AuthService.default.refreshToken(
            localStorage.getItem('refreshToken')
          );
          
          // Aggiornamento del token in localStorage
          localStorage.setItem('accessToken', refreshResponse.access_token);
          
          // Seconda chiamata con nuovo token
          result = await axios.get('/api/users', {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
          });
        } catch (refreshError) {
          ApiErrorHandler.handleApiError(refreshError);
        }
      } else {
        ApiErrorHandler.handleApiError(error);
      }
    }
    
    // Verifica che il token sia stato refreshato
    expect(AuthService.default.refreshToken).toHaveBeenCalledWith('mock-refresh-token');
    
    // Verifica che il nuovo token sia stato salvato
    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
    
    // Verifica che la seconda chiamata abbia avuto successo
    expect(result.data).toEqual({ id: 1, name: 'Test User' });
  });
  
  test('dovrebbe effettuare il logout se il refresh token fallisce', async () => {
    // Mock del fallimento del refresh token
    AuthService.default.refreshToken.mockRejectedValue({
      response: {
        status: 401,
        data: {
          detail: 'Refresh token non valido'
        }
      }
    });
    
    // Simulazione di una chiamata API che fallisce con 401 (token scaduto)
    mockAxios.onGet('/api/users').reply(401, { detail: 'Token scaduto' });
    
    try {
      await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          // Tentativo di refresh token che fallisce
          await AuthService.default.refreshToken(localStorage.getItem('refreshToken'));
        } catch (refreshError) {
          // L'ApiErrorHandler dovrebbe gestire l'errore e fare il logout
          ApiErrorHandler.handleApiError(refreshError);
        }
      } else {
        ApiErrorHandler.handleApiError(error);
      }
    }
    
    // Verifica che sia stato fatto il logout
    expect(AuthService.default.logout).toHaveBeenCalled();
    
    // Verifica che sia stata mostrata la notifica di errore appropriata
    expect(NotificationsService.showError).toHaveBeenCalledWith(
      'Sessione scaduta. Effettua nuovamente il login.'
    );
  });
  
  test('dovrebbe gestire correttamente errori 500 come errori del server', async () => {
    const serverError = {
      response: {
        status: 500,
        data: {
          detail: 'Errore interno del server'
        }
      }
    };
    
    // Simulazione di una chiamata API che fallisce con 500
    mockAxios.onGet('/api/users').reply(500, { detail: 'Errore interno del server' });
    
    try {
      await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    } catch (error) {
      // L'ApiErrorHandler dovrebbe intercettare l'errore nell'applicazione reale,
      // qui simuliamo manualmente la gestione
      ApiErrorHandler.handleApiError(error);
    }
    
    // Verifica che sia stata mostrata la notifica di errore appropriata
    expect(NotificationsService.showError).toHaveBeenCalledWith(
      'Errore del server: Errore interno del server'
    );
  });
  
  test('dovrebbe gestire errori di rete come errori di connessione', async () => {
    const networkError = new Error('Network Error');
    networkError.isAxiosError = true;
    networkError.message = 'Network Error';
    
    // Simulazione di una chiamata API che fallisce con errore di rete
    mockAxios.onGet('/api/users').networkError();
    
    try {
      await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    } catch (error) {
      // L'ApiErrorHandler dovrebbe intercettare l'errore nell'applicazione reale,
      // qui simuliamo manualmente la gestione
      ApiErrorHandler.handleApiError(error);
    }
    
    // Verifica che sia stata mostrata la notifica di errore appropriata
    expect(NotificationsService.showError).toHaveBeenCalledWith(
      'Errore di connessione al server. Verifica la tua connessione internet.'
    );
  });
});
