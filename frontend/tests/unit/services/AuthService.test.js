import axios from 'axios';
import AuthService from '../../../src/services/AuthService';
import { NotificationsService } from '../../../src/services/NotificationsService';

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      interceptors: {
        request: {
          use: jest.fn(),
          eject: jest.fn()
        },
        response: {
          use: jest.fn(),
          eject: jest.fn()
        }
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    })),
    defaults: {
      headers: {
        common: {}
      }
    }
  };
});

// Mock localStorage
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

// Mock NotificationsService
jest.mock('../../../src/services/NotificationsService', () => ({
  NotificationsService: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  }
}));

// Create a mock API instance for testing
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

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.create.mockReturnValue(mockApiInstance);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('login', () => {
    test('should login successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin'
      };
      
      const mockResponse = {
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user: mockUser
        }
      };

      mockApiInstance.post.mockResolvedValue(mockResponse);

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password'
      });

      // Check API call
      expect(mockApiInstance.post).toHaveBeenCalledWith('/login', {
        email: 'test@example.com',
        password: 'password'
      });

      // Check result
      expect(result).toEqual(mockResponse.data);

      // Check localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'test-access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'test-refresh-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });

    test('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      mockError.response = { data: { message: 'Email o password non validi' } };
      
      mockApiInstance.post.mockRejectedValue(mockError);

      await expect(AuthService.login({
        email: 'test@example.com',
        password: 'wrong-password'
      })).rejects.toThrow();

      // Check that localStorage was not updated
      expect(localStorage.setItem).not.toHaveBeenCalledWith('accessToken', expect.any(String));
      expect(localStorage.setItem).not.toHaveBeenCalledWith('refreshToken', expect.any(String));
      expect(localStorage.setItem).not.toHaveBeenCalledWith('user', expect.any(String));
    });
  });

  describe('register', () => {
    test('should register successfully', async () => {
      const mockUser = {
        id: '2',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'student'
      };
      
      const mockResponse = {
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user: mockUser
        }
      };

      mockApiInstance.post.mockResolvedValue(mockResponse);

      const result = await AuthService.register({
        email: 'new@example.com',
        password: 'password',
        firstName: 'New',
        lastName: 'User',
        role: 'student'
      });

      // Check API call
      expect(mockApiInstance.post).toHaveBeenCalledWith('/register', {
        email: 'new@example.com',
        password: 'password',
        firstName: 'New',
        lastName: 'User',
        role: 'student'
      });

      // Check result
      expect(result).toEqual(mockResponse.data);

      // Check localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'test-access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'test-refresh-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });

    test('should handle registration error', async () => {
      const mockError = new Error('Registration error');
      mockError.response = { data: { message: 'Email già registrata' } };
      
      mockApiInstance.post.mockRejectedValue(mockError);

      await expect(AuthService.register({
        email: 'existing@example.com',
        password: 'password',
        firstName: 'Existing',
        lastName: 'User',
        role: 'parent'
      })).rejects.toThrow();

      // Check that localStorage was not updated
      expect(localStorage.setItem).not.toHaveBeenCalledWith('accessToken', expect.any(String));
      expect(localStorage.setItem).not.toHaveBeenCalledWith('refreshToken', expect.any(String));
      expect(localStorage.setItem).not.toHaveBeenCalledWith('user', expect.any(String));
    });
  });

  describe('logout', () => {
    test('should logout successfully', async () => {
      // Setup initial state
      localStorage.setItem('accessToken', 'test-access-token');
      localStorage.setItem('refreshToken', 'test-refresh-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', role: 'admin' }));
      
      mockApiInstance.post.mockResolvedValue({ data: { success: true } });

      await AuthService.logout();

      // Check API call
      expect(mockApiInstance.post).toHaveBeenCalledWith('/logout', {});

      // Check localStorage was cleared
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });

    test('should logout from all devices when specified', async () => {
      // Setup initial state
      localStorage.setItem('accessToken', 'test-access-token');
      localStorage.setItem('refreshToken', 'test-refresh-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', role: 'admin' }));
      
      mockApiInstance.post.mockResolvedValue({ data: { success: true } });

      await AuthService.logout(true);

      // Check API call
      expect(mockApiInstance.post).toHaveBeenCalledWith('/logout', { 
        logoutAllDevices: true 
      });

      // Check localStorage was cleared
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('getCurrentUser', () => {
    test('should return user from localStorage', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin'
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      
      const user = AuthService.getCurrentUser();
      
      expect(user).toEqual(mockUser);
    });

    test('should return null if no user in localStorage', () => {
      const user = AuthService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    test('should return token from localStorage', () => {
      localStorage.setItem('accessToken', 'test-access-token');
      
      const token = AuthService.getAccessToken();
      
      expect(token).toEqual('test-access-token');
    });

    test('should return null if no token in localStorage', () => {
      localStorage.removeItem('accessToken');
      
      const token = AuthService.getAccessToken();
      
      expect(token).toBeNull();
    });
  });

  describe('refreshToken', () => {
    test('should refresh token successfully', async () => {
      // Setup initial state
      localStorage.setItem('refreshToken', 'test-refresh-token');
      
      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      };

      mockApiInstance.post.mockResolvedValue(mockResponse);

      const result = await AuthService.refreshToken();

      // Check API call
      expect(mockApiInstance.post).toHaveBeenCalledWith('/refresh-token', {
        refreshToken: 'test-refresh-token'
      });

      // Check result
      expect(result).toEqual(mockResponse.data);

      // Check localStorage was updated
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
    });

    test('should handle refresh token error', async () => {
      // Setup initial state
      localStorage.setItem('refreshToken', 'invalid-refresh-token');
      
      const mockError = new Error('Invalid refresh token');
      mockError.response = { data: { message: 'Token di refresh non valido' } };
      
      mockApiInstance.post.mockRejectedValue(mockError);

      await expect(AuthService.refreshToken()).rejects.toThrow();

      // Check localStorage was not updated (but may be cleared in a real implementation)
      expect(localStorage.setItem).not.toHaveBeenCalledWith('accessToken', expect.any(String));
      expect(localStorage.setItem).not.toHaveBeenCalledWith('refreshToken', expect.any(String));
    });
  });

  describe('validateSession', () => {
    test('should validate session successfully', async () => {
      mockApiInstance.get.mockResolvedValue({ data: { valid: true } });

      const result = await AuthService.validateSession();

      // Check API call
      expect(mockApiInstance.get).toHaveBeenCalledWith('/validate-session');

      // Check result
      expect(result).toBe(true);
    });

    test('should handle invalid session', async () => {
      const mockError = new Error('Invalid session');
      mockError.response = { status: 401 };
      
      mockApiInstance.get.mockRejectedValue(mockError);

      const onLogoutMock = jest.fn();

      const result = await AuthService.validateSession({ onLogout: onLogoutMock });

      // Check result
      expect(result).toBe(false);
      
      // Check onLogout was called
      expect(onLogoutMock).toHaveBeenCalled();
    });
  });
});
