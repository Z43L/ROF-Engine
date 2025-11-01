/**
 * Jest Configuration for ROF-Engine
 * Configuración de testing para el framework de juegos
 */

module.exports = {
  // Entorno de testing
  testEnvironment: 'jsdom',

  // Directorios de tests
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],

  // Patrones de archivos de test
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Archivos a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__snapshots__/',
    '/coverage/'
  ],

  // Módulos a ignorar
  transformIgnorePatterns: [
    'node_modules/(?!(@react-three)/)'
  ],

  // Configuración de módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  // Coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Coverage paths
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/test-utils.js',
    '!src/**/index.js' // Exclude index files from coverage
  ],

  // Transform para ES6 modules
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Modulos útiles para testing
  verbose: true,

  // Reset mocks entre tests
  resetMocks: true,
  resetModules: true,

  // Restore mocks después de cada test
  restoreMocks: true,

  // Max workers (paralelismo)
  maxWorkers: '50%',

  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ]
};