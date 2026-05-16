import * as fs from 'fs/promises';
import * as core from '@actions/core';
import { glob } from 'glob';
import { Config } from '../config/config';
import { CoverageData } from '../models/coverage';
import { ParserFactory } from '../parsers/parser-factory';

export class CoverageLoadProcess {
  async run(globPattern: string, config: Config): Promise<CoverageData[]> {
    const files = (await glob(globPattern, { nodir: true })).sort((a, b) => a.localeCompare(b));

    if (files.length === 0) {
      if (config.required) {
        throw new Error(`No coverage files matched pattern: ${globPattern}`);
      }
      core.warning(`No coverage files matched pattern: ${globPattern}`);
      return [];
    }

    const factory = new ParserFactory();
    const results: CoverageData[] = [];
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const parser = factory.create(file);
      results.push(parser.parse(content, file, config.uncoveredMethodsLimit));
    }
    return results;
  }
}
