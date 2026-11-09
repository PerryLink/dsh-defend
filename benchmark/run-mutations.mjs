// benchmark/run-mutations.mjs — reorder/synonym/obfuscation mutation gate.
//
// The 105-sample red-team set is in-distribution: it measures the shipped
// needles, not whether a paraphrase is caught. This set holds 10 positive
// mutations (reorder, synonym, zero-width, Cyrillic, Chinese) and 4 benign
// near-misses. It is intentionally small and adversarial; a release must not
// regress below 9/10 or admit a benign near-miss.
//
//   node --experimental-strip-types benchmark/run-mutations.mjs
//
// Exit 0 when the gate passes, 1 otherwise.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildScanner } from '../src/detect/index.ts'

const here = dirname(fileURLToPath(import.meta.url))
const cases = JSON.parse(readFileSync(join(here, 'mutations.json'), 'utf8'))
const scanner = buildScanner()

let positives = 0
let hits = 0
const falsePositives = []
const rows = []

for (const entry of cases) {
  const report = scanner.scan(entry.text, { families: ['injection'] })
  const detected = report.matches.length > 0
  if (entry.kind === 'benign') {
    if (detected) falsePositives.push(entry.id)
  } else {
    positives += 1
    if (detected) hits += 1
  }
  rows.push({ id: entry.id, kind: entry.kind, detected })
}

const rate = positives === 0 ? 0 : hits / positives
const result = { positives, hits, rate, falsePositives, rows }
console.log(JSON.stringify(result, null, 2))

if (rate < 0.9 || falsePositives.length > 0) {
  console.error(`mutation gate failed: ${hits}/${positives} positives, ${falsePositives.length} benign false positives`)
  process.exit(1)
}
console.log(`mutation gate passed: ${hits}/${positives} positives, 0 benign false positives`)
