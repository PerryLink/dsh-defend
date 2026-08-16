# Third-party notices

`dsh-defend` bundles no third-party source code. The detection rule library and
the benchmark fixtures are ports of the following upstream assets, all owned by
the same author (PerryLink) and licensed Apache-2.0. The upstream clones under
`upstream/` are read-only reference material: they are gitignored and never
ship in the published package.

| Upstream asset | License | Ported content |
|---|---|---|
| [Prompt-Injection-Payloads](https://github.com/PerryLink/Prompt-Injection-Payloads) | Apache-2.0 | `data/payloads.json` → `src/detect/rules.ts`: 25 payload rules (upstream ids `rh-*`/`ii-*`/`jb-*`/`il-*`/`pl-*`, upstream severities), each with signature needles extracted from the payload prose plus one tolerant paraphrase regex. |
| [Jailbreak-Detector](https://github.com/PerryLink/Jailbreak-Detector) | Apache-2.0 | `data/patterns.json` → `src/detect/rules.ts` (`jd-*` rules, 25 patterns in 3 categories) and the Aho-Corasick matching algorithm → `src/detect/ac.ts` (pure TypeScript reimplementation of the `pyahocorasick` usage; confidence HIGH/MEDIUM mapping became the scanner's confidence aggregation). |
| [Secret-Key-Leaker-Detect](https://github.com/PerryLink/Secret-Key-Leaker-Detect) | Apache-2.0 | The `sk-[a-zA-Z0-9]{20,}` pattern → `src/detect/secrets.ts` (`sk-openai`, source `ported`). Eleven `extended` patterns (OpenAI project keys, Anthropic, GitHub PAT/OAuth/fine-grained, AWS, Bearer, private-key blocks, Slack, generic assignments) extend the vocabulary from the issuers' public API references. |
| [Prompt-Attack-Dataset](https://github.com/PerryLink/Prompt-Attack-Dataset) | Apache-2.0 | `datasets/attacks.json` → `fixtures/attacks.json`: 28 attacks kept verbatim as the detection-rate regression set; `fixtures/clean.txt` is an original zero-false-positive corpus. |

At runtime the plugin only talks to the harness services listed as
peerDependencies; it performs no network requests of its own and stores no
data beyond the in-memory report ring buffer.
