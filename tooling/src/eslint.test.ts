import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { errorRules, lines } from '../test/lint.ts';
import { frkEslintConfig, JAVASCRIPT_FILES, limitRules, testRules } from './eslint.ts';
import { DEFAULT_LAYOUT, testGlob } from './layout.ts';
import { LIMITS } from './limits.ts';

const TEST_FILE = 'src/fixture.test.ts';

/** The rules of a test file, as the config combines them. */
const testFileRules = { ...limitRules, ...testRules };

/** The rules of the config entries for the files, merged. */
function rulesFor(files: readonly string[]) {
  const entries = frkEslintConfig({ rootDir: '/repo' }).filter((entry) =>
    isDeepStrictEqual(entry.files, files),
  );
  return Object.fromEntries(entries.flatMap((entry) => Object.entries(entry.rules ?? {})));
}

describe('limitRules', () => {
  it('fails a function above the complexity limit', async () => {
    const branches = lines(LIMITS.complexity, '  if (a) { b(); }');
    const code = `function f(a: boolean, b: () => void) {\n${branches}\n}`;
    expect(await errorRules(code, limitRules)).toEqual(['complexity']);
  });

  it('passes a function at the complexity limit', async () => {
    const branches = lines(LIMITS.complexity - 1, '  if (a) { b(); }');
    const code = `function f(a: boolean, b: () => void) {\n${branches}\n}`;
    expect(await errorRules(code, limitRules)).toEqual([]);
  });

  it('fails a function above the parameter limit', async () => {
    const params = Array.from({ length: LIMITS.parameters + 1 }, (_, i) => `p${String(i)}: number`);
    expect(await errorRules(`function f(${params.join(', ')}) {}`, limitRules)).toEqual([
      '@typescript-eslint/max-params',
    ]);
  });

  it('fails a function above the nesting limit', async () => {
    const open = lines(LIMITS.nestingDepth + 1, 'if (a) {');
    const close = lines(LIMITS.nestingDepth + 1, '}');
    const code = `function f(a: boolean) {\n${open}\n${close}\n}`;
    expect(await errorRules(code, limitRules)).toEqual(['max-depth']);
  });

  it('fails a function above the length limit', async () => {
    const code = `function f(a: () => void) {\n${lines(LIMITS.functionLines, '  a();')}\n}`;
    expect(await errorRules(code, limitRules)).toEqual(['frk/max-lines-per-function']);
  });

  it('fails a file above the length limit', async () => {
    const code = lines(LIMITS.fileLines + 1, 'export const a = 1;');
    expect(await errorRules(code, limitRules)).toEqual(['max-lines']);
  });

  it('leaves out blank lines and comments from the file length', async () => {
    const code = lines(LIMITS.fileLines, 'export const a = 1;\n\n// note');
    expect(await errorRules(code, limitRules)).toEqual([]);
  });
});

describe('testRules', () => {
  /** A test file with 1 section of the number of code lines. */
  function sectionOf(codeLines: number): string {
    return `describe('name', () => {\n${lines(codeLines - 2, "  it('works', () => {});")}\n});`;
  }

  it('passes a test file at its own length limit', async () => {
    const code = sectionOf(LIMITS.testFileLines);
    expect(await errorRules(code, testFileRules, TEST_FILE)).toEqual([]);
  });

  it('fails a test file above its own length limit', async () => {
    const code = sectionOf(LIMITS.testFileLines + 1);
    expect(await errorRules(code, testFileRules, TEST_FILE)).toEqual(['max-lines']);
  });

  it('fails a test outside a section', async () => {
    expect(await errorRules("it('works', () => {});", testFileRules, TEST_FILE)).toEqual([
      'vitest/require-top-level-describe',
    ]);
  });

  it('fails sections nested deeper than the limit', async () => {
    const open = lines(LIMITS.testSectionDepth + 1, "describe('name', () => {");
    const close = lines(LIMITS.testSectionDepth + 1, '});');
    const code = `${open}\nit('works', () => {});\n${close}`;
    expect(await errorRules(code, testFileRules, TEST_FILE)).toEqual(['vitest/max-nested-describe']);
  });

  it('asks for `it` in place of `test` inside a section', async () => {
    const code = "describe('name', () => {\n  test('works', () => {});\n});";
    expect(await errorRules(code, testFileRules, TEST_FILE)).toEqual(['vitest/consistent-test-it']);
  });
});

describe('frkEslintConfig', () => {
  it('ignores the build folders', () => {
    const ignores = frkEslintConfig({ rootDir: '/repo' }).flatMap((entry) => entry.ignores ?? []);
    expect(ignores).toEqual(['dist/', 'coverage/', 'reports/', '.stryker-tmp/']);
  });

  it('reads the tsconfig of the root folder', () => {
    const config = frkEslintConfig({ rootDir: '/repo' });
    const options = config.map((entry) => entry.languageOptions?.['parserOptions']);
    expect(options).toContainEqual({ projectService: true, tsconfigRootDir: '/repo' });
  });

  it('turns type-aware rules off for JavaScript files', () => {
    expect(JAVASCRIPT_FILES).toEqual(['**/*.js', '**/*.mjs', '**/*.cjs']);
    expect(rulesFor(JAVASCRIPT_FILES)).toMatchObject({ '@typescript-eslint/await-thenable': 'off' });
  });

  it('adds the test rules and the Vitest rules for test files', () => {
    const rules = rulesFor([testGlob(DEFAULT_LAYOUT)]);
    expect(rules).toMatchObject(testRules);
    expect(rules).toMatchObject({ 'vitest/expect-expect': 'error' });
  });
});

describe('frkEslintConfig on the files of this package', () => {
  const rootDir = join(import.meta.dirname, '..');

  /** Lints the code as the content of a file of this package, with the full config. */
  async function fullConfigRules(code: string, file: string): Promise<(string | null)[]> {
    const overrideConfig = frkEslintConfig({ rootDir });
    const eslint = new ESLint({ cwd: rootDir, overrideConfigFile: true, overrideConfig });
    const [result] = await eslint.lintText(code, { filePath: join(rootDir, file) });
    return result?.messages.map((message) => message.ruleId) ?? [];
  }

  it('checks the function length in a source file', async () => {
    const code = `export function f(a: () => void): void {\n${lines(LIMITS.functionLines, '  a();')}\n}\n`;
    expect(await fullConfigRules(code, 'src/limits.ts')).toEqual(['frk/max-lines-per-function']);
  });

  it('checks the sections in a test file', async () => {
    const code = "import { expect, it } from 'vitest';\n\nit('works', () => {\n  expect(1).toBe(1);\n});\n";
    expect(await fullConfigRules(code, 'src/layout.test.ts')).toEqual([
      'vitest/require-top-level-describe',
    ]);
  });
});
