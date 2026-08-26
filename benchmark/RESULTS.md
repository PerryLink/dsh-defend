# dsh-defend red-team benchmark results

> Deterministic scanner benchmark. Regenerate with
> `node --experimental-strip-types benchmark/run.mjs` (zero new dependencies; the scanner
> is the shipped `src/detect` source).

## Method

- **Detector**: `buildScanner()` — NFKC normalization, the Aho-Corasick automaton over all
  needles, per-rule tolerant regexes, and the Shannon-entropy gate on secret matches
  (default `minSecretEntropy: 3.0`). Each category is scanned with only that category's
  family enabled, so a match is a per-category detection.
- **Detection** = at least one match in the category's family.
- **Labels**: `label: true` = an attack/secret of that category; `label: false` = benign
  or near-miss text (including low-entropy secret lookalikes for the entropy gate).

## Per-category metrics

| Category | TP | FP | FN | TN | Precision | Recall | F1 | FPR |
|---|---|---|---|---|---|---|---|---|
| injection | 25 | 0 | 0 | 10 | 1.000 | 1.000 | 1.000 | 0.000 |
| jailbreak | 25 | 0 | 0 | 10 | 1.000 | 1.000 | 1.000 | 0.000 |
| secret | 22 | 1 | 3 | 9 | 0.957 | 0.880 | 0.917 | 0.100 |

## Overall

| Aggregate | Precision | Recall | F1 |
|---|---|---|---|
| Macro (mean of the three categories) | 0.986 | 0.960 | 0.972 |
| Micro (pooled TP/FP/FN across categories) | 0.986 | 0.960 | 0.973 |

- Samples: 105 total
  (75 positive,
   30 negative).
- Micro false-positive rate: 0.033.

## Per-sample notes

- Missed positives (false negatives): secret/sec-pos-23, secret/sec-pos-24, secret/sec-pos-25.
- Flagged negatives (false positives): secret/sec-neg-04.

## Comparison with the documented floor (27/28)

The repository pins a detection-rate floor on the upstream Prompt-Attack-Dataset fixture
(`fixtures/attacks.json`): **27 of 28** attacks detected (see README `Known limitations`
and `tests/detect.spec.ts`). Re-running that fixture with this same scanner reproduces:

- Detected: **27/28** (0.964).
- Missed: en_004.

The one documented miss (`en_004`'s lookalike Unicode) normalizes to "how to hack a system",
which the rule library still has no needle/regex for. This benchmark's category split is
stricter than the fixture: it adds per-category negatives (benign + low-entropy secret
lookalikes) and evaluates F1, not just recall, so a high detection rate here is a stronger
claim than the flat 27/28 recall.

## Known limitations (honest)

- **Vocabulary-bound.** Injection/jailbreak detection is only as broad as the ported rule
  library; novel phrasing and multi-step attacks can evade it.
- **Secret matching is structural.** Regex + entropy gate; no checksum/liveness validation
  and no issuer round-trip, so a well-formed synthetic credential is flagged by design.
- **GitHub token subtypes.** The secret vocabulary covers `ghp_` and `gho_` (plus
  `github_pat_`), not the `ghs_`/`ghr_`/`ghu_` GitHub App/refresh/user tokens, so
  those positives are reported as false negatives.
- **`aws-secret-key` grammar not in the committed dataset.** Its 40-character value is
  AWS-secret-shaped and GitHub push protection rejects committing such a literal, so that
  single grammar is exercised by a runtime test (`tests/benchmark.spec.ts`) instead of a
  dataset row. Every other secret grammar is measured here.
- **Entropy gate scores the whole regex match.** `found[0]` includes the key name and
  separator, so `password: <low-diversity-value>` can clear the gate when the key name
  itself adds enough entropy (see `sec-neg-04`).
- **No model verdicts.** The scanner is deterministic; it never judges intent.
