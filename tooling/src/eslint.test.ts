import { isDeepStrictEqual } from 'node:util';
import { ESLint, type Linter } from 'eslint';
import { expect, test } from 'vitest';
import tseslint from 'typescript-eslint';
import { frkEslintConfig, JAVASCRIPT_FILES, limitRules } from './eslint.ts';
import { DEFAULT_LAYOUT } from './layout.ts';
import { LIMITS } from './limits.ts';

/** Lints the code with the limit rules only, and returns the rules that report an error. */
async function limitMessages(code: string): Promise<(string | null)[]> {
  const config: Linter.Config = {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: limitRules,
  };
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
  const [result] = await eslint.lintText(code, { filePath: 'fixture.ts' });
  const errors = result?.messages.filter((message) => message.severity === ERROR) ?? [];
  return errors.map((message) => message.ruleId);
}

/** The severity of an ESLint error. */
const ERROR = 2;

function lines(count: number, line: string): string {
  return Array.from({ length: count }, () => line).join('\n');
}

test('the complexity rule fails above the limit', async () => {
  const branches = lines(LIMITS.complexity, '  if (a) { b(); }');
  const code = `function f(a: boolean, b: () => void) {\n${branches}\n}`;
  expect(await limitMessages(code)).toEqual(['complexity']);
});

test('the complexity rule passes at the limit', async () => {
  const branches = lines(LIMITS.complexity - 1, '  if (a) { b(); }');
  const code = `function f(a: boolean, b: () => void) {\n${branches}\n}`;
  expect(await limitMessages(code)).toEqual([]);
});

test('the parameter rule fails above the limit', async () => {
  const params = Array.from({ length: LIMITS.parameters + 1 }, (_, i) => `p${String(i)}: number`);
  expect(await limitMessages(`function f(${params.join(', ')}) {}`)).toEqual([
    '@typescript-eslint/max-params',
  ]);
});

test('the nesting rule fails above the limit', async () => {
  const open = lines(LIMITS.nestingDepth + 1, 'if (a) {');
  const close = lines(LIMITS.nestingDepth + 1, '}');
  expect(await limitMessages(`function f(a: boolean) {\n${open}\n${close}\n}`)).toEqual([
    'max-depth',
  ]);
});

test('the function length rule ignores blank lines and comments', async () => {
  const body = lines(LIMITS.functionLines - 2, '  a();');
  const padding = `${lines(LIMITS.functionLines, '')}\n${lines(LIMITS.functionLines, '  // note')}`;
  expect(await limitMessages(`function f(a: () => void) {\n${body}\n${padding}\n}`)).toEqual([]);
});

test('the function length rule fails above the limit', async () => {
  const body = lines(LIMITS.functionLines, '  a();');
  expect(await limitMessages(`function f(a: () => void) {\n${body}\n}`)).toEqual([
    'max-lines-per-function',
  ]);
});

test('the file length rule fails above the limit', async () => {
  expect(await limitMessages(lines(LIMITS.fileLines + 1, 'export const a = 1;'))).toContain(
    'max-lines',
  );
});

test('the file length rule ignores blank lines and comments', async () => {
  const code = lines(LIMITS.fileLines, 'export const a = 1;\n\n// note');
  expect(await limitMessages(code)).toEqual([]);
});

test('the JavaScript globs cover all module kinds', () => {
  expect(JAVASCRIPT_FILES).toEqual(['**/*.js', '**/*.mjs', '**/*.cjs']);
});

test('frkEslintConfig ignores the build folders and sets the root folder', () => {
  const config = frkEslintConfig({ rootDir: '/repo' });
  const ignores = config.flatMap((entry) => entry.ignores ?? []);
  expect(ignores).toEqual(DEFAULT_LAYOUT.ignoredDirs.map((dir) => `${dir}/`));
  const options = config.map((entry) => entry.languageOptions?.['parserOptions']);
  expect(options).toContainEqual({ projectService: true, tsconfigRootDir: '/repo' });
});

test('frkEslintConfig turns type-aware rules off for JavaScript files', () => {
  const config = frkEslintConfig({ rootDir: '/repo' });
  const jsEntries = config.filter((entry) => isDeepStrictEqual(entry.files, JAVASCRIPT_FILES));
  const jsRules = Object.fromEntries(jsEntries.flatMap((entry) => Object.entries(entry.rules ?? {})));
  expect(jsRules).toMatchObject({ '@typescript-eslint/await-thenable': 'off' });
});
