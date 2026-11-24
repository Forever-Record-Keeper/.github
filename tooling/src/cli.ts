#!/usr/bin/env node
import { duplication } from './commands/duplication.ts';
import { mutation } from './commands/mutation.ts';
import { EXIT, type CliDeps, type Command } from './commands/types.ts';
import { processDeps } from './process.ts';

/** The commands of the CLI, by name. */
export const COMMANDS: ReadonlyMap<string, Command> = new Map([
  ['duplication', duplication],
  ['mutation', mutation],
]);

/** The usage text of the CLI. */
export const USAGE = [
  'Usage: frk <command> [arguments]',
  '',
  'Commands:',
  '  duplication <path>...    Fail on duplicated code.',
  '  mutation --base <ref>    Run mutation tests on the source files changed since <ref>.',
].join('\n');

/** Runs the command that the first argument names. */
export async function runCli(args: readonly string[], deps: CliDeps): Promise<number> {
  const [name, ...rest] = args;
  const command = name === undefined ? undefined : COMMANDS.get(name);
  if (command === undefined) {
    deps.log(USAGE);
    return EXIT.usage;
  }
  return command(rest, deps);
}

if (import.meta.main) {
  process.exitCode = await runCli(process.argv.slice(2), processDeps(process.cwd()));
}
