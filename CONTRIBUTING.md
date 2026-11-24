# Contributing to Forever Record Keeper

Forever Record Keeper is open source under the MIT License.
This guide explains how work flows through the project, and which checks a change must pass.
The guide applies to every repo of the organization.

## The repos

| Repo | Content |
| --- | --- |
| `.github` | Community files, shared workflows and the Vale package for prose checks |
| `specs` | Plans, requirements, decisions and the glossary. No product code. |
| `app` | The desktop app: recording control, log tagging and the library |
| `addon` | The addon for the game client |
| `docs` | User and contributor docs |
| `forever-record-keeper.github.io` | The project website |

Clone the repos side by side in one folder.
Scripts and settings find each other through relative paths such as `../specs`.

## 2 ways to change the project

### Fix

A fix is small and stays in 1 repo.

1. Open an issue in that repo, or pick an open one.
2. Create a branch, make the change and open a PR with a link to the issue.
3. Every check in CI must pass.

### Change

A change adds or changes behavior.
It can touch several repos.

1. Open an issue in `specs` that describes the idea.
2. The plan goes into `specs` as an OpenSpec change: a proposal, a design, tasks for each repo, requirements and scenarios.
3. The maintainer reviews the plan.
4. The repos implement the plan, 1 repo at a time.
   The interfaces between repos come first.

The `specs` repo explains the format of requirements and scenarios.

## Write in plain English

Many readers of this project are not native speakers of English.
Write so that a reader with school English understands each sentence on the first read.
Vale checks all text that people read: Markdown files, code comments, UI text and Gherkin scenarios.

1. Put 1 idea in each sentence.
   A sentence has 25 words or fewer, and a requirement has 20 words or fewer.
2. Use the active voice and name who acts: "The app starts the recording."
3. Use common words, such as `use`, `help`, `start` and `before`.
4. Use 1 word for each concept.
   The glossary in `specs` lists the words.
5. Don't use idioms or figures of speech.
6. State what a thing is and does.
   Don't frame a statement as a contrast with something else.
7. Don't use dashes as punctuation.
   Use a period, a comma, a colon or parentheses.
8. Don't use filler words or intensifiers.
9. Start a sentence with a clear noun, for example "The cache allows".
   After a bare "This" or "That", the reader must guess the meaning.
10. Don't ask questions in body text.
    State the point as a sentence.
11. Write numbers as digits, with a space before the unit: `2 min`, `40 Mbps`.
12. Write headings in sentence case.
13. In a requirement, use only words that a test can check.
    Words such as `fast`, `easy` and `if possible` have no value to test.

Use US spelling.
The `README.md` of this repo explains how Vale checks these rules.

## Commits and pull requests

- Write commit messages and PR titles as Conventional Commits, for example `fix: keep the clip folder when the disk is full`.
- Make each PR small.
  Each PR passes its own checks.
- The project merges with squash merge.
  The PR title becomes the commit message on `main`.
- Commits need no sign-off line.

## Reviews

The maintainer merges every PR.
Automated checks and AI agents review most of the code.
The maintainer reviews these parts in person:

- Requirements and scenarios.
- The rules for the layers of the code.
- Code with special security needs: the library server, the communication between processes, file access and Warcraft Logs tokens.

The `CODEOWNERS` file of each repo marks these paths.

## Checks

Each repo runs its checks in CI, and the same checks run in a hook before each commit.
Every check must pass, and the prose check allows no Vale error.

For TypeScript, decision 0030 in `specs` sets the limits for complexity, length, nesting, parameters, coverage, mutation score and duplication.
The checks read these limits from [`tooling/src/limits.ts`](tooling/src/limits.ts).
Each test is in a `describe` section and has a short title.
A test file then reads as a list of behaviors.

The README of each repo lists all its checks.

## Tools

- Node.js 26 and pnpm.
- Vale.
  The default of the `vale-version` input in `.github/workflows/prose.yml` sets the version.

## AI agents

AI agents work on this project too.
Each repo has an `AGENTS.md` file with the rules for agents.
The checks for agent work and for human work are the same.

## License

Each repo uses the MIT License.
When you contribute, your contribution uses the license of that repo.

## Code of conduct

Everyone in the project follows the [code of conduct](CODE_OF_CONDUCT.md).
