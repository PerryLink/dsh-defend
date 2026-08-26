/**
 * The scan engine: one Aho-Corasick automaton over every needle (built once
 * per mount) plus the per-rule tolerant regexes. Produces a bounded
 * {@link ScanReport} — length-capped input, one match per rule, secrets
 * type-only. Pure: no I/O, no services, safe to call on every interception
 * path.
 * @module dsh-defend/detect/scanner
 */

import { buildAutomaton, type Automaton } from './ac.ts'
import { DEFAULT_MIN_SECRET_ENTROPY, shannonEntropy } from './entropy.ts'
import { INJECTION_JAILBREAK_RULES } from './rules.ts'
import { SECRET_RULES, SECRET_TYPE_BY_RULE_ID } from './secrets.ts'
import type { Family, MatchInfo, Rule, ScanReport, Severity } from './types.ts'
import { FAMILIES, severityRank } from './types.ts'

/** Default cap on scanned characters (the head is scanned; the tail is skipped). */
export const DEFAULT_MAX_SCAN_CHARS = 10_000

/** Default cap on reported matches per scan (bounded memory on hostile input). */
export const DEFAULT_MAX_MATCHES = 100

/**
 * Normalize text to NFKC so lookalike/full-width Unicode collapses to its
 * ASCII compatibility equivalent before any matcher runs. This closes the
 * lookalike-Unicode bypass: `ℍow to ḥack a ѕystem` scans as
 * `How to hack a system`, so an obfuscated needle still matches. Applied to
 * the scanned head only; match offsets are relative to the normalized text.
 * @param text - raw text to normalize.
 * @returns the NFKC-normalized text.
 */
export function normalizeNfkc(text: string): string {
  return text.normalize('NFKC')
}

/** Every rule the scanner consults, in build order. */
const ALL_RULES: readonly Rule[] = Object.freeze([...INJECTION_JAILBREAK_RULES, ...SECRET_RULES])

/** Rules keyed by id (ids are unique by construction). */
const RULE_BY_ID: ReadonlyMap<string, Rule> = new Map(ALL_RULES.map(rule => [rule.id, rule]))

/** Payload carried through the automaton: the owning rule id. */
interface NeedlePayload { readonly ruleId: string }

/**
 * A built scanner ready for repeated {@link Scanner.scan} calls.
 */
export interface Scanner {
  /**
   * Scan one text with every rule of the requested families.
   * @param text - raw text (any length; only the head is scanned).
   * @param options - families filter and the length/match caps.
   * @returns the bounded report; never throws.
   */
  scan(text: string, options?: ScanOptions): ScanReport
}

/** Per-scan options. */
export interface ScanOptions {
  /** Restrict to these families; omitted = every family. */
  readonly families?: readonly Family[]
  /** Cap on scanned characters (default {@link DEFAULT_MAX_SCAN_CHARS}). */
  readonly maxChars?: number
  /** Cap on reported matches (default {@link DEFAULT_MAX_MATCHES}). */
  readonly maxMatches?: number
  /** NFKC-normalize the scanned head first (default true). */
  readonly normalize?: boolean
  /**
   * Minimum Shannon entropy (bits/char) for an admitted secret match
   * (default {@link DEFAULT_MIN_SECRET_ENTROPY}); `0` disables the gate.
   */
  readonly minSecretEntropy?: number
}

/**
 * Build the shared automaton and return the scanner. Build once per mount;
 * scans are allocation-light.
 * @returns the ready scanner.
 */
export function buildScanner(): Scanner {
  const automaton: Automaton<NeedlePayload> = buildAutomaton(
    ALL_RULES.flatMap(rule => rule.needles.map(text => ({ text, payload: { ruleId: rule.id } }))),
  )

  const scan = (text: string, options: ScanOptions = {}): ScanReport => {
    const maxChars = Math.max(1, options.maxChars ?? DEFAULT_MAX_SCAN_CHARS)
    const maxMatches = Math.max(1, options.maxMatches ?? DEFAULT_MAX_MATCHES)
    const minSecretEntropy = Math.max(0, options.minSecretEntropy ?? DEFAULT_MIN_SECRET_ENTROPY)
    const families = new Set(options.families ?? FAMILIES)
    const head = text.length > maxChars ? text.slice(0, maxChars) : text
    const scanned = options.normalize === false ? head : normalizeNfkc(head)

    const seen = new Set<string>()
    const matches: MatchInfo[] = []

    const admit = (candidate: MatchInfo): void => {
      if (seen.has(candidate.ruleId)) return
      if (matches.length >= maxMatches) return
      seen.add(candidate.ruleId)
      matches.push(candidate)
    }

    // 1. Exact needles through the automaton (payloads + Jailbreak-Detector).
    for (const hit of automaton.search(scanned)) {
      const rule = RULE_BY_ID.get(hit.payload.ruleId)
      if (rule === undefined || !families.has(rule.family)) continue
      admit({
        ruleId: rule.id,
        family: rule.family,
        category: rule.category,
        severity: rule.severity,
        start: hit.start,
        end: hit.end,
      })
      if (matches.length >= maxMatches) break
    }

    // 2. Tolerant regexes (paraphrases, obfuscation, secret grammars).
    for (const rule of ALL_RULES) {
      if (!families.has(rule.family)) continue
      for (const regex of rule.regexes) {
        regex.lastIndex = 0
        let found: RegExpExecArray | null
        try {
          found = regex.exec(scanned)
        } catch {
          continue // A hostile regex could never get here (rules are trusted); fail per-rule.
        }
        if (found === null) continue
        // Secret regexes over-match on low-diversity text; require enough
        // entropy before admitting the hit (the matched text is scored here
        // and never carried into the match record).
        if (rule.family === 'secret' && minSecretEntropy > 0 && shannonEntropy(found[0]) < minSecretEntropy) {
          continue
        }
        const secretType = rule.family === 'secret' ? SECRET_TYPE_BY_RULE_ID.get(rule.id) : undefined
        admit({
          ruleId: rule.id,
          family: rule.family,
          category: rule.category,
          severity: rule.severity,
          ...(secretType !== undefined ? { secretType } : {}),
          start: found.index,
          end: found.index + found[0].length,
        })
        if (matches.length >= maxMatches) break
      }
      if (matches.length >= maxMatches) break
    }

    let severity: Severity | undefined
    for (const match of matches) {
      if (severityRank(match.severity) > severityRank(severity)) severity = match.severity
    }
    const familySet = new Set(matches.map(match => match.family))
    const confidence = computeConfidence(matches)
    return {
      scannedLength: scanned.length,
      truncated: text.length > maxChars,
      matches,
      severity,
      confidence,
      families: FAMILIES.filter(family => familySet.has(family)),
    }
  }

  return { scan }
}

/** Aggregate confidence: secret hits are unambiguous; injections need corroboration. */
function computeConfidence(matches: readonly MatchInfo[]): number {
  if (matches.length === 0) return 0
  const hasSecret = matches.some(match => match.family === 'secret')
  if (hasSecret) return 1
  if (matches.length >= 2) return 0.9
  const only = matches[0]
  if (only === undefined) return 0
  return only.severity === 'high' || only.severity === 'critical' ? 0.7 : 0.5
}

/**
 * A display-safe snippet of `text` around `[start, end)`. When the range is a
 * secret match the fragment is redacted in place: only the type reaches the
 * model/log, never credential text.
 * @param text - the original scanned text.
 * @param start - inclusive start offset.
 * @param end - exclusive end offset.
 * @param maxChars - snippet bound (default 120).
 * @returns the bounded, redacted snippet.
 */
export function safeSnippet(text: string, start: number, end: number, maxChars = 120): string {
  const bounded = Math.max(1, maxChars)
  const from = Math.max(0, start)
  const to = Math.min(text.length, end)
  const head = text.slice(Math.max(0, from - 20), from)
  const tail = text.slice(to, Math.min(text.length, to + 20))
  const inner = text.slice(from, to)
  const redacted = /^[\x20-\x7E]{12,}$/u.test(inner) && /[A-Za-z0-9]/.test(inner)
    ? '[REDACTED]'
    : inner.slice(0, bounded)
  const snippet = `${head}${redacted}${tail}`
  return snippet.length <= bounded ? snippet : `${snippet.slice(0, bounded - 1)}\u2026`
}
