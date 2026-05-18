import { Jsonable } from '../foundation/jsonable';
import { Metrics } from './metrics';
import { SourceCodeMethod, SourceCodeStatement } from './source-code';
import { ThresholdResults } from './threshold-result';

export abstract class CoverageBase implements Jsonable {
  constructor(
    public name: string,
    public metrics: Metrics,
    public methods: SourceCodeMethod[],
    public statements: SourceCodeStatement[],
    public files: CoverageBase[],
  ) {}

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      metrics: this.metrics.toJSON(),
      methods: this.methods.map((m) => m.toJSON()),
      statements: this.statements.map((s) => s.toJSON()),
      files: this.files.map((f) => f.toJSON()),
    };
  }
}

export class CoverageData extends CoverageBase {}

export class CoverageResult extends CoverageBase {
  constructor(
    name: string,
    metrics: Metrics,
    methods: SourceCodeMethod[],
    statements: SourceCodeStatement[],
    files: CoverageBase[],
    public result: 'ok' | 'warn' | 'fail',
    public thresholds: ThresholdResults,
  ) {
    super(name, metrics, methods, statements, files);
  }

  toJSON(): Record<string, unknown> {
    const json: Record<string, unknown> = {
      name: this.name,
      metrics: this.metrics.toJSON(),
      result: this.result,
    };
    const thresholdsJson = this.thresholds.toJSON();
    if (Object.keys(thresholdsJson).length > 0) {
      json.thresholds = thresholdsJson;
    }
    json.methods = this.methods.map((m) => m.toJSON());
    json.statements = this.statements.map((s) => s.toJSON());
    json.files = this.files.map((f) => f.toJSON());
    return json;
  }
}
