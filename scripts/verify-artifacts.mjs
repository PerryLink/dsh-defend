// Verify the built artifacts after `pnpm run build`: syntax-check the bundle,
// import the ESM host face under plain Node, and assert the plugin contract
// (name/apply/reviewDestructiveDelete) so a package with a stale or broken
// lib/ fails loudly. The detection layer (src/detect) lands later and will
// extend this face with its own exports and service injections.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const required = ['lib/index.js', 'lib/types/index.d.ts']
for (const rel of required) {
  if (!existsSync(path.join(root, rel))) throw new Error(`missing artifact: ${rel}`)
}

// 1. Syntax-check the bundle (plain Node parse; no execution).
execFileSync(process.execPath, ['--check', path.join(root, 'lib/index.js')], { stdio: 'inherit' })

// 2. The ESM host face must import under plain Node (no tsx, no checkout paths).
const index = await import(pathToFileURL(path.join(root, 'lib/index.js')).href)
if (typeof index.apply !== 'function' || index.name !== 'dsh-defend') {
  throw new Error('lib/index.js exports an unexpected plugin face')
}
if (typeof index.reviewDestructiveDelete !== 'function') {
  throw new Error('lib/index.js does not export reviewDestructiveDelete')
}

console.log('artifacts OK: syntax + ESM import + plugin face')
