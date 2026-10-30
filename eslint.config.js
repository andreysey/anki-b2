// ESLint: correctness rules only — formatting is Prettier's job (eslint-config-prettier).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', '.audit/**', 'node_modules/**', 'public/**', 'anki/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } }
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, __APP_VERSION__: 'readonly' }
    },
    rules: {
      curly: ['error', 'multi-line'],
      eqeqeq: ['error', 'smart'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      // Optional TS props (`foo?: string`) are fine without a runtime default
      'vue/require-default-prop': 'off',
      // v-html is allowed only through sanitizeHtml/sanitizeAiHtml — enforced by `npm run health:check`
      'vue/no-v-html': 'off'
    }
  },
  {
    // shadcn primitives (Button, Badge…) and the root App component use single-word names
    files: ['src/components/ui/**/*.vue', 'src/App.vue'],
    rules: { 'vue/multi-word-component-names': 'off' }
  },
  {
    // Tests may use `any` for mocks of browser APIs
    files: ['**/*.test.ts', 'src/test-utils/**', 'src/test-setup.ts', 'vitest.setup.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' }
  },
  prettier
);
