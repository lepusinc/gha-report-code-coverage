import * as core from '@actions/core';
import { Config } from '../config/config';
import { CoverageResult } from '../models/coverage';
import { Metrics } from '../models/metrics';
import { SourceCodeMethod } from '../models/source-code';
import { Reporter } from './reporter';

type SummaryTableRow = (string | { data: string; header?: boolean })[];

export class StepSummaryReporter implements Reporter {
  async report(result: CoverageResult, config: Config): Promise<void> {
    core.summary.addHeading(config.title, 2);

    const includeConditionals = result.metrics.conditionals > 0;
    const includeUncoveredMethods = config.uncoveredMethodsLimit > 0;

    if (result.files.length > 1) {
      for (const file of result.files) {
        core.summary.addHeading(file.name, 3);
        core.summary.addTable(this.buildMetricsTable(file.metrics, includeConditionals));
        if (includeUncoveredMethods && file.methods.length > 0) {
          this.addUncoveredMethodsDetails(file.methods);
        }
      }
    } else {
      core.summary.addTable(this.buildMetricsTable(result.metrics, includeConditionals));
      if (includeUncoveredMethods && result.methods.length > 0) {
        this.addUncoveredMethodsDetails(result.methods);
      }
    }

    await core.summary.write();
  }

  private buildMetricsTable(metrics: Metrics, includeConditionals: boolean): SummaryTableRow[] {
    const rows: SummaryTableRow[] = [
      [
        { data: '', header: true },
        { data: 'Coverage', header: true },
      ],
      ['Lines', this.formatRate(metrics.coveredstatements, metrics.statements)],
      ['Methods', this.formatRate(metrics.coveredmethods, metrics.methods)],
    ];
    if (includeConditionals) {
      rows.push([
        'Conditionals',
        this.formatRate(metrics.coveredconditionals, metrics.conditionals),
      ]);
    }
    return rows;
  }

  private formatRate(covered: number, total: number): string {
    const rate = total === 0 ? 0 : (covered / total) * 100;
    return `${rate.toFixed(1)}% (${covered}/${total})`;
  }

  private addUncoveredMethodsDetails(methods: SourceCodeMethod[]): void {
    const header = '| ファイル | 行 | メソッド |\n| --- | --- | --- |\n';
    const rows = methods
      .map((m) => `| \`${m.file}\` | ${m.num} | \`${m.name}\` |`)
      .join('\n');
    const content = `\n${header}${rows}\n`;
    core.summary.addDetails(`未カバーのメソッド (${methods.length})`, content);
  }
}