/**
 * Build faces for dsh-defend. The plugin is host-only: one ESM bundle from
 * `src/index.ts` lands at `lib/index.js`, while `scripts/prepare.mjs` emits
 * the matching declaration tree into `lib/types` through tsc
 * (`tsconfig.json`). There are no runtime dependencies — every import from
 * the `@deepseek-ai/*` peers is type-only, so the bundle is self-contained
 * and the declared peers stay external by construction.
 */

import { defineConfig } from 'tsdown'

export default defineConfig({
  name: 'dsh-defend',
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: false,
  clean: true,
  // ESM output under a "type": "module" package must land on .js, not .mjs.
  fixedExtension: false,
  deps: {
    // No dependency may come in from node_modules: the host half bundles
    // nothing because it needs nothing at runtime beyond node: builtins.
    onlyBundle: [],
    neverBundle: [/^node:/],
  },
})
