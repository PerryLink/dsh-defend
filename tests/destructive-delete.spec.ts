/**
 * 危险递归删除门禁的纯函数回归测试:8·14/8·16 事故的命令形态必须拒绝,
 * 工作区内显式绝对路径与 dry-run 形态必须放行。断言只依赖 verdict 种类与
 * 理由关键词(受保护/工作区/绝对路径/目标),不依赖主机具体路径。
 *
 * 跨平台策略:守卫按 Windows 主机的挂载语义静态解析目标词元,裸 POSIX
 * 绝对路径(/tmp/... 之类)会落入「POSIX 根/UNC 无法解析」分支,因此
 * 全平台行一律用 `$home` / `$env:tmp` / `~` 等词元形态表达等价命令 ——
 * resolveEnvToken 在 win32/POSIX 上展开到同一真实路径,断言平台中立;
 * 裸盘符绝对路径的解析分支由文末 win32 专属块覆盖。
 */
import { describe, expect, it } from 'vitest'
import os from 'node:os'
import path from 'node:path'
import { reviewDestructiveDelete } from '../src/index'

const WORKSPACE = path.join(os.tmpdir(), 'dsh-defend-spec-workspace')
/** `$env:tmp/<basename>`:resolveEnvToken 在 win32/POSIX 上均展开为 WORKSPACE 本身。 */
const WS = `$env:tmp/${path.basename(WORKSPACE)}`
const REVIEW = (command: string, workspace?: string) => reviewDestructiveDelete(command, workspace === undefined ? {} : { workspace })

describe('reviewDestructiveDelete — deny(两次事故的命令形态)', () => {
  it('rejects the 8·14 wiper: Remove-Item $home -Recurse -Force', () => {
    const verdict = REVIEW('Remove-Item $home -Recurse -Force', WORKSPACE)
    expect(verdict?.kind).toBe('deny')
    expect(verdict?.reason).toContain('受保护')
  })

  it('rejects the 8·14 wiper even wrapped in a conditional', () => {
    const verdict = REVIEW('if (Test-Path $home) { Remove-Item $home -Recurse -Force }', WORKSPACE)
    expect(verdict?.kind).toBe('deny')
  })

  it('rejects rm -rf ~/.dsh and ~/.claude', () => {
    expect(REVIEW('rm -rf ~/.dsh', WORKSPACE)?.kind).toBe('deny')
    expect(REVIEW('rm -rf ~/.claude', WORKSPACE)?.kind).toBe('deny')
  })

  it('rejects rd /s /q on %USERPROFILE%\\.claude', () => {
    const verdict = REVIEW('rd /s /q %USERPROFILE%\\.claude', WORKSPACE)
    expect(verdict?.kind).toBe('deny')
    expect(verdict?.reason).toContain('受保护')
  })

  it('rejects recursive deletes under the dsh-subprocess temp dir (8·16 indirect culprit)', () => {
    const verdict = REVIEW('rm -rf $env:tmp/dsh-subprocess-CEThJl', WORKSPACE)
    expect(verdict?.kind).toBe('deny')
    expect(verdict?.reason).toContain('受保护')
  })

  it('rejects POSIX-root targets that cannot be resolved to a drive', () => {
    expect(REVIEW('rm -rf /', WORKSPACE)?.kind).toBe('deny')
    expect(REVIEW('rm -rf /home/zzhdz', WORKSPACE)?.kind).toBe('deny')
  })

  it('rejects absolute targets outside the workspace', () => {
    const verdict = REVIEW('rm -rf $env:tmp/../outside-thing', WORKSPACE)
    expect(verdict?.kind).toBe('deny')
    expect(verdict?.reason).toContain('工作区')
  })

  it('rejects relative and glob targets (explicit absolute paths required)', () => {
    expect(REVIEW('rm -rf build', WORKSPACE)?.reason).toContain('绝对路径')
    expect(REVIEW('rm -rf ./build', WORKSPACE)?.kind).toBe('deny')
    expect(REVIEW('Remove-Item *.log -Recurse', WORKSPACE)?.kind).toBe('deny')
  })

  it('rejects recursive deletes with no printed target', () => {
    expect(REVIEW('Remove-Item -Recurse', WORKSPACE)?.kind).toBe('deny')
    expect(REVIEW('git clean -fdx', WORKSPACE)?.kind).toBe('deny')
  })

  it('rejects deleting the workspace root itself', () => {
    const verdict = REVIEW(`rm -rf ${WS}`, WORKSPACE)
    expect(verdict?.kind).toBe('deny')
    expect(verdict?.reason).toContain('工作区根')
  })

  it('rejects piped recursion with unverifiable targets', () => {
    expect(REVIEW('Get-ChildItem | Remove-Item -Recurse', WORKSPACE)?.kind).toBe('deny')
  })

  it('fails closed when no workspace boundary is available', () => {
    const verdict = REVIEW(`rm -rf ${WORKSPACE}/anything`)
    expect(verdict?.kind).toBe('deny')
    expect(verdict?.reason).toContain('工作区')
  })
})

describe('reviewDestructiveDelete — allow(可静态核实的常规形态)', () => {
  it('allows non-recursive single-file deletes', () => {
    expect(REVIEW(`del ${WS}/report.txt`, WORKSPACE)).toBeUndefined()
    expect(REVIEW('rm -f single-file.txt', WORKSPACE)).toBeUndefined()
    expect(REVIEW(`Remove-Item ${WS}/x.txt -Force`, WORKSPACE)).toBeUndefined()
  })

  it('allows recursive deletes inside the workspace with explicit absolute paths', () => {
    expect(REVIEW(`rm -rf ${WS}/node_modules/.cache`, WORKSPACE)).toBeUndefined()
    expect(REVIEW(`Remove-Item ${WS}/build-output -Recurse`, WORKSPACE)).toBeUndefined()
    expect(REVIEW(`rd /s /q ${WS}/old-logs`, WORKSPACE)).toBeUndefined()
  })

  it('allows dry-run forms (the demanded pre-delete verification)', () => {
    expect(REVIEW(`Remove-Item ${WS}/x -Recurse -WhatIf`, WORKSPACE)).toBeUndefined()
    expect(REVIEW('git clean -n', WORKSPACE)).toBeUndefined()
  })

  it('allows git clean without the force flags (it refuses to delete)', () => {
    expect(REVIEW('git clean', WORKSPACE)).toBeUndefined()
  })

  it('allows commands with no destructive verb', () => {
    expect(REVIEW('echo hello', WORKSPACE)).toBeUndefined()
    expect(REVIEW('pnpm install', WORKSPACE)).toBeUndefined()
  })
})

// 裸绝对路径只在 Windows 行按盘符语义解析;win32 专属块覆盖该分支。
describe.skipIf(process.platform !== 'win32')('reviewDestructiveDelete — raw absolute paths (win32 only)', () => {
  it('rejects the literal home directory as exact protected', () => {
    const verdict = REVIEW(`Remove-Item ${os.homedir()} -Recurse -Force`, WORKSPACE)
    expect(verdict?.kind).toBe('deny')
    expect(verdict?.reason).toContain('受保护')
  })

  it('rejects the literal dsh-subprocess temp dir', () => {
    const verdict = REVIEW(`rm -rf ${path.join(os.tmpdir(), 'dsh-subprocess-CEThJl')}`, WORKSPACE)
    expect(verdict?.kind).toBe('deny')
    expect(verdict?.reason).toContain('受保护')
  })

  it('rejects a raw absolute target outside the workspace', () => {
    const verdict = REVIEW(`rm -rf ${path.resolve(WORKSPACE, '..', 'outside-thing')}`, WORKSPACE)
    expect(verdict?.kind).toBe('deny')
    expect(verdict?.reason).toContain('工作区')
  })

  it('rejects deleting the raw workspace root', () => {
    expect(REVIEW(`rm -rf ${WORKSPACE}`, WORKSPACE)?.reason).toContain('工作区根')
  })

  it('allows raw drive paths inside the workspace', () => {
    expect(REVIEW(`rm -rf ${path.join(WORKSPACE, 'node_modules', '.cache')}`, WORKSPACE)).toBeUndefined()
  })
})
