/**
 * Mocks comuni per i test unitari
 * Questo file centralizza tutti i mock dei servizi che sono utilizzati in diversi test
 */

import { NotificationType } from '../../../src/types/notifications';

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
  setNotificationHandler: jest.fn(),
  notify: jest.fn()
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
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token'
  })),
  register: jest.fn(() => Promise.resolve({
    user: { 
      id: '2', 
      email: 'newuser@example.com', 
      firstName: 'New', 
      lastName: 'User', 
      role: 'student' 
    },
    access_token: 'new-access-token',
    refresh_token: 'new-refresh-token'
  })),
  logout: jest.fn(() => Promise.resolve()),
  refreshTokens: jest.fn(() => Promise.resolve({
    access_token: 'new-access-token',
    refresh_token: 'new-refresh-token'
  })),
  validateSession: jest.fn(() => Promise.resolve(true)),
  getCurrentUser: jest.fn(() => Promise.resolve({
    id: '1', 
    email: 'test@example.com', 
    firstName: 'Test', 
    lastName: 'User', 
    role: 'admin'
  })),
  isAuthenticated: jest.fn(() => true)
};

// Mock per UserService
export const mockUserService = {
  getAllUsers: jest.fn(() => Promise.resolve([
    { id: '1', email: 'admin@example.com', firstName: 'Admin', lastName: 'User', role: 'admin' },
    { id: '2', email: 'parent@example.com', firstName: 'Parent', lastName: 'User', role: 'parent' },
    { id: '3', email: 'student@example.com', firstName: 'Student', lastName: 'User', role: 'student' }
  ])),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserById: jest.fn()
};

// Mock per PathService
export const mockPathService = {
  getAllPathTemplates: jest.fn(),
  getPathTemplateById: jest.fn(),
  createPathTemplate: jest.fn(),
  updatePathTemplate: jest.fn(),
  deletePathTemplate: jest.fn(),
  assignPathToStudent: jest.fn(),
  getAssignedPaths: jest.fn(),
  getStudentPaths: jest.fn()
};

// Mock per QuizService
export const mockQuizService = {
  getAllQuizTemplates: jest.fn(),
  getQuizTemplateById: jest.fn(),
  createQuizTemplate: jest.fn(),
  updateQuizTemplate: jest.fn(),
  deleteQuizTemplate: jest.fn(),
  getStudentQuizzes: jest.fn(),
  submitQuizAnswers: jest.fn()
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

// Setup mock di sessionStorage
export const setupSessionStorageMock = () => {
  const sessionStorageMock = (() => {
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
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
  });
  
  return sessionStorageMock;
};
