/**
 * Lifecycle and export-contract suite: the HMR-safety test (dispose the
 * contributing fiber, re-query the authoritative registries and re-trigger
 * the guarded waterfall), the default-export guard (module namespace + Loader
 * unwrap round-trip), and the defend_report three-interface assertion (model
 * schema + canonical value + content blocks) through the real ToolRuntime.
 * @module dsh-defend/test/lifecycle.spec
 */

import type { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import type { PreToolDecision, ToolBatchInput, ToolExecution } from '@deepseek-ai/dsh-tools'
import { describe, expect, it } from 'vitest'
import * as plugin from '../src/index.ts'
import { mountHarness } from './harness.ts'

/**
 * Brand a synthetic tool-call id without naming the host line's brand: the
 * 0.1.x lines exported `CallId` and host HEAD renamed it to `ToolCallId` —
 * deriving the type from the batch input's call blocks keeps both typecheck
 * rulers green.
 */
type ToolCallId = ToolBatchInput['calls'][number]['id']
const makeCallId = (id: string): ToolCallId => id as ToolCallId

const WORKSPACE = 'D:\\fake-workspace'

function execOf(command: string, toolName = 'bash'): ToolExecution {
  return {
    name: toolName,
    arguments: { command },
    agent: { session: { header: { cwd: WORKSPACE } } },
    signal: new AbortController().signal,
  } as unknown as ToolExecution
}

function gate(ctx: Context, command: string, toolName = 'bash'): Promise<PreToolDecision> {
  return ctx.waterfall('tools/pre-execute', execOf(command, toolName), () => Promise.resolve<PreToolDecision>({ kind: 'allow' }))
}

// ---------------------------------------------------------------------------
// C2: the function-plugin namespace must survive Loader unwrapping
// ---------------------------------------------------------------------------

describe('export contract', () => {
  it('carries no default export and Loader unwrap round-trips the namespace', () => {
    expect('default' in plugin).toBe(false)
    const loader = Object.create(Loader.prototype)
    const unwrapped = loader.unwrapExports(plugin)
    expect(unwrapped).toBe(plugin)
    expect(unwrapped.name).toBe('dsh-defend')
    expect(unwrapped.inject).toEqual(['commands'])
    expect(unwrapped.Config).not.toBeUndefined()
    expect(typeof unwrapped.apply).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// C1: disposing the contributing fiber removes every registry contribution
// ---------------------------------------------------------------------------

describe('fiber disposal', () => {
  it('removes the tool, command, and guard listener when its fiber is disposed', async () => {
    const harness = await mountHarness()
    try {
      // Before: contributions are live.
      expect(harness.ctx.tools.get('defend_report')).toBeDefined()
      expect(harness.ctx.commands.list(harness.agent).find(entry => entry.name === 'defend')).toBeDefined()
      expect((await gate(harness.ctx, 'rm -rf ~/.dsh')).kind).toBe('deny')

      await harness.pluginFiber.dispose()

      // After: tool and command are gone from the authoritative registries.
      expect(harness.ctx.tools.get('defend_report')).toBeUndefined()
      expect(harness.ctx.commands.list(harness.agent).find(entry => entry.name === 'defend')).toBeUndefined()
      // The prepend guard listener was removed with the fiber: the dangerous
      // command now passes through to the downstream allow callback.
      expect((await gate(harness.ctx, 'rm -rf ~/.dsh')).kind).toBe('allow')
    } finally {
      await harness.ctx.fiber.dispose()
    }
  })
})

// ---------------------------------------------------------------------------
// U2: the tool three interfaces in one assertion through the real runtime
// ---------------------------------------------------------------------------

describe('tool three interfaces', () => {
  it('keeps the defend_report schema, canonical value, and content blocks stable', async () => {
    const harness = await mountHarness()
    try {
      // Model-visible schema.
      const schema = harness.ctx.tools.schemas().find(entry => entry.name === 'defend_report')
      expect(schema).toBeDefined()
      expect(schema?.parameters).toBeDefined()

      const batch = await harness.ctx.tools.execute({
        calls: [{ type: 'tool-call', id: makeCallId('dsh-defend-three-interfaces'), name: 'defend_report', arguments: '{}' }],
        agent: harness.agent,
        signal: new AbortController().signal,
      })
      const result = batch.results[0]?.result
      expect(result?.isError).toBe(false)
      if (result === undefined || result.isError) return

      // Canonical value (empty in-memory ring buffer before any interception).
      expect(result.value).toEqual({
        ok: true,
        total: 0,
        blocked: 0,
        asked: 0,
        byFamily: { injection: 0, jailbreak: 0, secret: 0 },
        recent: [],
      })

      // Model-facing content blocks.
      expect(Array.isArray(result.content)).toBe(true)
      const text = result.content
        .filter((block: ContentBlock) => block.type === 'text')
        .map(block => (block as { text: string }).text)
        .join('\n')
      expect(text).toContain('dsh-defend')
      expect(text).toContain('0 recorded detection(s)')
    } finally {
      await harness.ctx.fiber.dispose()
    }
  })
})
