const nodePlugin = require('eslint-plugin-node');
const securityPlugin = require('eslint-plugin-security');

module.exports = [
  // Base configuration for all JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
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
      },
    },
    plugins: {
      node: nodePlugin,
      security: securityPlugin,
    },
    rules: {
      // ESLint recommended rules (manually specified for compatibility)
      'constructor-super': 'error',
      'for-direction': 'error',
      'getter-return': 'error',
      'no-async-promise-executor': 'error',
      'no-case-declarations': 'error',
      'no-class-assign': 'error',
      'no-compare-neg-zero': 'error',
      'no-cond-assign': 'error',
      'no-const-assign': 'error',
      'no-constant-condition': 'error',
      'no-control-regex': 'error',
      'no-debugger': 'error',
      'no-delete-var': 'error',
      'no-dupe-args': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'error',
      'no-empty-character-class': 'error',
      'no-empty-pattern': 'error',
      'no-ex-assign': 'error',
      'no-extra-boolean-cast': 'error',
      'no-extra-semi': 'error',
      'no-fallthrough': 'error',
      'no-func-assign': 'error',
      'no-global-assign': 'error',
      'no-import-assign': 'error',
      'no-inner-declarations': 'error',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'error',
      'no-loss-of-precision': 'error',
      'no-misleading-character-class': 'error',
      'no-mixed-spaces-and-tabs': 'error',
      'no-new-symbol': 'error',
      'no-nonoctal-decimal-escape': 'error',
      'no-obj-calls': 'error',
      'no-octal': 'error',
      'no-prototype-builtins': 'error',
      'no-redeclare': 'error',
      'no-regex-spaces': 'error',
      'no-self-assign': 'error',
      'no-setter-return': 'error',
      'no-shadow-restricted-names': 'error',
      'no-sparse-arrays': 'error',
      'no-this-before-super': 'error',
      'no-undef': 'error',
      'no-unexpected-multiline': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-unused-labels': 'error',
      'no-useless-backreference': 'error',
      'no-useless-catch': 'error',
      'no-useless-escape': 'error',
      'no-with': 'error',
      'require-yield': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // Custom rules
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-process-exit': 'warn',

      // Node plugin rules
      'node/no-unpublished-require': 'off',
      'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],

      // Security plugin rules
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
    },
  },

  // Configuration for test files
  {
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
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
      'node/no-unsupported-features/es-syntax': 'off', // Allow modern ES features in tests
      'security/detect-object-injection': 'off', // Disable for test files
    },
  },

  // Configuration for server startup file
  {
    files: ['server.js'],
    rules: {
      'no-console': 'off', // Allow console in server startup file
      'no-process-exit': 'off', // Allow process.exit in server error handling
    },
  },

  // Configuration for config, middleware, and utility files
  {
    files: ['src/config/**/*.js', 'src/middleware/**/*.js', 'src/utils/**/*.js'],
    rules: {
      'no-console': 'off', // Allow console in config, middleware, and utility files
      'security/detect-non-literal-fs-filename': 'off', // Allow dynamic file paths in utilities
      'security/detect-object-injection': 'off', // Allow object property access in utilities
    },
  },

  // Configuration for model files
  {
    files: ['src/models/**/*.js'],
    rules: {
      'security/detect-object-injection': 'off', // Allow object property access in models
    },
  },

  // Configuration for script files
  {
    files: ['scripts/**/*.js'],
    rules: {
      'node/no-missing-require': 'off', // Allow dynamic requires in scripts
      'security/detect-object-injection': 'off', // Allow object property access in scripts
    },
  },

  // Configuration for database utility files
  {
    files: ['src/db/**/*.js'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off', // Allow dynamic file paths in DB utilities
    },
  },

  // Global ignores
  {
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
];
