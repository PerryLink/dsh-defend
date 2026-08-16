/**
 * tools/pre-execute 门禁的装配级测试:真实 cordis Context 上 apply 插件,
 * 用与 dsh-tools 相同的 waterfall 语义触发事件,验证 prepend 拦截的
 * 契约 —— 拦截时不咨询下游监听者,放行时透传。
 */
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import os from 'node:os'
import path from 'node:path'
import { apply, Config } from '../src/index'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'

const WORKSPACE = path.join(os.tmpdir(), 'dsh-defend-hook-workspace')

function execOf(command: string, toolName = 'bash'): ToolExecution {
  return {
    name: toolName,
    arguments: { command },
    agent: { session: { header: { cwd: WORKSPACE } } },
  } as unknown as ToolExecution
}

/** 按 tools 核心的调用形态触发瀑布:插件监听者 + 默认 allow 回调。 */
function gate(root: Context, command: string, toolName = 'bash'): Promise<PreToolDecision> {
  return root.waterfall('tools/pre-execute', execOf(command, toolName), () => Promise.resolve({ kind: 'allow' } satisfies PreToolDecision))
}

describe('apply — tools/pre-execute gate wiring', () => {
  it('denies a protected recursive delete without consulting downstream listeners', async () => {
    const root = new Context()
    await root.plugin({ apply, Config }, {})
    let downstreamRan = false
    root.on('tools/pre-execute', (_exec, next) => {
      downstreamRan = true
      return next()
    })
    const decision = await gate(root, 'rm -rf ~/.dsh')
    expect(decision.kind).toBe('deny')
    if (decision.kind === 'deny') expect(decision.reason).toContain('受保护')
    expect(downstreamRan).toBe(false)
  })

  it('passes safe commands through to the next listener', async () => {
    const root = new Context()
    await root.plugin({ apply, Config }, {})
    let downstreamRan = false
    root.on('tools/pre-execute', (_exec, next) => {
      downstreamRan = true
      return next()
    })
    const decision = await gate(root, `del ${path.join(WORKSPACE, 'notes.txt')}`)
    expect(decision.kind).toBe('allow')
    expect(downstreamRan).toBe(true)
  })

  it('ignores tool names outside the configured set', async () => {
    const root = new Context()
    await root.plugin({ apply, Config }, {})
    const decision = await gate(root, 'rm -rf ~/.dsh', 'write')
    expect(decision.kind).toBe('allow')
  })

  it('honors enabled: false by registering nothing', async () => {
    const root = new Context()
    await root.plugin({ apply, Config }, { enabled: false })
    const decision = await gate(root, 'rm -rf ~/.dsh')
    expect(decision.kind).toBe('allow')
  })

  it('routes to ask when action: ask', async () => {
    const root = new Context()
    await root.plugin({ apply, Config }, { action: 'ask' })
    const decision = await gate(root, 'rm -rf ~/.claude')
    expect(decision.kind).toBe('ask')
  })
})
