// setup.js - Integration test setup
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom'; 
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Mock del modulo axios
const mockAxios = new MockAdapter(axios);

// Mock di localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    },
    length: 0,
    key: function() {
      return null;
    }
  };
})();

// Mock del localStorage globale
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock di sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
});

// Mock per window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecato
    removeListener: jest.fn(), // deprecato
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Supprimere gli avvisi di React 
const originalConsoleError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalConsoleError(...args);
};

// Configurazione globale prima di ogni test
beforeAll(() => {
  // Inizializzazione di variabili o configurazioni globali
  console.log('Setting up integration tests');
});

// Pulizia dopo ogni test
afterEach(() => {
  // Reset delle richieste simulate
  mockAxios.reset();
  // Pulizia del DOM dopo ogni test
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  jest.clearAllMocks();
});

// Pulizia dopo tutti i test
afterAll(() => {
  // Pulizia finale e ripristino
  mockAxios.restore();
  console.log('Cleaning up integration tests');
});

// Esportiamo mockAxios per un accesso più facile nei test
export { mockAxios };
