import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT } from './layout.ts';
import { LIMITS } from './limits.ts';
import { frkStrykerConfig } from './stryker.ts';

describe('frkStrykerConfig', () => {
  it('runs Vitest and the type checker, with the mutation limit', () => {
    const limit = LIMITS.mutationScorePercent;
    expect(frkStrykerConfig()).toEqual({
      plugins: ['@stryker-mutator/vitest-runner', '@stryker-mutator/typescript-checker'],
      testRunner: 'vitest',
      checkers: ['typescript'],
      tsconfigFile: 'tsconfig.json',
      coverageAnalysis: 'perTest',
      mutate: ['src/**/*.ts', '!src/**/*.test.ts'],
      reporters: ['clear-text', 'progress'],
      thresholds: { high: limit, low: limit, break: limit },
    });
  });

  it('follows the layout of the repo', () => {
    const layout = { ...DEFAULT_LAYOUT, sourceDir: 'lib', tsconfigFile: 'tsconfig.lib.json' };
    expect(frkStrykerConfig(layout)).toMatchObject({
      mutate: ['lib/**/*.ts', '!lib/**/*.test.ts'],
      tsconfigFile: 'tsconfig.lib.json',
    });
  });
});
