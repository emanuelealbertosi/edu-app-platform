module.exports = {
  // La directory radice del progetto
  rootDir: '.',

  // Percorsi in cui cercare i test
  testMatch: [
    '<rootDir>/src/**/*.test.[jt]s?(x)',
    '<rootDir>/tests/**/*.test.[jt]s?(x)'
  ],

  // Ambiente di test
  testEnvironment: 'jsdom',

  // Configurazione di mock
  moduleNameMapper: {
    // Mappa file statici come mock
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/tests/__mocks__/fileMock.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js'
  },

  // Configurazione di transform per babel
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },

  // File di setup per i test
  setupFilesAfterEnv: [
    '<rootDir>/tests/integration/setup.js'
  ],

  // Moduli da ignorare durante la trasformazione
  transformIgnorePatterns: [
    '/node_modules/(?!axios)/'
  ],

  // Copertura di codice
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/reportWebVitals.js'
  ],

  // Directory da ignorare
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/'
  ]
};
