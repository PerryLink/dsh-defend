// scripts/loader-runner.mjs — real Loader composition runner (community
// five-layer model, layer 4). An independent process boots a real Context,
// mounts the vendored Loader with the Include builtin, reads the given
// cordis.yml (service rows + plugin row + config), then asserts the plugin's
// contributions through the authoritative registries and executes one real
// behavior. The composition sets `registerTool: false`, so the runner proves
// the Loader applied that config value by asserting the `defend_report` tool
// is absent while the `/defend` command (registerCommand default) is present.
//
// Usage: node scripts/loader-runner.mjs <cordis.yml>
// Exit 0 prints DSH_LOADER_RESULT <json>; any assertion or load failure exits
// non-zero with the reason on stderr (used by the invalid-config and
// default-export regression cases). A loader row whose `apply` (or config
// validation) threw is re-thrown from its own fiber so those negations still
// fail on the real reason instead of on the downstream "/defend command is
// missing" symptom — see `rethrowFirstFailedRow` below.

import { Context } from '@deepseek-ai/cordis'
import Include from '@deepseek-ai/cordis-plugin-include'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { SessionId } from '@deepseek-ai/dsh-session'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const configArgument = process.argv[2]
if (configArgument === undefined) {
  console.error('usage: loader-runner.mjs <cordis.yml>')
  process.exit(2)
}

const configPath = resolve(configArgument)
// Resolve bare package rows from this repository's dependency tree so the
// composition works with config files written anywhere (e.g. a temp dir).
const configRequire = createRequire(resolve(import.meta.dirname, '../package.json'))

const ctx = new Context()
/** Error-severity log records, kept so a failed row's reason survives for the assertion. */
const capturedErrors = []
ctx.logger.exporter({
  levels: { default: 0 },
  export: (message) => {
    if (message.level === 'error' || message.level === 0) {
      capturedErrors.push(message.args?.[0] instanceof Error ? message.args[0] : new Error(String(message.args?.[0] ?? message.message ?? 'loader error')))
    }
  },
})
try {
  ctx.baseUrl = `${pathToFileURL(dirname(configPath)).href}/`
  await ctx.plugin(Loader)
  ctx.loader.internal = /** @type {any} */ ({
    version: 'v2',
    async import(specifier) {
      if (specifier.startsWith('file:')) return import(specifier)
      if (specifier.startsWith('node:')) return import(specifier)
      const absolute = /^([a-zA-Z]:)?[\\/]/u.test(specifier)
      return import(pathToFileURL(absolute ? specifier : configRequire.resolve(specifier)).href)
    },
  })
  ctx.loader.builtins.include = Include
  await ctx.loader.create({
    name: 'cordis:include',
    config: { path: pathToFileURL(configPath).href },
  })
  await ctx.loader.await()
  rethrowFirstFailedRow()

  const session = ctx.sessions.create(SessionId('dsh-defend-loader-runner'))
  const agent = /** @type {any} */ ({
    id: session.id,
    options: { provider: 'deepseek', model: 'demo-model' },
    session,
    inbox: {},
    status: 'idle',
    ctx,
    cancel: () => undefined,
    whenIdle: async () => undefined,
    runMaintenance: async (task) => task(new AbortController().signal),
    send: () => undefined,
    followup: () => undefined,
    steer: () => undefined,
    inject: () => undefined,
  })

  // Authoritative registries carry the plugin's contributions.
  const commands = ctx.commands.list(agent)
  if (commands.find(entry => entry.name === 'defend') === undefined) {
    throw new Error('Loader composition: /defend command is missing from the commands registry')
  }
  const toolNames = ctx.tools.schemas().map(schema => schema.name)
  if (toolNames.includes('defend_report')) {
    throw new Error('Loader composition: defend_report tool present despite registerTool: false (config not applied)')
  }

  // Real behavior: the /defend command through the real commands service.
  const execution = await ctx.commands.execute(agent, '/defend', [], new AbortController().signal)
  const text = execution?.result?.text ?? ''
  if (!text.includes('dsh-defend')) {
    throw new Error(`Loader composition: /defend returned ${JSON.stringify(execution?.result)}`)
  }

  const summary = {
    command: text.split('\n')[0],
    tools: toolNames,
  }
  process.stdout.write(`DSH_LOADER_RESULT ${JSON.stringify(summary)}\n`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
} finally {
  await ctx.fiber.dispose()
}

/**
 * Re-throw the first FAILED loader row's error.
 *
 * `cordis-plugin-loader` 1.0.6 dropped the failure surface `await()` had in
 * 1.0.3/1.0.4: the old body collected `entry._await()` outcomes and threw the
 * single failure (or an AggregateError), while 1.0.6's body only loops over
 * `_initTask || fiber.inertia` and returns as soon as there is no pending
 * task — so a row whose config validation or `apply` threw no longer makes
 * `await()` reject. `Entry._init()` does not surface it either (cordis's
 * `Fiber._reload()` catches the error, reports it through `ctx.logger.error`
 * and parks the fiber in `FiberState.FAILED`), and this composition registers
 * no exporter, so the report would vanish — measured 2026-10-04 on
 * `1.0.6-alpha.1`: the invalid-config negation exited 1 on the downstream
 * "/defend command is missing from the commands registry" symptom, not on the
 * loader's own reason. Walking the entries restores that reason without
 * depending on the resurrected API.
 *
 * `DSH_LOADER_RUNNER_NO_RETHROW=1` disables it for re-measurement only.
 */
function rethrowFirstFailedRow() {
  if (process.env.DSH_LOADER_RUNNER_NO_RETHROW === '1') return
  const failed = []
  for (const entry of ctx.loader.entries()) {
    const fiber = entry?.fiber
    // FiberState.FAILED === 3 (const enum, erased at runtime). A failed row keeps no
    // `fiber.error` on this line, so the reason is recovered from the row's own log records.
    if (fiber?.state === 3) failed.push(capturedErrors.shift() ?? new Error(`loader row ${String(entry?.options?.name ?? '?')} failed`))
  }
  if (failed.length === 1) throw failed[0]
  if (failed.length > 1) throw new AggregateError(failed, 'loader fibers failed')
}
