/**
 * Type declarations for `benchmark/metrics.mjs` — the pure, zero-dependency
 * binary-classification metrics module shared by `benchmark/run.mjs` and the
 * benchmark unit test. Present so `typecheck:ci` (which type-checks `tests/`
 * against the published peer types) can resolve the `.mjs` import instead of
 * treating it as an implicit `any`.
 */

/** Confusion-matrix counts for a set of labeled predictions. */
export interface Counts {
  tp: number
  fp: number
  fn: number
  tn: number
}

/** One labeled prediction: whether the sample is positive and was predicted positive. */
export interface Outcome {
  label: boolean
  predicted: boolean
}

/** Full metric bundle computed by {@link metricsFor}. */
export interface ClassMetrics extends Counts {
  total: number
  positives: number
  negatives: number
  precision: number
  recall: number
  f1: number
  fpr: number
}

/** Count TP/FP/FN/TN for a list of labeled predictions. */
export function confusion(outcomes: Outcome[]): Counts

/** Precision = TP / (TP + FP); 0 when undefined. */
export function precision(counts: Counts): number

/** Recall = TP / (TP + FN); 0 when undefined. */
export function recall(counts: Counts): number

/** F1 = harmonic mean of precision and recall; 0 when undefined. */
export function f1(precision: number, recall: number): number

/** False-positive rate = FP / (FP + TN); 0 when undefined. */
export function falsePositiveRate(counts: Counts): number

/** Round to a stable 3-decimal value (deterministic JSON). */
export function round3(value: number): number

/** Full metric bundle for one class. */
export function metricsFor(outcomes: Outcome[]): ClassMetrics

/** Macro-average metrics over several classes (unweighted mean of P/R/F1). */
export function macroAverage(classMetrics: ClassMetrics[]): {
  classes: number
  precision: number
  recall: number
  f1: number
}

/** Micro-average metrics over several classes (pooled counts). */
export function microAverage(classMetrics: ClassMetrics[]): Counts &
  Pick<ClassMetrics, 'precision' | 'recall' | 'f1' | 'fpr'>
