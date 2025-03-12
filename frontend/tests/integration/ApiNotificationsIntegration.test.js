import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { NotificationsProvider } from '../../src/contexts/NotificationsContext';
import { NotificationsService } from '../../src/services/NotificationsService';
import ApiErrorHandler from '../../src/services/ApiErrorHandler';
import ApiService from '../../src/services/ApiService';

// Componente di test per simulare diverse chiamate API
const ApiTestComponent = () => {
  // Creazione di un servizio API per i test
  const api = new ApiService();
  
  const makeSuccessRequest = async () => {
    try {
      await api.get('/api/success');
    } catch (error) {
      // Errore gestito dagli interceptor
    }
  };

  const makeServerErrorRequest = async () => {
    try {
      await api.get('/api/server-error');
    } catch (error) {
      // Errore gestito dagli interceptor
    }
  };

  const makeNotFoundRequest = async () => {
    try {
      await api.get('/api/not-found');
    } catch (error) {
      // Errore gestito dagli interceptor
    }
  };

  const makeNetworkErrorRequest = async () => {
    try {
      await api.get('/api/network-error');
    } catch (error) {
      // Errore gestito dagli interceptor
    }
  };

  const makeTimeoutRequest = async () => {
    try {
      await api.get('/api/timeout');
    } catch (error) {
      // Errore gestito dagli interceptor
    }
  };

  const makeValidationErrorRequest = async () => {
    try {
      await api.post('/api/validation-error', { invalidData: true });
    } catch (error) {
      // Errore gestito dagli interceptor
    }
  };

  return (
    <div>
      <button onClick={makeSuccessRequest}>Richiesta con successo</button>
      <button onClick={makeServerErrorRequest}>Errore del server</button>
      <button onClick={makeNotFoundRequest}>Risorsa non trovata</button>
      <button onClick={makeNetworkErrorRequest}>Errore di rete</button>
      <button onClick={makeTimeoutRequest}>Timeout della richiesta</button>
      <button onClick={makeValidationErrorRequest}>Errore di validazione</button>
    </div>
  );
};

describe('Integrazione API-Notifiche', () => {
  let mockAxios;
  let errorHandler;
  let originalAxiosInterceptors;

  beforeEach(() => {
    // Backup degli interceptor originali
    originalAxiosInterceptors = axios.interceptors;
    
    // Setup del mock axios
    mockAxios = new MockAdapter(axios);
    
    // Creazione del gestore errori
    errorHandler = new ApiErrorHandler();
    
    // Configurazione degli interceptor
    axios.interceptors.response.use(
      response => response,
      error => errorHandler.handleError(error)
    );
    
    // Spia dei metodi di NotificationsService
    jest.spyOn(NotificationsService, 'showSuccess');
    jest.spyOn(NotificationsService, 'showError');
    jest.spyOn(NotificationsService, 'showWarning');
    jest.spyOn(NotificationsService, 'showInfo');
  });

  afterEach(() => {
    mockAxios.restore();
    // Ripristino degli interceptor originali
    axios.interceptors = originalAxiosInterceptors;
    jest.clearAllMocks();
  });

  test('dovrebbe gestire le risposte con successo senza mostrare notifiche', async () => {
    // Mock della risposta di successo
    mockAxios.onGet('/api/success').reply(200, { message: 'Operazione completata con successo' });

    // Rendering del componente
    render(
      <NotificationsProvider>
        <ApiTestComponent />
      </NotificationsProvider>
    );

    // Esecuzione della richiesta
    fireEvent.click(screen.getByText('Richiesta con successo'));

    // Verifica che non siano state mostrate notifiche
    await waitFor(() => {
      expect(NotificationsService.showSuccess).not.toHaveBeenCalled();
      expect(NotificationsService.showError).not.toHaveBeenCalled();
      expect(NotificationsService.showWarning).not.toHaveBeenCalled();
      expect(NotificationsService.showInfo).not.toHaveBeenCalled();
    });
  });

  test('dovrebbe mostrare una notifica di errore per errori del server (500)', async () => {
    // Mock della risposta con errore del server
    mockAxios.onGet('/api/server-error').reply(500, {
      detail: 'Errore interno del server'
    });

    // Rendering del componente
    render(
      <NotificationsProvider>
        <ApiTestComponent />
      </NotificationsProvider>
    );

    // Esecuzione della richiesta
    fireEvent.click(screen.getByText('Errore del server'));

    // Verifica che sia stata mostrata la notifica di errore
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errore: Errore interno del server',
        expect.any(String)
      );
    });
  });

  test('dovrebbe mostrare una notifica per risorse non trovate (404)', async () => {
    // Mock della risposta con risorsa non trovata
    mockAxios.onGet('/api/not-found').reply(404, {
      detail: 'Risorsa non trovata'
    });

    // Rendering del componente
    render(
      <NotificationsProvider>
        <ApiTestComponent />
      </NotificationsProvider>
    );

    // Esecuzione della richiesta
    fireEvent.click(screen.getByText('Risorsa non trovata'));

    // Verifica che sia stata mostrata la notifica di errore
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errore: Risorsa non trovata',
        expect.any(String)
      );
    });
  });

  test('dovrebbe mostrare una notifica per errori di rete', async () => {
    // Mock della risposta con errore di rete
    mockAxios.onGet('/api/network-error').networkError();

    // Rendering del componente
    render(
      <NotificationsProvider>
        <ApiTestComponent />
      </NotificationsProvider>
    );

    // Esecuzione della richiesta
    fireEvent.click(screen.getByText('Errore di rete'));

    // Verifica che sia stata mostrata la notifica di errore di rete
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errore di connessione: Verifica la tua connessione internet.',
        expect.any(String)
      );
    });
  });

  test('dovrebbe mostrare una notifica per timeout delle richieste', async () => {
    // Mock della risposta con timeout
    mockAxios.onGet('/api/timeout').timeout();

    // Rendering del componente
    render(
      <NotificationsProvider>
        <ApiTestComponent />
      </NotificationsProvider>
    );

    // Esecuzione della richiesta
    fireEvent.click(screen.getByText('Timeout della richiesta'));

    // Verifica che sia stata mostrata la notifica di timeout
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Timeout della richiesta: Il server non risponde.',
        expect.any(String)
      );
    });
  });

  test('dovrebbe mostrare notifiche dettagliate per errori di validazione (422)', async () => {
    // Mock della risposta con errori di validazione
    mockAxios.onPost('/api/validation-error').reply(422, {
      detail: [
        {
          loc: ['body', 'name'],
          msg: 'Il campo nome è obbligatorio',
          type: 'value_error.missing'
        },
        {
          loc: ['body', 'email'],
          msg: 'Formato email non valido',
          type: 'value_error.email'
        }
      ]
    });

    // Rendering del componente
    render(
      <NotificationsProvider>
        <ApiTestComponent />
      </NotificationsProvider>
    );

    // Esecuzione della richiesta
    fireEvent.click(screen.getByText('Errore di validazione'));

    // Verifica che sia stata mostrata la notifica di errore con dettagli
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errori di validazione',
        expect.stringContaining('Il campo nome è obbligatorio')
      );
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errori di validazione',
        expect.stringContaining('Formato email non valido')
      );
    });
  });
});
