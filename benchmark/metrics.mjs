// benchmark/metrics.mjs — deterministic binary-classification metrics.
// Pure, zero-dependency; shared by benchmark/run.mjs and the unit test.

/**
 * Count TP/FP/FN/TN for a list of labeled predictions.
 * @param {Array<{label: boolean, predicted: boolean}>} outcomes
 * @returns {{tp: number, fp: number, fn: number, tn: number}}
 */
export function confusion(outcomes) {
  const counts = { tp: 0, fp: 0, fn: 0, tn: 0 }
  for (const outcome of outcomes) {
    if (outcome.label && outcome.predicted) counts.tp += 1
    else if (outcome.label && !outcome.predicted) counts.fn += 1
    else if (!outcome.label && outcome.predicted) counts.fp += 1
    else counts.tn += 1
  }
  return counts
}

/** Precision = TP / (TP + FP); 0 when undefined. */
export function precision(counts) {
  const denominator = counts.tp + counts.fp
  return denominator === 0 ? 0 : counts.tp / denominator
}

/** Recall = TP / (TP + FN); 0 when undefined. */
export function recall(counts) {
  const denominator = counts.tp + counts.fn
  return denominator === 0 ? 0 : counts.tp / denominator
}

/** F1 = harmonic mean of precision and recall; 0 when undefined. */
export function f1(prec, rec) {
  const denominator = prec + rec
  return denominator === 0 ? 0 : (2 * prec * rec) / denominator
}

/** False-positive rate = FP / (FP + TN); 0 when undefined. */
export function falsePositiveRate(counts) {
  const denominator = counts.fp + counts.tn
  return denominator === 0 ? 0 : counts.fp / denominator
}

/** Round to a stable 3-decimal value (deterministic JSON). */
export function round3(value) {
  return Number(value.toFixed(3))
}

/** Full metric bundle for one class. */
export function metricsFor(outcomes) {
  const counts = confusion(outcomes)
  const prec = precision(counts)
  const rec = recall(counts)
  return {
    tp: counts.tp,
    fp: counts.fp,
    fn: counts.fn,
    tn: counts.tn,
    total: outcomes.length,
    positives: counts.tp + counts.fn,
    negatives: counts.fp + counts.tn,
    precision: round3(prec),
    recall: round3(rec),
    f1: round3(f1(prec, rec)),
    fpr: round3(falsePositiveRate(counts)),
  }
}

/** Macro-average metrics over several classes (unweighted mean of P/R/F1). */
export function macroAverage(classMetrics) {
  const out = { classes: classMetrics.length }
  for (const key of ['precision', 'recall', 'f1']) {
    const sum = classMetrics.reduce((acc, m) => acc + m[key], 0)
    out[key] = round3(classMetrics.length === 0 ? 0 : sum / classMetrics.length)
  }
  return out
}

/** Micro-average metrics over several classes (pooled counts). */
export function microAverage(classMetrics) {
  const pooled = classMetrics.reduce((acc, m) => ({
    tp: acc.tp + m.tp,
    fp: acc.fp + m.fp,
    fn: acc.fn + m.fn,
    tn: acc.tn + m.tn,
  }), { tp: 0, fp: 0, fn: 0, tn: 0 })
  const prec = precision(pooled)
  const rec = recall(pooled)
  return {
    tp: pooled.tp,
    fp: pooled.fp,
    fn: pooled.fn,
    tn: pooled.tn,
    precision: round3(prec),
    recall: round3(rec),
    f1: round3(f1(prec, rec)),
    fpr: round3(falsePositiveRate(pooled)),
  }
}
