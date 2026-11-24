import { parseArgs } from 'node:util';
import { isProductionSource } from '../layout.ts';
import { EXIT, type Command } from './types.ts';

/** The usage line of the command. */
export const MUTATION_USAGE = 'Usage: frk mutation --base <git ref>';

/** The message when no source file changed. */
export const NOTHING_TO_MUTATE = 'No source file changed. The mutation check has nothing to test.';

/** Reads the base ref from the arguments, or returns undefined. */
export function baseRefOf(args: readonly string[]): string | undefined {
  const { values } = parseArgs({
    args: [...args],
    options: { base: { type: 'string' } },
    strict: false,
  });
  const base = values.base;
  return typeof base === 'string' && base.length > 0 ? base : undefined;
}

/** Runs Stryker on the source files that changed since the base ref. */
export const mutation: Command = async (args, deps) => {
  const baseRef = baseRefOf(args);
  if (baseRef === undefined) {
    deps.log(MUTATION_USAGE);
    return EXIT.usage;
  }
  const changed = await deps.changedFiles(baseRef);
  const targets = changed.filter((path) => isProductionSource(path, deps.layout));
  if (targets.length === 0) {
    deps.log(NOTHING_TO_MUTATE);
    return EXIT.ok;
  }
  return deps.runTool('stryker', ['run', '--mutate', targets.join(',')]);
};
