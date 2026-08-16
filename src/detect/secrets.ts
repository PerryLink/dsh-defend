/**
 * Secret/credential scanning rules, ported from Secret-Key-Leaker-Detect
 * (Apache-2.0, see THIRD_PARTY_NOTICES.md). The upstream asset ships one
 * pattern — `sk-[a-zA-Z0-9]{20,}` (OpenAI/AWS key) — plus the sliding-window
 * buffering that finds secrets split across stream chunks. The buffering
 * belongs to the harness integration (post-execute result bodies arrive
 * whole), so only the pattern vocabulary was ported.
 *
 * Rows whose `source` is `'ported'` mirror upstream verbatim; `'extended'`
 * rows extend the vocabulary with credential shapes documented by the public
 * API references of each issuer (same convention as dsh-translate).
 *
 * Every rule is regex-only (no needles): secret grammars are structural, not
 * literal. Matches NEVER carry the matched text — only `secretType`, span,
 * and severity reach the audit path.
 * @module dsh-defend/detect/secrets
 */

import type { Rule } from './types.ts'

/** One secret rule: a structural regex plus its issuer metadata. */
interface SecretRuleSpec {
  readonly id: string
  readonly secretType: string
  readonly severity: Rule['severity']
  readonly source: 'ported' | 'extended'
  /** Regex that captures the whole credential in group 0. */
  readonly regex: RegExp
}

const SECRET_SPECS: readonly SecretRuleSpec[] = [
  { id: 'sk-openai', secretType: 'openai-api-key', severity: 'critical', source: 'ported',
    regex: /\bsk-[A-Za-z0-9]{20,}\b/gu },
  { id: 'sk-openai-project', secretType: 'openai-project-key', severity: 'critical', source: 'extended',
    regex: /\bsk-proj-[A-Za-z0-9_-]{20,}\b/gu },
  { id: 'sk-anthropic', secretType: 'anthropic-api-key', severity: 'critical', source: 'extended',
    regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/gu },
  { id: 'ghp-token', secretType: 'github-personal-access-token', severity: 'critical', source: 'extended',
    regex: /\bghp_[A-Za-z0-9]{20,}\b/gu },
  { id: 'gho-token', secretType: 'github-oauth-token', severity: 'critical', source: 'extended',
    regex: /\bgho_[A-Za-z0-9]{20,}\b/gu },
  { id: 'gh-pat', secretType: 'github-fine-grained-pat', severity: 'critical', source: 'extended',
    regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/gu },
  { id: 'aws-access-key', secretType: 'aws-access-key-id', severity: 'high', source: 'extended',
    regex: /\bAKIA[0-9A-Z]{16}\b/gu },
  { id: 'aws-secret-key', secretType: 'aws-secret-access-key', severity: 'critical', source: 'extended',
    regex: /\baws(?:_secret)?[_-]?(?:access[_-]?key|secret)[\s:=]+['"]?[A-Za-z0-9/+]{40}\b/giu },
  { id: 'bearer-token', secretType: 'bearer-token', severity: 'high', source: 'extended',
    regex: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}\b/gu },
  { id: 'private-key-block', secretType: 'private-key-block', severity: 'critical', source: 'extended',
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[A-Za-z0-9+/=\s]*-----END [A-Z ]*PRIVATE KEY-----/gu },
  { id: 'slack-token', secretType: 'slack-token', severity: 'high', source: 'extended',
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/gu },
  { id: 'generic-assignment', secretType: 'credential-assignment', severity: 'medium', source: 'extended',
    regex: /\b(?:api[_-]?key|secret|token|password|passwd|auth[_-]?token)\s*[:=]\s*['"]?[A-Za-z0-9._~+/=-]{12,}\b/giu },
]

/** Every secret rule (frozen; regexes keep their global flag for repeated scans). */
export const SECRET_RULES: readonly Rule[] = Object.freeze(SECRET_SPECS.map(spec => Object.freeze({
  id: spec.id,
  family: 'secret' as const,
  category: 'secret-leak',
  severity: spec.severity,
  needles: Object.freeze([]),
  regexes: Object.freeze([spec.regex]),
}) satisfies Rule))

/** Secret subtype per rule id, for {@link MatchInfo.secretType}. */
export const SECRET_TYPE_BY_RULE_ID: ReadonlyMap<string, string> = new Map(
  SECRET_SPECS.map(spec => [spec.id, spec.secretType]),
)
