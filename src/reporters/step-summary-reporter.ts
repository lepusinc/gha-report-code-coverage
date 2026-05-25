import * as core from '@actions/core';
import { Config } from '../config/config';
import { CoverageResult } from '../models/coverage';
import { Metrics } from '../models/metrics';
import { SourceCodeMethod } from '../models/source-code';
import { Reporter } from './reporter';

export class StepSummaryReporter implements Reporter {
  async report(result: CoverageResult, config: Config): Promise<void> {
    core.summary.addHeading(config.title, 2);

    const includeConditionals = result.metrics.conditionals > 0;
    const includeUncoveredMethods = config.uncoveredMethodsLimit > 0;

    if (result.files.length === 0) {
      core.summary.addRaw('_No coverage data found._');
    } else if (result.files.length > 1) {
      for (const file of result.files) {
        core.summary.addHeading(file.name, 3);
        core.summary.addRaw(this.buildMetricsTable(file.metrics, includeConditionals), true);
        if (includeUncoveredMethods && file.methods.length > 0) {
          const totalUncovered = Math.max(0, file.metrics.methods - file.metrics.coveredmethods);
          this.addUncoveredMethodsDetails(file.methods, totalUncovered);
        }
      }
    } else {
      core.summary.addRaw(this.buildMetricsTable(result.metrics, includeConditionals), true);
      if (includeUncoveredMethods && result.methods.length > 0) {
        const totalUncovered = Math.max(0, result.metrics.methods - result.metrics.coveredmethods);
        this.addUncoveredMethodsDetails(result.methods, totalUncovered);
      }
    }

    await core.summary.write();
  }

  private buildMetricsTable(metrics: Metrics, includeConditionals: boolean): string {
    const rows: [string, number, number][] = [
      ['Lines', metrics.coveredstatements, metrics.statements],
      ['Methods', metrics.coveredmethods, metrics.methods],
    ];
    if (includeConditionals) {
      rows.push(['Conditionals', metrics.coveredconditionals, metrics.conditionals]);
    }

    const maxCovered = Math.max(...rows.map(([, covered]) => covered));
    const maxTotal = Math.max(...rows.map(([,, total]) => total));
    const coveredWidth = String(maxCovered).length;
    const totalWidth = String(maxTotal).length;

    const header = `|  | Coverage | Count |\n| --- | --: | --: |`;
    const dataRows = rows
      .map(([label, covered, total]) => {
        const rate = total === 0 ? 0 : (covered / total) * 100;
        const coverage = `\`${rate.toFixed(1)} %\``;
        const count = `\`${String(covered).padStart(coveredWidth)} / ${String(total).padStart(totalWidth)}\``;
        return `| ${label} | ${coverage} | ${count} |`;
      })
      .join('\n');

    return `\n${header}\n${dataRows}`;
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/\|/g, '\\|').replace(/`/g, '\\`').replace(/\r?\n/g, ' ');
  }

  private addUncoveredMethodsDetails(methods: SourceCodeMethod[], totalUncovered: number): void {
    const header = '| ファイル | 行 | メソッド |\n| --- | --- | --- |\n';
    const rows = methods
      .map((m) => `| \`${this.escapeMarkdown(m.file)}\` | ${m.num} | \`${this.escapeMarkdown(m.name)}\` |`)
      .join('\n');
    const truncated = methods.length < totalUncovered ? `\n_${methods.length}件のみ表示（全${totalUncovered}件）_\n` : '';
    const content = `\n\n${header}${rows}\n${truncated}`;
    core.summary.addDetails(`未カバーのメソッド (${totalUncovered})`, content);
  }
}
