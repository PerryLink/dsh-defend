/**
 * Shared vocabulary for the detection layer of `dsh-defend`: severity,
 * family, surface, and match/report types. Pure — no service or runtime
 * imports, so every consumer (scan, audit, report, tests) shares one set of
 * discriminated tags.
 * @module dsh-defend/detect/types
 */

/** Severity of one detection, ordered lowest first. */
export type Severity = 'low' | 'medium' | 'high' | 'critical'

/** Detector family — decides which guard configuration and action applies. */
export type Family = 'injection' | 'jailbreak' | 'secret'

/** Every {@link Severity}, in ascending order, for ordering and validation. */
export const SEVERITIES: readonly Severity[] = ['low', 'medium', 'high', 'critical']

/** Every {@link Family}, for closed-enum validation. */
export const FAMILIES: readonly Family[] = ['injection', 'jailbreak', 'secret']

/**
 * Where scanned content entered the pipeline. Decides which interception
 * point acts on the match and how the audit event is attributed.
 */
export type Surface = 'message' | 'tool-arguments' | 'tool-result' | 'model-output'

/** Every {@link Surface}, for closed-enum validation. */
export const SURFACES: readonly Surface[] = ['message', 'tool-arguments', 'tool-result', 'model-output']

/**
 * Rank of one severity, for max/compare operations. Higher rank = more
 * severe; a missing value (undefined) ranks below everything.
 * @param severity - the severity to rank.
 * @returns the numeric rank.
 */
export function severityRank(severity: Severity | undefined): number {
  if (severity === undefined) return -1
  return SEVERITIES.indexOf(severity)
}

/**
 * One pattern-library rule: stable id, family/category attribution, severity,
 * and its matchers — exact needles (Aho-Corasick) plus tolerant regexes for
 * obfuscated variants. A rule contributes at most one match per scan.
 */
export interface Rule {
  /** Stable upstream-derived id (e.g. `ii-001`, `rh-001`, `sk-openai`). */
  readonly id: string
  readonly family: Family
  /** Upstream category the rule was ported from (e.g. `instruction-injection`). */
  readonly category: string
  readonly severity: Severity
  /** Exact substrings matched case-insensitively through the automaton. */
  readonly needles: readonly string[]
  /** Tolerant patterns for delimiter tricks, obfuscation, and paraphrases. */
  readonly regexes: readonly RegExp[]
}

/**
 * One match reported by a scan. Never carries the matched text itself:
 * secret matches must stay type-only, so the audit path derives any display
 * snippet from the original text through {@link safeSnippet} (which redacts
 * secrets) instead of from the match record.
 */
export interface MatchInfo {
  readonly ruleId: string
  readonly family: Family
  readonly category: string
  readonly severity: Severity
  /** Secret subtype (e.g. `openai-api-key`), present only for secret matches. */
  readonly secretType?: string
  /** Inclusive start offset in the scanned text, when the matcher reported one. */
  readonly start?: number
  /** Exclusive end offset in the scanned text, when the matcher reported one. */
  readonly end?: number
}

/**
 * Result of scanning one piece of text with every enabled detector.
 * `matches` are deduplicated per rule; `severity`/`confidence` summarize the
 * whole report for the decision step.
 */
export interface ScanReport {
  /** How many characters were actually scanned (after the length cap). */
  readonly scannedLength: number
  /** Whether the text exceeded the scan cap and only the head was scanned. */
  readonly truncated: boolean
  readonly matches: readonly MatchInfo[]
  /** Highest severity among the matches, or undefined on a clean scan. */
  readonly severity: Severity | undefined
  /** Aggregated confidence in [0, 1]; higher = more/louder matches. */
  readonly confidence: number
  /** Every family with at least one match, in stable order. */
  readonly families: readonly Family[]
}

/** A clean report: no matches, no severity, zero confidence. */
export const CLEAN_REPORT: ScanReport = Object.freeze({
  scannedLength: 0,
  truncated: false,
  matches: Object.freeze([]),
  severity: undefined,
  confidence: 0,
  families: Object.freeze([]),
})
