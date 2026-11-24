import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT, isProductionSource, sourceGlob, testGlob } from './layout.ts';

describe('DEFAULT_LAYOUT', () => {
  it('keeps sources and tests in src', () => {
    expect(DEFAULT_LAYOUT).toEqual({
      sourceDir: 'src',
      sourceExtension: '.ts',
      testSuffix: '.test.ts',
      ignoredDirs: ['dist', 'coverage', 'reports', '.stryker-tmp'],
      tsconfigFile: 'tsconfig.json',
    });
  });
});

describe('sourceGlob', () => {
  it('covers each source file in the source folder', () => {
    expect(sourceGlob(DEFAULT_LAYOUT)).toBe('src/**/*.ts');
  });
});

describe('testGlob', () => {
  it('covers each test file in the source folder', () => {
    expect(testGlob(DEFAULT_LAYOUT)).toBe('src/**/*.test.ts');
  });
});

describe('isProductionSource', () => {
  it.each(['src/cli.ts', 'src/commands/mutation.ts'])('accepts %s', (path) => {
    expect(isProductionSource(path, DEFAULT_LAYOUT)).toBe(true);
  });

  it.each(['src/cli.test.ts', 'lib/cli.ts', 'source/cli.ts', 'srcx/cli.ts', 'src/readme.md'])(
    'rejects %s',
    (path) => {
      expect(isProductionSource(path, DEFAULT_LAYOUT)).toBe(false);
    },
  );
});
