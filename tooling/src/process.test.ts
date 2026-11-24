import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { EXIT, TOOLS } from './commands/types.ts';
import { DEFAULT_LAYOUT } from './layout.ts';
import { binOf, binPath, changedFiles, exitCodeOf, processDeps, run } from './process.ts';

const node = process.execPath;
const folders: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  folders.splice(0).forEach((folder) => {
    rmSync(folder, { recursive: true, force: true });
  });
});

/** Creates a git repo with 2 commits. The second adds b.ts and sub/c.ts, and deletes a.ts. */
function gitRepo(): string {
  const folder = mkdtempSync(join(tmpdir(), 'frk-tooling-'));
  folders.push(folder);
  const git = (...args: string[]) => execFileSync('git', args, { cwd: folder });
  git('init', '--quiet', '--initial-branch=main');
  git('config', 'commit.gpgsign', 'false');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  writeFileSync(join(folder, 'a.ts'), 'export const a = 1;\n');
  git('add', '.');
  git('commit', '--quiet', '-m', 'first');
  git('checkout', '--quiet', '-b', 'topic');
  writeFileSync(join(folder, 'b.ts'), 'export const b = 2;\n');
  mkdirSync(join(folder, 'sub'));
  writeFileSync(join(folder, 'sub', 'c.ts'), 'export const c = 3;\n');
  git('rm', '--quiet', 'a.ts');
  git('add', '.');
  git('commit', '--quiet', '-m', 'second');
  return folder;
}

test.each([
  [{ bin: 'cli.js' }, 'cli.js'],
  [{ bin: { tool: 'bin/tool.js' } }, 'bin/tool.js'],
  [{ bin: { other: 'bin/other.js' } }, undefined],
  [{}, undefined],
])('binOf(%j) is %s', (manifest, expected) => {
  expect(binOf(manifest, 'tool')).toBe(expected);
});

test.each([
  [0, 0],
  [3, 3],
  [null, EXIT.failure],
])('exitCodeOf(%s) is %s', (code, expected) => {
  expect(exitCodeOf(code)).toBe(expected);
});

test('binPath finds the bin file of each tool', () => {
  expect(existsSync(binPath(TOOLS.jscpd))).toBe(true);
  expect(existsSync(binPath(TOOLS.stryker))).toBe(true);
});

test('binPath fails on a package without the bin', () => {
  expect(() => binPath({ packageName: 'jscpd', binName: 'no-such-bin' })).toThrow(/no bin/);
});

test('run keeps the output and the exit code when it captures', async () => {
  const script = 'process.stdout.write("out"); process.stderr.write("err"); process.exit(3)';
  const result = await run({ command: node, args: ['-e', script], cwd: '.', capture: true });
  expect(result).toEqual({ code: 3, stdout: 'out', stderr: 'err' });
});

test('run rejects when the command does not exist', async () => {
  const request = { command: 'frk-no-such-command', args: [], cwd: '.', capture: true };
  await expect(run(request)).rejects.toThrow();
});

test('changedFiles lists the added files and leaves out the deleted ones', async () => {
  expect(await changedFiles('main', gitRepo())).toEqual(['b.ts', 'sub/c.ts']);
});

test('changedFiles lists only the files below the folder, relative to it', async () => {
  expect(await changedFiles('main', join(gitRepo(), 'sub'))).toEqual(['c.ts']);
});

test('changedFiles fails on an unknown base ref', async () => {
  await expect(changedFiles('no-such-ref', gitRepo())).rejects.toThrow(/git diff failed with exit code \d+: fatal/);
});

test('processDeps starts a tool and returns its exit code', async () => {
  const deps = processDeps('.');
  expect(deps.layout).toBe(DEFAULT_LAYOUT);
  expect(await deps.runTool('jscpd', ['--version'])).toBe(EXIT.ok);
});

test('processDeps lists changed files and writes lines to the output', async () => {
  const folder = gitRepo();
  const write = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  const deps = processDeps(folder);
  deps.log('line');
  expect(write).toHaveBeenCalledWith('line\n');
  expect(await deps.changedFiles('main')).toEqual(['b.ts', 'sub/c.ts']);
});
