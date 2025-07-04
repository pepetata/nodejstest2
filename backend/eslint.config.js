import eslint from '@eslint/js';
import eslintPluginNode from 'eslint-plugin-node';
import eslintPluginSecurity from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      node: eslintPluginNode,
      security: eslintPluginSecurity,
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
      'node/no-unpublished-require': 'off',
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'no-process-exit': 'warn',
    },
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      '.env',
      '.env.*',
      '!.env.example',
      'logs/',
      '*.log',
      '.DS_Store',
    ],
  },
  // Jest test files configuration
  {
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        // Jest globals
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'node/no-unpublished-require': 'off',
    },
  },
  prettierConfig,
];
