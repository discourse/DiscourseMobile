import ftFlow from 'eslint-plugin-ft-flow';
import hermesEslint from 'hermes-eslint';
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      parser: hermesEslint,
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      'ft-flow': ftFlow,
    },
    rules: {
      'no-undef': 'warn',
    },
  },
  { ignores: ['lib/*', 'react-native.config.js', '.*', '*.config.js'] },
];
