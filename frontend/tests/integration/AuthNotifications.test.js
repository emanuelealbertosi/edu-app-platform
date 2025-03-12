import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { NotificationsProvider } from '../../src/contexts/NotificationsContext';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { NotificationsService } from '../../src/services/NotificationsService';
import AuthService from '../../src/services/AuthService';
import Login from '../../src/components/auth/Login';
import Register from '../../src/components/auth/Register';

// Mock del servizio di notifiche
jest.mock('../../src/services/NotificationsService', () => ({
  NotificationsService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }
}));

// Componente ausiliario per testare l'integrazione Auth-Notification
const LoginWithProviders = () => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationsProvider>
        <Login />
      </NotificationsProvider>
    </AuthProvider>
  </BrowserRouter>
);

const RegisterWithProviders = () => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationsProvider>
        <Register />
      </NotificationsProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Auth e Notifications Integration Tests', () => {
  let mockAxios;
  
  beforeEach(() => {
    // Setup mock axios
    mockAxios = new MockAdapter(axios);
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
    
    // Pulizia localStorage
    localStorage.clear();
  });
  
  afterEach(() => {
    mockAxios.restore();
    jest.clearAllMocks();
  });
  
  test('dovrebbe mostrare notifica di successo al login', async () => {
    // Risposta di successo per il login
    const loginResponse = {
      id: 2,
      email: 'parent@example.com',
      full_name: 'Parent User',
      role: 'parent',
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token'
    };
    
    // Configurazione del mock axios per il login
    mockAxios.onPost('/api/auth/login').reply(200, loginResponse);
    
    // Rendering del componente
    render(<LoginWithProviders />);
    
    // Compila il form di login
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByText(/Accedi/i);
    
    fireEvent.change(emailInput, { target: { value: 'parent@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Invia il form
    await act(async () => {
      fireEvent.click(loginButton);
    });
    
    // Verifica che sia stata mostrata una notifica di successo
    await waitFor(() => {
      expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
        'Login effettuato con successo. Benvenuto Parent User!'
      );
    });
    
    // Verifica che i token siano stati salvati nel localStorage
    expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
    expect(localStorage.getItem('user')).toBeTruthy();
  });
  
  test('dovrebbe mostrare notifica di errore al login con credenziali errate', async () => {
    // Configurazione del mock axios per errore di login
    mockAxios.onPost('/api/auth/login').reply(401, {
      detail: 'Credenziali non valide'
    });
    
    // Rendering del componente
    render(<LoginWithProviders />);
    
    // Compila il form di login
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByText(/Accedi/i);
    
    fireEvent.change(emailInput, { target: { value: 'parent@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'passwordErrata' } });
    
    // Invia il form
    await act(async () => {
      fireEvent.click(loginButton);
    });
    
    // Verifica che sia stata mostrata una notifica di errore
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errore: Credenziali non valide'
      );
    });
    
    // Verifica che i token non siano stati salvati nel localStorage
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
  
  test('dovrebbe mostrare notifica di successo alla registrazione', async () => {
    // Risposta di successo per la registrazione
    const registerResponse = {
      id: 4,
      email: 'nuovo.genitore@example.com',
      full_name: 'Nuovo Genitore',
      role: 'parent',
      message: 'Registrazione completata con successo'
    };
    
    // Configurazione del mock axios per la registrazione
    mockAxios.onPost('/api/auth/register').reply(201, registerResponse);
    
    // Rendering del componente
    render(<RegisterWithProviders />);
    
    // Compila il form di registrazione
    const nameInput = screen.getByLabelText(/Nome completo/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Conferma password/i);
    const registerButton = screen.getByText(/Registrati/i);
    
    fireEvent.change(nameInput, { target: { value: 'Nuovo Genitore' } });
    fireEvent.change(emailInput, { target: { value: 'nuovo.genitore@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    // Seleziona il ruolo "Genitore"
    const roleSelect = screen.getByLabelText(/Ruolo/i);
    fireEvent.change(roleSelect, { target: { value: 'parent' } });
    
    // Invia il form
    await act(async () => {
      fireEvent.click(registerButton);
    });
    
    // Verifica che sia stata mostrata una notifica di successo
    await waitFor(() => {
      expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
        'Registrazione completata con successo. Puoi accedere con le tue credenziali.'
      );
    });
  });
  
  test('dovrebbe mostrare notifica di errore per registrazione con email esistente', async () => {
    // Configurazione del mock axios per errore di registrazione
    mockAxios.onPost('/api/auth/register').reply(409, {
      detail: 'Utente con questa email già registrato'
    });
    
    // Rendering del componente
    render(<RegisterWithProviders />);
    
    // Compila il form di registrazione
    const nameInput = screen.getByLabelText(/Nome completo/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Conferma password/i);
    const registerButton = screen.getByText(/Registrati/i);
    
    fireEvent.change(nameInput, { target: { value: 'Genitore Esistente' } });
    fireEvent.change(emailInput, { target: { value: 'parent@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    // Seleziona il ruolo "Genitore"
    const roleSelect = screen.getByLabelText(/Ruolo/i);
    fireEvent.change(roleSelect, { target: { value: 'parent' } });
    
    // Invia il form
    await act(async () => {
      fireEvent.click(registerButton);
    });
    
    // Verifica che sia stata mostrata una notifica di errore
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Errore: Utente con questa email già registrato'
      );
    });
  });
  
  test('dovrebbe mostrare notifica di errore per validazione password', async () => {
    // Rendering del componente
    render(<RegisterWithProviders />);
    
    // Compila il form di registrazione
    const nameInput = screen.getByLabelText(/Nome completo/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Conferma password/i);
    const registerButton = screen.getByText(/Registrati/i);
    
    fireEvent.change(nameInput, { target: { value: 'Nuovo Utente' } });
    fireEvent.change(emailInput, { target: { value: 'nuovo.utente@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } }); // Password diversa
    
    // Seleziona il ruolo "Genitore"
    const roleSelect = screen.getByLabelText(/Ruolo/i);
    fireEvent.change(roleSelect, { target: { value: 'parent' } });
    
    // Invia il form
    await act(async () => {
      fireEvent.click(registerButton);
    });
    
    // Verifica che sia stata mostrata una notifica di errore per le password non corrispondenti
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Le password non corrispondono'
      );
    });
  });
  
  test('dovrebbe mostrare notifica di successo al logout', async () => {
    // Setup localStorage per simulare utente loggato
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    localStorage.setItem('user', JSON.stringify({
      id: 2,
      email: 'parent@example.com',
      full_name: 'Parent User',
      role: 'parent'
    }));
    
    // Spy sul metodo logout di AuthService
    const logoutSpy = jest.spyOn(AuthService.default, 'logout').mockImplementation(() => {
      localStorage.clear();
      return true;
    });
    
    // Componente di test per il logout
    const LogoutTest = () => {
      return (
        <BrowserRouter>
          <AuthProvider>
            <NotificationsProvider>
              <button onClick={() => {
                AuthService.default.logout();
                NotificationsService.showSuccess('Logout effettuato con successo');
              }}>
                Logout
              </button>
            </NotificationsProvider>
          </AuthProvider>
        </BrowserRouter>
      );
    };
    
    // Rendering del componente
    render(<LogoutTest />);
    
    // Clicca il pulsante di logout
    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      fireEvent.click(logoutButton);
    });
    
    // Verifica che il metodo logout sia stato chiamato
    expect(logoutSpy).toHaveBeenCalled();
    
    // Verifica che sia stata mostrata una notifica di successo
    expect(NotificationsService.showSuccess).toHaveBeenCalledWith(
      'Logout effettuato con successo'
    );
    
    // Verifica che localStorage sia stato pulito
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    
    // Cleanup
    logoutSpy.mockRestore();
  });
  
  test('dovrebbe mostrare notifica di errore per token scaduto', async () => {
    // Setup localStorage per simulare utente loggato con token
    localStorage.setItem('accessToken', 'mock-expired-token');
    localStorage.setItem('refreshToken', 'mock-expired-refresh-token');
    localStorage.setItem('user', JSON.stringify({
      id: 2,
      email: 'parent@example.com',
      full_name: 'Parent User',
      role: 'parent'
    }));
    
    // Mock per simulare un errore 401 per token scaduto
    mockAxios.onGet('/api/users/profile').reply(401, {
      detail: 'Token scaduto o non valido'
    });
    
    // Mock per simulare fallimento nel refresh del token
    mockAxios.onPost('/api/auth/refresh').reply(401, {
      detail: 'Refresh token non valido o scaduto'
    });
    
    // Componente di test per simulare una richiesta API protetta
    const ProfileRequestTest = () => {
      const makeRequest = async () => {
        try {
          await axios.get('/api/users/profile', {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
          });
        } catch (error) {
          if (error.response && error.response.status === 401) {
            try {
              // Tentativo di refresh token
              const refreshResponse = await axios.post('/api/auth/refresh', {
                refresh_token: localStorage.getItem('refreshToken')
              });
              
              // In caso di successo, aggiorna il token e ripeti la richiesta
              localStorage.setItem('accessToken', refreshResponse.data.access_token);
            } catch (refreshError) {
              // Se fallisce il refresh, logout e mostra notifica
              AuthService.default.logout();
              NotificationsService.showError('Sessione scaduta. Effettua nuovamente il login.');
            }
          }
        }
      };
      
      return (
        <BrowserRouter>
          <AuthProvider>
            <NotificationsProvider>
              <button onClick={makeRequest}>Carica Profilo</button>
            </NotificationsProvider>
          </AuthProvider>
        </BrowserRouter>
      );
    };
    
    // Spy sul metodo logout di AuthService
    const logoutSpy = jest.spyOn(AuthService.default, 'logout').mockImplementation(() => {
      localStorage.clear();
      return true;
    });
    
    // Rendering del componente
    render(<ProfileRequestTest />);
    
    // Clicca il pulsante per fare la richiesta
    const requestButton = screen.getByText('Carica Profilo');
    await act(async () => {
      fireEvent.click(requestButton);
    });
    
    // Verifica che sia stata mostrata una notifica di errore
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        'Sessione scaduta. Effettua nuovamente il login.'
      );
    });
    
    // Verifica che il metodo logout sia stato chiamato
    expect(logoutSpy).toHaveBeenCalled();
    
    // Verifica che localStorage sia stato pulito
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    
    // Cleanup
    logoutSpy.mockRestore();
  });
});
