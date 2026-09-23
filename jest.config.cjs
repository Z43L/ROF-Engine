/**
 * Jest Configuration for ROF-Engine
 * Configuración de testing para el framework de juegos
 *
 * Nota: este fichero es .cjs porque el package usa "type": "module"
 * y jest espera poder cargarlo con require().
 */

module.exports = {
  // Entorno de testing
  testEnvironment: 'jsdom',

  // Directorios de tests
  roots: ['<rootDir>/__tests__'],

  // Patrones de archivos de test
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Archivos a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__snapshots__/',
    '/coverage/',
    '/__tests__/setup.js'
  ],

  // Módulos a ignorar en la transformación
  transformIgnorePatterns: [
    'node_modules/(?!(@react-three)/)'
  ],

  // Mapeo de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js'
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  // Coverage (desactivado por defecto; usar `npm run test:coverage`)
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/test-utils.js',
    '!src/**/index.js' // Exclude index files from coverage
  ],

  // Transform para ES6 modules (config de babel dedicada a jest)
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.jest.cjs' }]
  },

  // Verbose
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
