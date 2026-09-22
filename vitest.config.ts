import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: [
        'src/main/modules/**/use-cases/**/*.ts',
        'src/main/modules/**/services/**/*.ts',
        'src/main/modules/**/util/**/*.ts',
        'src/shared/utils/**/*.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@shared/': resolve(__dirname, 'src/shared'),
    },
  },
})
