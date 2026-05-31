import { defineConfig } from 'vitest/config'

// Pure-function unit tests run in the Node environment (no DOM/React needed).
// A dedicated config avoids loading the app's /api dev-server plugin.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
