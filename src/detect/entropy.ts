/**
 * Entropy scoring for secret candidates. The structural secret regexes
 * over-match on patterned or low-diversity text (`api_key: aaaaaaaaaaaaaaaa`,
 * `token: changeme12345`), so a regex hit is only admitted as a secret when
 * its Shannon entropy per character clears a threshold. Pure — no I/O, no
 * services, safe on every interception path.
 *
 * The gate targets repetitive/low-diversity false positives, the dominant
 * structural over-matches. It does not claim to recognize "randomness":
 * distinct-but-ordered sequences (the alphabet, counting digits) score high
 * even though they are not random, which is an accepted limitation shared by
 * entropy-based scanners (see THIRD_PARTY_NOTICES.md).
 * @module dsh-defend/detect/entropy
 */

/** Default minimum Shannon entropy (bits/char) for an admitted secret. */
export const DEFAULT_MIN_SECRET_ENTROPY = 3.0

/**
 * Shannon entropy of `text` in bits per character.
 * @param text - the candidate token (already matched by a secret regex).
 * @returns bits per character; 0 for empty input.
 */
export function shannonEntropy(text: string): number {
  if (text.length === 0) return 0
  const counts = new Map<string, number>()
  for (const char of text) counts.set(char, (counts.get(char) ?? 0) + 1)
  let entropy = 0
  for (const count of counts.values()) {
    const probability = count / text.length
    entropy -= probability * Math.log2(probability)
  }
  return entropy
}

/**
 * Count the distinct character classes a token spans: lowercase, uppercase,
 * digit, and symbol (everything else). Exposed for callers that want a
 * length + character-class fallback alongside {@link shannonEntropy}; the
 * scanner gate itself uses entropy only.
 * @param text - the candidate token.
 * @returns the number of distinct classes present, in [0, 4].
 */
export function charClassCount(text: string): number {
  let lower = false
  let upper = false
  let digit = false
  let symbol = false
  for (const char of text) {
    if (/[a-z]/.test(char)) lower = true
    else if (/[A-Z]/.test(char)) upper = true
    else if (/[0-9]/.test(char)) digit = true
    else symbol = true
  }
  return Number(lower) + Number(upper) + Number(digit) + Number(symbol)
}
