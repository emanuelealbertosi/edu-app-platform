import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../src/App';
import * as AuthContext from '../../src/contexts/AuthContext';
import { NotificationsProvider } from '../../src/contexts/NotificationsContext';

// Mock di react-router-dom
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    ...originalModule,
    Navigate: jest.fn(() => <div data-testid="navigate-mock" />),
  };
});

// Mock dell'AuthContext
jest.mock('../../src/contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../../src/contexts/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn(),
  };
});

describe('Protected Routes', () => {
  // Setup dei dati di test
  const mockAdminUser = {
    id: '1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  };

  const mockParentUser = {
    id: '2',
    email: 'parent@example.com',
    firstName: 'Parent',
    lastName: 'User',
    role: 'parent',
  };

  const mockStudentUser = {
    id: '3',
    email: 'student@example.com',
    firstName: 'Student',
    lastName: 'User',
    role: 'student',
  };

  // Helper per il rendering dell'app con un percorso specifico
  const renderWithRoute = (route, authState = { user: null, isAuthenticated: false }) => {
    // Setup del mock useAuth
    AuthContext.useAuth.mockReturnValue({
      ...authState,
      loading: false,
      error: null,
    });

    return render(
      <MemoryRouter initialEntries={[route]}>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </MemoryRouter>
    );
  };

  // Test route pubbliche
  test('le route pubbliche dovrebbero essere accessibili a tutti gli utenti', async () => {
    // Utente non autenticato
    renderWithRoute('/login');
    await waitFor(() => {
      expect(screen.getByText(/Accedi alla tua area personale/i)).toBeInTheDocument();
    });

    renderWithRoute('/register');
    await waitFor(() => {
      expect(screen.getByText(/Registrati/i)).toBeInTheDocument();
    });

    renderWithRoute('/');
    await waitFor(() => {
      expect(screen.getByText(/Benvenuto nell'App Educativa/i)).toBeInTheDocument();
    });
  });

  // Test route protette - Utente non autenticato
  test('le route protette dovrebbero reindirizzare alla login se utente non autenticato', async () => {
    renderWithRoute('/admin');
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });

    renderWithRoute('/parent');
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });

    renderWithRoute('/student');
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });
  });

  // Test route protette - Utente Admin
  test('utente admin dovrebbe accedere solo alle route admin', async () => {
    // Admin accede a route admin
    renderWithRoute('/admin', { user: mockAdminUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
    });

    // Admin accede a route parent
    renderWithRoute('/parent', { user: mockAdminUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });

    // Admin accede a route student
    renderWithRoute('/student', { user: mockAdminUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });
  });

  // Test route protette - Utente Parent
  test('utente parent dovrebbe accedere solo alle route parent', async () => {
    // Parent accede a route parent
    renderWithRoute('/parent', { user: mockParentUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByText(/Parent Dashboard/i)).toBeInTheDocument();
    });

    // Parent accede a route admin
    renderWithRoute('/admin', { user: mockParentUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });

    // Parent accede a route student
    renderWithRoute('/student', { user: mockParentUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });
  });

  // Test route protette - Utente Student
  test('utente student dovrebbe accedere solo alle route student', async () => {
    // Student accede a route student
    renderWithRoute('/student', { user: mockStudentUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByText(/Student Dashboard/i)).toBeInTheDocument();
    });

    // Student accede a route admin
    renderWithRoute('/admin', { user: mockStudentUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });

    // Student accede a route parent
    renderWithRoute('/parent', { user: mockStudentUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });
  });

  // Test route protette - Sottoroute specifiche
  test('utente dovrebbe accedere solo alle sottoroute specifiche del suo ruolo', async () => {
    // Admin accede alla route di gestione utenti
    renderWithRoute('/admin/users', { user: mockAdminUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByText(/Gestione Utenti/i)).toBeInTheDocument();
    });

    // Parent accede alla route di gestione studenti
    renderWithRoute('/parent/students', { user: mockParentUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByText(/I tuoi studenti/i)).toBeInTheDocument();
    });

    // Student accede alla route di quiz
    renderWithRoute('/student/quizzes', { user: mockStudentUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByText(/I tuoi quiz/i)).toBeInTheDocument();
    });
  });

  // Test reindirizzamento alle dashboard dopo login
  test('utente dovrebbe essere reindirizzato alla sua dashboard dopo il login', async () => {
    // Admin dopo login
    renderWithRoute('/login', { user: mockAdminUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });

    // Parent dopo login
    renderWithRoute('/login', { user: mockParentUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });

    // Student dopo login
    renderWithRoute('/login', { user: mockStudentUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });
  });

  // Test sessione scaduta
  test('utente con sessione scaduta dovrebbe essere reindirizzato al login', async () => {
    // Simulazione sessione scaduta
    AuthContext.useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: 'La tua sessione è scaduta. Effettua nuovamente il login.',
      sessionStatus: 'expired'
    });

    renderWithRoute('/admin', { user: mockAdminUser, isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    });
  });
});
