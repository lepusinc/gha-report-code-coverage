import { CoverageResult } from '../models/coverage';
import { Config } from '../config/config';

export interface CoverageProcessor {
  process(result: CoverageResult, config: Config): CoverageResult;
}
