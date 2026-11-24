# Tooling of Forever Record Keeper

The npm package `@forever-record-keeper/tooling` holds the shared checks and configurations for the TypeScript repos of the project.
Decision 0009 in the `specs` repo sets the limits.
`src/limits.ts` holds them, and each configuration and command reads them from there.

## Contents

| Import | Content |
| --- | --- |
| `@forever-record-keeper/tooling/eslint` | `frkEslintConfig`: the strict type-checked rules of typescript-eslint, plus the limits for complexity, length, nesting and parameters. |
| `@forever-record-keeper/tooling/vitest` | `frkVitestConfig`: tests next to the code, and the coverage limit for lines and branches. |
| `@forever-record-keeper/tooling/stryker` | `frkStrykerConfig`: mutation tests with Vitest and the type checker, and the mutation limit. |
| `@forever-record-keeper/tooling/dependency-cruiser` | `frkDependencyCruiserConfig`: no cycles and no unresolved imports, plus the layer rules of the repo. |
| `@forever-record-keeper/tooling/limits` | `LIMITS`: the limits of decision 0009. |
| `@forever-record-keeper/tooling/tsconfig.base.json` | The strict compiler options for all TypeScript code. |

Each configuration function takes an optional `Layout` for a repo with other folders.
The default layout keeps the sources and the tests in `src`, and test files end in `.test.ts`.

## Rules for test files

- Each test is in a `describe` section, and sections nest up to the limit `testSectionDepth`.
  Name each section after the unit that it tests, and give each test a short title that states 1 behavior.
- Inside a section, tests use `it`, so that a title reads as a sentence, such as `jscpdArgs › skips the ignored folders`.
- A test file has its own length limit, `testFileLines`.
- The function length rule `frk/max-lines-per-function` skips the callbacks of `describe` and `suite`.
  Each test inside a section keeps the function limit.
  The rule counts only the lines with code, so blank lines and comment lines never count.

## The `frk` command

- `frk duplication <path>...` fails on each clone of the token limit or more.
  It also fails when it finds no file to check, so that a wrong path can't pass.
- `frk mutation --base <ref>` runs the mutation tests on the source files that changed between `<ref>` and `HEAD`.
  Commit your changes first, because the command compares commits.

## Use the package in a repo

1. Add the package and the tools it configures.
   The versions must match the `peerDependencies` of the package.

   ```bash
   pnpm add -D @forever-record-keeper/tooling eslint typescript vitest @vitest/coverage-v8 \
     @stryker-mutator/core @stryker-mutator/vitest-runner @stryker-mutator/typescript-checker \
     knip dependency-cruiser
   ```

2. Add the configuration files:

   ```ts
   // eslint.config.ts
   import { frkEslintConfig } from '@forever-record-keeper/tooling/eslint';
   export default frkEslintConfig({ rootDir: import.meta.dirname });

   // vitest.config.ts
   import { frkVitestConfig } from '@forever-record-keeper/tooling/vitest';
   export default frkVitestConfig();
   ```

   ```js
   // stryker.config.mjs
   import { frkStrykerConfig } from '@forever-record-keeper/tooling/stryker';
   export default frkStrykerConfig();

   // .dependency-cruiser.mjs
   import { frkDependencyCruiserConfig } from '@forever-record-keeper/tooling/dependency-cruiser';
   export default frkDependencyCruiserConfig([/* the layer rules of the repo */]);
   ```

   ```json
   // tsconfig.json
   { "extends": "@forever-record-keeper/tooling/tsconfig.base.json", "include": ["src"] }
   ```

3. Add these scripts to `package.json`.
   The shared workflow `.github/workflows/typescript.yml` calls them.

   | Script | Command |
   | --- | --- |
   | `typecheck` | `tsc -p tsconfig.json --noEmit` |
   | `lint` | `eslint .` |
   | `test` | `vitest run --coverage` |
   | `duplication` | `frk duplication src` |
   | `deadcode` | `knip` |
   | `layers` | `depcruise src` |
   | `build` | the build of the repo |
   | `mutation` | `frk mutation` |

4. Call the shared workflow from the CI of the repo:

   ```yaml
   jobs:
     typescript:
       uses: Forever-Record-Keeper/.github/.github/workflows/typescript.yml@main
   ```

## Work on the package

You need Node.js 26 and the pnpm version in `package.json`.

```bash
pnpm install
pnpm run test
```

Node.js 26 runs TypeScript files without a build step.
The scripts of this package use that to run the command from `src/cli.ts`.
The package itself passes the same checks as the repos that use it.

The package uses TypeScript 6.0, because typescript-eslint 8 supports TypeScript up to version 6.0.

## License

MIT, see [LICENSE](LICENSE).
