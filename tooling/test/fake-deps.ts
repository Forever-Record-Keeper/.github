import { EXIT, type CliDeps, type ToolName } from '../src/commands/types.ts';
import { DEFAULT_LAYOUT } from '../src/layout.ts';

interface ToolCall {
  readonly tool: ToolName;
  readonly args: readonly string[];
}

/** Fake side effects that record what a command does. */
export interface FakeDeps extends CliDeps {
  readonly lines: string[];
  readonly toolCalls: ToolCall[];
}

export interface FakeOptions {
  /** The files that changedFiles returns. */
  readonly changed?: readonly string[];
  /** The exit code that runTool returns. */
  readonly toolExitCode?: number;
}

export function fakeDeps(options: FakeOptions = {}): FakeDeps {
  const lines: string[] = [];
  const toolCalls: ToolCall[] = [];
  return {
    lines,
    toolCalls,
    layout: DEFAULT_LAYOUT,
    log: (line) => {
      lines.push(line);
    },
    runTool: (tool, args) => {
      toolCalls.push({ tool, args });
      return Promise.resolve(options.toolExitCode ?? EXIT.ok);
    },
    changedFiles: () => Promise.resolve(options.changed ?? []),
  };
}
