import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

/** Config isolada — nao herda tests/unit do vitest.config.ts */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/seed/**/*.seed.ts'],
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@shared/': resolve(__dirname, 'src/shared'),
    },
  },
})
