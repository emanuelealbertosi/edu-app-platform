/**
 * Centralizzazione dei mock per i servizi utilizzati nei test
 */

// Mock per NotificationsService
export const mockNotificationsService = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn(),
  showInfo: jest.fn(),
  setNotificationHandler: jest.fn()
};

// Mock per AuthService
export const mockAuthService = {
  login: jest.fn(() => Promise.resolve({
    user: { 
      id: '1', 
      email: 'test@example.com', 
      firstName: 'Test', 
      lastName: 'User', 
      role: 'admin' 
    },
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token'
  })),
  register: jest.fn(() => Promise.resolve({
    user: { 
      id: '2', 
      email: 'newuser@example.com', 
      firstName: 'New', 
      lastName: 'User', 
      role: 'student' 
    },
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token'
  })),
  logout: jest.fn(() => Promise.resolve()),
  refreshTokens: jest.fn(() => Promise.resolve({
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token'
  })),
  validateSession: jest.fn(() => Promise.resolve(true)),
  getCurrentUser: jest.fn(() => ({
    id: '1', 
    email: 'test@example.com', 
    firstName: 'Test', 
    lastName: 'User', 
    role: 'admin'
  })),
  isAuthenticated: jest.fn(() => true)
};

// Setup mock di localStorage
export const setupLocalStorageMock = () => {
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      })
    };
  })();
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  
  return localStorageMock;
};

// Mock per axios
export const setupAxiosMock = () => {
  const mockApiInstance = {
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };
  
  return mockApiInstance;
};
