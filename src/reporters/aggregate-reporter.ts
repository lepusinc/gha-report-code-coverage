import { Config } from '../config/config';
import { CoverageResult } from '../models/coverage';
import { Reporter } from './reporter';

export class AggregateReporter implements Reporter {
  constructor(private readonly reporters: Reporter[]) {}

  async report(result: CoverageResult, config: Config): Promise<void> {
    for (const reporter of this.reporters) {
      await reporter.report(result, config);
    }
  }
}
