import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as core from '@actions/core';
import { CoverageAnalysisProcess } from '../../src/steps/coverage-analysis-process';
import { Config } from '../../src/config/config';
import { Thresholds, ThresholdValue } from '../../src/config/thresholds';
import { CoverageData } from '../../src/models/coverage';
import { Metrics } from '../../src/models/metrics';
import { SourceCodeMethod, SourceCodeStatement } from '../../src/models/source-code';

vi.mock('@actions/core', () => ({
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  getInput: vi.fn(() => ''),
}));

function makeConfig(uncoveredLimit = 0, thresholds: Thresholds = new Thresholds(null, null, null)): Config {
  return new Config('', '', false, false, 'Coverage', thresholds, uncoveredLimit);
}

function makeData(name: string, metrics: Metrics, methods: SourceCodeMethod[] = [], statements: SourceCodeStatement[] = []): CoverageData {
  return new CoverageData(name, metrics, methods, statements, []);
}

function getOutput(key: string): string | undefined {
  const mock = vi.mocked(core.setOutput);
  const calls = mock.mock.calls.filter((c) => c[0] === key);
  return calls.length > 0 ? (calls[calls.length - 1][1] as string) : undefined;
}

describe('CoverageAnalysisProcess', () => {
  beforeEach(() => {
    vi.mocked(core.setOutput).mockClear();
  });

  it('aggregates multiple CoverageData (metrics sum, methods/statements flatten, files populate)', () => {
    const m1 = new SourceCodeMethod('a.php', 1, false, 'm1');
    const m2 = new SourceCodeMethod('b.php', 1, true, 'm2');
    const s1 = new SourceCodeStatement('a.php', 5, false);
    const data = [
      makeData('A', new Metrics(10, 5, 4, 2, 6, 3), [m1], [s1]),
      makeData('B', new Metrics(20, 15, 6, 6, 4, 4), [m2], []),
    ];

    const proc = new CoverageAnalysisProcess();
    const result = proc.run(data, makeConfig(10));

    expect(result.metrics.statements).toBe(30);
    expect(result.metrics.coveredstatements).toBe(20);
    expect(result.metrics.methods).toBe(10);
    expect(result.metrics.coveredmethods).toBe(8);
    expect(result.metrics.conditionals).toBe(10);
    expect(result.metrics.coveredconditionals).toBe(7);
    expect(result.files).toHaveLength(2);

    expect(getOutput('lines')).toBe(((20 / 30) * 100).toFixed(1));
    expect(getOutput('methods')).toBe(((8 / 10) * 100).toFixed(1));
    expect(getOutput('conditionals')).toBe(((7 / 10) * 100).toFixed(1));
    expect(getOutput('result')).toBe('ok');
  });

  it('empty dataArr → writes "-" for percentages and result', () => {
    const proc = new CoverageAnalysisProcess();
    proc.run([], makeConfig());
    expect(getOutput('lines')).toBe('-');
    expect(getOutput('methods')).toBe('-');
    expect(getOutput('result')).toBe('-');
    expect(getOutput('conditionals')).toBeUndefined();
  });

  it('conditionals=0 total → omits conditionals output', () => {
    const data = [makeData('A', new Metrics(10, 10, 5, 5, 0, 0))];
    const proc = new CoverageAnalysisProcess();
    proc.run(data, makeConfig());

    const calls = vi.mocked(core.setOutput).mock.calls.map((c) => c[0]);
    expect(calls).not.toContain('conditionals');
  });

  it('report output contains all methods (before filter)', () => {
    const methods = [
      new SourceCodeMethod('a.php', 1, false, 'u1'),
      new SourceCodeMethod('a.php', 2, false, 'u2'),
      new SourceCodeMethod('a.php', 3, false, 'u3'),
      new SourceCodeMethod('a.php', 4, true, 'c1'),
    ];
    const data = [makeData('A', new Metrics(10, 5, 4, 1, 0, 0), methods)];
    const proc = new CoverageAnalysisProcess();
    const result = proc.run(data, makeConfig(1));

    const reportJson = getOutput('report');
    expect(reportJson).toBeDefined();
    const parsed = JSON.parse(reportJson as string);
    expect(parsed.methods).toHaveLength(4);

    expect(result.methods).toHaveLength(1);
    expect(result.methods[0].covered).toBe(false);
  });
});
