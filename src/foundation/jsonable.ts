export interface Jsonable {
  toJSON(): Record<string, unknown>;
}
