import { Jsonable } from '../foundation/jsonable';

export class ThresholdValue implements Jsonable {
  constructor(public warn: number, public fail: number) {}

  toJSON(): Record<string, unknown> {
    return { warn: this.warn, fail: this.fail };
  }
}

export class Thresholds implements Jsonable {
  constructor(
    public lines: ThresholdValue | null,
    public methods: ThresholdValue | null,
    public conditionals: ThresholdValue | null,
  ) {}

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (this.lines !== null) result.lines = this.lines.toJSON();
    if (this.methods !== null) result.methods = this.methods.toJSON();
    if (this.conditionals !== null) result.conditionals = this.conditionals.toJSON();
    return result;
  }
}
