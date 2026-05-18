import { describe, it, expect } from 'vitest';
import { CoverageData, CoverageResult } from '../../src/models/coverage';
import { Metrics } from '../../src/models/metrics';
import { SourceCodeMethod, SourceCodeStatement } from '../../src/models/source-code';
import { ThresholdResult, ThresholdResults } from '../../src/models/threshold-result';

describe('CoverageData.toJSON', () => {
  it('includes name, metrics, methods, statements, files (recursive)', () => {
    const child = new CoverageData(
      'child',
      new Metrics(1, 1, 1, 1, 1, 1),
      [new SourceCodeMethod('a.php', 1, true, 'foo')],
      [new SourceCodeStatement('a.php', 2, false)],
      [],
    );
    const data = new CoverageData(
      'top',
      new Metrics(2, 1, 2, 1, 2, 1),
      [],
      [],
      [child],
    );

    const json = data.toJSON();
    expect(json.name).toBe('top');
    expect(json.metrics).toEqual(new Metrics(2, 1, 2, 1, 2, 1).toJSON());
    expect(json.methods).toEqual([]);
    expect(json.statements).toEqual([]);
    const files = json.files as Record<string, unknown>[];
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('child');
    expect(files[0].methods).toEqual([{ file: 'a.php', num: 1, name: 'foo', covered: true }]);
  });
});

describe('CoverageResult.toJSON', () => {
  it('includes result and thresholds (when present)', () => {
    const r = new CoverageResult(
      'top',
      new Metrics(0, 0, 0, 0, 0, 0),
      [],
      [],
      [],
      'warn',
      new ThresholdResults(new ThresholdResult(80, 60, 'warn'), null, null),
    );
    const json = r.toJSON();
    expect(json.result).toBe('warn');
    expect(json.thresholds).toEqual({ lines: { result: 'warn', warn: 80, fail: 60 } });
  });

  it('omits thresholds when all null', () => {
    const r = new CoverageResult(
      'top',
      new Metrics(0, 0, 0, 0, 0, 0),
      [],
      [],
      [],
      'ok',
      new ThresholdResults(null, null, null),
    );
    const json = r.toJSON();
    expect(json.thresholds).toBeUndefined();
    expect(json.result).toBe('ok');
  });

  it('recursively toJSONs files', () => {
    const child = new CoverageResult(
      'child',
      new Metrics(0, 0, 0, 0, 0, 0),
      [],
      [],
      [],
      'ok',
      new ThresholdResults(null, null, null),
    );
    const parent = new CoverageResult(
      'parent',
      new Metrics(0, 0, 0, 0, 0, 0),
      [],
      [],
      [child],
      'ok',
      new ThresholdResults(null, null, null),
    );
    const files = parent.toJSON().files as Record<string, unknown>[];
    expect(files[0].name).toBe('child');
    expect(files[0].result).toBe('ok');
  });
});
