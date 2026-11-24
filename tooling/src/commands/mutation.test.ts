import { describe, expect, it } from 'vitest';
import { fakeDeps } from '../../test/fake-deps.ts';
import { baseRefOf, mutation, MUTATION_USAGE, NOTHING_TO_MUTATE } from './mutation.ts';
import { EXIT } from './types.ts';

describe('baseRefOf', () => {
  it.each([
    [['--base', 'origin/main'], 'origin/main'],
    [['--base=main'], 'main'],
  ])('reads the ref from %j', (args, expected) => {
    expect(baseRefOf(args)).toBe(expected);
  });

  it.each([[['--base', '']], [['--base']], [[]]])('returns undefined for %j', (args) => {
    expect(baseRefOf(args)).toBeUndefined();
  });
});

describe('mutation', () => {
  it('shows the usage without a base ref', async () => {
    const deps = fakeDeps();
    expect(await mutation([], deps)).toBe(EXIT.usage);
    expect(deps.lines).toEqual([MUTATION_USAGE]);
  });

  it('passes when no source file changed', async () => {
    const deps = fakeDeps({ changed: ['README.md', 'src/cli.test.ts'] });
    expect(await mutation(['--base', 'main'], deps)).toBe(EXIT.ok);
    expect(deps.lines).toEqual([NOTHING_TO_MUTATE]);
    expect(deps.toolCalls).toEqual([]);
  });

  it('runs Stryker on the changed source files only', async () => {
    const changed = ['src/a.ts', 'src/a.test.ts', 'docs/b.ts', 'src/c/d.ts'];
    const deps = fakeDeps({ changed, toolExitCode: EXIT.failure });
    expect(await mutation(['--base', 'main'], deps)).toBe(EXIT.failure);
    expect(deps.toolCalls).toEqual([
      { tool: 'stryker', args: ['run', '--mutate', 'src/a.ts,src/c/d.ts'] },
    ]);
  });
});
