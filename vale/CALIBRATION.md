# Vale calibration

The `FRK` package uses rules from `ai-tells`.
Some of those rules match plain technical text.
This file records each change to such a rule, and the reason for the change.

## Run of 2026-11-23

- Tools: Vale 3.28.1, `ai-tells` and `ai-tells-experimental` v1.37.0.
- Text: 2 planning documents of the project, 860 lines in total.
  Both documents are private, so this file quotes no lines from them.
- First run: 578 alerts.
  Final run, after the changes below: 312 alerts.
  Of these, 181 are errors.

### Rules turned off

| Rule | Hits | Reason |
| --- | --- | --- |
| `ai-tells.ColonUsage` | 26 | The rule flags a capital letter after a colon. All 26 hits were names or table labels. |
| `ai-tells.EmDashUsage` | 4 | The rule also flags en dashes in ranges such as `1–3 s`. `FRK.Dashes` flags em dashes and spaced dashes. |
| `ai-tells.FormalRegister` | 4 | The word list includes standard software verbs such as `implement` and `optimize`. `FRK.PlainWords` keeps the formal words. |
| `ai-tells.FormalTransitions` | 7 | All 7 hits were `for example`, which plain English recommends. `FRK.Transitions` keeps the formal connectors. |
| `ai-tells.NegatedObject` | 6 | All 6 hits were clear statements such as `needs no setup`. |
| `ai-tells.ParallelStaccato` | 6 | The rule flags runs of short sentences. Plain English rule 1 asks for short sentences. |

### Rules turned down

| Rule | New level | Hits | Reason |
| --- | --- | --- | --- |
| `ai-tells.VerbTricolon` | suggestion | 23 | All hits were real lists of 3 items, such as settings or steps. |
| `ai-tells.AnnouncementHeadings` | warning | 1 | Guides use headings such as `What the app records`. |
| `ai-tells.ExplainerHeadings` | warning | 1 | Guides use headings such as `Where the checks run`. |
| `ai-tells.AnthropomorphicCognition` | warning | 4 | 1 hit had a person as the subject: `each player decides`. |
| `ai-tells.ContrastiveNegation` | warning | 3 | The `ai-tells` README lists this rule as noisy. The hits were lists of missing features in a comparison table. |
| `ai-tells.FigurativeKeeps` | warning | 1 | The hit was a literal instruction: `keep the PRs small`. |
| `ai-tells.HedgingPhrases` | warning | 1 | The hit was `at the same time` in its literal sense. The app reads files while the game writes them. |
| `ai-tells.NegatedSubject` | warning | 3 | Specs state limits in this form, for example `no login in v1`. |
| `ai-tells.RestatementMarkers` | warning | 1 | The hit was the project term `plain English`. |
| `ai-tells.UniversalSubject` | warning | 1 | Requirements use `every` and `each` on purpose. |

Rules with 1 hit and no clear pattern stay at their level until more text gives more evidence.
The `ai-tells` README also lists `BareHolds` and `NamedAdjective` as noisy.
Both rules had 0 hits in this run, so both stay on.

### FRK rules changed after the run

- `FRK.Questions` checks body paragraphs only.
  All 11 hits were real questions in lists, in table headers or in a bold label.
- `FRK.SentenceLength` is an error now.
  All 13 hits had more than 25 words.
- `FRK.Readability` scores each paragraph with 40 words or more.
  The 2 documents score grade 5.1 and 6.7 as a whole, which hides the dense paragraphs.
  Without a minimum, 34 paragraphs score above grade 9.
  Most of them are short, and a short paragraph is too small a sample for the formula.
  For example, a 7-word sentence with 2 long words scores grade 10.7.
  With the 40-word minimum, 6 paragraphs score above grade 9, all in the product spec.
- `FRK.HeadingCase` replaces `ai-tells-experimental.HeadingTitleCase`.
  Vale gives vocabulary exceptions only to styles in `BasedOnStyles`, so the experimental rule flagged names such as `OpenSpec`.

### Spelling

`FRK.Spelling` uses the strict en_US dictionary, because the built-in dictionary accepts British spellings.
The first run had 305 spelling hits.
The `frk` dictionary and the `FRK` vocabulary bring them down to 94 hits of 28 words:

- 6 terms of the project, such as `guildmate` and `keybind`. These terms belong in the glossary of the `specs` repo.
- 6 names of games and services, such as `Archon` and `WCL`. These names go into the `FRK` vocabulary when our own texts use them.
- 6 names of people.
- 5 informal or Latin words, such as `et al.` and `comms`. These hits are correct.
- 4 British spellings, such as `licence`. These hits are correct.
- 1 short tool name of a private repo.

### Open points

- Readability limit: grade 9 per paragraph flags 6 paragraphs in the product spec.
  The rule stays a warning until the rewritten specs give a better sample.
- The glossary in the `specs` repo will add the project terms to a second vocabulary.
