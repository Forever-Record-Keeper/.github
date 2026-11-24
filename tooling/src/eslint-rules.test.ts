import { readFileSync } from 'node:fs';
import type { Linter } from 'eslint';
import type { Node } from 'estree';
import { describe, expect, it } from 'vitest';
import { errorRules, lintErrors, lines } from '../test/lint.ts';
import { frkPlugin, rootName, SECTION_FUNCTIONS } from './eslint-rules.ts';
import { LIMITS } from './limits.ts';

const rules: Linter.RulesRecord = {
  'frk/max-lines-per-function': ['error', { max: LIMITS.functionLines }],
};
const RULE = 'frk/max-lines-per-function';

/** A function with the number of code lines, counting its first and last line. */
function functionOf(codeLines: number, filler = ''): string {
  const body = lines(codeLines - 2, '  a();');
  return `function f(a: () => void) {\n${body}\n${filler}}`;
}

/** A call of the callee with a callback of the number of code lines. */
function callbackOf(callee: string, codeLines: number): string {
  const body = lines(codeLines - 2, '  a();');
  return `${callee}('name', () => {\n${body}\n});`;
}

describe('rootName', () => {
  const describeName: Node = { type: 'Identifier', name: 'describe' };
  const member: Node = {
    type: 'MemberExpression',
    object: describeName,
    property: { type: 'Identifier', name: 'each' },
    computed: false,
    optional: false,
  };

  it('returns the name of an identifier', () => {
    expect(rootName(describeName)).toBe('describe');
  });

  it('follows the object of a member', () => {
    expect(rootName(member)).toBe('describe');
  });

  it('follows the callee of a call', () => {
    expect(rootName({ type: 'CallExpression', callee: member, arguments: [], optional: false })).toBe(
      'describe',
    );
  });

  it('returns an empty name for other nodes', () => {
    expect(rootName({ type: 'Literal', value: 1 })).toBe('');
  });
});

describe('frkPlugin', () => {
  it('has the name of the package', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as { name: string };
    expect(frkPlugin.meta?.name).toBe(manifest.name);
  });
});

describe('the options of the function length rule', () => {
  it.each([
    ['without a limit', {}],
    ['with a limit of 0', { max: 0 }],
    ['with a limit that is no number', { max: 'many' }],
    ['with an unknown option', { max: 1, skipBlankLines: true }],
  ])('rejects the options %s', async (_, options) => {
    const badRules: Linter.RulesRecord = { 'frk/max-lines-per-function': ['error', options] };
    await expect(errorRules('const a = 1;', badRules)).rejects.toThrow(/Key "frk\/max-lines-per-function"/);
  });
});

describe('the function length rule', () => {
  it('passes a function at the limit', async () => {
    expect(await errorRules(functionOf(LIMITS.functionLines), rules)).toEqual([]);
  });

  it('fails a function above the limit and names both numbers', async () => {
    const errors = await lintErrors(functionOf(LIMITS.functionLines + 1), rules);
    const count = String(LIMITS.functionLines + 1);
    expect(errors).toEqual([
      {
        ruleId: RULE,
        message: `The function has ${count} lines of code. The limit is ${String(LIMITS.functionLines)}.`,
      },
    ]);
  });

  it('leaves out blank lines and comment lines', async () => {
    const filler = `\n\n// note\n/* a\n   b */\n`;
    expect(await errorRules(functionOf(LIMITS.functionLines, filler), rules)).toEqual([]);
  });

  it('counts a line with code and a comment', async () => {
    const code = functionOf(LIMITS.functionLines, 'a(); // note\n');
    expect(await errorRules(code, rules)).toEqual([RULE]);
  });

  it('counts each line of a template literal', async () => {
    const code = functionOf(LIMITS.functionLines, 'a`\n\n`;\n');
    expect(await errorRules(code, rules)).toEqual([RULE]);
  });

  it('checks arrow functions and function expressions', async () => {
    const body = lines(LIMITS.functionLines, '  a();');
    const code = `const f = () => {\n${body}\n};\nconst g = function () {\n${body}\n};`;
    expect(await errorRules(code, rules)).toEqual([RULE, RULE]);
  });
});

describe('the function length rule in test sections', () => {
  it.each([...SECTION_FUNCTIONS, 'describe.each([1])', 'describe.skip'])(
    'skips the callback of %s',
    async (callee) => {
      expect(await errorRules(callbackOf(callee, LIMITS.functionLines + 1), rules)).toEqual([]);
    },
  );

  it('checks the callback of a test', async () => {
    expect(await errorRules(callbackOf('it', LIMITS.functionLines + 1), rules)).toEqual([RULE]);
  });

  it('checks a test inside a section', async () => {
    const code = `describe('name', () => {\n${callbackOf('it', LIMITS.functionLines + 1)}\n});`;
    expect(await errorRules(code, rules)).toEqual([RULE]);
  });

  it('checks the callback of a call without a name', async () => {
    expect(await errorRules(callbackOf('(a || b)', LIMITS.functionLines + 1), rules)).toEqual([RULE]);
  });

  it('checks a function that a section calls', async () => {
    const iife = `(() => {\n${lines(LIMITS.functionLines, '  a();')}\n})()`;
    expect(await errorRules(`describe('name', ${iife});`, rules)).toEqual([RULE]);
  });
});
