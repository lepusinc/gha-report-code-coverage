import { ThresholdValue, Thresholds } from '../config/thresholds';

export class ThresholdResult extends ThresholdValue {
  constructor(warn: number, fail: number, public result: 'ok' | 'warn' | 'fail') {
    super(warn, fail);
  }

  toJSON(): Record<string, unknown> {
    return { result: this.result, warn: this.warn, fail: this.fail };
  }
}

export class ThresholdResults extends Thresholds {
  declare lines: ThresholdResult | null;
  declare methods: ThresholdResult | null;
  declare conditionals: ThresholdResult | null;

  constructor(
    lines: ThresholdResult | null,
    methods: ThresholdResult | null,
    conditionals: ThresholdResult | null,
  ) {
    super(lines, methods, conditionals);
  }
}
