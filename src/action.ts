import * as core from '@actions/core';
import { Config } from './config/config';
import { CoverageAnalysisProcess } from './steps/coverage-analysis-process';
import { CoverageLoadProcess } from './steps/coverage-load-process';
import { ReportProcess } from './steps/report-process';
import { SourceResolveProcess } from './steps/source-resolve-process';

export class ReportCodeCoverageAction {
  private readonly config: Config;

  constructor() {
    this.config = Config.fromInputs();
  }

  async run(): Promise<void> {
    try {
      const source = await new SourceResolveProcess().run(this.config);
      const data = await new CoverageLoadProcess().run(source, this.config);
      const result = new CoverageAnalysisProcess().run(data, this.config);
      await new ReportProcess().run(result, this.config);
    } catch (err) {
      core.setFailed(err instanceof Error ? err.message : String(err));
    }
  }
}
