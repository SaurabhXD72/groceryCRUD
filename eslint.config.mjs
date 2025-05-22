import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintJs from '@eslint/js';

export default [
  {
    languageOptions: { globals: globals.node },
  },
  eslintJs.configs.recommended, // Correct way to include eslint:recommended
  ...tseslint.configs.recommended,
];
