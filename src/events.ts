/**
 * Session audit events for the detection layer. `defend/detection` is
 * log-only: the model-visible part of every interception is the deny/ask
 * reason materialized by the tools registry (or the post-execute feedback),
 * and the audit event carries the same rule facts so the decision can be
 * reconstructed from the session log. Never carries matched text — secret
 * matches are type-only.
 *
 * The event is appended with the envelope's `ignorable: true` marker (see
 * {@link AuditAppend}): future harness builds that honor the marker stamp it
 * on the envelope and skip unknown ignorable records when loading, so the
 * audit can never refuse a session. Every released line so far —
 * `0.1.0-rc.1`–`0.1.0-rc.8` and `0.1.1-rc.1`–`0.1.1-rc.2` — silently DROPS
 * the options bag: the event then lands unmarked and makes the session
 * unresumable on required-on-read hosts. The runtime detects such hosts at
 * first use (peer-version pre-check plus a probe of the appended envelope)
 * and disables session-log audit on them with a one-time warning;
 * `detection.allowUnmarkedAudit: true` opts back in.
 * See https://github.com/PerryLink/dsh-defend/issues/2.
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

/**
 * `Session.append` narrowed to this plugin's audit event. The options bag
 * exists only on host builds that expose the `ignorable` envelope-marker
 * surface (no released line so far); a pre-marker host accepts the call but
 * silently drops the third argument — the event is appended WITHOUT the
 * marker, which is exactly what breaks later resume on stricter hosts. The
 * runtime treats the marker as optional-but-probed: see
 * {@link isMarkedAuditEvent}.
 */
export type AuditAppend = (
  type: 'defend/detection',
  data: DetectionEvent,
  options?: { ignorable?: true },
) => unknown

/**
 * Whether an `append` call actually honored the `ignorable` marker: the
 * logged event returned by the host carries `ignorable === true` on
 * marker-aware builds and nothing on pre-marker builds. `false` (or any
 * non-event return) means the host dropped the marker and the event landed
 * unmarked — the runtime then degrades instead of polluting further logs.
 * @param result - the return value of the audit append.
 * @returns true only when the marker is present on the returned envelope.
 */
export function isMarkedAuditEvent(result: unknown): boolean {
  return typeof result === 'object' && result !== null && (result as { ignorable?: unknown }).ignorable === true
}
