import { describe, expect, it } from 'vitest';
import { fakeDeps } from '../../test/fake-deps.ts';
import { LIMITS } from '../limits.ts';
import { duplication, DUPLICATION_USAGE, jscpdArgs } from './duplication.ts';
import { EXIT } from './types.ts';

describe('jscpdArgs', () => {
  it('fails on each clone of the token limit or more, and on no files', () => {
    expect(jscpdArgs(['src'], ['dist']).slice(0, 4)).toEqual([
      '--min-tokens',
      String(LIMITS.duplicateTokens),
      `--exit-code=${String(EXIT.failure)}`,
      '--fail-on-empty',
    ]);
  });

  it('skips the ignored folders and checks the paths', () => {
    expect(jscpdArgs(['src', 'test'], ['dist', 'coverage']).slice(-6)).toEqual([
      '--reporters',
      'console',
      '--ignore',
      '**/dist/**,**/coverage/**',
      'src',
      'test',
    ]);
  });
});

describe('duplication', () => {
  it('shows the usage without a path', async () => {
    const deps = fakeDeps();
    expect(await duplication([], deps)).toBe(EXIT.usage);
    expect(deps.lines).toEqual([DUPLICATION_USAGE]);
    expect(deps.toolCalls).toEqual([]);
  });

  it('runs jscpd and returns its exit code', async () => {
    const deps = fakeDeps({ toolExitCode: EXIT.failure });
    expect(await duplication(['src'], deps)).toBe(EXIT.failure);
    expect(deps.toolCalls).toEqual([
      { tool: 'jscpd', args: jscpdArgs(['src'], deps.layout.ignoredDirs) },
    ]);
  });
});
