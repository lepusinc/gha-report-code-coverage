import os from 'os';
import path from 'path';
import { defineConfig } from 'vitest/config';

const isCI = !!process.env.CI;

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    reporters: isCI ? ['default', 'junit'] : ['default'],
    outputFile: isCI
      ? { junit: process.env.JUNIT_OUTPUT_PATH ?? path.join(os.tmpdir(), 'test-results', 'junit.xml') }
      : undefined,
    coverage: {
      enabled: isCI,
      provider: 'v8',
      reporter: ['clover'],
      reportsDirectory: path.join(os.tmpdir(), 'coverage'),
    },
  },
});
