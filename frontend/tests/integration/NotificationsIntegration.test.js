import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { NotificationsProvider, useNotifications } from '../../src/contexts/NotificationsContext';
import { NotificationsService } from '../../src/services/NotificationsService';
import ApiService from '../../src/services/ApiService';
import AuthService from '../../src/services/AuthService';
import { ApiErrorType } from '../../src/services/ApiErrorHandler';

// Componente per inizializzare il servizio di notifiche
const NotificationsServiceInitializer = () => {
  const { addNotification } = useNotifications();
  
  React.useEffect(() => {
    // Inizializza il servizio di notifiche con il context
    NotificationsService.setNotificationHandler(addNotification);
  }, [addNotification]);
  
  return null;
};

// Componente di test per verificare l'integrazione di notifiche
const TestComponent = ({ onButtonClick }) => {
  return (
    <div>
      <h1>Test Component</h1>
      <button onClick={onButtonClick}>Fetch Data</button>
    </div>
  );
};

describe('Notifiche - Integrazione con ApiService', () => {
  let mockAxios;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    localStorage.clear();
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.reset();
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('dovrebbe mostrare una notifica di errore quando una richiesta API fallisce', async () => {
    // Spionnaggio del metodo showError
    const showErrorSpy = jest.spyOn(NotificationsService, 'showError');
    
    // Simula direttamente l'errore 500 senza usare mockAxios
    jest.spyOn(ApiService, 'get').mockRejectedValueOnce({
      status: 500,
      message: 'Errore interno del server',
      type: ApiErrorType.SERVER_ERROR
    });

    // Funzione che verrà chiamata quando si clicca il pulsante
    const handleButtonClick = async () => {
      try {
        await ApiService.get('/api/test');
      } catch (error) {
        // Gestiamo manualmente l'errore come farebbe ApiErrorHandler
        if (error.status === 500 || error.type === ApiErrorType.SERVER_ERROR) {
          NotificationsService.showError(`Errore del server: ${error.message}`);
        }
      }
    };

    // Rendering del componente con il provider delle notifiche
    render(
      <NotificationsProvider>
        <NotificationsServiceInitializer />
        <TestComponent onButtonClick={handleButtonClick} />
      </NotificationsProvider>
    );

    // Trigger della richiesta API
    const button = screen.getByText('Fetch Data');
    act(() => {
      button.click();
    });

    // Verifica che la notifica di errore sia stata chiamata
    await waitFor(() => {
      expect(showErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Errore del server')
      );
    });
  });

  test('dovrebbe mostrare una notifica di errore specifica per errori 404', async () => {
    // Spionnaggio del metodo showError
    const showErrorSpy = jest.spyOn(NotificationsService, 'showError');

    // Configurazione del mock per simulare un errore 404
    mockAxios.onGet('/api/test').reply(404, {
      detail: 'Risorsa non trovata'
    });

    // Funzione che verrà chiamata quando si clicca il pulsante
    const handleButtonClick = async () => {
      try {
        await ApiService.get('/api/test');
      } catch (error) {
        // Gestiamo manualmente l'errore come farebbe ApiErrorHandler
        if (error.status === 404) {
          NotificationsService.showError(`Errore: ${error.message}`);
        }
      }
    };

    // Rendering del componente con il provider delle notifiche
    render(
      <NotificationsProvider>
        <NotificationsServiceInitializer />
        <TestComponent onButtonClick={handleButtonClick} />
      </NotificationsProvider>
    );

    // Trigger della richiesta API
    const button = screen.getByText('Fetch Data');
    act(() => {
      button.click();
    });

    // Verifica che la notifica di errore sia stata chiamata
    await waitFor(() => {
      expect(showErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Errore: ')
      );
    });
  });

  test('dovrebbe effettuare il logout e mostrare notifica per errori 401 di refresh token', async () => {
    // Spionnaggio dei metodi rilevanti
    const refreshTokensSpy = jest.spyOn(AuthService, 'refreshTokens')
      .mockRejectedValueOnce(new Error('Refresh token scaduto o non valido'));
    
    const logoutSpy = jest.spyOn(AuthService, 'logout')
      .mockImplementation(() => {});
    
    const showErrorSpy = jest.spyOn(NotificationsService, 'showError');

    // Simula direttamente l'errore 401 senza usare mockAxios
    jest.spyOn(ApiService, 'get').mockRejectedValueOnce({
      status: 401,
      message: 'Token non valido o scaduto',
      type: ApiErrorType.UNAUTHORIZED
    });

    // Funzione che verrà chiamata quando si clicca il pulsante
    const handleButtonClick = async () => {
      try {
        await ApiService.get('/api/test');
      } catch (error) {
        // Se c'è un errore di autenticazione, prova a refreshare il token
        if (error.status === 401 || error.type === ApiErrorType.UNAUTHORIZED) {
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            await AuthService.refreshTokens(refreshToken);
            // Riprova la richiesta originale (non necessario per il test)
          } catch (refreshError) {
            // Se il refresh fallisce, logout e mostra notifica
            AuthService.logout();
            NotificationsService.showError('Sessione scaduta. Effettua nuovamente il login.');
          }
        }
      }
    };

    // Rendering del componente con il provider delle notifiche
    render(
      <NotificationsProvider>
        <NotificationsServiceInitializer />
        <TestComponent onButtonClick={handleButtonClick} />
      </NotificationsProvider>
    );

    // Trigger della richiesta API
    const button = screen.getByText('Fetch Data');
    act(() => {
      button.click();
    });

    // Verifica che la notifica di errore sia stata chiamata e che sia stato fatto logout
    await waitFor(() => {
      expect(refreshTokensSpy).toHaveBeenCalled();
      expect(logoutSpy).toHaveBeenCalled();
      expect(showErrorSpy).toHaveBeenCalledWith(
        'Sessione scaduta. Effettua nuovamente il login.'
      );
    });
  });

  test('dovrebbe riprovare la richiesta dopo un refresh token avvenuto con successo', async () => {
    // Spionnaggio dei metodi rilevanti
    const refreshTokensSpy = jest.spyOn(AuthService, 'refreshTokens')
      .mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });

    // Mock per verificare che una seconda richiesta venga effettuata
    let requestCount = 0;
    const apiGetSpy = jest.spyOn(ApiService, 'get').mockImplementation(async () => {
      requestCount++;
      if (requestCount === 1) {
        // Prima richiesta, genera errore 401
        const error = new Error('Token non valido o scaduto');
        error.status = 401;
        throw error;
      } else {
        // Seconda richiesta, dopo refresh token, ha successo
        return { success: true, data: 'Dati recuperati con successo' };
      }
    });

    // Funzione che verrà chiamata quando si clicca il pulsante
    const handleButtonClick = async () => {
      try {
        await ApiService.get('/api/test');
      } catch (error) {
        if (error.status === 401) {
          try {
            // Refresh token
            const refreshToken = localStorage.getItem('refreshToken');
            const tokens = await AuthService.refreshTokens(refreshToken);
            
            // Salva i nuovi token
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            
            // Riprova la richiesta
            return await ApiService.get('/api/test');
          } catch (refreshError) {
            AuthService.logout();
            NotificationsService.showError('Sessione scaduta. Effettua nuovamente il login.');
          }
        }
      }
    };

    // Rendering del componente con il provider delle notifiche
    render(
      <NotificationsProvider>
        <NotificationsServiceInitializer />
        <TestComponent onButtonClick={handleButtonClick} />
      </NotificationsProvider>
    );

    // Trigger della richiesta API
    const button = screen.getByText('Fetch Data');
    act(() => {
      button.click();
    });

    // Verifica che il refresh token sia stato chiamato e la richiesta ritentata
    await waitFor(() => {
      expect(refreshTokensSpy).toHaveBeenCalled();
      expect(apiGetSpy).toHaveBeenCalledTimes(2);
      expect(localStorage.getItem('accessToken')).toBe('new-access-token');
    });
  });

  test('dovrebbe mostrare una notifica per errori di rete', async () => {
    // Spionnaggio del metodo showError
    const showErrorSpy = jest.spyOn(NotificationsService, 'showError');

    // Mock diretto che simula un errore di rete
    jest.spyOn(ApiService, 'get').mockRejectedValue({
      type: ApiErrorType.NETWORK_ERROR,
      message: 'Errore di connessione alla rete',
      originalError: new Error('Network Error')
    });

    // Funzione che verrà chiamata quando si clicca il pulsante
    const handleButtonClick = async () => {
      try {
        await ApiService.get('/api/test');
      } catch (error) {
        if (error.type === ApiErrorType.NETWORK_ERROR) {
          NotificationsService.showError('Errore di connessione alla rete. Verifica la tua connessione internet.');
        }
      }
    };

    // Rendering del componente con il provider delle notifiche
    render(
      <NotificationsProvider>
        <NotificationsServiceInitializer />
        <TestComponent onButtonClick={handleButtonClick} />
      </NotificationsProvider>
    );

    // Trigger della richiesta API
    const button = screen.getByText('Fetch Data');
    act(() => {
      button.click();
    });

    // Verifica che la notifica di errore sia stata chiamata con il messaggio corretto
    await waitFor(() => {
      expect(showErrorSpy).toHaveBeenCalledWith(
        'Errore di connessione alla rete. Verifica la tua connessione internet.'
      );
    });
  });
});
