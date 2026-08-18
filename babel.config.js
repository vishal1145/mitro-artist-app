/** @type {import('@babel/core').ConfigFunction} */
module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@components': './src/components',
            '@navigation': './src/navigation',
            '@screens': './src/screens',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@store': './src/store',
            '@utils': './src/utils',
            '@constants': './src/constants',
            '@static': './src/static',
            '@theme': './src/theme',
            // NOTE: not '@types' — TypeScript reserves that for ambient
            // declaration packages, which breaks `import type` (TS6137).
            '@app-types': './src/types',
            '@assets': './assets',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      // Reanimated 4 uses the worklets plugin, which MUST be listed last.
      'react-native-worklets/plugin',
    ],
  };
};
