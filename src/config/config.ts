import * as core from '@actions/core';
import { ThresholdValue, Thresholds } from './thresholds';

export class Config {
  constructor(
    public file: string,
    public artifact: string,
    public required: boolean,
    public stepSummary: boolean,
    public title: string,
    public thresholds: Thresholds,
    public uncoveredMethodsLimit: number,
  ) {}

  static fromInputs(): Config {
    const file = core.getInput('file');
    const artifact = core.getInput('artifact');
    const required = Config.parseBoolean(core.getInput('required'), true);
    const stepSummary = Config.parseBoolean(core.getInput('step-summary'), true);
    const title = core.getInput('title') || 'Coverage';
    const thresholds = new Thresholds(
      Config.parseThreshold(core.getInput('thresholds-lines')),
      Config.parseThreshold(core.getInput('thresholds-methods')),
      Config.parseThreshold(core.getInput('thresholds-conditionals')),
    );
    const uncoveredMethodsLimit = Config.parseUncoveredMethodsLimit(
      core.getInput('uncovered-methods-limit'),
    );
    return new Config(file, artifact, required, stepSummary, title, thresholds, uncoveredMethodsLimit);
  }

  private static parseThreshold(input: string): ThresholdValue | null {
    const trimmed = input.trim();
    if (trimmed === '') return null;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) return null;
    const warn = Number(parts[0]);
    const fail = Number(parts[1]);
    if (Number.isNaN(warn) || Number.isNaN(fail)) return null;
    return new ThresholdValue(warn, fail);
  }

  private static parseBoolean(input: string, defaultValue: boolean): boolean {
    const trimmed = input.trim().toLowerCase();
    if (trimmed === '') return defaultValue;
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    return defaultValue;
  }

  private static parseUncoveredMethodsLimit(input: string): number {
    const trimmed = input.trim().toLowerCase();
    if (trimmed === '' || trimmed === '0' || trimmed === 'off') return 0;
    const value = parseInt(trimmed, 10);
    return Number.isNaN(value) ? 0 : Math.max(0, value);
  }
}
