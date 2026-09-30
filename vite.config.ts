import { defineConfig, type Plugin } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

/** Which build this is: the commit on CI, the moment of building otherwise. */
const BUILD_ID = process.env.GITHUB_SHA?.slice(0, 12) ?? String(Date.now())

/** Publishes the build's id beside the game, so an open copy can tell it has been superseded. */
const versionFile = (): Plugin => ({
  name: 'version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) })
  },
})

export default defineConfig({
  plugins: [vue(), versionFile()],
  // Relative base so the built bundle works when uploaded to itch.io
  base: './',
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    // Generating a provably solvable case takes a fraction of a second, and
    // several tests generate dozens.
    testTimeout: 90_000,
  },
})
