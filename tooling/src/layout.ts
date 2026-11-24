/**
 * The folder layout that the shared configs expect in a repo.
 * A repo with another layout passes its own values to the config functions.
 */
export interface Layout {
  /** The folder with the source files. */
  readonly sourceDir: string;
  /** The file extension of source files. */
  readonly sourceExtension: string;
  /** The end of the name of a test file. */
  readonly testSuffix: string;
  /** The folders that the checks skip, such as build output. */
  readonly ignoredDirs: readonly string[];
  /** The tsconfig file that covers all source files, tests included. */
  readonly tsconfigFile: string;
}

export const DEFAULT_LAYOUT: Layout = {
  sourceDir: 'src',
  sourceExtension: '.ts',
  testSuffix: '.test.ts',
  ignoredDirs: ['dist', 'coverage', 'reports', '.stryker-tmp'],
  tsconfigFile: 'tsconfig.json',
};

/** The glob for all source files, tests included. */
export function sourceGlob(layout: Layout): string {
  return `${layout.sourceDir}/**/*${layout.sourceExtension}`;
}

/** The glob for all test files. */
export function testGlob(layout: Layout): string {
  return `${layout.sourceDir}/**/*${layout.testSuffix}`;
}

/** Whether a path is a source file and no test file. */
export function isProductionSource(path: string, layout: Layout): boolean {
  const inSourceDir = path.startsWith(`${layout.sourceDir}/`);
  return inSourceDir && path.endsWith(layout.sourceExtension) && !path.endsWith(layout.testSuffix);
}
