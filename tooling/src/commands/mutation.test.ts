import { expect, test } from 'vitest';
import { fakeDeps } from '../../test/fake-deps.ts';
import { baseRefOf, mutation, MUTATION_USAGE, NOTHING_TO_MUTATE } from './mutation.ts';
import { EXIT } from './types.ts';

test.each([
  [['--base', 'origin/main'], 'origin/main'],
  [['--base=main'], 'main'],
  [['--base', ''], undefined],
  [['--base'], undefined],
  [[], undefined],
])('baseRefOf(%j) is %s', (args, expected) => {
  expect(baseRefOf(args)).toBe(expected);
});

test('mutation shows the usage without a base ref', async () => {
  const deps = fakeDeps();
  expect(await mutation([], deps)).toBe(EXIT.usage);
  expect(deps.lines).toEqual([MUTATION_USAGE]);
});

test('mutation passes when no source file changed', async () => {
  const deps = fakeDeps({ changed: ['README.md', 'src/cli.test.ts'] });
  expect(await mutation(['--base', 'main'], deps)).toBe(EXIT.ok);
  expect(deps.lines).toEqual([NOTHING_TO_MUTATE]);
  expect(deps.toolCalls).toEqual([]);
});

test('mutation runs Stryker on the changed source files only', async () => {
  const changed = ['src/a.ts', 'src/a.test.ts', 'docs/b.ts', 'src/c/d.ts'];
  const deps = fakeDeps({ changed, toolExitCode: EXIT.failure });
  expect(await mutation(['--base', 'main'], deps)).toBe(EXIT.failure);
  expect(deps.toolCalls).toEqual([
    { tool: 'stryker', args: ['run', '--mutate', 'src/a.ts,src/c/d.ts'] },
  ]);
});
