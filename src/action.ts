import * as core from '@actions/core';
import { Config } from './config/config';
import { CoverageAnalysisProcess } from './steps/coverage-analysis-process';
import { CoverageLoadProcess } from './steps/coverage-load-process';
import { ReportProcess } from './steps/report-process';
import { SourceResolveProcess } from './steps/source-resolve-process';

export class ReportCodeCoverageAction {
  async run(): Promise<void> {
    try {
      const config = Config.fromInputs();
      const source = await new SourceResolveProcess().run(config);
      const data = await new CoverageLoadProcess().run(source, config);
      const result = new CoverageAnalysisProcess().run(data, config);
      await new ReportProcess().run(result, config);
    } catch (err) {
      core.setFailed(err instanceof Error ? err.message : String(err));
    }
  }
}
