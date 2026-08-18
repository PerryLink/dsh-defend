/**
 * Aho-Corasick automaton in pure TypeScript — the algorithm ported from the
 * upstream Jailbreak-Detector asset (`src/jailbreak_detector/matcher.py`,
 * which wrapped the `pyahocorasick` automaton). Case-insensitive matching is
 * the default because upstream built every automaton with
 * `case_sensitive=False`.
 *
 * The automaton is immutable after {@link buildAutomaton}: one build serves
 * every subsequent scan, so the plugin constructs it once per mount.
 * @module dsh-defend/detect/ac
 */

/**
 * One pattern fed to the automaton: the search text plus an opaque payload
 * returned with every match (the rule that owns the needle).
 */
export interface AcPattern<T> {
  readonly text: string
  readonly payload: T
}

/** One automaton match: pattern identity, payload, and [start, end) span. */
export interface AcMatch<T> {
  readonly pattern: string
  readonly payload: T
  /** Inclusive start offset in the searched text. */
  readonly start: number
  /** Exclusive end offset in the searched text. */
  readonly end: number
}

/** Trie/automaton node: child transitions, failure link, and outputs. */
interface Node<T> {
  /** Child edge by (possibly case-folded) character. */
  readonly children: Map<string, number>
  /** Failure link (longest proper suffix that is also a prefix path). */
  fail: number
  /** Patterns ending at this node: their length and payload. */
  readonly outputs: Array<{ readonly length: number; readonly payload: T }>
}

/**
 * A built automaton ready for repeated {@link search} calls.
 */
export interface Automaton<T> {
  /**
   * Find every pattern occurrence in `text`. Overlapping and repeated
   * occurrences are all reported in scan order (end position ascending);
   * matches ending at the same position are emitted in output-list order —
   * the node's own patterns first, then patterns inherited through its
   * failure link — mirroring upstream `iter()` semantics.
   * @param text - the text to scan.
   * @returns all matches with their [start, end) spans.
   */
  search(text: string): AcMatch<T>[]
}

/**
 * Build an Aho-Corasick automaton from a pattern list. Patterns are
 * case-folded by default (upstream parity); the returned automaton folds the
 * searched text the same way, so `caseInsensitive` only changes matching,
 * never the reported spans (offsets are positions in the ORIGINAL text).
 * @param patterns - the patterns to index.
 * @param options.caseInsensitive - case-fold patterns and text (default true).
 * @returns the built automaton.
 */
export function buildAutomaton<T>(
  patterns: readonly AcPattern<T>[],
  options: { readonly caseInsensitive?: boolean } = {},
): Automaton<T> {
  const caseInsensitive = options.caseInsensitive ?? true
  const fold = (text: string): string => caseInsensitive ? text.toLowerCase() : text
  const nodes: Node<T>[] = [{ children: new Map(), fail: 0, outputs: [] }]

  for (const pattern of patterns) {
    const key = fold(pattern.text)
    let node = 0
    for (const char of key) {
      let next = nodes[node]?.children.get(char)
      if (next === undefined) {
        next = nodes.length
        nodes[node]?.children.set(char, next)
        nodes.push({ children: new Map(), fail: 0, outputs: [] })
      }
      node = next
    }
    nodes[node]?.outputs.push({ length: key.length, payload: pattern.payload })
  }

  // Breadth-first failure-link construction: the root's children fail to the
  // root; every deeper node inherits outputs from its failure target so a
  // match of a suffix pattern is found in one pass.
  const queue: number[] = []
  for (const child of nodes[0]?.children.values() ?? []) queue.push(child)
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head]
    if (current === undefined) continue
    const node = nodes[current]
    if (node === undefined) continue
    for (const [char, child] of node.children) {
      let fallback = node.fail
      while (fallback !== 0 && !(nodes[fallback]?.children.has(char) ?? false)) {
        fallback = nodes[fallback]?.fail ?? 0
      }
      const target = nodes[fallback]?.children.get(char)
      const childNode = nodes[child]
      if (childNode === undefined) continue
      childNode.fail = fallback === 0 ? (target ?? 0) : (target ?? 0)
      if (nodes[childNode.fail] !== undefined) {
        childNode.outputs.push(...(nodes[childNode.fail]?.outputs ?? []))
      }
      queue.push(child)
    }
  }

  const search = (text: string): AcMatch<T>[] => {
    const matches: AcMatch<T>[] = []
    let state = 0
    const haystack = fold(text)
    for (let i = 0; i < haystack.length; i += 1) {
      const char = haystack[i] ?? ''
      while (state !== 0 && !(nodes[state]?.children.has(char) ?? false)) {
        state = nodes[state]?.fail ?? 0
      }
      state = nodes[state]?.children.get(char) ?? 0
      for (const output of nodes[state]?.outputs ?? []) {
        matches.push({
          pattern: text.slice(i + 1 - output.length, i + 1),
          payload: output.payload,
          start: i + 1 - output.length,
          end: i + 1,
        })
      }
    }
    return matches
  }

  return { search }
}
