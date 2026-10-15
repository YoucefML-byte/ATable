import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.int.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.int.test.ts'],
          environment: 'node',
          setupFiles: ['tests/integration/setup.ts'],
          testTimeout: 30_000,
          fileParallelism: false,
        },
      },
    ],
    // 'server-only' throws outside React Server Components: replace it in tests.
    alias: { 'server-only': new URL('./tests/stubs/server-only.ts', import.meta.url).pathname },
  },
});
