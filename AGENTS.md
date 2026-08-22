# AGENTS.md

Standalone DeepSeek Harness plugin repository (`dsh-defend`). Development follows the dsh-plugin-guide skill and the official plugin contract; this file records repo-local decisions.

## Layout

- `src/index.ts` — function-plugin contract (`name`/`inject`/`Config`/`apply`; NO default export). Two independent layers share this entry: the destructive-delete guard (prepend listener on `tools/pre-execute`, deny/ask only) and the detection layer (three interception points + report surfaces).
- `src/detect/ac.ts` — pure TypeScript Aho-Corasick automaton (ported from Jailbreak-Detector's `pyahocorasick` usage; case-insensitive like upstream).
- `src/detect/types.ts` — the shared vocabulary: `Severity`/`Family`/`Surface` closed enums, `Rule`, `MatchInfo`, `ScanReport`, `CLEAN_REPORT`.
- `src/detect/rules.ts` — the injection/jailbreak rule library: 25 Prompt-Injection-Payloads rules (upstream ids/severities, signature needles + tolerant regexes) + 25 Jailbreak-Detector patterns (`jd-*` ids, category-tolerant regexes).
- `src/detect/secrets.ts` — 12 secret grammars (1 ported upstream `sk-…`, 11 extended issuer patterns) + `SECRET_TYPE_BY_RULE_ID`. Regex-only by design: secret matching is structural, never literal.
- `src/detect/scanner.ts` — one automaton over all needles + per-rule regexes; length cap, one match per rule, secret-type annotation, `safeSnippet` (in-place redaction for secret spans).
- `src/events.ts` — `defend/detection` `SessionEventMap` member (declaration merging) + payload type + `AuditAppend`, the append surface that requests the envelope's `ignorable: true` marker. Pre-marker hosts (every released line so far — rc8 and 0.1.1-rc.x re-verified 2026-08-22) silently drop the options bag, so the runtime detects them BEFORE the first append (peer-version pre-check, then a probe of the appended envelope's return value) and disables session-log audit with a one-time warning — `detection.allowUnmarkedAudit: true` opts back in (see https://github.com/PerryLink/dsh-defend/issues/2).
- `fixtures/` — `attacks.json` (28 Prompt-Attack-Dataset attacks verbatim) and `clean.txt` (zero-false-positive corpus). The benchmark test pins the measured detection-rate floor; raising the floor needs new rules, lowering it needs a PR explanation.
- `tests/` — vitest; real Cordis `Context` + real `SessionStore`/`Session`/`ToolRuntime`/`Commands`/`ApprovalService` from the `0.1.0-rc.8` peers; the agent object is a structural fake. `guard-hook.spec.ts` covers the destructive-delete guard, `detect.spec.ts` the pure layer, `defend-detect.spec.ts` the interception wiring through real waterfalls, `audit-support.spec.ts` the ignorable-marker host-capability degradation.

## Hard rules applied here

- **Waterfall discipline.** Every interception listener calls `next()` on every pass-through — including the `allow` tier — and only claims a call with a deliberate deny/ask/block/reject. The guard's deny path is the one intentional short-circuit (prepend, occupies the first slot).
- **Decisions ride official seams.** deny/ask on `tools/pre-execute` (PreToolDecision), accept/block on `tools/post-execute` (PostToolDecision), enter/reject on `agent/pre-step` (PreStepDecision), ask through `ctx.approval` (`request` → `allowed-once`). No answerer = fail closed. `agent/request` is deliberately NOT intercepted — it is the LLM-call-config waterfall with no message content.
- **Seam-checked facts (verified against the checkout, recorded here so nobody re-derives them):** post-execute cannot replace the value of a FAILED result; `agent/pre-step` reject carries no reason (the audit event does); approval outcomes are `allowed-once`/`rejected`/`cancelled`/`unavailable`.
- **Secrets stay type-only.** Match records, audit events, and the report ring buffer never carry matched text; `safeSnippet` redacts credential spans in place.
- **Model-visible ⟺ logged.** The model-visible part of every interception is the deny/ask reason or the post-execute feedback; the `defend/detection` event carries the same rule facts so decisions reconstruct from the session log.
- **Bounded everything.** Scan length cap, one match per rule, ring-buffer cap, diff-less reports. Clean inputs cost one automaton pass.
- **Optional services fail closed.** `approval`/`tools`/`commands` are read with `ctx.get()`; missing services degrade (deny instead of ask, skip the report surfaces) instead of breaking the guard.
- **No hardcoded tunables.** Every action tier, cap, and switch is a Schemastery `Config` field documented in `cordis.patch.yml` and the five READMEs.

## Checks

`pnpm run typecheck && pnpm run typecheck:ci && pnpm test && pnpm run build && pnpm run verify:self-contained && pnpm run verify:artifacts && pnpm pack`

`typecheck` resolves `@deepseek-ai/*` through tsconfig paths to the local harness checkout; `typecheck:ci` checks against the published `0.1.0-rc.8` types. Both stay green — see dsh-click's AGENTS.md for the shared rationale.

## Release

`scripts/release.mjs` does not exist here; the release step is manual: stamp CHANGELOG `[Unreleased]` → `[x.y.z] - <UTC date>`, re-run the full gate, commit `chore(release): x.y.z`, tag `v<x.y.z>`, push `--follow-tags`. The release workflow publishes to npm with provenance and builds the GitHub Release from the changelog section.

## Docs

- Five-language READMEs (`README.md`, `README.zh.md`, `README.es.md`, `README.pt.md`, `README.hi.md`) — keep all five in sync; the English file is the source of truth.
- GitHub topics `dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety` (mirror `package.json` keywords; the ecosystem's visibility channel is the `dsh-plugin` topic).
- License is Apache-2.0 (`LICENSE` + package.json `license`). `THIRD_PARTY_NOTICES.md` documents the four upstream assets and the ported content.
