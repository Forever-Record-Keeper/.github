import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT, type Layout } from './layout.ts';
import { LIMITS } from './limits.ts';
import { frkVitestConfig } from './vitest.ts';

describe('frkVitestConfig', () => {
  it('sets the coverage limit for lines and branches', () => {
    expect(frkVitestConfig().test?.coverage).toMatchObject({
      provider: 'v8',
      thresholds: { lines: LIMITS.coveragePercent, branches: LIMITS.coveragePercent },
    });
  });

  it('counts each source file and no test file', () => {
    const layout: Layout = { ...DEFAULT_LAYOUT, sourceDir: 'lib' };
    const config = frkVitestConfig(layout).test;
    expect(config?.include).toEqual(['lib/**/*.test.ts']);
    expect(config?.coverage).toMatchObject({
      include: ['lib/**/*.ts'],
      exclude: ['lib/**/*.test.ts'],
    });
  });
});
