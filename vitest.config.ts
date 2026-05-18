import { defineConfig } from 'vitest/config';

const isCI = !!process.env.CI;

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    environment: 'node',
    reporters: isCI ? ['default', 'junit'] : ['default'],
    outputFile: isCI
      ? { junit: process.env.JUNIT_OUTPUT_PATH ?? '/tmp/test-results/junit.xml' }
      : undefined,
    coverage: {
      enabled: isCI,
      provider: 'v8',
      reporter: ['clover'],
      reportsDirectory: '/tmp/coverage',
    },
  },
});
