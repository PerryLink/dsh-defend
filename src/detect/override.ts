/**
 * Order-agnostic "override the instructions" detector.
 *
 * The automaton already catches the exact upstream payloads. This layer exists
 * because the same instruction can be reordered, synonym-swapped, or split by a
 * zero-width character without containing any of those needles. It is a closed
 * predicate, not another wordlist:
 *
 *   verb (ignore/disregard/forget/override/...) × object (instructions/rules/...)
 *   within a bounded window, with a modifier (previous/prior/your/...) on the
 *   object, and a small set of benign near-misses excluded.
 *
 * Pure: no I/O, no state. The scanner calls it only for the injection family.
 * @module dsh-defend/detect/override
 */

const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF\u00AD]/gu

/**
 * Cyrillic/Greek lookalikes that NFKC does not fold to ASCII. A closed
 * confusable map, not a general transliteration: only characters that are
 * visually identical to a Latin letter used by the verbs/objects below.
 */
const CONFUSABLES: Readonly<Record<string, string>> = Object.freeze({
  '\u0430': 'a', '\u0435': 'e', '\u043E': 'o', '\u0440': 'p', '\u0441': 'c',
  '\u0443': 'y', '\u0445': 'x', '\u0456': 'i', '\u0458': 'j', '\u0455': 's',
  '\u03B1': 'a', '\u03B5': 'e', '\u03BF': 'o', '\u03C1': 'p', '\u03C5': 'u',
})

/** Normalize case/width, drop zero-width characters, fold common confusables. */
function fold(text: string, normalize: boolean): string {
  const widthFolded = normalize ? text.normalize('NFKC') : text
  const stripped = widthFolded.replace(ZERO_WIDTH, '').toLowerCase()
  if (!normalize) return stripped
  return stripped.replace(/[\u0430\u0435\u043E\u0440\u0441\u0443\u0445\u0456\u0458\u0455\u03B1\u03B5\u03BF\u03C1\u03C5]/gu, (char) => CONFUSABLES[char] ?? char)
}

/** Chinese override patterns: no whitespace tokenizer can segment these reliably. */
const CHINESE_OVERRIDE = /(?:忽略|无视|忘记|覆盖|丢弃|绕过|跳过)\s*(?:之前|先前|以上|原来|系统|你的)?\s*(?:的)?\s*(?:所有)?\s*(?:指令|指示|规则|要求|提示|设定)/u

/** A known object phrase that is longer than one token. */
const EVERYTHING_YOU_WERE_TOLD = /everything\s+(?:you|i)\s+(?:were|was|have\s+been)\s+told/u

const VERBS = new Set([
  'ignore', 'ignoring', 'ignored',
  'disregard', 'disregarding', 'disregarded',
  'forget', 'forgetting', 'forgot', 'forgotten',
  'override', 'overriding', 'overridden', 'overrode',
  'discard', 'discarding', 'discarded',
  'drop', 'dropping', 'dropped',
  'bypass', 'bypassing', 'bypassed',
  'skip', 'skipping', 'skipped',
  'neglect', 'neglecting', 'neglected',
  'abandon', 'abandoning', 'abandoned',
])

const MULTI_VERBS = ['set aside', 'throw out', 'pay no attention']

const OBJECTS = new Set([
  'instruction', 'instructions', 'rule', 'rules',
  'directive', 'directives', 'guideline', 'guidelines',
  'guidance', 'constraint', 'constraints', 'policy', 'policies',
  'prompt', 'prompts', 'command', 'commands', 'order', 'orders',
  '设定', '指令', '指示', '规则', '要求', '提示',
])

const MODIFIERS = new Set([
  'previous', 'prior', 'earlier', 'above', 'former', 'preceding',
  'original', 'system', 'your', 'told', 'given',
  '之前', '先前', '以上', '原来', '系统', '你的',
])

/** Objects that look like instructions but are benign in ordinary prose. */
const NOT_OBJECTS = new Set([
  'paragraph', 'section', 'draft', 'variable', 'clause', 'line',
  'version', 'email', 'message', 'review', 'incident', 'appendix',
  '段落', '草稿', '变量', '条款', '版本', '邮件', '消息',
])

/** Phrases that mark a benign retrospective, not a live override. */
const BENIGN_CUES = /\b(?:rolled back|reverted|withdrawn|after the incident|incident review|if the reviewer|reviewer objects|was undone)\b|(?:已回滚|已撤回|评审后|如果评审)/iu

/** One override predicate hit. */
export interface OverrideHit {
  readonly verb: string
  readonly object: string
  /** Token distance between verb and object. */
  readonly distance: number
}

/**
 * Detect a reordered/synonym "override the instructions" predicate.
 * @param text - raw or normalized text.
 * @param normalize - NFKC-fold width lookalikes first (default true). The
 *   scanner passes its own `normalize` option so a deliberate
 *   `normalize: false` scan still sees the un-folded text.
 * @returns the hit, or undefined when the text does not match.
 */
export function detectOverride(text: string, normalize = true): OverrideHit | undefined {
  const normalized = fold(text, normalize)
  if (BENIGN_CUES.test(normalized)) return undefined
  if (CHINESE_OVERRIDE.test(normalized)) return { verb: '忽略', object: '指令', distance: 0 }
  const tokens = [...normalized.matchAll(/[\p{L}\p{N}]+/gu)].map((match) => match[0])

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] ?? ''
    const multi = MULTI_VERBS.find((phrase) => {
      const parts = phrase.split(' ')
      return parts.every((part, offset) => tokens[index + offset] === part)
    })
    if (!VERBS.has(token) && multi === undefined) continue
    if (multi !== undefined && EVERYTHING_YOU_WERE_TOLD.test(normalized)) {
      return { verb: multi, object: 'everything you were told', distance: 0 }
    }

    const verbLength = multi === undefined ? 1 : multi.split(' ').length
    for (let other = Math.max(0, index - 12); other < Math.min(tokens.length, index + 12 + verbLength); other += 1) {
      if (other >= index && other < index + verbLength) continue
      const object = tokens[other] ?? ''
      if (NOT_OBJECTS.has(object) || !OBJECTS.has(object)) continue
      // The modifier must sit immediately before the object (within four
      // tokens), not merely somewhere in the sentence: "previous paragraph;
      // the new instructions" must not make "previous" modify "instructions".
      // A benign noun between the two ("earlier draft guidance") means the
      // modifier belongs to that noun, not to the instruction object.
      const lookback = tokens.slice(Math.max(0, other - 4), other)
      const lookahead = tokens.slice(other + 1, other + 5)
      const modifierAt = lookback.findLastIndex((candidate) => MODIFIERS.has(candidate))
      const modifierAfter = lookahead.findIndex((candidate) => MODIFIERS.has(candidate))
      if (modifierAt < 0 && modifierAfter < 0) {
        if (multi !== undefined && EVERYTHING_YOU_WERE_TOLD.test(normalized)) {
          return { verb: multi, object: 'everything you were told', distance: Math.abs(other - index) }
        }
        continue
      }
      const between = modifierAt >= 0
        ? lookback.slice(modifierAt + 1)
        : lookahead.slice(0, Math.max(0, modifierAfter))
      if (between.some((candidate) => NOT_OBJECTS.has(candidate))) continue
      return { verb: multi ?? token, object, distance: Math.abs(other - index) }
    }
  }
  return undefined
}
