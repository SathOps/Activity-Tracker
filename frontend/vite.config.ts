/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vite-plus';
import { loadEnv } from 'vite-plus';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mode = process.env.MODE || process.env.NODE_ENV || 'development';
const env = loadEnv(mode, process.cwd(), '');
const corpusToken = env.CORPUS_TOKEN || '';
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const swechaApiBaseUrl =
  env.SWECHA_API_BASE_URL ||
  env.VITE_SWECHA_API_BASE_URL ||
  'https://api.corpus.swecha.org';

export default defineConfig({
  resolve: {
    alias: {
      '@tanstack/react-query': path.resolve(
        rootDir,
        'src/shims/react-query.ts'
      ),
      'lucide-react': path.resolve(rootDir, 'src/shims/lucide-react.tsx'),
      'react-hot-toast': path.resolve(rootDir, 'src/shims/react-hot-toast.tsx'),
    },
  },
  staged: {
    '*': 'vp check --fix',
  },
  lint: {
    plugins: ['oxc', 'typescript', 'unicorn', 'react'],
    categories: {
      correctness: 'warn',
    },
    env: {
      builtin: true,
    },
    ignorePatterns: [
      'dist',
      'build',
      'builds',
      'cache',
      'coverage',
      'node_modules',
      'vite.config.js',
      'vite.config.d.ts',
      'src/index.css',
      'src/styles.css',
    ],
    overrides: [
      {
        files: [
          'src/**/*.{js,jsx,ts,tsx}',
          'scripts/**/*.{js,mjs,cjs,ts}',
          'tests/**/*.{js,jsx,ts,tsx}',
          '*.config.{js,mjs,cjs,ts}',
        ],
        rules: {
          'constructor-super': 'error',
          'for-direction': 'error',
          'getter-return': 'error',
          'no-async-promise-executor': 'error',
          'no-case-declarations': 'error',
          'no-class-assign': 'error',
          'no-compare-neg-zero': 'error',
          'no-cond-assign': 'error',
          'no-const-assign': 'error',
          'no-constant-binary-expression': 'error',
          'no-constant-condition': 'error',
          'no-control-regex': 'error',
          'no-debugger': 'error',
          'no-delete-var': 'error',
          'no-dupe-class-members': 'error',
          'no-dupe-else-if': 'error',
          'no-dupe-keys': 'error',
          'no-duplicate-case': 'error',
          'no-empty': 'error',
          'no-empty-character-class': 'error',
          'no-empty-pattern': 'error',
          'no-empty-static-block': 'error',
          'no-ex-assign': 'error',
          'no-extra-boolean-cast': 'error',
          'no-fallthrough': 'error',
          'no-func-assign': 'error',
          'no-global-assign': 'error',
          'no-import-assign': 'error',
          'no-invalid-regexp': 'error',
          'no-irregular-whitespace': 'error',
          'no-loss-of-precision': 'error',
          'no-misleading-character-class': 'error',
          'no-new-native-nonconstructor': 'error',
          'no-nonoctal-decimal-escape': 'error',
          'no-obj-calls': 'error',
          'no-prototype-builtins': 'error',
          'no-redeclare': 'error',
          'no-regex-spaces': 'error',
          'no-self-assign': 'error',
          'no-setter-return': 'error',
          'no-shadow-restricted-names': 'error',
          'no-sparse-arrays': 'error',
          'no-this-before-super': 'error',
          'no-undef': 'off',
          'no-unexpected-multiline': 'error',
          'no-unreachable': 'error',
          'no-unsafe-finally': 'error',
          'no-unsafe-negation': 'error',
          'no-unsafe-optional-chaining': 'error',
          'no-unused-labels': 'error',
          'no-unused-private-class-members': 'error',
          'no-unused-vars': [
            'warn',
            {
              argsIgnorePattern: '^_',
              varsIgnorePattern: '^_',
            },
          ],
          'no-useless-backreference': 'error',
          'no-useless-catch': 'error',
          'no-useless-escape': 'error',
          'no-with': 'error',
          'require-yield': 'error',
          'use-isnan': 'error',
          'valid-typeof': 'error',
          '@typescript-eslint/ban-ts-comment': 'error',
          'no-array-constructor': 'error',
          '@typescript-eslint/no-duplicate-enum-values': 'error',
          '@typescript-eslint/no-empty-object-type': 'error',
          '@typescript-eslint/no-explicit-any': 'error',
          '@typescript-eslint/no-extra-non-null-assertion': 'error',
          '@typescript-eslint/no-misused-new': 'error',
          '@typescript-eslint/no-namespace': 'error',
          '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
          '@typescript-eslint/no-require-imports': 'error',
          '@typescript-eslint/no-this-alias': 'error',
          '@typescript-eslint/no-unnecessary-type-constraint': 'error',
          '@typescript-eslint/no-unsafe-declaration-merging': 'error',
          '@typescript-eslint/no-unsafe-function-type': 'error',
          'no-unused-expressions': 'error',
          '@typescript-eslint/no-wrapper-object-types': 'error',
          '@typescript-eslint/prefer-as-const': 'error',
          '@typescript-eslint/prefer-namespace-keyword': 'error',
          '@typescript-eslint/triple-slash-reference': 'error',
          'react/display-name': 'error',
          'react/jsx-key': 'error',
          'react/jsx-no-comment-textnodes': 'error',
          'react/jsx-no-duplicate-props': 'error',
          'react/jsx-no-target-blank': 'error',
          'react/jsx-no-undef': 'error',
          'react/no-children-prop': 'error',
          'react/no-danger-with-children': 'error',
          'react/no-direct-mutation-state': 'error',
          'react/no-find-dom-node': 'error',
          'react/no-is-mounted': 'error',
          'react/no-render-return-value': 'error',
          'react/no-string-refs': 'error',
          'react/no-unescaped-entities': 'error',
          'react/no-unknown-property': 'error',
          'react/no-unsafe': 'off',
          'react/react-in-jsx-scope': 'off',
          'react/require-render-return': 'error',
          'jsx-a11y/alt-text': 'error',
          'jsx-a11y/anchor-ambiguous-text': 'off',
          'jsx-a11y/anchor-has-content': 'error',
          'jsx-a11y/anchor-is-valid': 'error',
          'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
          'jsx-a11y/aria-props': 'error',
          'jsx-a11y/aria-proptypes': 'error',
          'jsx-a11y/aria-role': 'error',
          'jsx-a11y/aria-unsupported-elements': 'error',
          'jsx-a11y/autocomplete-valid': 'error',
          'jsx-a11y/click-events-have-key-events': 'error',
          'jsx-a11y/heading-has-content': 'error',
          'jsx-a11y/html-has-lang': 'error',
          'jsx-a11y/iframe-has-title': 'error',
          'jsx-a11y/img-redundant-alt': 'error',
          'jsx-a11y/label-has-associated-control': 'error',
          'jsx-a11y/media-has-caption': 'error',
          'jsx-a11y/mouse-events-have-key-events': 'error',
          'jsx-a11y/no-access-key': 'error',
          'jsx-a11y/no-autofocus': 'error',
          'jsx-a11y/no-distracting-elements': 'error',
          'jsx-a11y/no-noninteractive-tabindex': [
            'error',
            {
              tags: [],
              roles: ['tabpanel'],
              allowExpressionValues: true,
            },
          ],
          'jsx-a11y/no-redundant-roles': 'error',
          'jsx-a11y/no-static-element-interactions': [
            'error',
            {
              allowExpressionValues: true,
              handlers: [
                'onClick',
                'onMouseDown',
                'onMouseUp',
                'onKeyPress',
                'onKeyDown',
                'onKeyUp',
              ],
            },
          ],
          'jsx-a11y/role-has-required-aria-props': 'error',
          'jsx-a11y/role-supports-aria-props': 'error',
          'jsx-a11y/scope': 'error',
          'jsx-a11y/tabindex-no-positive': 'error',
          'react-hooks/rules-of-hooks': 'error',
          'react-hooks/exhaustive-deps': 'warn',
        },
        globals: {
          AudioWorkletGlobalScope: 'readonly',
          AudioWorkletProcessor: 'readonly',
          currentFrame: 'readonly',
          currentTime: 'readonly',
          registerProcessor: 'readonly',
          sampleRate: 'readonly',
          WorkletGlobalScope: 'readonly',
        },
        env: {
          es2026: true,
          browser: true,
          node: true,
        },
        plugins: ['jsx-a11y'],
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 80,
    sortPackageJson: false,
  },
  test: {
    include: [
      'tests/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      ...configDefaults.exclude,
      'builds/**',
      'dist/**',
      'coverage/**',
      'cache/**',
    ],
    coverage: {
      reporter: ['text', 'cobertura', 'html'],
      provider: 'v8',
      include: [
        'src/modules/**/*.ts',
        'src/services/**/*.ts',
        'src/store/**/*.ts',
        'src/utils/**/*.ts',
      ],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/index.ts'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: swechaApiBaseUrl,
        changeOrigin: true,
        secure: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configure: (proxy: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          proxy.on('proxyReq', (proxyReq: any, req: any) => {
            const requestAuthHeader = proxyReq.getHeader('authorization');
            const requestPath = req.url || '';
            const isAuthRoute = requestPath.startsWith('/api/v1/auth/');

            if (!requestAuthHeader && corpusToken && !isAuthRoute) {
              proxyReq.setHeader('Authorization', `Bearer ${corpusToken}`);
            }
          });
        },
      },
    },
  },
});
