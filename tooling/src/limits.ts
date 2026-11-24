/**
 * The limits of decision 0030 in the specs repo.
 * Each shared config and each command reads its limit from this file.
 */
export const LIMITS = {
  /** The highest cyclomatic complexity of a function. */
  complexity: 6,
  /** The most lines of a function, without blank lines and comments. */
  functionLines: 25,
  /** The most lines of a file, without blank lines and comments. */
  fileLines: 200,
  /** The most lines of a test file, without blank lines and comments. */
  testFileLines: 500,
  /** The deepest nesting of `describe` sections in a test file. */
  testSectionDepth: 2,
  /** The deepest nesting of blocks in a function. */
  nestingDepth: 3,
  /** The most parameters of a function. */
  parameters: 3,
  /** The lowest test coverage of lines and of branches, in percent. */
  coveragePercent: 90,
  /** The lowest mutation score on changed files, in percent. */
  mutationScorePercent: 85,
  /** The smallest clone, in tokens, that fails the duplication check. */
  duplicateTokens: 50,
} as const;
