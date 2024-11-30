export default {
  testEnvironment: 'node',
  transform: {},
  setupFilesAfterEnv: ['./backend/__tests__/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  moduleDirectories: ['node_modules', 'backend'],
  testMatch: [
    '**/backend/__tests__/**/*.test.js'
  ],
  verbose: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/__tests__/**'
  ]
}
