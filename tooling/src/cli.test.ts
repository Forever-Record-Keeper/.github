import { expect, test } from 'vitest';
import { fakeDeps } from '../test/fake-deps.ts';
import { COMMANDS, runCli, USAGE } from './cli.ts';
import { DUPLICATION_USAGE } from './commands/duplication.ts';
import { EXIT } from './commands/types.ts';

test('the CLI has the duplication and mutation commands', () => {
  expect([...COMMANDS.keys()]).toEqual(['duplication', 'mutation']);
});

test('the usage text lists each command', () => {
  expect(USAGE).toBe(
    [
      'Usage: frk <command> [arguments]',
      '',
      'Commands:',
      '  duplication <path>...    Fail on duplicated code.',
      '  mutation --base <ref>    Run mutation tests on the source files changed since <ref>.',
    ].join('\n'),
  );
});

test.each([[[]], [['unknown']], [['toString']]])('runCli(%j) shows the usage', async (args) => {
  const deps = fakeDeps();
  expect(await runCli(args, deps)).toBe(EXIT.usage);
  expect(deps.lines).toEqual([USAGE]);
});

test('runCli passes the other arguments to the command', async () => {
  const deps = fakeDeps();
  expect(await runCli(['duplication', 'src'], deps)).toBe(EXIT.ok);
  expect(deps.toolCalls).toHaveLength(1);
});

test('runCli returns the exit code of the command', async () => {
  const deps = fakeDeps();
  expect(await runCli(['duplication'], deps)).toBe(EXIT.usage);
  expect(deps.lines).toEqual([DUPLICATION_USAGE]);
});
