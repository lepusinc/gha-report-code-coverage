import { describe, it, expect } from 'vitest';
import { CoverageProcessorPipeline } from '../../src/processors/coverage-processor-pipeline';
import { CoverageProcessor } from '../../src/processors/coverage-processor';
import { Config } from '../../src/config/config';
import { Thresholds } from '../../src/config/thresholds';
import { CoverageResult } from '../../src/models/coverage';
import { Metrics } from '../../src/models/metrics';
import { ThresholdResults } from '../../src/models/threshold-result';

const config = new Config('', '', false, false, 'Coverage', new Thresholds(null, null, null), 0);

function makeResult(name: string): CoverageResult {
  return new CoverageResult(
    name,
    new Metrics(0, 0, 0, 0, 0, 0),
    [],
    [],
    [],
    'ok',
    new ThresholdResults(null, null, null),
  );
}

describe('CoverageProcessorPipeline', () => {
  it('runs processors in sequence', () => {
    const order: string[] = [];
    const make = (id: string): CoverageProcessor => ({
      process(result) {
        order.push(id);
        return result;
      },
    });

    const pipeline = new CoverageProcessorPipeline([make('a'), make('b'), make('c')]);
    pipeline.process(makeResult('x'), config);
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('passes transformed result from previous step', () => {
    const rename: CoverageProcessor = {
      process(result) {
        return makeResult(result.name + '!');
      },
    };
    let seenName = '';
    const observer: CoverageProcessor = {
      process(result) {
        seenName = result.name;
        return result;
      },
    };

    const pipeline = new CoverageProcessorPipeline([rename, observer]);
    const out = pipeline.process(makeResult('start'), config);
    expect(seenName).toBe('start!');
    expect(out.name).toBe('start!');
  });

  it('empty pipeline returns input unchanged', () => {
    const pipeline = new CoverageProcessorPipeline([]);
    const input = makeResult('same');
    expect(pipeline.process(input, config)).toBe(input);
  });
});
