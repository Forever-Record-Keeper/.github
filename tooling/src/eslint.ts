import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { frkPlugin } from './eslint-rules.ts';
import { DEFAULT_LAYOUT, testGlob, type Layout } from './layout.ts';
import { LIMITS } from './limits.ts';

/** The JavaScript files, such as config files. Type-aware rules skip them. */
export const JAVASCRIPT_FILES = ['**/*.js', '**/*.mjs', '**/*.cjs'];

export interface EslintOptions {
  /** The root folder of the repo, where its `tsconfig.json` is. */
  readonly rootDir: string;
  /** The folder layout of the repo. */
  readonly layout?: Layout;
}

/** Blank lines and comments don't count toward a length limit. */
const COUNT_CODE_ONLY = { skipBlankLines: true, skipComments: true };

/** The size and complexity rules of decision 0030. */
export const limitRules: Linter.RulesRecord = {
  complexity: ['error', { max: LIMITS.complexity }],
  'max-depth': ['error', { max: LIMITS.nestingDepth }],
  'max-params': 'off',
  '@typescript-eslint/max-params': ['error', { max: LIMITS.parameters }],
  'max-lines-per-function': 'off',
  'frk/max-lines-per-function': ['error', { max: LIMITS.functionLines }],
  'max-lines': ['error', { max: LIMITS.fileLines, ...COUNT_CODE_ONLY }],
};

/**
 * The rules for test files of decision 0030.
 * Tests sit in `describe` sections. The function length rule skips the section callbacks.
 */
export const testRules: Linter.RulesRecord = {
  'max-lines': ['error', { max: LIMITS.testFileLines, ...COUNT_CODE_ONLY }],
  'vitest/require-top-level-describe': 'error',
  'vitest/max-nested-describe': ['error', { max: LIMITS.testSectionDepth }],
  'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
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
      plugins: { frk: frkPlugin },
      rules: limitRules,
    },
    {
      files: [testGlob(layout)],
      extends: [vitest.configs.recommended],
      rules: testRules,
    },
    { files: JAVASCRIPT_FILES, extends: [tseslint.configs.disableTypeChecked] },
  );
}
