// ESLint — strict rules enforcing the project's non-negotiable standards:
// no `any`, no console.log (logger only), no inline styles.
module.exports = {
  root: true,
  extends: ['expo', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // --- Absolute rule: never use `any` ---
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'off',

    // --- Absolute rule: only the logger utility may write to the console ---
    'no-console': 'error',

    // --- Absolute rule: no inline styles, no color literals in JSX ---
    'react-native/no-inline-styles': 'error',
    'react-native/no-color-literals': 'error',
    'react-native/no-single-element-style-arrays': 'error',

    // --- Code hygiene ---
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'babel.config.js',
    'metro.config.js',
    'tailwind.config.js',
    '.eslintrc.js',
  ],
};
