import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Relative base so the built bundle works when uploaded to itch.io
  base: './',
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
  },
})
