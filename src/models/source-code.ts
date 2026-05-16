import { Jsonable } from '../foundation/jsonable';

export abstract class SourceCode implements Jsonable {
  constructor(public file: string, public num: number, public covered: boolean) {}

  abstract toJSON(): Record<string, unknown>;
}

export class SourceCodeMethod extends SourceCode {
  constructor(file: string, num: number, covered: boolean, public name: string) {
    super(file, num, covered);
  }

  toJSON(): Record<string, unknown> {
    return { file: this.file, num: this.num, name: this.name, covered: this.covered };
  }
}

export class SourceCodeStatement extends SourceCode {
  toJSON(): Record<string, unknown> {
    return { file: this.file, num: this.num, covered: this.covered };
  }
}
