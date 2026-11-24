import { expect, test } from 'vitest';
import { DEFAULT_LAYOUT, type Layout } from './layout.ts';
import { LIMITS } from './limits.ts';
import { frkVitestConfig } from './vitest.ts';

test('frkVitestConfig sets the coverage limits of decision 0009', () => {
  const coverage = frkVitestConfig().test?.coverage;
  expect(coverage).toMatchObject({
    provider: 'v8',
    thresholds: { lines: LIMITS.coveragePercent, branches: LIMITS.coveragePercent },
  });
});

test('frkVitestConfig counts all source files and no test files', () => {
  const layout: Layout = { ...DEFAULT_LAYOUT, sourceDir: 'lib' };
  const config = frkVitestConfig(layout).test;
  expect(config?.include).toEqual(['lib/**/*.test.ts']);
  expect(config?.coverage).toMatchObject({
    include: ['lib/**/*.ts'],
    exclude: ['lib/**/*.test.ts'],
  });
});
