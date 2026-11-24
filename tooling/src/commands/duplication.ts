import { LIMITS } from '../limits.ts';
import { EXIT, type Command } from './types.ts';

/** The usage line of the command. */
export const DUPLICATION_USAGE = 'Usage: frk duplication <path>...';

/**
 * The arguments for jscpd: fail on each clone of the token limit or more.
 * jscpd also fails when it finds no file to check, so that a wrong path can't pass.
 */
export function jscpdArgs(paths: readonly string[], ignoredDirs: readonly string[]): string[] {
  const ignore = ignoredDirs.map((dir) => `**/${dir}/**`).join(',');
  return [
    '--min-tokens',
    String(LIMITS.duplicateTokens),
    `--exit-code=${String(EXIT.failure)}`,
    '--fail-on-empty',
    '--reporters',
    'console',
    '--ignore',
    ignore,
    ...paths,
  ];
}

/** Checks the paths for duplicated code with jscpd. */
export const duplication: Command = async (args, deps) => {
  if (args.length === 0) {
    deps.log(DUPLICATION_USAGE);
    return EXIT.usage;
  }
  return deps.runTool('jscpd', jscpdArgs(args, deps.layout.ignoredDirs));
};
