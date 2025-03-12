import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { NotificationsProvider } from '../../src/contexts/NotificationsContext';
import { NotificationsService } from '../../src/services/NotificationsService';
import AuthService from '../../src/services/AuthService';
import ApiErrorHandler from '../../src/services/ApiErrorHandler';

// Componente di test per integrare auth e notifiche
const AuthComponent = () => {
  const handleLogin = async () => {
    try {
      await AuthService.login('test@example.com', 'password123');
    } catch (error) {
      // Errore già gestito dal servizio
    }
  };

  const handleLoginError = async () => {
    try {
      await AuthService.login('invalid@example.com', 'wrongpassword');
    } catch (error) {
      // Errore già gestito dal servizio
    }
  };

  const handleRegister = async () => {
    try {
      await AuthService.register({
        email: 'newuser@example.com',
        password: 'securepass123',
        firstName: 'New',
        lastName: 'User',
        role: 'student'
      });
    } catch (error) {
      // Errore già gestito dal servizio
    }
  };

  const handleTokenExpiry = async () => {
    try {
      await AuthService.refreshUserData();
    } catch (error) {
      // Errore già gestito dal servizio
    }
  };

  return (
    <div>
      <button onClick={handleLogin}>Login (Successo)</button>
      <button onClick={handleLoginError}>Login (Errore)</button>
      <button onClick={handleRegister}>Registrazione</button>
      <button onClick={handleTokenExpiry}>Refresh Dati (Token Scaduto)</button>
    </div>
  );
};

describe('Integrazione Auth-Notifications', () => {
  let mockAxios;

  beforeEach(() => {
    // Setup del mock axios
    mockAxios = new MockAdapter(axios);
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
    
    // Spia su NotificationsService
    jest.spyOn(NotificationsService, 'showSuccess');
    jest.spyOn(NotificationsService, 'showError');
    jest.spyOn(NotificationsService, 'showWarning');
    jest.spyOn(NotificationsService, 'showInfo');
  });

  afterEach(() => {
    mockAxios.restore();
  });

  test('dovrebbe mostrare una notifica di successo dopo il login', async () => {
    // Mock della risposta per il login
    mockAxios.onPost('/api/auth/login').reply(200, {
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      }
    });

    // Rendering del componente
    render(
      <NotificationsProvider>
        <AuthComponent />
      </NotificationsProvider>
    );

    // Esecuzione del login
    fireEvent.click(screen.getByText('Login (Successo)'));

    // Verifica che il login sia avvenuto con successo
    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('test_access_token');
      expect(localStorage.getItem('refreshToken')).toBe('test_refresh_token');
      expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
        'Login effettuato con successo.'
      );
    });
  });

  test('dovrebbe mostrare una notifica di errore con login non valido', async () => {
    // Mock della risposta per il login fallito
    mockAxios.onPost('/api/auth/login').reply(401, {
      detail: 'Credenziali non valide.'
    });

    // Configurazione del gestore errori
    const errorHandler = new ApiErrorHandler();
    axios.interceptors.response.use(
      response => response,
      error => errorHandler.handleError(error)
    );

    // Rendering del componente
    render(
      <NotificationsProvider>
        <AuthComponent />
      </NotificationsProvider>
    );

    // Esecuzione del login errato
    fireEvent.click(screen.getByText('Login (Errore)'));

    // Verifica che sia stata mostrata la notifica di errore
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errore: Credenziali non valide.',
        expect.any(String)
      );
    });
  });

  test('dovrebbe mostrare una notifica di successo dopo la registrazione', async () => {
    // Mock della risposta per la registrazione
    mockAxios.onPost('/api/auth/register').reply(201, {
      id: 2,
      email: 'newuser@example.com',
      firstName: 'New',
      lastName: 'User',
      role: 'student'
    });

    // Rendering del componente
    render(
      <NotificationsProvider>
        <AuthComponent />
      </NotificationsProvider>
    );

    // Esecuzione della registrazione
    fireEvent.click(screen.getByText('Registrazione'));

    // Verifica che sia stata mostrata la notifica di successo
    await waitFor(() => {
      expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
        'Registrazione completata con successo. Ora puoi effettuare il login.'
      );
    });
  });

  test('dovrebbe gestire il token scaduto con notifica e logout', async () => {
    // Simulazione di token già presente
    localStorage.setItem('accessToken', 'expired_token');
    localStorage.setItem('refreshToken', 'expired_refresh_token');
    
    // Mock di refreshToken che fallisce
    mockAxios.onPost('/api/auth/refresh-token').reply(401, {
      detail: 'Token di refresh scaduto o non valido.'
    });
    
    // Mock della chiamata che genera l'errore di token
    mockAxios.onGet('/api/user/profile').reply(401, {
      detail: 'Token di accesso scaduto.'
    });

    // Spy sulla funzione di logout
    jest.spyOn(AuthService, 'logout');

    // Configurazione del gestore errori
    const errorHandler = new ApiErrorHandler();
    axios.interceptors.response.use(
      response => response,
      error => errorHandler.handleError(error)
    );

    // Rendering del componente
    render(
      <NotificationsProvider>
        <AuthComponent />
      </NotificationsProvider>
    );

    // Esecuzione della chiamata con token scaduto
    fireEvent.click(screen.getByText('Refresh Dati (Token Scaduto)'));

    // Verifica che sia stata mostrata la notifica di sessione scaduta e che sia stato chiamato il logout
    await waitFor(() => {
      expect(NotificationsService.showWarning).toHaveBeenCalledWith(
        'Sessione scaduta. Effettua nuovamente il login.'
      );
      expect(AuthService.logout).toHaveBeenCalled();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  test('dovrebbe gestire gli errori di validazione durante la registrazione', async () => {
    // Mock della risposta per la registrazione fallita con errori di validazione
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

    // Configurazione del gestore errori
    const errorHandler = new ApiErrorHandler();
    axios.interceptors.response.use(
      response => response,
      error => errorHandler.handleError(error)
    );

    // Rendering del componente
    render(
      <NotificationsProvider>
        <AuthComponent />
      </NotificationsProvider>
    );

    // Esecuzione della registrazione
    fireEvent.click(screen.getByText('Registrazione'));

    // Verifica che sia stata mostrata la notifica di errore con dettagli
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errori di validazione',
        expect.stringContaining('Email non valida')
      );
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errori di validazione',
        expect.stringContaining('La password deve essere lunga almeno 8 caratteri')
      );
    });
  });
});
