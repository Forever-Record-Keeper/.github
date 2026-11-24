import { expect, test } from 'vitest';
import { DEFAULT_LAYOUT, isProductionSource, sourceGlob, testGlob } from './layout.ts';

test('the default layout keeps sources and tests in src', () => {
  expect(DEFAULT_LAYOUT).toEqual({
    sourceDir: 'src',
    sourceExtension: '.ts',
    testSuffix: '.test.ts',
    ignoredDirs: ['dist', 'coverage', 'reports', '.stryker-tmp'],
    tsconfigFile: 'tsconfig.json',
  });
});

test('sourceGlob covers every source file in the source folder', () => {
  expect(sourceGlob(DEFAULT_LAYOUT)).toBe('src/**/*.ts');
});

test('testGlob covers every test file in the source folder', () => {
  expect(testGlob(DEFAULT_LAYOUT)).toBe('src/**/*.test.ts');
});

test.each([
  ['src/cli.ts', true],
  ['src/commands/mutation.ts', true],
  ['src/cli.test.ts', false],
  ['lib/cli.ts', false],
  ['source/cli.ts', false],
  ['srcx/cli.ts', false],
  ['src/readme.md', false],
])('isProductionSource(%s) is %s', (path, expected) => {
  expect(isProductionSource(path, DEFAULT_LAYOUT)).toBe(expected);
});
