# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Destructive-delete guard on `tools/pre-execute`: recursively deleting commands are refused unless every target is an explicit absolute path inside the session workspace and outside protected prefixes (home/config/system directories) — the executable form of the 8·14/8·16 postmortem lesson (deny by default, `ask` configurable, dry-run markers pass).
- Detection layer ported from four upstream assets (Apache-2.0, see THIRD_PARTY_NOTICES.md):
  - Prompt-Injection-Payloads: 25 payload rules (`rh-*`/`ii-*`/`jb-*`/`il-*`/`pl-*`) with signature needles and tolerant paraphrase regexes.
  - Jailbreak-Detector: 25 patterns in 3 categories (`jd-*`) through a pure TypeScript Aho-Corasick automaton, plus tolerant category regexes.
  - Secret-Key-Leaker-Detect: the upstream `sk-…` pattern plus 11 extended credential grammars (OpenAI project, Anthropic, GitHub PAT/OAuth/fine-grained, AWS, Bearer, private-key blocks, Slack, generic assignments).
  - Prompt-Attack-Dataset: 28 attacks kept verbatim as `fixtures/attacks.json` with a measured detection-rate floor and a clean-corpus zero-false-positive regression.
- Three-tier interception (allow/ask/block, defaults ask; critical secrets always block): inbound messages on `agent/pre-step`, tool arguments on `tools/pre-execute`, tool results on `tools/post-execute`; ask rides the official approval seam and fails closed without an answerer; pass-throughs always call `next()`.
- Sanitized `defend/detection` session audit events (rule id/family/severity/action only — never matched text; secret matches are type-only).
- `defend_report` tool and `/defend` command over a bounded in-memory ring buffer.

### Fixed

- Guard-hook spec type narrowing (`PreToolDecision.reason` behind a `kind === 'deny'` check) and unused listener parameters.

## [0.1.0] - 2026-08-16

- Initial release: the destructive-delete guard plus the four-asset detection layer with allow/ask/block interception, audit events, and report surfaces.
