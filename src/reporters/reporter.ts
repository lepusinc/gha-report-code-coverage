import { Config } from '../config/config';
import { CoverageResult } from '../models/coverage';

export interface Reporter {
  report(result: CoverageResult, config: Config): Promise<void>;
}
