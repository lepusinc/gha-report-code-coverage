import { describe, it, expect } from 'vitest';
import { ThresholdEvaluator } from '../../src/processors/threshold-evaluator';
import { Config } from '../../src/config/config';
import { Thresholds, ThresholdValue } from '../../src/config/thresholds';
import { CoverageResult } from '../../src/models/coverage';
import { Metrics } from '../../src/models/metrics';
import { ThresholdResults } from '../../src/models/threshold-result';

function makeConfig(thresholds: Thresholds): Config {
  return new Config('', '', false, false, 'Coverage', thresholds, 0);
}

function makeResult(metrics: Metrics, files: CoverageResult[] = []): CoverageResult {
  return new CoverageResult(
    'Coverage',
    metrics,
    [],
    [],
    files,
    'ok',
    new ThresholdResults(null, null, null),
  );
}

describe('ThresholdEvaluator', () => {
  const evaluator = new ThresholdEvaluator();

  it('returns ok when all metrics meet warn threshold', () => {
    const config = makeConfig(
      new Thresholds(new ThresholdValue(80, 60), new ThresholdValue(80, 60), new ThresholdValue(80, 60)),
    );
    const result = makeResult(new Metrics(100, 90, 10, 9, 10, 9));
    evaluator.process(result, config);

    expect(result.result).toBe('ok');
    expect(result.thresholds.lines?.result).toBe('ok');
    expect(result.thresholds.methods?.result).toBe('ok');
    expect(result.thresholds.conditionals?.result).toBe('ok');
  });

  it('warns when lines below warn but above fail', () => {
    const config = makeConfig(
      new Thresholds(new ThresholdValue(80, 60), null, null),
    );
    const result = makeResult(new Metrics(100, 70, 10, 10, 0, 0));
    evaluator.process(result, config);
    expect(result.thresholds.lines?.result).toBe('warn');
    expect(result.result).toBe('warn');
  });

  it('fails when lines below fail', () => {
    const config = makeConfig(
      new Thresholds(new ThresholdValue(80, 60), null, null),
    );
    const result = makeResult(new Metrics(100, 50, 10, 10, 0, 0));
    evaluator.process(result, config);
    expect(result.thresholds.lines?.result).toBe('fail');
    expect(result.result).toBe('fail');
  });

  it('mixed: warn + ok → warn', () => {
    const config = makeConfig(
      new Thresholds(new ThresholdValue(80, 60), new ThresholdValue(80, 60), null),
    );
    const result = makeResult(new Metrics(100, 70, 10, 10, 0, 0));
    evaluator.process(result, config);
    expect(result.result).toBe('warn');
  });

  it('mixed: fail + warn → fail', () => {
    const config = makeConfig(
      new Thresholds(new ThresholdValue(80, 60), new ThresholdValue(80, 60), null),
    );
    const result = makeResult(new Metrics(100, 50, 10, 7, 0, 0));
    evaluator.process(result, config);
    expect(result.result).toBe('fail');
  });

  it('no thresholds configured → ok', () => {
    const config = makeConfig(new Thresholds(null, null, null));
    const result = makeResult(new Metrics(100, 50, 10, 5, 10, 5));
    evaluator.process(result, config);
    expect(result.result).toBe('ok');
    expect(result.thresholds.lines).toBeNull();
    expect(result.thresholds.methods).toBeNull();
    expect(result.thresholds.conditionals).toBeNull();
  });

  it('conditionals=0 skips conditionals evaluation', () => {
    const config = makeConfig(
      new Thresholds(null, null, new ThresholdValue(80, 60)),
    );
    const result = makeResult(new Metrics(100, 100, 10, 10, 0, 0));
    evaluator.process(result, config);
    expect(result.thresholds.conditionals).toBeNull();
    expect(result.result).toBe('ok');
  });

  it('recursively evaluates files', () => {
    const config = makeConfig(
      new Thresholds(new ThresholdValue(80, 60), null, null),
    );
    const child = makeResult(new Metrics(10, 5, 0, 0, 0, 0));
    const parent = makeResult(new Metrics(10, 5, 0, 0, 0, 0), [child]);
    evaluator.process(parent, config);
    expect(parent.thresholds.lines?.result).toBe('fail');
    expect(child.thresholds.lines?.result).toBe('fail');
  });
});
