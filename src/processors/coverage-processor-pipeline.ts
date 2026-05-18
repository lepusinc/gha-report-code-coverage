import { CoverageResult } from '../models/coverage';
import { Config } from '../config/config';
import { CoverageProcessor } from './coverage-processor';

export class CoverageProcessorPipeline implements CoverageProcessor {
  constructor(private readonly processors: CoverageProcessor[]) {}

  process(result: CoverageResult, config: Config): CoverageResult {
    return this.processors.reduce<CoverageResult>(
      (acc, processor) => processor.process(acc, config),
      result,
    );
  }
}
