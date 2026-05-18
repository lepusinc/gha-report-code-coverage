import { describe, it, expect } from 'vitest';
import { UncoveredMethodFilter } from '../../src/processors/uncovered-method-filter';
import { Config } from '../../src/config/config';
import { Thresholds } from '../../src/config/thresholds';
import { CoverageResult } from '../../src/models/coverage';
import { Metrics } from '../../src/models/metrics';
import { SourceCodeMethod } from '../../src/models/source-code';
import { ThresholdResults } from '../../src/models/threshold-result';

function makeConfig(limit: number): Config {
  return new Config('', '', false, false, 'Coverage', new Thresholds(null, null, null), limit);
}

function makeMethods(): SourceCodeMethod[] {
  return [
    new SourceCodeMethod('a.php', 1, true, 'covered1'),
    new SourceCodeMethod('a.php', 2, false, 'uncovered1'),
    new SourceCodeMethod('a.php', 3, false, 'uncovered2'),
    new SourceCodeMethod('a.php', 4, true, 'covered2'),
    new SourceCodeMethod('a.php', 5, false, 'uncovered3'),
  ];
}

function makeResult(methods: SourceCodeMethod[], files: CoverageResult[] = []): CoverageResult {
  return new CoverageResult(
    'Coverage',
    new Metrics(0, 0, 0, 0, 0, 0),
    methods,
    [],
    files,
    'ok',
    new ThresholdResults(null, null, null),
  );
}

describe('UncoveredMethodFilter', () => {
  const filter = new UncoveredMethodFilter();

  it('keeps only uncovered methods', () => {
    const result = makeResult(makeMethods());
    filter.process(result, makeConfig(10));
    expect(result.methods).toHaveLength(3);
    expect(result.methods.every((m) => !m.covered)).toBe(true);
  });

  it('truncates to limit', () => {
    const result = makeResult(makeMethods());
    filter.process(result, makeConfig(2));
    expect(result.methods).toHaveLength(2);
  });

  it('limit=0 → empty', () => {
    const result = makeResult(makeMethods());
    filter.process(result, makeConfig(0));
    expect(result.methods).toEqual([]);
  });

  it('recursively applies to files', () => {
    const child = makeResult(makeMethods());
    const parent = makeResult(makeMethods(), [child]);
    filter.process(parent, makeConfig(1));
    expect(parent.methods).toHaveLength(1);
    expect((parent.files[0] as CoverageResult).methods).toHaveLength(1);
  });
});
