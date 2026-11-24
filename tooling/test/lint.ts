import vitest from '@vitest/eslint-plugin';
import { ESLint, type Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { frkPlugin } from '../src/eslint-rules.ts';

/** The severity of an ESLint error. */
const ERROR = 2;

export interface LintFinding {
  readonly ruleId: string | null;
  readonly message: string;
}

/** Lints code with the rules only, without the project service, and returns the errors. */
export async function lintErrors(
  code: string,
  rules: Linter.RulesRecord,
  filePath = 'fixture.ts',
): Promise<LintFinding[]> {
  const config: Linter.Config = {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin, frk: frkPlugin, vitest },
    rules,
  };
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
  const [result] = await eslint.lintText(code, { filePath });
  const errors = result?.messages.filter((message) => message.severity === ERROR) ?? [];
  return errors.map(({ ruleId, message }) => ({ ruleId, message }));
}

/** Lints code and returns the IDs of the rules that report an error. */
export async function errorRules(
  code: string,
  rules: Linter.RulesRecord,
  filePath?: string,
): Promise<(string | null)[]> {
  const errors = await lintErrors(code, rules, filePath);
  return errors.map((error) => error.ruleId);
}

/** Repeats a line. */
export function lines(count: number, line: string): string {
  return Array.from({ length: count }, () => line).join('\n');
}
