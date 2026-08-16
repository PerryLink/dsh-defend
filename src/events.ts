/**
 * Session audit events for the detection layer. `defend/detection` is
 * log-only: the model-visible part of every interception is the deny/ask
 * reason materialized by the tools registry (or the post-execute feedback),
 * and the audit event carries the same rule facts so the decision can be
 * reconstructed from the session log. Never carries matched text — secret
 * matches are type-only.
 *
 * The append stays two-argument: the pinned 0.1.0-rc.6 peers have no
 * append-envelope option, and the two-argument form typechecks against both
 * rc.6 and newer builds.
 * @module dsh-defend/events
 */

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /**
     * One detection decision or scan hit recorded by the detection layer —
     * log-only audit. `action` is the decision taken (`allow`/`ask`/
     * `block`), `surface` the pipeline point that was scanned.
     */
    'defend/detection': {
      /** Where the scanned content entered the pipeline. */
      surface: 'message' | 'tool-arguments' | 'tool-result' | 'model-output'
      /** The rule that matched (stable upstream-derived id). */
      ruleId: string
      /** Detector family. */
      family: 'injection' | 'jailbreak' | 'secret'
      /** Upstream category the rule was ported from. */
      category: string
      /** Rule severity. */
      severity: 'low' | 'medium' | 'high' | 'critical'
      /** Secret subtype, present only for secret matches. */
      secretType?: string
      /** The decision taken on this match. */
      action: 'allow' | 'ask' | 'block'
      /** Whether the interception was approved (only when `action` is `ask`). */
      approved?: boolean
      /** Characters actually scanned. */
      scannedLength: number
      /** Whether the input exceeded the scan cap. */
      truncated: boolean
    }
  }
}

/** The detection audit event type. */
export const DETECTION_EVENT = 'defend/detection' as const

/** Payload type of one detection audit event. */
export type DetectionEvent = {
  surface: 'message' | 'tool-arguments' | 'tool-result' | 'model-output'
  ruleId: string
  family: 'injection' | 'jailbreak' | 'secret'
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  secretType?: string
  action: 'allow' | 'ask' | 'block'
  approved?: boolean
  scannedLength: number
  truncated: boolean
}
