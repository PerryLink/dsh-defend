// benchmark/run.mjs — deterministic red-team benchmark runner for dsh-defend.
//
// Runs the real scanner (src/detect/scanner.ts: NFKC normalization + Aho-Corasick
// needles + tolerant regexes + the secret entropy gate) over the labeled dataset,
// one category family at a time, then writes:
//   benchmark/results.json  — per-category confusion matrix + P/R/F1 + per-sample verdict
//   benchmark/RESULTS.md    — the human-readable report, including a comparison with
//                             the documented 27/28 detection floor on the upstream fixture
//
// The scanner is published only as TypeScript source (src/detect), so the runner
// imports it directly and is launched through Node's type stripping — the engines
// range runs it (Node >= 22.6 with the flag, unflagged by default on >= 23.6):
//   node --experimental-strip-types benchmark/run.mjs
// Zero new dependencies, no build step. Exit 0 on success; a malformed dataset or
// an engine too old for type stripping exits non-zero.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildScanner } from '../src/detect/index.ts'
import { macroAverage, microAverage, metricsFor } from './metrics.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const datasetPath = join(here, 'dataset', 'redteam.json')
const fixturePath = join(root, 'fixtures', 'attacks.json')
const resultsJsonPath = join(here, 'results.json')
const resultsMdPath = join(here, 'RESULTS.md')

const dataset = JSON.parse(readFileSync(datasetPath, 'utf8'))
const scanner = buildScanner()

/** Detected = at least one match in the requested family. */
function detect(text, family) {
  return scanner.scan(text, { families: [family] }).matches.length > 0
}

const perCategory = dataset.categories.map(category => {
  const outcomes = category.samples.map(sample => {
    const predicted = detect(sample.text, category.family)
    return { id: sample.id, label: sample.label, predicted }
  })
  return { id: category.id, family: category.family, metrics: metricsFor(outcomes), samples: outcomes }
})

const classMetrics = perCategory.map(entry => entry.metrics)
const overall = {
  macro: macroAverage(classMetrics),
  micro: microAverage(classMetrics),
}

// --- Upstream fixture floor (27/28 documented in README/AGENTS) ---------------
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'))
const fixtureAttacks = fixture.categories.flatMap(category =>
  category.attacks.map(attack => ({ ...attack, family: category.family })))
const fixtureMisses = []
for (const attack of fixtureAttacks) {
  if (scanner.scan(attack.prompt).matches.length === 0) fixtureMisses.push(attack.id)
}
const fixtureFloor = {
  total: fixtureAttacks.length,
  detected: fixtureAttacks.length - fixtureMisses.length,
  misses: fixtureMisses,
}

const results = {
  name: dataset.name,
  version: dataset.version,
  detector: dataset.detector,
  generatedBy: 'benchmark/run.mjs',
  perCategory: perCategory.map(entry => ({
    id: entry.id,
    family: entry.family,
    ...entry.metrics,
    samples: entry.samples,
  })),
  overall,
  fixtureFloor,
}

writeFileSync(resultsJsonPath, `${JSON.stringify(results, null, 2)}\n`)

// --- Markdown report ---------------------------------------------------------

const fmt = value => Number(value).toFixed(3)

const rows = perCategory.map(entry => {
  const m = entry.metrics
  return `| ${entry.id} | ${m.tp} | ${m.fp} | ${m.fn} | ${m.tn} | ${fmt(m.precision)} | ${fmt(m.recall)} | ${fmt(m.f1)} | ${fmt(m.fpr)} |`
}).join('\n')

const misses = []
const falsePositives = []
for (const entry of perCategory) {
  for (const sample of entry.samples) {
    if (sample.label && !sample.predicted) misses.push(`${entry.id}/${sample.id}`)
    if (!sample.label && sample.predicted) falsePositives.push(`${entry.id}/${sample.id}`)
  }
}

const md = `# dsh-defend red-team benchmark results

> Deterministic scanner benchmark. Regenerate with
> \`node --experimental-strip-types benchmark/run.mjs\` (zero new dependencies; the scanner
> is the shipped \`src/detect\` source).

## Method

- **Detector**: \`buildScanner()\` — NFKC normalization, the Aho-Corasick automaton over all
  needles, per-rule tolerant regexes, and the Shannon-entropy gate on secret matches
  (default \`minSecretEntropy: 3.0\`). Each category is scanned with only that category's
  family enabled, so a match is a per-category detection.
- **Detection** = at least one match in the category's family.
- **Labels**: \`label: true\` = an attack/secret of that category; \`label: false\` = benign
  or near-miss text (including low-entropy secret lookalikes for the entropy gate).

## Per-category metrics

| Category | TP | FP | FN | TN | Precision | Recall | F1 | FPR |
|---|---|---|---|---|---|---|---|---|
${rows}

## Overall

| Aggregate | Precision | Recall | F1 |
|---|---|---|---|
| Macro (mean of the three categories) | ${fmt(overall.macro.precision)} | ${fmt(overall.macro.recall)} | ${fmt(overall.macro.f1)} |
| Micro (pooled TP/FP/FN across categories) | ${fmt(overall.micro.precision)} | ${fmt(overall.micro.recall)} | ${fmt(overall.micro.f1)} |

- Samples: ${perCategory.reduce((sum, entry) => sum + entry.samples.length, 0)} total
  (${classMetrics.reduce((sum, m) => sum + m.positives, 0)} positive,
   ${classMetrics.reduce((sum, m) => sum + m.negatives, 0)} negative).
- Micro false-positive rate: ${fmt(overall.micro.fpr)}.

## Per-sample notes

- Missed positives (false negatives): ${misses.length === 0 ? 'none' : misses.join(', ')}.
- Flagged negatives (false positives): ${falsePositives.length === 0 ? 'none' : falsePositives.join(', ')}.

## Comparison with the documented floor (27/28)

The repository pins a detection-rate floor on the upstream Prompt-Attack-Dataset fixture
(\`fixtures/attacks.json\`): **27 of 28** attacks detected (see README \`Known limitations\`
and \`tests/detect.spec.ts\`). Re-running that fixture with this same scanner reproduces:

- Detected: **${fixtureFloor.detected}/${fixtureFloor.total}** (${fmt(fixtureFloor.detected / fixtureFloor.total)}).
- Missed: ${fixtureFloor.misses.length === 0 ? 'none' : fixtureFloor.misses.join(', ')}.

The one documented miss (\`en_004\`'s lookalike Unicode) normalizes to "how to hack a system",
which the rule library still has no needle/regex for. This benchmark's category split is
stricter than the fixture: it adds per-category negatives (benign + low-entropy secret
lookalikes) and evaluates F1, not just recall, so a high detection rate here is a stronger
claim than the flat 27/28 recall.

## Known limitations (honest)

- **Vocabulary-bound.** Injection/jailbreak detection is only as broad as the ported rule
  library; novel phrasing and multi-step attacks can evade it.
- **Secret matching is structural.** Regex + entropy gate; no checksum/liveness validation
  and no issuer round-trip, so a well-formed synthetic credential is flagged by design.
- **GitHub token subtypes.** The secret vocabulary covers \`ghp_\` and \`gho_\` (plus
  \`github_pat_\`), not the \`ghs_\`/\`ghr_\`/\`ghu_\` GitHub App/refresh/user tokens, so
  those positives are reported as false negatives.
- **\`aws-secret-key\` grammar not in the committed dataset.** Its 40-character value is
  AWS-secret-shaped and GitHub push protection rejects committing such a literal, so that
  single grammar is exercised by a runtime test (\`tests/benchmark.spec.ts\`) instead of a
  dataset row. Every other secret grammar is measured here.
- **Entropy gate scores the whole regex match.** \`found[0]\` includes the key name and
  separator, so \`password: <low-diversity-value>\` can clear the gate when the key name
  itself adds enough entropy (see \`sec-neg-04\`).
- **No model verdicts.** The scanner is deterministic; it never judges intent.
`;

writeFileSync(resultsMdPath, md)

// --- stdout summary ----------------------------------------------------------

console.log(`dsh-defend red-team benchmark: ${perCategory.length} categories, ${results.perCategory.reduce((s, t) => s + t.total, 0)} samples`)
for (const entry of perCategory) {
  const m = entry.metrics
  console.log(`  ${entry.id.padEnd(10)} P=${fmt(m.precision)} R=${fmt(m.recall)} F1=${fmt(m.f1)} (TP ${m.tp}, FP ${m.fp}, FN ${m.fn})`)
}
console.log(`  macro F1=${fmt(overall.macro.f1)}  micro F1=${fmt(overall.micro.f1)}`)
console.log(`  fixture floor: ${fixtureFloor.detected}/${fixtureFloor.total} (misses: ${fixtureFloor.misses.join(', ') || 'none'})`)
console.log(`wrote ${resultsJsonPath} and ${resultsMdPath}`)
