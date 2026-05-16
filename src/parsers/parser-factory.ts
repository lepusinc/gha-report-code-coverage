import { CloverParser } from './clover-parser';
import { Parser } from './parser';

export class ParserFactory {
  create(_filePath: string): Parser {
    return new CloverParser();
  }
}
