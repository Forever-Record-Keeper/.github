import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { EXIT, TOOLS, type CliDeps } from './commands/types.ts';
import { DEFAULT_LAYOUT } from './layout.ts';

const require = createRequire(import.meta.url);

/** The git command that lists the changed files below the current folder. */
const GIT_DIFF = { command: 'git', args: ['diff', '--name-only', '--relative', '--diff-filter=ACMR'] };

export interface PackageManifest {
  readonly bin?: string | Readonly<Partial<Record<string, string>>>;
}

export interface RunRequest {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  /** Whether to keep the standard output. Without it, the output goes to the terminal. */
  readonly capture: boolean;
}

export interface RunResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface ToolSpec {
  readonly packageName: string;
  readonly binName: string;
}

/** The bin file of a package manifest, relative to the package folder. */
export function binOf(manifest: PackageManifest, binName: string): string | undefined {
  return typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[binName];
}

/** The exit code of a process. A process that a signal ended has none, and counts as failed. */
export function exitCodeOf(code: number | null): number {
  return code ?? EXIT.failure;
}

/** Finds the file of a bin in an installed package. */
export function binPath({ packageName, binName }: ToolSpec): string {
  const manifestPath = require.resolve(`${packageName}/package.json`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest;
  const bin = binOf(manifest, binName);
  if (bin === undefined) {
    throw new Error(`The package ${packageName} has no bin ${binName}.`);
  }
  return join(dirname(manifestPath), bin);
}

/** Starts a command and resolves with its exit code. */
export function run(request: RunRequest): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(request.command, request.args, {
      cwd: request.cwd,
      stdio: request.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });
    const output = { stdout: '', stderr: '' };
    child.stdout?.on('data', (chunk: Buffer) => {
      output.stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      output.stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code: exitCodeOf(code), ...output });
    });
  });
}

/** Lists the files that changed between the base ref and HEAD, relative to the folder. */
export async function changedFiles(baseRef: string, cwd: string): Promise<string[]> {
  const args = [...GIT_DIFF.args, `${baseRef}...HEAD`];
  const result = await run({ command: GIT_DIFF.command, args, cwd, capture: true });
  if (result.code !== EXIT.ok) {
    throw new Error(`git diff failed with exit code ${String(result.code)}: ${result.stderr.trim()}`);
  }
  return result.stdout.split('\n').filter((line) => line.length > 0);
}

/** The real side effects of the CLI, for a repo in the folder. */
export function processDeps(cwd: string): CliDeps {
  return {
    runTool: async (tool, args) => {
      const command = process.execPath;
      const result = await run({ command, args: [binPath(TOOLS[tool]), ...args], cwd, capture: false });
      return result.code;
    },
    changedFiles: (baseRef) => changedFiles(baseRef, cwd),
    log: (line) => {
      process.stdout.write(`${line}\n`);
    },
    layout: DEFAULT_LAYOUT,
  };
}
