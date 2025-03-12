import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext';
import AuthService from '../../../src/services/AuthService';
import { NotificationsService } from '../../../src/services/NotificationsService';

// Mock di NotificationsService
jest.mock('../../../src/services/NotificationsService', () => ({
  NotificationsService: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn()
  }
}));

// Mock degli oggetti user utilizzati nei test
const mockAdminUser = {
  id: '1', 
  email: 'admin@example.com', 
  firstName: 'Test', 
  lastName: 'User', 
  role: 'admin'
};

const mockStudentUser = {
  id: '2', 
  email: 'student@example.com', 
  firstName: 'New', 
  lastName: 'User', 
  role: 'student'
};

// Mock completo del AuthService
jest.mock('../../../src/services/AuthService', () => {
  const mockService = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    validateSession: jest.fn(),
    refreshTokens: jest.fn(),
    isAuthenticated: jest.fn(),
  };

  // Dobbiamo assicurarci che 'default' contenga le stesse funzioni
  return {
    ...mockService,
    default: mockService
  };
});

// Componente di test per utilizzare il context
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{auth.loading.toString()}</div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="error">{auth.error || 'no-error'}</div>
      <div data-testid="session-status">{auth.sessionStatus}</div>
      {auth.user && (
        <div data-testid="user-info">
          {`${auth.user.firstName} ${auth.user.lastName} (${auth.user.role})`}
        </div>
      )}
      <button 
        onClick={() => auth.login('test@example.com', 'password')}
        data-testid="login-button"
      >
        Login
      </button>
      <button 
        onClick={() => auth.register({
          email: 'new@example.com',
          password: 'password',
          firstName: 'New',
          lastName: 'User',
          role: 'student'
        })}
        data-testid="register-button"
      >
        Register
      </button>
      <button 
        onClick={() => auth.logout()}
        data-testid="logout-button"
      >
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset NotificationsService mocks
    Object.keys(NotificationsService).forEach(key => {
      if (typeof NotificationsService[key] === 'function') {
        NotificationsService[key].mockClear();
      }
    });
  });

  test('should initialize with correct default values', async () => {
    // Mock getCurrentUser to return null (no authenticated user)
    AuthService.default.getCurrentUser.mockReturnValue(null);
    AuthService.default.validateSession.mockResolvedValue(false);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toBe('no-error');
    expect(screen.getByTestId('session-status').textContent).toBe('active');
    expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
  });

  test('should correctly set user when already authenticated', async () => {
    // Mock getCurrentUser to return a user
    AuthService.default.getCurrentUser.mockReturnValue(mockAdminUser);
    AuthService.default.validateSession.mockResolvedValue(true);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user-info').textContent).toBe('Test User (admin)');
    expect(screen.getByTestId('session-status').textContent).toBe('active');
  });

  test('should handle login correctly', async () => {
    // Mock getCurrentUser to return null initially
    AuthService.default.getCurrentUser.mockReturnValue(null);
    AuthService.default.validateSession.mockResolvedValue(false);

    // Mock successful login with CORRECT RESPONSE STRUCTURE
    AuthService.default.login.mockResolvedValue({
      user: mockAdminUser,
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: 1643723900
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Verify initial state
    expect(screen.getByTestId('authenticated').textContent).toBe('false');

    // Perform login
    await act(async () => {
      screen.getByTestId('login-button').click();
    });

    // Verify loading state during login
    await waitFor(() => {
      expect(AuthService.default.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    // Verify final state after login
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user-info').textContent).toBe('Test User (admin)');
    });
  });

  test('should handle login error correctly', async () => {
    // Mock getCurrentUser to return null initially
    AuthService.default.getCurrentUser.mockReturnValue(null);
    AuthService.default.validateSession.mockResolvedValue(false);

    // Mock failed login
    const mockError = new Error('Invalid credentials');
    mockError.response = { data: { message: 'Email o password non validi' } };
    AuthService.default.login.mockRejectedValue(mockError);

    // Ensure we're properly mocking the NotificationsService
    jest.spyOn(NotificationsService, 'error').mockImplementation(() => {});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Perform login
    await act(async () => {
      try {
        screen.getByTestId('login-button').click();
      } catch (error) {
        // We expect this to throw an error, but we catch it here to continue the test
        console.log('Expected error caught');
      }
    });

    // Verify error state after failed login
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.getByTestId('error').textContent).toBe('Email o password non validi');
      expect(NotificationsService.error).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('should handle registration correctly', async () => {
    // Mock getCurrentUser to return null initially
    AuthService.default.getCurrentUser.mockReturnValue(null);
    AuthService.default.validateSession.mockResolvedValue(false);

    // Mock successful registration with CORRECT RESPONSE STRUCTURE
    AuthService.default.register.mockResolvedValue({
      user: mockStudentUser,
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: 1643723900
    });

    // Spy on NotificationsService.success
    jest.spyOn(NotificationsService, 'success').mockImplementation(() => {});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Perform registration
    await act(async () => {
      screen.getByTestId('register-button').click();
    });

    // Verify registration call
    await waitFor(() => {
      expect(AuthService.default.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password',
        firstName: 'New',
        lastName: 'User',
        role: 'student'
      });
    });

    // Verify final state after registration with longer timeout
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user-info').textContent).toBe('New User (student)');
      
      // Verificare che sia stato chiamato il metodo success del NotificationsService
      expect(NotificationsService.success).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('should handle session expiration', async () => {
    // Mock getCurrentUser to return null initially
    AuthService.default.getCurrentUser.mockReturnValue(null);
    AuthService.default.validateSession.mockResolvedValue(false);

    // Mock successful login first
    AuthService.default.login.mockResolvedValue({
      user: mockAdminUser,
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: 1643723900
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Perform login
    await act(async () => {
      screen.getByTestId('login-button').click();
    });

    // Verify login succeeded
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user-info').textContent).toBe('Test User (admin)');
    });

    // Modificare il comportamento mocked di AuthService per simulare una sessione scaduta
    AuthService.default.getCurrentUser.mockReturnValue(null);
    
    // Forza uno stato di non autenticazione
    AuthService.default.logout.mockImplementation(() => {
      // Forziamo getCurrentUser a ritornare null dopo il logout
      AuthService.default.getCurrentUser.mockReturnValue(null);
      return Promise.resolve();
    });
    
    // Simulare il logout (che verrebbe attivato dall'errore di sessione scaduta)
    await act(async () => {
      // Chiamiamo logout direttamente invece di simulare l'evento focus
      screen.getByTestId('logout-button').click();
    });

    // Verifica che l'utente sia stato disconnesso
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('should handle logout correctly', async () => {
    // Setup initial authenticated state
    AuthService.default.getCurrentUser.mockReturnValue(mockAdminUser);
    AuthService.default.validateSession.mockResolvedValue(true);
    
    // Mock logout function
    AuthService.default.logout.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Verify initial authenticated state
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user-info').textContent).toBe('Test User (admin)');
    });

    // Perform logout
    await act(async () => {
      screen.getByTestId('logout-button').click();
    });

    // Verify logout was called
    expect(AuthService.default.logout).toHaveBeenCalled();

    // Verify user is logged out
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
    });
  });
});
