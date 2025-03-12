import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfileSettings from '../../../src/components/common/ProfileSettings';
import AuthService from '../../../src/services/AuthService';
import { NotificationsProvider } from '../../../src/contexts/NotificationsContext';
import { NotificationsService } from '../../../src/services/NotificationsService';
import { AuthProvider } from '../../../src/contexts/AuthContext';

// Mock dei servizi
jest.mock('../../../src/services/AuthService', () => ({
  __esModule: true,
  default: {
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    getUserProfile: jest.fn(),
    getCurrentUser: jest.fn()
  }
}));

jest.mock('../../../src/services/NotificationsService', () => ({
  NotificationsService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }
}));

describe('ProfileSettings Integration Tests', () => {
  // Dati di test
  const mockUser = {
    id: 2,
    email: 'parent@example.com',
    full_name: 'Parent User',
    role: 'parent'
  };
  
  const mockUserProfile = {
    id: 2,
    email: 'parent@example.com',
    full_name: 'Parent User',
    role: 'parent',
    profile: {
      phone: '+39 123 456 7890',
      address: 'Via Roma 123, Milano',
      profile_image: 'https://example.com/parent.jpg'
    }
  };
  
  const mockProfileUpdateResponse = {
    success: true,
    message: 'Profilo aggiornato con successo',
    user: {
      ...mockUserProfile,
      full_name: 'Parent User Aggiornato',
      profile: {
        ...mockUserProfile.profile,
        phone: '+39 098 765 4321'
      }
    }
  };
  
  const mockPasswordChangeResponse = {
    success: true,
    message: 'Password modificata con successo'
  };
  
  beforeEach(() => {
    // Configurazione mock dei servizi
    AuthService.default.getUserProfile.mockResolvedValue(mockUserProfile);
    AuthService.default.getCurrentUser.mockReturnValue(mockUser);
    AuthService.default.updateProfile.mockResolvedValue(mockProfileUpdateResponse);
    AuthService.default.changePassword.mockResolvedValue(mockPasswordChangeResponse);
    
    // Storage mock setup
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('accessToken', 'mock-token');
    
    // Reset delle chiamate mock
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    localStorage.clear();
  });
  
  test('dovrebbe caricare e visualizzare i dati del profilo utente', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <ProfileSettings />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Verifica che il servizio sia stato chiamato
    expect(AuthService.default.getUserProfile).toHaveBeenCalled();
    
    // Attendi che i dati del profilo vengano caricati e visualizzati
    await waitFor(() => {
      // Verifica che i dati del profilo siano visualizzati
      expect(screen.getByDisplayValue('Parent User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('parent@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+39 123 456 7890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Via Roma 123, Milano')).toBeInTheDocument();
    });
  });
  
  test('dovrebbe aggiornare il profilo utente correttamente', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <ProfileSettings />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Attendi che i dati del profilo vengano caricati
    await waitFor(() => {
      expect(screen.getByDisplayValue('Parent User')).toBeInTheDocument();
    });
    
    // Modifica i campi del profilo
    const nameInput = screen.getByDisplayValue('Parent User');
    const phoneInput = screen.getByDisplayValue('+39 123 456 7890');
    
    fireEvent.change(nameInput, { target: { value: 'Parent User Aggiornato' } });
    fireEvent.change(phoneInput, { target: { value: '+39 098 765 4321' } });
    
    // Trova e clicca il pulsante di aggiornamento profilo
    const updateButton = screen.getByText('Aggiorna Profilo');
    fireEvent.click(updateButton);
    
    // Verifica che il servizio sia stato chiamato con i parametri corretti
    expect(AuthService.default.updateProfile).toHaveBeenCalledWith({
      full_name: 'Parent User Aggiornato',
      profile: {
        phone: '+39 098 765 4321',
        address: 'Via Roma 123, Milano',
        profile_image: 'https://example.com/parent.jpg'
      }
    });
    
    // Verifica che sia stata mostrata una notifica di successo
    await waitFor(() => {
      expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Profilo aggiornato con successo');
    });
  });
  
  test('dovrebbe cambiare la password correttamente', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <ProfileSettings />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Attendi che il componente venga caricato
    await waitFor(() => {
      expect(screen.getByText('Cambia Password')).toBeInTheDocument();
    });
    
    // Trova e compila i campi della password
    const currentPasswordInput = screen.getByLabelText('Password attuale');
    const newPasswordInput = screen.getByLabelText('Nuova password');
    const confirmPasswordInput = screen.getByLabelText('Conferma nuova password');
    
    fireEvent.change(currentPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newPassword456' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newPassword456' } });
    
    // Trova e clicca il pulsante di cambio password
    const passwordButton = screen.getByText('Cambia Password');
    fireEvent.click(passwordButton);
    
    // Verifica che il servizio sia stato chiamato con i parametri corretti
    expect(AuthService.default.changePassword).toHaveBeenCalledWith(
      'password123',
      'newPassword456'
    );
    
    // Verifica che sia stata mostrata una notifica di successo
    await waitFor(() => {
      expect(NotificationsService.showSuccess).toHaveBeenCalledWith('Password modificata con successo');
    });
  });
  
  test('dovrebbe mostrare errore se le password nuove non corrispondono', async () => {
    // Rendering del componente
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <ProfileSettings />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Attendi che il componente venga caricato
    await waitFor(() => {
      expect(screen.getByText('Cambia Password')).toBeInTheDocument();
    });
    
    // Trova e compila i campi della password con valori diversi per la conferma
    const currentPasswordInput = screen.getByLabelText('Password attuale');
    const newPasswordInput = screen.getByLabelText('Nuova password');
    const confirmPasswordInput = screen.getByLabelText('Conferma nuova password');
    
    fireEvent.change(currentPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newPassword456' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentPassword789' } });
    
    // Trova e clicca il pulsante di cambio password
    const passwordButton = screen.getByText('Cambia Password');
    fireEvent.click(passwordButton);
    
    // Verifica che venga mostrato un messaggio di errore
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith('Le password non corrispondono');
    });
    
    // Verifica che il servizio non sia stato chiamato
    expect(AuthService.default.changePassword).not.toHaveBeenCalled();
  });
  
  test('dovrebbe gestire errori durante l\'aggiornamento del profilo', async () => {
    // Modifichiamo il mock per simulare un errore
    AuthService.default.updateProfile.mockRejectedValue({
      response: {
        data: {
          detail: 'Errore durante l\'aggiornamento del profilo'
        }
      }
    });
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <ProfileSettings />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Attendi che i dati del profilo vengano caricati
    await waitFor(() => {
      expect(screen.getByDisplayValue('Parent User')).toBeInTheDocument();
    });
    
    // Modifica i campi del profilo
    const nameInput = screen.getByDisplayValue('Parent User');
    fireEvent.change(nameInput, { target: { value: 'Parent User Aggiornato' } });
    
    // Trova e clicca il pulsante di aggiornamento profilo
    const updateButton = screen.getByText('Aggiorna Profilo');
    fireEvent.click(updateButton);
    
    // Verifica che venga mostrata una notifica di errore
    await waitFor(() => {
      expect(NotificationsService.showError).toHaveBeenCalledWith(
        expect.stringContaining('Errore durante l\'aggiornamento del profilo')
      );
    });
  });
  
  test('dovrebbe mostrare correttamente i dati specifici in base al ruolo utente', async () => {
    // Modifichiamo il mock per un utente studente
    const studentUser = {
      id: 3,
      email: 'student@example.com',
      full_name: 'Student User',
      role: 'student'
    };
    
    const studentProfile = {
      id: 3,
      email: 'student@example.com',
      full_name: 'Student User',
      role: 'student',
      profile: {
        age: 10,
        birth_date: '2015-05-10',
        school_name: 'Scuola Elementare Esempio',
        parent_id: 2,
        profile_image: 'https://example.com/student.jpg'
      }
    };
    
    AuthService.default.getCurrentUser.mockReturnValue(studentUser);
    AuthService.default.getUserProfile.mockResolvedValue(studentProfile);
    localStorage.setItem('user', JSON.stringify(studentUser));
    
    // Rendering del componente
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <ProfileSettings />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Attendi che i dati del profilo vengano caricati
    await waitFor(() => {
      // Verifica che i dati specifici dello studente siano visualizzati
      expect(screen.getByDisplayValue('Student User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('student@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Scuola Elementare Esempio')).toBeInTheDocument();
    });
  });
});
