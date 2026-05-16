import { CoverageResult } from '../models/coverage';
import { Config } from '../config/config';
import { CoverageProcessor } from './coverage-processor';

// Placeholder processor. Coverage percentages are derived on demand by callers
// from Metrics (e.g. coveredstatements / statements * 100), so no transform is
// applied here. Kept for future percentage caching / rate-related transforms.
export class CoverageRateCalculator implements CoverageProcessor {
  process(result: CoverageResult, _config: Config): CoverageResult {
    return result;
  }
}
