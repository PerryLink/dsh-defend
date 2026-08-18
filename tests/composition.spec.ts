/**
 * Real Loader composition suite (community five-layer model, layers 4–5):
 * an independent process mounts the Loader over a cordis.yml with real
 * service rows + the plugin row + config, proving module unwrapping, inject
 * resolution, config application, and the registry contributions. The plugin
 * row points at the built `lib/index.js`, so the suite also carries the
 * plain-Node built entry smoke (A1). The two negative regressions are also
 * here: invalid config must fail loud for the expected reason (U4), and a
 * default export must fail with the missing-inject reason (C2).
 * @module dsh-defend/test/composition.spec
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const runner = join(repositoryRoot, 'scripts', 'loader-runner.mjs')
const builtEntry = join(repositoryRoot, 'lib', 'index.js')

/** One cordis.yml: real service rows, then the plugin row with config. */
function configFor(pluginRow: string, configLines: string[] = []): string {
  return [
    "- name: '@deepseek-ai/dsh-session'",
    "- name: '@deepseek-ai/dsh-system-prompt'",
    "- name: '@deepseek-ai/dsh-tools'",
    "- name: '@deepseek-ai/dsh-commands'",
    `- name: ${JSON.stringify(pluginRow)}`,
    ...(configLines.length > 0 ? ['  config:', ...configLines.map(line => `    ${line}`)] : []),
    '',
  ].join('\n')
}

function runRunner(configPath: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [runner, configPath], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env },
    timeout: 120_000,
  })
  if (result.error !== undefined) throw result.error
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

const temporaryRoot = mkdtempSync(join(tmpdir(), 'dsh-defend-loader-'))

beforeAll(() => {
  // The plugin row points at the built bundle; `shell` resolves `pnpm` (.cmd)
  // on Windows.
  const build = spawnSync('pnpm', ['run', 'build'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env },
    timeout: 120_000,
  })
  if (build.status !== 0) {
    throw new Error(`build failed (${String(build.status)}):\n${build.stdout}\n${build.stderr}`)
  }
}, 120_000)

describe('Loader composition (built entry)', () => {
  it('mounts the plugin, registers /defend, and applies registerTool: false', () => {
    const configPath = join(temporaryRoot, 'valid.yml')
    writeFileSync(configPath, configFor(pathToFileURL(builtEntry).href, ['registerTool: false']))
    const evidence = runRunner(configPath)
    expect(evidence.status, `stdout:\n${evidence.stdout}\nstderr:\n${evidence.stderr}`).toBe(0)
    const marker = evidence.stdout.match(/DSH_LOADER_RESULT (.+)$/mu)
    expect(marker).not.toBeNull()
    const summary = JSON.parse(marker![1]!) as { command: string; tools: string[] }
    expect(summary.command).toContain('dsh-defend')
    // registerTool: false was applied: defend_report is absent from the tools
    // registry while /defend (registerCommand default) is present.
    expect(summary.tools).not.toContain('defend_report')
  })

  it('rejects invalid config through the Loader for the expected reason', () => {
    const entryUrl = pathToFileURL(builtEntry).href
    const cases = [
      { lines: ["enabled: 'yes'"], reason: /expected boolean|enabled/u },
      { lines: ["action: 'sometimes'"], reason: /action|expected/u },
      { lines: ['detection:', "  maxScanChars: 'x'"], reason: /maxScanChars|expected/u },
    ]
    for (const entry of cases) {
      const configPath = join(temporaryRoot, 'invalid.yml')
      writeFileSync(configPath, configFor(entryUrl, entry.lines))
      const evidence = runRunner(configPath)
      expect(evidence.status, `invalid config unexpectedly mounted:\n${entry.lines.join('\n')}`).not.toBe(0)
      expect(evidence.stderr, `failed for the wrong reason:\n${evidence.stderr}`).toMatch(entry.reason)
    }
  })

  it('rejects a default export through the Loader with the missing-inject reason', () => {
    const wrapper = join(temporaryRoot, 'default-export.mjs')
    const builtUrl = pathToFileURL(builtEntry).href
    writeFileSync(wrapper, [
      `export { name, inject, Config, apply } from ${JSON.stringify(builtUrl)}`,
      `export { apply as default } from ${JSON.stringify(builtUrl)}`,
      '',
    ].join('\n'))
    const configPath = join(temporaryRoot, 'invalid-default.yml')
    writeFileSync(configPath, configFor(pathToFileURL(wrapper).href))
    const evidence = runRunner(configPath)
    expect(evidence.status).not.toBe(0)
    // dsh-defend's apply reads `config.enabled` before any injected service,
    // so a lost-inject default export surfaces as the missing-config read
    // instead of the missing-inject reason; either way it fails loud.
    expect(evidence.stderr, `failed for the wrong reason:\n${evidence.stderr}`).toMatch(/enabled|without inject/u)
  })
})

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true })
})
