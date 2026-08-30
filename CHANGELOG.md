# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-08-30

### Changed

- Host `0.1.2-alpha.1` compatibility: master removed the `ignorable` envelope (42dc2a46c2) and fail-closes on unknown session event types, so `isUnmarkedHostVersion` now also classifies `0.1.2-alpha.1`+ lines as unmarked, and the audit sink fails closed (disables session-log audit BEFORE the first append) when the peer version is unresolvable 鈥?appending an unregistered `defend/detection` event would make sessions unloadable. `detection.allowUnmarkedAudit: true` still opts back in.

### Fixed

- Approval calls are wrapped in try/catch: hosts that throw when no approval turn is open now fail closed instead of surfacing an unhandled rejection on the guard seam.
- Test harness derives synthetic tool-call ids from `tools.execute`'s input type (the host renamed the `CallId` brand to `ToolCallId`), keeping `typecheck` (checkout) and `typecheck:ci` (published `0.1.1-rc.2`) both green.

## [0.2.0] - 2026-08-26

### Added

- **NFKC/Unicode normalization before every scan.** Lookalike/full-width Unicode (`饾晙gnore 饾晵ll previous 饾暁nstructions`) now collapses to its ASCII compatibility equivalent before the automaton and regexes run, closing the lookalike-Unicode bypass. Configurable via `detection.normalizeUnicode` (default `true`).
- **Secret entropy gate.** A secret regex hit is admitted only when its Shannon entropy per character clears `detection.secretMinEntropy` (default `3.0`; `0` disables), dropping low-diversity false positives such as `api_key: aaaaaaaaaaaaaaaa`. The gate scores the matched text in place and never carries it into the match record or the audit path.

## [0.1.4] - 2026-08-23

## [0.1.3] - 2026-08-22

### Changed

- **DeepSeek Harness 0.1.1-rc.2 compatibility release.** `@deepseek-ai/dsh-*` devDependencies pin the exact `0.1.1-rc.2` line and peerDependencies stay `>=0.1.0-rc.8 <0.2.0` (the plugin uses no rc.2-only API). The workshop compatibility manifest, the pnpm minimum-release-age allowlist, the compat workflow's dsh CLI/bundle pins, and the five-language READMEs declare the rc.2 baseline. The pre-marker audit boundary is unchanged (`isUnmarkedHostVersion` still classifies `0.1.1-rc.2` as pre-marker): rc.2's `Session.append` still drops the options bag, so session-log audit stays disabled on the released rc.2 line with the same one-time warning. Full gate passes against rc.2.

## [0.1.2] - 2026-08-22

### Changed

- **DeepSeek Harness 0.1.0-rc.8 compatibility release.** `@deepseek-ai/dsh-*` devDependencies pin the exact `0.1.0-rc.8` line and peerDependencies widen to `>=0.1.0-rc.8 <0.2.0`; the workshop compatibility manifest and the five-language READMEs declare the rc.8 baseline. Full gate passes against rc.8 (75 tests, typecheck against local and published types, lint, coverage, build, verification) and a real rc.8 headless profile smoke run mounts the bundle.

### Fixed

- **Pre-marker host boundary corrected for rc.8 (re-verified 2026-08-22).** Every released harness line so far 鈥?`0.1.0-rc.1`鈥揱0.1.0-rc.8` and `0.1.1-rc.1`鈥揱0.1.1-rc.2` 鈥?silently drops the `Session.append` options bag, so the previous boundary (which treated rc.8+ as marker-capable) let one unmarked audit event land before the probe disabled audit. `isUnmarkedHostVersion` now classifies all released lines as pre-marker (audit disabled before the first append, one-time warning); future unknown lines still fall back to the append-envelope probe, so the marker surface auto-enables when a harness line actually ships it.
- `/defend` exercise surfaces (`scripts/loader-runner.mjs`, `tests/defend-detect.spec.ts`) pass the rc.8 `commands.execute` four-argument signature (agent, line, images, signal).

## [0.1.1] - 2026-08-21

### Fixed

- `defend/detection` audit events now request the envelope's `ignorable: true` marker, and hosts whose `Session.append` predates the marker (the released `0.1.0-rc.1`鈥揱0.1.0-rc.7` lines, which silently drop the options bag) are detected at first use 鈥?peer-version pre-check plus a probe of the appended envelope 鈥?so session-log audit is disabled there with a one-time warning instead of writing unmarked events that make sessions unresumable on stricter builds ([#2](https://github.com/PerryLink/dsh-defend/issues/2)). `detection.allowUnmarkedAudit: true` opts back in; existing unmarked rows can be repaired by adding `"ignorable": true` to their envelopes.

## [0.1.0] - 2026-08-16

- Initial release: the destructive-delete guard plus the four-asset detection layer with allow/ask/block interception, audit events, and report surfaces.

### Added

- Destructive-delete guard on `tools/pre-execute`: recursively deleting commands are refused unless every target is an explicit absolute path inside the session workspace and outside protected prefixes (home/config/system directories) 鈥?the executable form of the 8路14/8路16 postmortem lesson (deny by default, `ask` configurable, dry-run markers pass).
- Detection layer ported from four upstream assets (Apache-2.0, see THIRD_PARTY_NOTICES.md):
  - Prompt-Injection-Payloads: 25 payload rules (`rh-*`/`ii-*`/`jb-*`/`il-*`/`pl-*`) with signature needles and tolerant paraphrase regexes.
  - Jailbreak-Detector: 25 patterns in 3 categories (`jd-*`) through a pure TypeScript Aho-Corasick automaton, plus tolerant category regexes.
  - Secret-Key-Leaker-Detect: the upstream `sk-鈥 pattern plus 11 extended credential grammars (OpenAI project, Anthropic, GitHub PAT/OAuth/fine-grained, AWS, Bearer, private-key blocks, Slack, generic assignments).
  - Prompt-Attack-Dataset: 28 attacks kept verbatim as `fixtures/attacks.json` with a measured detection-rate floor and a clean-corpus zero-false-positive regression.
- Three-tier interception (allow/ask/block, defaults ask; critical secrets always block): inbound messages on `agent/pre-step`, tool arguments on `tools/pre-execute`, tool results on `tools/post-execute`; ask rides the official approval seam and fails closed without an answerer; pass-throughs always call `next()`.
- Sanitized `defend/detection` session audit events (rule id/family/severity/action only 鈥?never matched text; secret matches are type-only).
- `defend_report` tool and `/defend` command over a bounded in-memory ring buffer.

### Fixed

- Guard-hook spec type narrowing (`PreToolDecision.reason` behind a `kind === 'deny'` check) and unused listener parameters.

