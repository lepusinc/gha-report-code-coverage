import * as core from '@actions/core';
import { Config } from '../config/config';
import { CoverageBase, CoverageData, CoverageResult } from '../models/coverage';
import { Metrics } from '../models/metrics';
import { ThresholdResults } from '../models/threshold-result';
import { CoverageProcessorPipeline } from '../processors/coverage-processor-pipeline';
import { CoverageRateCalculator } from '../processors/coverage-rate-calculator';
import { ThresholdEvaluator } from '../processors/threshold-evaluator';
import { UncoveredMethodFilter } from '../processors/uncovered-method-filter';

export class CoverageAnalysisProcess {
  run(dataArr: CoverageData[], config: Config): CoverageResult {
    const result = this.aggregate(dataArr, config);

    const prePipeline = new CoverageProcessorPipeline([
      new CoverageRateCalculator(),
      new ThresholdEvaluator(),
    ]);
    const processed = prePipeline.process(result, config);

    this.writeOutputs(processed, dataArr, config);

    const postPipeline = new CoverageProcessorPipeline([
      new UncoveredMethodFilter(),
    ]);
    return postPipeline.process(processed, config);
  }

  private aggregate(dataArr: CoverageData[], config: Config): CoverageResult {
    if (dataArr.length === 0) {
      return new CoverageResult(
        config.title,
        new Metrics(0, 0, 0, 0, 0, 0),
        [],
        [],
        [],
        'ok',
        new ThresholdResults(null, null, null),
      );
    }

    const totals = new Metrics(0, 0, 0, 0, 0, 0);
    const allMethods = [];
    const allStatements = [];
    const files: CoverageBase[] = [];

    for (const d of dataArr) {
      totals.statements += d.metrics.statements;
      totals.coveredstatements += d.metrics.coveredstatements;
      totals.methods += d.metrics.methods;
      totals.coveredmethods += d.metrics.coveredmethods;
      totals.conditionals += d.metrics.conditionals;
      totals.coveredconditionals += d.metrics.coveredconditionals;
      allMethods.push(...d.methods);
      allStatements.push(...d.statements);

      files.push(
        new CoverageResult(
          d.name,
          d.metrics,
          d.methods,
          d.statements,
          [],
          'ok',
          new ThresholdResults(null, null, null),
        ),
      );
    }

    return new CoverageResult(
      config.title,
      totals,
      allMethods,
      allStatements,
      files,
      'ok',
      new ThresholdResults(null, null, null),
    );
  }

  private writeOutputs(
    result: CoverageResult,
    dataArr: CoverageData[],
    config: Config,
  ): void {
    core.setOutput('title', config.title);

    if (dataArr.length === 0) {
      core.setOutput('lines', '-');
      core.setOutput('methods', '-');
      core.setOutput('result', '-');
      core.setOutput('report', JSON.stringify(result.toJSON()));
      return;
    }

    const m = result.metrics;
    core.setOutput('lines', this.rate(m.coveredstatements, m.statements));
    core.setOutput('methods', this.rate(m.coveredmethods, m.methods));
    if (m.conditionals > 0) {
      core.setOutput(
        'conditionals',
        this.rate(m.coveredconditionals, m.conditionals),
      );
    }
    core.setOutput('result', result.result);
    core.setOutput('report', JSON.stringify(result.toJSON()));
  }

  private rate(covered: number, total: number): string {
    if (total === 0) return '0.0';
    return ((covered / total) * 100).toFixed(1);
  }
}
