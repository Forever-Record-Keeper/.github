import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { EXIT, TOOLS } from './commands/types.ts';
import { DEFAULT_LAYOUT } from './layout.ts';
import { binOf, binPath, changedFiles, exitCodeOf, processDeps, run } from './process.ts';

const node = process.execPath;

/**
 * Creates a git repo with 2 commits. The second adds b.ts and sub/c.ts, and deletes a.ts.
 * The repo is deleted when the test ends.
 */
function gitRepo(): string {
  const folder = mkdtempSync(join(tmpdir(), 'frk-tooling-'));
  onTestFinished(() => {
    rmSync(folder, { recursive: true, force: true });
  });
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

describe('binOf', () => {
  it.each([
    [{ bin: 'cli.js' }, 'cli.js'],
    [{ bin: { tool: 'bin/tool.js' } }, 'bin/tool.js'],
  ])('finds the bin in %j', (manifest, expected) => {
    expect(binOf(manifest, 'tool')).toBe(expected);
  });

  it.each([[{ bin: { other: 'bin/other.js' } }], [{}]])('returns undefined for %j', (manifest) => {
    expect(binOf(manifest, 'tool')).toBeUndefined();
  });
});

describe('exitCodeOf', () => {
  it.each([0, 3])('keeps the exit code %i', (code) => {
    expect(exitCodeOf(code)).toBe(code);
  });

  it('counts a process without an exit code as failed', () => {
    expect(exitCodeOf(null)).toBe(EXIT.failure);
  });
});

describe('binPath', () => {
  it('finds the bin file of each tool', () => {
    expect(existsSync(binPath(TOOLS.jscpd))).toBe(true);
    expect(existsSync(binPath(TOOLS.stryker))).toBe(true);
  });

  it('fails on a package without the bin', () => {
    expect(() => binPath({ packageName: 'jscpd', binName: 'no-such-bin' })).toThrow(/no bin/);
  });
});

describe('run', () => {
  it('keeps the output and the exit code when it captures', async () => {
    const script = 'process.stdout.write("out"); process.stderr.write("err"); process.exit(3)';
    const result = await run({ command: node, args: ['-e', script], cwd: '.', capture: true });
    expect(result).toEqual({ code: 3, stdout: 'out', stderr: 'err' });
  });

  it('rejects when the command does not exist', async () => {
    const request = { command: 'frk-no-such-command', args: [], cwd: '.', capture: true };
    await expect(run(request)).rejects.toThrow();
  });
});

describe('changedFiles', () => {
  it('lists the added files and leaves out the deleted ones', async () => {
    expect(await changedFiles('main', gitRepo())).toEqual(['b.ts', 'sub/c.ts']);
  });

  it('lists only the files below the folder, relative to it', async () => {
    expect(await changedFiles('main', join(gitRepo(), 'sub'))).toEqual(['c.ts']);
  });

  it('fails on an unknown base ref, with the message of git', async () => {
    await expect(changedFiles('no-such-ref', gitRepo())).rejects.toThrow(
      /git diff failed with exit code \d+: fatal/,
    );
  });
});

describe('processDeps', () => {
  it('starts a tool and returns its exit code', async () => {
    const deps = processDeps('.');
    expect(deps.layout).toBe(DEFAULT_LAYOUT);
    expect(await deps.runTool('jscpd', ['--version'])).toBe(EXIT.ok);
  });

  it('lists changed files and writes lines to the output', async () => {
    const write = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    onTestFinished(() => {
      write.mockRestore();
    });
    const deps = processDeps(gitRepo());
    deps.log('line');
    expect(write).toHaveBeenCalledWith('line\n');
    expect(await deps.changedFiles('main')).toEqual(['b.ts', 'sub/c.ts']);
  });
});
