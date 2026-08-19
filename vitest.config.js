import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: { __BUILD_TIME__: JSON.stringify('dev') },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
    // Tests unitaires uniquement ; les specs Playwright de tests/ sont exclues
    // (elles tournent via `npx playwright test`, pas via Vitest).
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['node_modules/**', 'tests/**', 'dist/**'],
  },
})
