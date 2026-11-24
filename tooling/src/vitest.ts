import { defineConfig, type ViteUserConfig } from 'vitest/config';
import { DEFAULT_LAYOUT, sourceGlob, testGlob, type Layout } from './layout.ts';
import { LIMITS } from './limits.ts';

/** The shared Vitest config: tests next to the code, and the coverage limits. */
export function frkVitestConfig(layout: Layout = DEFAULT_LAYOUT): ViteUserConfig {
  return defineConfig({
    test: {
      include: [testGlob(layout)],
      coverage: {
        provider: 'v8',
        include: [sourceGlob(layout)],
        exclude: [testGlob(layout)],
        thresholds: { lines: LIMITS.coveragePercent, branches: LIMITS.coveragePercent },
      },
    },
  });
}
