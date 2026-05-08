const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  rootDir: '.',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/.claude/worktrees/'],
  coveragePathIgnorePatterns: [
    '<rootDir>/lib/supabase.js',
    '<rootDir>/lib/procedureLibrary.js',
    '<rootDir>/lib/hseGuidance.js',
  ],
});
