import { expect, test } from 'vitest';
import { fakeDeps } from '../../test/fake-deps.ts';
import { LIMITS } from '../limits.ts';
import { duplication, DUPLICATION_USAGE, jscpdArgs } from './duplication.ts';
import { EXIT } from './types.ts';

test('jscpdArgs fails on each clone of the token limit or more', () => {
  const args = jscpdArgs(['src'], ['dist']);
  expect(args.slice(0, 4)).toEqual([
    '--min-tokens',
    String(LIMITS.duplicateTokens),
    `--exit-code=${String(EXIT.failure)}`,
    '--fail-on-empty',
  ]);
});

test('jscpdArgs skips the ignored folders and checks the paths', () => {
  const args = jscpdArgs(['src', 'test'], ['dist', 'coverage']);
  expect(args.slice(-6)).toEqual([
    '--reporters',
    'console',
    '--ignore',
    '**/dist/**,**/coverage/**',
    'src',
    'test',
  ]);
});

test('duplication shows the usage without a path', async () => {
  const deps = fakeDeps();
  expect(await duplication([], deps)).toBe(EXIT.usage);
  expect(deps.lines).toEqual([DUPLICATION_USAGE]);
  expect(deps.toolCalls).toEqual([]);
});

test('duplication runs jscpd and returns its exit code', async () => {
  const deps = fakeDeps({ toolExitCode: EXIT.failure });
  expect(await duplication(['src'], deps)).toBe(EXIT.failure);
  expect(deps.toolCalls).toEqual([
    { tool: 'jscpd', args: jscpdArgs(['src'], deps.layout.ignoredDirs) },
  ]);
});
