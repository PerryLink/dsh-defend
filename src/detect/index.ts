/**
 * Detection-layer public surface: rules, scanner, and the shared vocabulary.
 * Everything here is pure — the interception wiring lives in `src/index.ts`.
 * @module dsh-defend/detect
 */

export type {
  Severity,
  Family,
  Surface,
  Rule,
  MatchInfo,
  ScanReport,
} from './types.ts'
export {
  SEVERITIES,
  FAMILIES,
  SURFACES,
  severityRank,
  CLEAN_REPORT,
} from './types.ts'
export type { Automaton, AcPattern, AcMatch } from './ac.ts'
export { buildAutomaton } from './ac.ts'
export { INJECTION_JAILBREAK_RULES, INJECTION_RULES, JAILBREAK_RULES } from './rules.ts'
export { SECRET_RULES, SECRET_TYPE_BY_RULE_ID } from './secrets.ts'
export { DEFAULT_MIN_SECRET_ENTROPY, shannonEntropy, charClassCount } from './entropy.ts'
export type { Scanner, ScanOptions } from './scanner.ts'
export {
  buildScanner,
  safeSnippet,
  normalizeNfkc,
  DEFAULT_MAX_SCAN_CHARS,
  DEFAULT_MAX_MATCHES,
} from './scanner.ts'
