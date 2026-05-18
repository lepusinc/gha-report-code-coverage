import { describe, it, expect } from 'vitest';
import { Thresholds, ThresholdValue } from '../../src/config/thresholds';
import { ThresholdResult, ThresholdResults } from '../../src/models/threshold-result';

describe('ThresholdValue.toJSON', () => {
  it('returns { warn, fail }', () => {
    const v = new ThresholdValue(80, 60);
    expect(v.toJSON()).toEqual({ warn: 80, fail: 60 });
  });
});

describe('Thresholds.toJSON', () => {
  it('omits null entries', () => {
    const t = new Thresholds(new ThresholdValue(80, 60), null, null);
    expect(t.toJSON()).toEqual({ lines: { warn: 80, fail: 60 } });
  });

  it('returns {} when all null', () => {
    expect(new Thresholds(null, null, null).toJSON()).toEqual({});
  });
});

describe('ThresholdResult.toJSON', () => {
  it('returns { result, warn, fail }', () => {
    const r = new ThresholdResult(80, 60, 'warn');
    expect(r.toJSON()).toEqual({ result: 'warn', warn: 80, fail: 60 });
  });
});

describe('ThresholdResults.toJSON', () => {
  it('inherits omission behavior', () => {
    const tr = new ThresholdResults(new ThresholdResult(80, 60, 'ok'), null, null);
    expect(tr.toJSON()).toEqual({ lines: { result: 'ok', warn: 80, fail: 60 } });
  });

  it('returns {} when all null', () => {
    expect(new ThresholdResults(null, null, null).toJSON()).toEqual({});
  });
});
