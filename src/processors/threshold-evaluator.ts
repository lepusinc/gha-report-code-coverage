import { CoverageResult } from '../models/coverage';
import { Config } from '../config/config';
import { ThresholdValue } from '../config/thresholds';
import { ThresholdResult } from '../models/threshold-result';
import { CoverageProcessor } from './coverage-processor';

type Verdict = 'ok' | 'warn' | 'fail';

export class ThresholdEvaluator implements CoverageProcessor {
  process(result: CoverageResult, config: Config): CoverageResult {
    const skipConditionals = result.metrics.conditionals === 0;
    this.evaluate(result, config, skipConditionals);
    return result;
  }

  private evaluate(target: CoverageResult, config: Config, skipConditionals: boolean): void {
    const thresholds = config.thresholds;
    const verdicts: Verdict[] = [];

    if (thresholds.lines !== null) {
      const verdict = this.classify(this.percentage(target.metrics.coveredstatements, target.metrics.statements), thresholds.lines);
      target.thresholds.lines = new ThresholdResult(thresholds.lines.warn, thresholds.lines.fail, verdict);
      verdicts.push(verdict);
    } else {
      target.thresholds.lines = null;
    }

    if (thresholds.methods !== null) {
      const verdict = this.classify(this.percentage(target.metrics.coveredmethods, target.metrics.methods), thresholds.methods);
      target.thresholds.methods = new ThresholdResult(thresholds.methods.warn, thresholds.methods.fail, verdict);
      verdicts.push(verdict);
    } else {
      target.thresholds.methods = null;
    }

    if (thresholds.conditionals !== null && !skipConditionals) {
      const verdict = this.classify(this.percentage(target.metrics.coveredconditionals, target.metrics.conditionals), thresholds.conditionals);
      target.thresholds.conditionals = new ThresholdResult(thresholds.conditionals.warn, thresholds.conditionals.fail, verdict);
      verdicts.push(verdict);
    } else {
      target.thresholds.conditionals = null;
    }

    target.result = this.overall(verdicts);

    for (const file of target.files) {
      if (file instanceof CoverageResult) {
        this.evaluate(file, config, skipConditionals);
      }
    }
  }

  private percentage(covered: number, total: number): number {
    if (total === 0) return 100;
    return (covered / total) * 100;
  }

  private classify(actual: number, threshold: ThresholdValue): Verdict {
    if (actual >= threshold.warn) return 'ok';
    if (actual >= threshold.fail) return 'warn';
    return 'fail';
  }

  private overall(verdicts: Verdict[]): Verdict {
    if (verdicts.length === 0) return 'ok';
    if (verdicts.includes('fail')) return 'fail';
    if (verdicts.includes('warn')) return 'warn';
    return 'ok';
  }

}
