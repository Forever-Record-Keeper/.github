import eslint from '@eslint/js';
import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { DEFAULT_LAYOUT, type Layout } from './layout.ts';
import { LIMITS } from './limits.ts';

/** The JavaScript files, such as config files. Type-aware rules skip them. */
export const JAVASCRIPT_FILES = ['**/*.js', '**/*.mjs', '**/*.cjs'];

export interface EslintOptions {
  /** The root folder of the repo, where its `tsconfig.json` is. */
  readonly rootDir: string;
  /** The folder layout of the repo. */
  readonly layout?: Layout;
}

/** The size and complexity rules of decision 0009. */
export const limitRules: Linter.RulesRecord = {
  complexity: ['error', { max: LIMITS.complexity }],
  'max-depth': ['error', { max: LIMITS.nestingDepth }],
  'max-params': 'off',
  '@typescript-eslint/max-params': ['error', { max: LIMITS.parameters }],
  'max-lines-per-function': [
    'error',
    { max: LIMITS.functionLines, skipBlankLines: true, skipComments: true },
  ],
  'max-lines': ['error', { max: LIMITS.fileLines, skipBlankLines: true, skipComments: true }],
};

/** The shared ESLint config: strict type-checked rules plus the limits. */
export function frkEslintConfig(options: EslintOptions): Linter.Config[] {
  const layout = options.layout ?? DEFAULT_LAYOUT;
  return defineConfig(
    { ignores: layout.ignoredDirs.map((dir) => `${dir}/`) },
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir: options.rootDir },
      },
      rules: limitRules,
    },
    { files: JAVASCRIPT_FILES, extends: [tseslint.configs.disableTypeChecked] },
  );
}
