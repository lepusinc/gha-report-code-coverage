import { Config } from '../config/config';
import { CoverageResult } from '../models/coverage';
import { AggregateReporter } from '../reporters/aggregate-reporter';
import { Reporter } from '../reporters/reporter';
import { StepSummaryReporter } from '../reporters/step-summary-reporter';

export class ReportProcess {
  async run(result: CoverageResult, config: Config): Promise<void> {
    const aggregate = this.build(config);
    await aggregate.report(result, config);
  }

  private build(config: Config): AggregateReporter {
    const reporters: Reporter[] = [];
    if (config.stepSummary) {
      reporters.push(new StepSummaryReporter());
    }
    return new AggregateReporter(reporters);
  }
}
