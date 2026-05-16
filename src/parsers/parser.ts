import { CoverageData } from '../models/coverage';

export interface Parser {
  parse(content: string, filePath: string, statementsLimit: number): CoverageData;
}
