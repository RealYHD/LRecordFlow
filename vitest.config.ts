import { defineConfig } from 'vitest/config'
import { svelte as sveltePlugin } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [sveltePlugin()],
  test: {
    include: ['src/test/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'src/test/', 'e2e/', 'test-results/']
    }
  }
})
