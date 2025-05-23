module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^cors$': '<rootDir>/src/__mocks__/cors.ts',
    '^morgan$': '<rootDir>/src/__mocks__/morgan.ts',
    '^helmet$': '<rootDir>/src/__mocks__/helmet.ts',
    '^swagger-jsdoc$': '<rootDir>/src/__mocks__/swagger-jsdoc.ts',
    '^swagger-ui-express$': '<rootDir>/src/__mocks__/swagger-ui-express.ts'
  },
  setupFilesAfterEnv: ['./jest.setup.js']
};
