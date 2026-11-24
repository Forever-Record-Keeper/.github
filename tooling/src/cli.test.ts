import { describe, expect, it } from 'vitest';
import { fakeDeps } from '../test/fake-deps.ts';
import { COMMANDS, runCli, USAGE } from './cli.ts';
import { DUPLICATION_USAGE } from './commands/duplication.ts';
import { EXIT } from './commands/types.ts';

describe('COMMANDS', () => {
  it('holds the duplication and mutation commands', () => {
    expect([...COMMANDS.keys()]).toEqual(['duplication', 'mutation']);
  });
});

describe('USAGE', () => {
  it('lists each command', () => {
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
});

describe('runCli', () => {
  it.each([[[]], [['unknown']], [['toString']]])('shows the usage for %j', async (args) => {
    const deps = fakeDeps();
    expect(await runCli(args, deps)).toBe(EXIT.usage);
    expect(deps.lines).toEqual([USAGE]);
  });

  it('passes the other arguments to the command', async () => {
    const deps = fakeDeps();
    expect(await runCli(['duplication', 'src'], deps)).toBe(EXIT.ok);
    expect(deps.toolCalls).toHaveLength(1);
  });

  it('returns the exit code of the command', async () => {
    const deps = fakeDeps();
    expect(await runCli(['duplication'], deps)).toBe(EXIT.usage);
    expect(deps.lines).toEqual([DUPLICATION_USAGE]);
  });
});
