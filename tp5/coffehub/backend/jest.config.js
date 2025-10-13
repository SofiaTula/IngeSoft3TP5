export default {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'server.js',
      '!node_modules/**',
      '!coverage/**',
      '!tests/**',
      '!jest.config.js'
    ],
    testMatch: [
      '**/tests/unit/**/*.test.js',
      '**/tests/unit-mocked/**/*.test.js',  // ← AGREGAR
      '**/tests/integration/**/*.test.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 30000,
    verbose: true,
    transform: {},
    forceExit: true,
    detectOpenHandles: true
  };