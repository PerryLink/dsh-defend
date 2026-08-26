/**
 * Benchmark-support regression tests: the pure metrics module, the labeled
 * dataset's shape, and a reproducibility pin that re-runs the scanner from
 * source and compares against the committed `benchmark/results.json`.
 *
 * @module dsh-defend/test/benchmark.spec
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildScanner, type Family } from '../src/detect/index.ts'
import { confusion, f1, falsePositiveRate, metricsFor, precision, recall } from '../benchmark/metrics.mjs'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

describe('benchmark metrics module', () => {
  it('counts TP/FP/FN/TN correctly', () => {
    const outcomes = [
      { label: true, predicted: true },
      { label: true, predicted: true },
      { label: true, predicted: false },
      { label: false, predicted: true },
      { label: false, predicted: false },
      { label: false, predicted: false },
    ]
    expect(confusion(outcomes)).toEqual({ tp: 2, fp: 1, fn: 1, tn: 2 })
  })

  it('computes precision/recall/f1/fpr and guards empty denominators', () => {
    expect(precision({ tp: 2, fp: 1, fn: 1, tn: 2 })).toBe(2 / 3)
    expect(recall({ tp: 2, fp: 1, fn: 1, tn: 2 })).toBe(2 / 3)
    expect(f1(2 / 3, 2 / 3)).toBe(2 / 3)
    expect(falsePositiveRate({ tp: 2, fp: 1, fn: 1, tn: 2 })).toBe(1 / 3)
    expect(metricsFor([]).f1).toBe(0)
    expect(metricsFor([]).precision).toBe(0)
  })

  it('scores a perfect classifier F1 = 1', () => {
    const perfect = metricsFor([
      { label: true, predicted: true },
      { label: false, predicted: false },
    ])
    expect(perfect.f1).toBe(1)
    expect(perfect.fpr).toBe(0)
  })
})

describe('red-team dataset shape', () => {
  interface Sample { id: string; label: boolean; text: string }
  interface Category { id: string; family: Family; samples: Sample[] }
  const dataset = JSON.parse(readFileSync(resolve(root, 'benchmark/dataset/redteam.json'), 'utf8')) as { categories: Category[] }

  it('ships the three categories, each with positives and negatives', () => {
    expect(dataset.categories.map(category => category.id).sort()).toEqual(['injection', 'jailbreak', 'secret'])
    for (const category of dataset.categories) {
      const positives = category.samples.filter(sample => sample.label)
      const negatives = category.samples.filter(sample => !sample.label)
      expect(positives.length).toBeGreaterThanOrEqual(20)
      expect(negatives.length).toBeGreaterThanOrEqual(8)
      for (const sample of category.samples) {
        expect(typeof sample.text).toBe('string')
        expect(sample.text.length).toBeGreaterThan(0)
      }
      expect(new Set(category.samples.map(sample => sample.id)).size).toBe(category.samples.length)
    }
  })
})

describe('secret grammars exercised at runtime (not committed as literals)', () => {
  const scanner = buildScanner()

  it('detects the 40-character aws-secret-key grammar (push-protection-excluded from the dataset)', () => {
    // A 40-char AWS-secret-shaped value cannot be committed (GitHub push protection),
    // so the aws-secret-key grammar is verified here at runtime instead.
    const value = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/ab'
    const report = scanner.scan(`aws_secret_access_key: ${value}`, { families: ['secret'] })
    expect(report.matches.map(match => match.ruleId)).toContain('aws-secret-key')
  })
})

describe('committed benchmark report is reproducible from source', () => {
  interface Sample { id: string; label: boolean; text: string }
  interface Category { id: string; family: Family; samples: Sample[] }
  const dataset = JSON.parse(readFileSync(resolve(root, 'benchmark/dataset/redteam.json'), 'utf8')) as { categories: Category[] }
  const results = JSON.parse(readFileSync(resolve(root, 'benchmark/results.json'), 'utf8')) as {
    perCategory: Array<{ id: string; tp: number; fp: number; fn: number; tn: number; f1: number }>
  }
  const scanner = buildScanner()

  it('recomputes the per-category confusion matrix identical to results.json', () => {
    for (const category of dataset.categories) {
      const outcomes = category.samples.map(sample => ({
        label: sample.label,
        predicted: scanner.scan(sample.text, { families: [category.family] }).matches.length > 0,
      }))
      const metrics = metricsFor(outcomes)
      const committed = results.perCategory.find(entry => entry.id === category.id)
      expect(committed, `missing committed metrics for ${category.id}`).toBeDefined()
      expect(metrics.tp).toBe(committed?.tp)
      expect(metrics.fp).toBe(committed?.fp)
      expect(metrics.fn).toBe(committed?.fn)
      expect(metrics.tn).toBe(committed?.tn)
      expect(metrics.f1).toBe(committed?.f1)
    }
  })
})
