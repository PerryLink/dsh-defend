/**
 * Shared test harness for the detection layer: REAL Cordis `Context`,
 * REAL `SessionStore`/`Session`, REAL `ToolRuntime`, REAL `Commands`, and
 * REAL `ApprovalService` from the 0.1.0-rc.6 peers — plus a structurally
 * complete fake agent. Interceptions run the real waterfalls; only the
 * agent object is a driver-shaped fake (like dsh-click's harness).
 *
 * @module dsh-defend/test/harness
 */

import { Context, type Fiber } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import SessionStore, { SessionId, type Session } from '@deepseek-ai/dsh-session'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import ApprovalService from '@deepseek-ai/dsh-user-approval'

/** How the approval answerer behaves in the harness. */
export type ApprovalPolicy = 'grant' | 'deny' | 'absent'

/** Build a structurally complete fake agent over a real session. */
export function makeAgent(session: Session): Agent {
  const fake = {
    id: session.id,
    options: { provider: 'deepseek', model: 'demo-model' },
    session,
    inbox: {},
    status: 'idle',
    ctx: new Context(),
    cancel: () => undefined,
    whenIdle: async () => undefined,
    runMaintenance: async (task: (signal: AbortSignal) => Promise<unknown>) => task(new AbortController().signal),
    send: () => undefined,
    followup: () => undefined,
    steer: () => undefined,
    inject: () => undefined,
  }
  return fake as unknown as Agent
}

/** Everything a mounted harness hands back to a test. */
export interface Harness {
  readonly ctx: Context
  readonly session: Session
  readonly agent: Agent
  /** The fiber this plugin was mounted under; dispose it to prove HMR safety. */
  readonly pluginFiber: Fiber
}

/** Harness assembly options. */
export interface HarnessOptions {
  /** Raw plugin config. */
  config?: Record<string, unknown>
  /** Approval answerer policy. */
  approval?: ApprovalPolicy
  /** Mount the commands service (default true). */
  commands?: boolean
}

/**
 * Mount real session/tools/commands/approval services and this plugin, and
 * open one turn so approval asks and session appends work.
 * @param options - assembly options.
 * @returns the mounted harness.
 */
export async function mountHarness(options: HarnessOptions = {}): Promise<Harness> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  const session = ctx.sessions.create(SessionId('dsh-defend-harness'))
  session.append('turn/start', { turn: 1 })
  ctx.provide('systemPrompt', { tools: () => () => undefined, section: () => () => undefined } as never)
  await ctx.plugin(ToolRuntime)
  if (options.commands !== false) await ctx.plugin(CommandRuntime)

  if (options.approval !== 'absent') {
    await ctx.plugin(ApprovalService)
    const policy = options.approval ?? 'grant'
    ctx.on('approval/request', () => {
      if (policy === 'grant') return Promise.resolve('allowed-once' as const)
      if (policy === 'deny') return Promise.resolve('rejected' as const)
      throw new Error('no answerer')
    })
  }

  const plugin = await import('../src/index.ts')
  const pluginFiber = await ctx.plugin(plugin as unknown as import('@deepseek-ai/cordis').Plugin, options.config ?? {})

  const agent = makeAgent(session)
  return { ctx, session, agent, pluginFiber }
}
