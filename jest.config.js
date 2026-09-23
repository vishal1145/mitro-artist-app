/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // jest-expo's default transformIgnorePatterns already allowlists the core
  // RN/Expo scope, but this project pulls in a few extra untranspiled ESM
  // packages (SignalR, RN Firebase, RN Agora, toast-message, worklets) that
  // need to go through babel-jest too, or their `import`/`export` syntax
  // throws a SyntaxError under CommonJS.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo(nent)?' +
      '|@expo(-google-fonts)?' +
      '|@expo-google-fonts/.*' +
      '|expo-.*' +
      '|@expo/.*' +
      '|react-navigation' +
      '|@react-navigation/.*' +
      '|@microsoft/signalr' +
      '|@react-native-firebase/.*' +
      '|react-native-agora' +
      '|react-native-toast-message' +
      '|react-native-svg' +
      '|react-native-reanimated' +
      '|react-native-worklets' +
      '|react-native-gesture-handler' +
      '|react-native-safe-area-context' +
      '|react-native-screens' +
      '|nativewind' +
      '|react-native-css-interop' +
      ')/)',
  ],

  moduleNameMapper: {
    // Path aliases — must mirror babel.config.js's module-resolver + tsconfig paths.
    '^@components$': '<rootDir>/src/components',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@navigation$': '<rootDir>/src/navigation',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@screens$': '<rootDir>/src/screens',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@hooks$': '<rootDir>/src/hooks',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services$': '<rootDir>/src/services',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@store$': '<rootDir>/src/store',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@utils$': '<rootDir>/src/utils',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants$': '<rootDir>/src/constants',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@static$': '<rootDir>/src/static',
    '^@static/(.*)$': '<rootDir>/src/static/$1',
    '^@theme$': '<rootDir>/src/theme',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
    '^@app-types$': '<rootDir>/src/types',
    '^@app-types/(.*)$': '<rootDir>/src/types/$1',
    '^@assets$': '<rootDir>/assets',
    '^@assets/(.*)$': '<rootDir>/assets/$1',

    // Static assets — jest-expo already maps most image extensions to a stub,
    // but this project also imports .jpeg (mitro-logo.jpeg) and .css
    // (global.css, via nativewind) at module scope, neither of which
    // jest-expo's default asset mock list covers.
    '\\.(jpg|jpeg|png|gif|webp|bmp|ico|svg)$': '<rootDir>/test-utils/fileMock.js',
    '\\.(css)$': '<rootDir>/test-utils/styleMock.js',
  },

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'plugins/**/*.js',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    '!jest.setup.ts',
    '!test-utils/**',
    // Excluded — see TEST_PLAN.md "Excluded" section for the reason behind
    // each of these; kept in sync by hand whenever that section changes.
    '!src/types/**',
    '!src/constants/index.ts',
    '!src/store/index.ts',
    '!src/services/storage/index.ts',
    '!src/services/api/index.ts',
    '!src/theme/index.ts',
    '!src/utils/index.ts',
    '!src/components/live/index.ts',
    '!src/components/shared/index.ts',
    '!src/components/ui/index.ts',
  ],

  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],

  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/.expo/',
    '<rootDir>/.agent2-backup/',
  ],
};
