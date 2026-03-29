import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ignores: [
      'dist',
      'build',
      'builds',
      'cache',
      'coverage',
      'node_modules',
      'vite.config.js',
      'vite.config.d.ts',
    ],
  },
  {
    files: [
      'src/**/*.{js,jsx,ts,tsx}',
      'scripts/**/*.{js,mjs,cjs,ts}',
      'tests/**/*.{js,jsx,ts,tsx}',
      '*.config.{js,mjs,cjs,ts}',
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // Base JS recommended rules
      ...js.configs.recommended.rules,

      // TypeScript recommended rules
      ...tsPlugin.configs.recommended.rules,

      // React + JSX rules
      ...reactPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,

      // React hooks rules
      ...reactHooksPlugin.configs.recommended.rules,

      // Project-specific tweaks
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // TypeScript handles undefined checks; avoid false positives
      'no-undef': 'off',

      // Prettier formatting as ESLint rule
      'prettier/prettier': 'error',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
