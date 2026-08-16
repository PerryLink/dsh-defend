# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately through GitHub's private vulnerability reporting:

**https://github.com/PerryLink/dsh-defend/security/advisories/new**

That flow keeps the report confidential while we triage, and it is the channel we watch first.

## Before you report

- **Redact sensitive data** from any logs, session excerpts, or payload samples you attach: tokens, API keys, secrets, Authorization/request headers, personal paths, and account identifiers. Trimmed rule ids and severity facts are usually enough.
- Include, when possible: the plugin version, the harness (`dsh`) version, Node and OS versions, and the minimal steps to reproduce.

## What to expect

- **Acknowledgment**: within 5 business days.
- **Triage**: within 10 business days we confirm the issue and assess severity, or ask for more details.
- **Fix**: security fixes are prepared in a private fork, released as a patch version, and announced in the release notes.

## Disclosure and credit

- We follow coordinated disclosure: a public advisory (and CVE request where appropriate) is published once a fix ships.
- Reporters are credited in the advisory unless they ask to remain anonymous. There is no bug bounty program at this time.

## Scope

This plugin is a detection and interception layer inside the harness. Its own guarantees:

- Interceptions ride the official seams (`tools/pre-execute`, `tools/post-execute`, `agent/pre-step`, the approval service) — the plugin never re-implements or bypasses them, and every pass-through calls `next()`.
- Audit events are sanitized by construction: rule id, family, severity, and decision only; matched text never reaches the session log, and secret matches are type-only.
- The plugin performs no network requests, stores no credentials, and executes no subprocesses.

Bypasses of this detector are detection gaps (false negatives), not vulnerabilities in the harness itself — but report them anyway so the rule library can improve. Vulnerabilities in the harness itself should be reported to the official harness maintainers instead.
