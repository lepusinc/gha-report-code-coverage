import { Jsonable } from '../foundation/jsonable';

export class Metrics implements Jsonable {
  constructor(
    public statements: number,
    public coveredstatements: number,
    public methods: number,
    public coveredmethods: number,
    public conditionals: number,
    public coveredconditionals: number,
  ) {}

  toJSON(): Record<string, unknown> {
    return {
      statements: this.statements,
      coveredstatements: this.coveredstatements,
      methods: this.methods,
      coveredmethods: this.coveredmethods,
      conditionals: this.conditionals,
      coveredconditionals: this.coveredconditionals,
    };
  }
}
