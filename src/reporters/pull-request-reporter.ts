import { Config } from '../config/config';
import { CoverageResult } from '../models/coverage';
import { Reporter } from './reporter';

export class PullRequestReporter implements Reporter {
  // 将来実装: PR コメント出力
  report(_result: CoverageResult, _config: Config): Promise<void> {
    return Promise.resolve();
  }
}
