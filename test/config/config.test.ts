import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Config } from '../../src/config/config';

const INPUT_NAMES = [
  'file',
  'artifact',
  'required',
  'step-summary',
  'title',
  'thresholds-lines',
  'thresholds-methods',
  'thresholds-conditionals',
  'uncovered-methods-limit',
];

function envKey(name: string): string {
  return `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
}

function clearInputs(): void {
  for (const name of INPUT_NAMES) {
    delete process.env[envKey(name)];
  }
}

function setInput(name: string, value: string): void {
  process.env[envKey(name)] = value;
}

describe('Config.fromInputs', () => {
  beforeEach(() => {
    clearInputs();
  });

  afterEach(() => {
    clearInputs();
  });

  it('applies defaults', () => {
    const c = Config.fromInputs();
    expect(c.file).toBe('');
    expect(c.artifact).toBe('');
    expect(c.required).toBe(true);
    expect(c.stepSummary).toBe(true);
    expect(c.title).toBe('Coverage');
    expect(c.thresholds.lines).toBeNull();
    expect(c.thresholds.methods).toBeNull();
    expect(c.thresholds.conditionals).toBeNull();
    expect(c.uncoveredMethodsLimit).toBe(0);
  });

  it('parses threshold "60 80" → { warn: 60, fail: 80 }', () => {
    setInput('thresholds-lines', '60 80');
    const c = Config.fromInputs();
    expect(c.thresholds.lines).not.toBeNull();
    expect(c.thresholds.lines?.warn).toBe(60);
    expect(c.thresholds.lines?.fail).toBe(80);
  });

  it('parses threshold "" → null', () => {
    setInput('thresholds-methods', '');
    expect(Config.fromInputs().thresholds.methods).toBeNull();
  });

  it('threshold is whitespace-tolerant', () => {
    setInput('thresholds-lines', '  70   50  ');
    const c = Config.fromInputs();
    expect(c.thresholds.lines?.warn).toBe(70);
    expect(c.thresholds.lines?.fail).toBe(50);
  });

  it('uncovered-methods-limit: empty → 0', () => {
    setInput('uncovered-methods-limit', '');
    expect(Config.fromInputs().uncoveredMethodsLimit).toBe(0);
  });

  it("uncovered-methods-limit: 'off' → 0", () => {
    setInput('uncovered-methods-limit', 'off');
    expect(Config.fromInputs().uncoveredMethodsLimit).toBe(0);
  });

  it("uncovered-methods-limit: '0' → 0", () => {
    setInput('uncovered-methods-limit', '0');
    expect(Config.fromInputs().uncoveredMethodsLimit).toBe(0);
  });

  it("uncovered-methods-limit: '10' → 10", () => {
    setInput('uncovered-methods-limit', '10');
    expect(Config.fromInputs().uncoveredMethodsLimit).toBe(10);
  });

  it("required: 'false' → false", () => {
    setInput('required', 'false');
    expect(Config.fromInputs().required).toBe(false);
  });

  it("step-summary: 'false' → false", () => {
    setInput('step-summary', 'false');
    expect(Config.fromInputs().stepSummary).toBe(false);
  });
});
