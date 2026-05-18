import { CoverageBase, CoverageResult } from '../models/coverage';
import { Config } from '../config/config';
import { SourceCodeMethod } from '../models/source-code';
import { CoverageProcessor } from './coverage-processor';

export class UncoveredMethodFilter implements CoverageProcessor {
  process(result: CoverageResult, config: Config): CoverageResult {
    this.filter(result, config.uncoveredMethodsLimit);
    return result;
  }

  private filter(node: CoverageBase, limit: number): void {
    node.methods = this.pick(node.methods, limit);
    for (const file of node.files) {
      this.filter(file, limit);
    }
  }

  private pick(methods: SourceCodeMethod[], limit: number): SourceCodeMethod[] {
    if (limit === 0) return [];
    return methods.filter((m) => m.covered === false).slice(0, limit);
  }
}
