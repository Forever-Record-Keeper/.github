# Shared files of Forever Record Keeper

This repo contains the files that all Forever Record Keeper repos share:

- The `FRK` Vale package in `vale/FRK`, with the prose rules for every repo.
- The npm package `@forever-record-keeper/tooling` in `tooling`, with the shared checks and configurations for TypeScript.
- Reusable GitHub Actions workflows in `.github/workflows`.

## The FRK Vale package

The package checks all text that people read against the plain English rules of the project.
It contains these parts:

- `styles/FRK`: our own rules. Each rule file holds 1 failing and 1 passing test case.
- `styles/config/dictionaries`: the strict en_US dictionary, and `frk` for ordinary technical words.
- `styles/config/vocabularies/FRK`: names with a fixed spelling, such as `OpenSpec`.
- `.vale.ini`: the rule set. It pins `ai-tells` and turns its rules on or down.

`vale/CALIBRATION.md` records each change to a rule from another package, with its reason.

### Use the package in a repo

1. Add a `.vale.ini` at the root of the repo:

   ```ini
   StylesPath = .vale/styles
   MinAlertLevel = suggestion
   Packages = https://github.com/Forever-Record-Keeper/.github/releases/download/vale-frk-v0.1.0/FRK.zip
   ```

2. Add `/.vale/` to `.gitignore`.
3. Run `vale sync` once, then `vale .` to check the repo.

### Change the rules

1. Change a rule in `vale/FRK/styles/FRK`, and update its test cases.
2. Run `vale sync`, then `vale test --coverage vale/FRK/styles`.
   The coverage check fails if a rule never matches, because a rule that matches nothing fails without a message.
3. Run `vale .` on this repo.
4. After the merge, a tag such as `vale-frk-v0.2.0` builds a new `FRK.zip` release.

## The prose workflow

A repo calls the shared workflow from its own CI:

```yaml
jobs:
  prose:
    uses: Forever-Record-Keeper/.github/.github/workflows/prose.yml@main
```

The workflow installs Vale, syncs the packages and checks the repo.
An alert at the error level fails the check.
The default of the `vale-version` input sets the Vale version for all repos.
Install the same version on your machine, for example with `winget install errata-ai.Vale` on Windows.

## The tooling package

[tooling/README.md](tooling/README.md) explains the shared checks for TypeScript and how a repo uses them.
The shared workflow `typescript.yml` runs the checks.

## License

MIT, see [LICENSE](LICENSE).
The en_US dictionary comes from SCOWL under its own permissive license, see `vale/FRK/styles/config/dictionaries/en_US.LICENSE.txt`.
