<div align="center">

# 🛡️ dsh-defend

**Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness.**

*Rules decide the known. Interception decides the rest — and everything is audited.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-defend/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-defend/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-defend?label=version)](https://github.com/PerryLink/dsh-defend/releases)
[![npm version](https://img.shields.io/npm/v/dsh-defend)](https://www.npmjs.com/package/dsh-defend)
[![npm downloads](https://img.shields.io/npm/dm/dsh-defend)](https://www.npmjs.com/package/dsh-defend)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## Compatibility

| Surface | Status |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` (compat declared for `0.1.0-rc.5`–`0.1.0-rc.6`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Platforms | All (pure host; no native code, no network) |
| Model | Any (detection runs before content reaches the model) |

## What you get

`dsh-defend` puts two independent layers in front of the agent:

1. **Destructive-delete guard** — the executable form of the 8·14/8·16 postmortem lesson. On `tools/pre-execute`, recursively deleting shell commands are refused unless **every** target is an explicit absolute path inside the session workspace and outside the protected prefixes (home config, `.dsh`/`.claude`, system directories). Dry-run markers (`-WhatIf`, `--dry-run`, `git clean -n`) pass, because they are exactly the check the lesson demands.
2. **Detection layer** — ported from four upstream assets (all Apache-2.0, see THIRD_PARTY_NOTICES.md): 25 Prompt-Injection-Payloads rules, 25 Jailbreak-Detector patterns through a pure-TypeScript Aho-Corasick automaton, 12 secret grammars from Secret-Key-Leaker-Detect plus the issuers' public references, and the Prompt-Attack-Dataset kept verbatim as the regression benchmark.

Three interception points, one decision model each:

| Point | Scanned | Decision |
|---|---|---|
| `agent/pre-step` | inbound user messages | allow → `next()`; ask → approval; block → reject the step |
| `tools/pre-execute` | tool arguments | allow → `next()`; ask → approval; block → deny |
| `tools/post-execute` | tool results | allow → `next()`; ask → approval; block → corrective feedback |

Defaults: `ask` for every family, `block` for **critical** secrets (the upstream interrupt-on-sight semantics). No approval answerer = fail closed. Every pass-through calls `next()` — downstream policy plugins are never short-circuited.

```text
inbound message ── agent/pre-step ── scan ── clean → next()/enter
tool arguments ── tools/pre-execute ── scan ── allow → next()
tool results   ── tools/post-execute ── scan ── block → feedback
                                  │
                                  └─ defend/detection audit (rule id, family,
                                     severity, decision — never matched text)
```

## Quick start

```sh
# 1. install the bundle into your profile
dsh plugin --profile web add "github:PerryLink/dsh-defend#main"

# or from npm (published releases)
dsh plugin --profile web add dsh-defend

# 2. restart and verify the row
dsh --profile web --dump-config | grep -A3 'id: dsh-defend'
```

## Install & uninstall

- **git channel** (latest `main`): `dsh plugin --profile web add "github:PerryLink/dsh-defend#main"` — the `prepare` script builds with production dependencies only.
- **npm channel** (published releases): `dsh plugin --profile web add dsh-defend`.
- **tarball channel**: `pnpm pack` in this repo, then `dsh plugin --profile web add ./dsh-defend-<version>.tgz`.
- **uninstall**: `dsh plugin --profile web remove dsh-defend` (or remove the row from the profile patch).

## Configuration

All tunables are Schemastery `Config` fields (changeable from cordis.yml). An id-targeted override replaces the whole row — restate every key you need. `cordis.patch.yml` documents each key inline.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Master switch for both layers |
| `action` | `deny` | Destructive-delete guard action (`deny` / `ask`) |
| `toolNames` | `['bash','persistent-bash','terminal-bash']` | Tool names whose command arguments the guard reviews |
| `detection.enabled` | `true` | Detection-layer switch |
| `detection.maxScanChars` | `10000` | Scan cap per interception (head only) |
| `detection.injectionAction` | `ask` | Injection family: `allow` / `ask` / `block` |
| `detection.jailbreakAction` | `ask` | Jailbreak family: `allow` / `ask` / `block` |
| `detection.secretAction` | `ask` | Secret family: `allow` / `ask` / `block` |
| `detection.secretBlockCritical` | `true` | Critical secrets always block regardless of `secretAction` |
| `detection.audit` | `true` | Write `defend/detection` session audit events |
| `detection.maxReportEntries` | `200` | In-memory report ring-buffer cap |
| `registerCommand` | `true` | Register the `/defend` command |
| `registerTool` | `true` | Register the `defend_report` tool |

## Tools & surfaces

| Surface | Kind | Notes |
|---|---|---|
| `defend_report` | tool | Totals (recorded/blocked/asked), per-family counts, and the 20 most recent matches — never matched text |
| `/defend` | command | The same summary as text |
| `agent/pre-step` | listener | Inbound message scanning (enter/reject) |
| `tools/pre-execute` | listener | Tool-argument scanning (deny/ask) + the destructive-delete guard |
| `tools/post-execute` | listener | Tool-result scanning (block feedback) |

## Permissions & data

- **Permissions**: ask decisions ride the official approval seam; nothing is re-implemented or bypassed. The plugin declares `session:append` and `network:none` in its workshop manifest.
- **Data**: nothing is stored on disk; the report ring buffer is in-memory and bounded. No network requests, no subprocesses.
- **Session log**: `defend/detection` events carry rule id, family, category, severity, secret type, decision, and scan facts — matched text never reaches the log, and secret matches are type-only by construction.

## Security boundaries

- **Detection, not enforcement.** The guard and the detection layer only produce deny/ask/block decisions on official seams; the sandbox and approval systems remain the enforcement authorities.
- **Fail closed.** Missing approval answerer, missing session, or a missing services surface degrades to the strictest decision — never to silent pass-through.
- **No content leaves the process.** Scanning is local; audit events are sanitized; secrets are never logged, displayed, or reported.
- **Bounded work.** Scan caps, one match per rule, and ring-buffer bounds keep hostile inputs from consuming unbounded resources.

## Known limitations

- **Detection gaps.** The rule library catches the ported vocabularies and their tolerant variants; novel phrasing, lookalike-Unicode encodings (NFKC normalization is tracked as future work), and multi-step attacks can evade it. The benchmark pins the measured floor (27/28 on the upstream dataset) so regressions are visible.
- **No model-level verdicts.** `dsh-defend` is deterministic; it never calls a model and cannot judge novel intent.
- **Message rejection is silent.** `agent/pre-step` reject carries no reason to the model (the seam has no reason field); the audit event records the rule facts.
- **Session audit on newer harness builds.** Audit appends use the two-argument `Session.append` form (the pinned rc.6 peers have no append-envelope option); on post-rc.6 builds the events are required-on-read, which is fine while this plugin is installed because it declares the event type.

## Development

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests against the local harness checkout
pnpm run typecheck:ci  # tsc against the published 0.1.0-rc.6 types (no paths)
pnpm test           # vitest: 49 tests, 4 suites (detection benchmark incl.)
pnpm run build      # tsdown bundle + tsc declarations (lib/)
pnpm run verify:self-contained  # dependency specs resolve from the registry
pnpm run verify:artifacts       # built ESM face + shipped files present
pnpm pack           # the published tarball
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creator and maintainer: destructive-delete guard, the four-asset detection port, interception wiring, audit surface, and the five-language docs.

## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors
