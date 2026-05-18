import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CloverParser } from '../../src/parsers/clover-parser';

const FIXTURES = join(__dirname, '..', 'fixtures', 'clover');

function load(name: string): { content: string; path: string } {
  const path = join(FIXTURES, name);
  return { content: readFileSync(path, 'utf-8'), path };
}

describe('CloverParser', () => {
  const parser = new CloverParser();

  it('parses simple.xml', () => {
    const { content, path } = load('simple.xml');
    const data = parser.parse(content, path);

    expect(data.name).toBe('Unit Tests');
    expect(data.metrics.statements).toBe(50);
    expect(data.metrics.coveredstatements).toBe(40);
    expect(data.metrics.methods).toBe(10);
    expect(data.metrics.coveredmethods).toBe(8);
    expect(data.metrics.conditionals).toBe(20);
    expect(data.metrics.coveredconditionals).toBe(15);

    expect(data.methods).toHaveLength(10);
    const covered = data.methods.filter((m) => m.covered).length;
    const uncovered = data.methods.filter((m) => !m.covered).length;
    expect(covered).toBe(8);
    expect(uncovered).toBe(2);

    expect(data.statements.every((s) => s.covered === false)).toBe(true);
    expect(data.statements.length).toBeGreaterThan(0);
    expect(data.statements.length).toBeLessThanOrEqual(30);

    expect(data.files).toEqual([]);
  });

  it('parses with-packages.xml (package wrapper)', () => {
    const { content, path } = load('with-packages.xml');
    const data = parser.parse(content, path);

    expect(data.name).toBe('Integration Tests');
    expect(data.methods).toHaveLength(10);
    expect(data.methods.filter((m) => !m.covered).length).toBe(2);
    expect(data.methods[0].file).toBe('src/Http/OrderController.php');
    expect(data.files).toEqual([]);
  });

  it('parses no-conditionals.xml', () => {
    const { content, path } = load('no-conditionals.xml');
    const data = parser.parse(content, path);

    expect(data.metrics.conditionals).toBe(0);
    expect(data.metrics.coveredconditionals).toBe(0);
    expect(data.files).toEqual([]);
  });

  it('parses all-covered.xml', () => {
    const { content, path } = load('all-covered.xml');
    const data = parser.parse(content, path);

    expect(data.methods).toHaveLength(3);
    expect(data.methods.every((m) => m.covered === true)).toBe(true);
    expect(data.statements).toEqual([]);
    expect(data.files).toEqual([]);
  });

  it('parses empty-project.xml (falls back to filePath)', () => {
    const { content, path } = load('empty-project.xml');
    const data = parser.parse(content, path);

    expect(data.name).toBe(path);
    expect(data.methods).toEqual([]);
    expect(data.statements).toEqual([]);
    expect(data.files).toEqual([]);
  });
});
