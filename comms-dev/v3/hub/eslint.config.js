import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    rules: {
      'sonarjs/cognitive-complexity': ['warn', 15],
      'max-depth': ['warn', 4],
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      'sonarjs/os-command': 'off',
      'sonarjs/pseudo-random': 'off',
    },
  },
  { ignores: ['node_modules/', 'dist/'] },
);
