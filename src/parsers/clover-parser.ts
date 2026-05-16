import { XMLParser } from 'fast-xml-parser';
import { CoverageData } from '../models/coverage';
import { Metrics } from '../models/metrics';
import { SourceCodeMethod, SourceCodeStatement } from '../models/source-code';
import { Parser } from './parser';

interface LineNode {
  '@_type'?: string;
  '@_count'?: number | string;
  '@_num'?: number | string;
  '@_name'?: string;
}

interface FileNode {
  '@_name'?: string;
  line?: LineNode | LineNode[];
}

interface PackageNode {
  '@_name'?: string;
  file?: FileNode | FileNode[];
}

interface MetricsNode {
  '@_statements'?: number | string;
  '@_coveredstatements'?: number | string;
  '@_methods'?: number | string;
  '@_coveredmethods'?: number | string;
  '@_conditionals'?: number | string;
  '@_coveredconditionals'?: number | string;
}

interface ProjectNode {
  '@_name'?: string;
  metrics?: MetricsNode;
  package?: PackageNode | PackageNode[];
  file?: FileNode | FileNode[];
}

interface CoverageRoot {
  coverage?: {
    project?: ProjectNode;
  };
}

const UNCOVERED_STATEMENT_LIMIT = 30;

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function toNumber(value: number | string | undefined): number {
  if (value === undefined || value === null) {
    return 0;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export class CloverParser implements Parser {
  parse(content: string, filePath: string): CoverageData {
    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    let parsed: CoverageRoot;
    try {
      parsed = xmlParser.parse(content) as CoverageRoot;
    } catch (err) {
      throw new Error(`Failed to parse Clover XML from ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
    }
    const project: ProjectNode = parsed.coverage?.project ?? {};
    const metricsNode: MetricsNode = project.metrics ?? {};

    const metrics = new Metrics(
      toNumber(metricsNode['@_statements']),
      toNumber(metricsNode['@_coveredstatements']),
      toNumber(metricsNode['@_methods']),
      toNumber(metricsNode['@_coveredmethods']),
      toNumber(metricsNode['@_conditionals']),
      toNumber(metricsNode['@_coveredconditionals']),
    );

    const methods: SourceCodeMethod[] = [];
    const statements: SourceCodeStatement[] = [];

    const files: FileNode[] = [
      ...toArray(project.file),
      ...toArray(project.package).flatMap((pkg) => toArray(pkg.file)),
    ];

    for (const file of files) {
      const fileName = file['@_name'] ?? '';
      const lines = toArray(file.line);

      for (const line of lines) {
        const type = line['@_type'];
        const count = toNumber(line['@_count']);
        const num = toNumber(line['@_num']);

        if (type === 'method') {
          methods.push(new SourceCodeMethod(fileName, num, count > 0, line['@_name'] ?? ''));
        } else if (type === 'stmt') {
          if (count === 0 && statements.length < UNCOVERED_STATEMENT_LIMIT) {
            statements.push(new SourceCodeStatement(fileName, num, false));
          }
        }
      }
    }

    const projectName = project['@_name'];
    const name = projectName && projectName.length > 0 ? projectName : filePath;

    return new CoverageData(name, metrics, methods, statements, []);
  }
}
