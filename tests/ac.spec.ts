/**
 * Aho-Corasick automaton branch suite: suffix output inheritance, the
 * build-time and search-time failure-link walks, case-sensitivity options,
 * and empty/no-match paths — the pure algorithm's edge branches that the
 * payload-level benchmarks never steer into.
 * @module dsh-defend/test/ac.spec
 */

import { describe, expect, it } from 'vitest'
import { buildAutomaton } from '../src/detect/ac.ts'

describe('buildAutomaton failure links and output inheritance', () => {
  it('inherits suffix-pattern outputs through failure links', () => {
    const automaton = buildAutomaton([
      { text: 'he', payload: 'short' },
      { text: 'she', payload: 'long' },
    ])
    const matches = automaton.search('she')
    expect(matches).toHaveLength(2)
    // At one end position the automaton emits the node's own output before
    // the outputs inherited through the failure link (insertion order).
    expect(matches[0]).toMatchObject({ payload: 'long', pattern: 'she', start: 0, end: 3 })
    expect(matches[1]).toMatchObject({ payload: 'short', pattern: 'he', start: 1, end: 3 })
  })

  it('walks multi-step failure links at build time and at search time', () => {
    // 'aabc' forces the build-time walk: node a->a->b's failure target is not
    // its parent's direct child, so the fallback loop iterates before landing
    // on the root's 'b' edge. Searching 'abc' forces the same walk at runtime.
    const automaton = buildAutomaton([
      { text: 'aabc', payload: 'whole' },
      { text: 'bc', payload: 'suffix' },
    ])
    const viaFallback = automaton.search('abc')
    expect(viaFallback).toHaveLength(1)
    expect(viaFallback[0]).toMatchObject({ payload: 'suffix', pattern: 'bc', start: 1, end: 3 })

    const direct = automaton.search('aabc')
    expect(direct.map(match => match.payload)).toEqual(['whole', 'suffix'])
    expect(direct[0]).toMatchObject({ pattern: 'aabc', start: 0, end: 4 })
    expect(direct[1]).toMatchObject({ pattern: 'bc', start: 2, end: 4 })
  })

  it('reports overlapping occurrences in scan order with original-text spans', () => {
    const automaton = buildAutomaton([{ text: 'aa', payload: 'pair' }])
    const matches = automaton.search('aAa')
    expect(matches).toHaveLength(2)
    expect(matches[0]).toMatchObject({ pattern: 'aA', start: 0, end: 2 })
    expect(matches[1]).toMatchObject({ pattern: 'Aa', start: 1, end: 3 })
  })

  it('honors caseSensitive: matching becomes exact and spans stay original', () => {
    const automaton = buildAutomaton([{ text: 'she', payload: 'long' }], { caseInsensitive: false })
    expect(automaton.search('SHE')).toEqual([])
    const matches = automaton.search('she')
    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject({ pattern: 'she', start: 0, end: 3 })
  })

  it('returns no matches for an empty pattern set or a clean text', () => {
    expect(buildAutomaton([]).search('anything')).toEqual([])
    const automaton = buildAutomaton([{ text: 'needle', payload: 'n' }])
    expect(automaton.search('haystack only')).toEqual([])
  })
})
