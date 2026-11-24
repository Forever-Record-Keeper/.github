import type { Layout } from '../layout.ts';

/** The exit codes of the CLI. */
export const EXIT = {
  ok: 0,
  failure: 1,
  usage: 2,
} as const;

/** The tools that the CLI starts. Each one is a bin of an installed package. */
export const TOOLS = {
  jscpd: { packageName: 'jscpd', binName: 'jscpd' },
  stryker: { packageName: '@stryker-mutator/core', binName: 'stryker' },
} as const;

export type ToolName = keyof typeof TOOLS;

/** The side effects of the CLI. Tests pass fakes. */
export interface CliDeps {
  /** Starts a tool with the arguments and returns its exit code. */
  readonly runTool: (tool: ToolName, args: readonly string[]) => Promise<number>;
  /** Lists the files that changed since the base ref, as paths from the repo root. */
  readonly changedFiles: (baseRef: string) => Promise<readonly string[]>;
  /** Writes 1 line of output. */
  readonly log: (line: string) => void;
  /** The folder layout of the repo. */
  readonly layout: Layout;
}

/** A command of the CLI. It gets the arguments after its name. */
export type Command = (args: readonly string[], deps: CliDeps) => Promise<number>;
