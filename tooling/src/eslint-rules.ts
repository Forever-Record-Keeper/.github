import type { AST, ESLint, Rule } from 'eslint';
import type { Node, SourceLocation } from 'estree';

/** The Vitest functions that open a section of tests. */
export const SECTION_FUNCTIONS: ReadonlySet<string> = new Set(['describe', 'suite']);

/** The name at the root of a callee, such as `describe` in `describe.each(cases)`, or an empty name. */
export function rootName(callee: Node): string {
  if (callee.type === 'Identifier') {
    return callee.name;
  }
  if (callee.type === 'MemberExpression') {
    return rootName(callee.object);
  }
  return callee.type === 'CallExpression' ? rootName(callee.callee) : '';
}

/**
 * Whether a function is the callback of a section, such as `describe('name', () => {})`.
 * A function that is itself the callee has no name, so it never counts as a section callback.
 */
function isSectionCallback(node: Rule.Node): boolean {
  const parent: Node | null = node.parent;
  return parent?.type === 'CallExpression' && SECTION_FUNCTIONS.has(rootName(parent.callee));
}

/**
 * The numbers of the lines that hold code.
 * Comments are no tokens, so blank lines and comment lines are never in the set.
 */
function codeLines(tokens: readonly AST.Token[]): ReadonlySet<number> {
  const lines = new Set<number>();
  for (const { loc } of tokens) {
    for (let line = loc.start.line; line <= loc.end.line; line++) {
      lines.add(line);
    }
  }
  return lines;
}

/** Counts the lines of code within a location. */
function countCodeLines(lines: ReadonlySet<number>, loc: SourceLocation): number {
  let count = 0;
  for (let line = loc.start.line; line <= loc.end.line; line++) {
    count += lines.has(line) ? 1 : 0;
  }
  return count;
}

interface LengthOptions {
  readonly max: number;
}

/**
 * The function length rule of decision 0030: lines of code per function.
 * A section holds many tests, so its callback has no limit. Each test inside keeps the limit.
 */
const maxLinesPerFunction: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Limit the lines of code of each function outside test sections.' },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        required: ['max'],
        additionalProperties: false,
      },
    ],
    messages: { tooLong: 'The function has {{count}} lines of code. The limit is {{max}}.' },
  },
  create(context) {
    const [{ max }] = context.options as [LengthOptions];
    const lines = codeLines(context.sourceCode.ast.tokens);
    const check = (node: Rule.Node) => {
      const count = countCodeLines(lines, context.sourceCode.getLoc(node));
      if (count > max && !isSectionCallback(node)) {
        context.report({ node, messageId: 'tooLong', data: { count: String(count), max: String(max) } });
      }
    };
    return { FunctionDeclaration: check, FunctionExpression: check, ArrowFunctionExpression: check };
  },
};

/** The ESLint plugin of the project, with the name `frk` in a config. */
export const frkPlugin: ESLint.Plugin = {
  meta: { name: '@forever-record-keeper/tooling' },
  rules: { 'max-lines-per-function': maxLinesPerFunction },
};
