import type { PartialStrykerOptions } from '@stryker-mutator/api/core';
import { DEFAULT_LAYOUT, sourceGlob, testGlob, type Layout } from './layout.ts';
import { LIMITS } from './limits.ts';

/**
 * The plugins of the test runner and the checker.
 * pnpm keeps each package apart, so Stryker needs their names to load them.
 */
const STRYKER_PLUGINS = ['@stryker-mutator/vitest-runner', '@stryker-mutator/typescript-checker'];

/**
 * The shared Stryker config.
 * The mutation command of the CLI replaces `mutate` with the changed files.
 */
export function frkStrykerConfig(layout: Layout = DEFAULT_LAYOUT): PartialStrykerOptions {
  return {
    plugins: STRYKER_PLUGINS,
    testRunner: 'vitest',
    checkers: ['typescript'],
    tsconfigFile: layout.tsconfigFile,
    coverageAnalysis: 'perTest',
    mutate: [sourceGlob(layout), `!${testGlob(layout)}`],
    reporters: ['clear-text', 'progress'],
    thresholds: {
      high: LIMITS.mutationScorePercent,
      low: LIMITS.mutationScorePercent,
      break: LIMITS.mutationScorePercent,
    },
  };
}
