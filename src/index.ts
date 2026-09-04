/**
 * dsh-defend 插件入口 —— 首个落地门禁:危险递归删除命令拦截。
 *
 * 8·14 与 8·16 两次事故的共同教训:验证/清理脚本的路径变量解析错误,
 * 递归删除落在了 ~/.claude、~/.dsh、%TEMP%\dsh-subprocess 等真实家目录。
 * 本门禁把"Remove-Item 前 dry-run"从文档教训升级为执行层约束:
 * tools/pre-execute 上拦截 bash 类工具的递归删除命令,只放行"每个目标都是
 * 显式绝对路径、全部位于会话工作区内、且不触碰受保护前缀"的删除;
 * 其余一律 deny(可配 ask),错误信息要求先 dry-run 打印目标路径并核对。
 *
 * 拦截契约:prepend 直通监听。放行时调用 next() 并透传结果(策略插件仍作
 * 唯一决策方),拦截时不调用 next() 直接返回决策,占据瀑布首位。放行路径
 * 零状态、零副作用;工作区边界不可用时对危险命令失败关闭。
 *
 * 检测层(src/detect 的 Aho-Corasick 注入/越狱/密钥扫描)与本门禁相互独立,
 * 后续在 agent/pre-step 与 tools/post-execute 上补齐后共用本入口。
 * @module dsh-defend
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-agent'
import type { PreStepDecision } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-commands'
import type { ContentBlock, UserMessage } from '@deepseek-ai/dsh-llm'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { PostToolDecision, PreToolDecision, ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import type { ApprovalService } from '@deepseek-ai/dsh-user-approval'
import type { Session } from '@deepseek-ai/dsh-session'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { buildScanner, type ScanReport, type Family, type MatchInfo, severityRank } from './detect/index.ts'
import { DETECTION_EVENT, type DetectionEvent, type AuditAppend, isMarkedAuditEvent } from './events.ts'

export const name = 'dsh-defend'

/** Hard services: the command surface the `/defend` report lands on. */
export const inject = ['commands']

/** 默认受检工具名(tool-bash 与 tool-bash-persistent 注册名同为 'bash';别名可配)。 */
const DEFAULT_TOOL_NAMES = ['bash', 'persistent-bash', 'terminal-bash'] as const

/** 门禁配置(cordis.yml 可覆盖;所有 tunable 均有默认,无硬编码)。 */
export interface Config {
  /** 整体开关;false 时不注册任何监听。默认 true。 */
  enabled?: boolean
  /** 拦截动作:deny 直接拒绝;ask 转审批通道(审批未过同样拒绝)。默认 deny。 */
  action?: 'deny' | 'ask'
  /** 受检工具名集合(工具注册名)。默认 ['bash', 'persistent-bash', 'terminal-bash']。 */
  toolNames?: string[]
  /** 检测层(注入/越狱/密钥)配置。 */
  detection?: DetectionConfig
  /** 注册 /defend 会话命令。默认 true。 */
  registerCommand?: boolean
  /** 注册 defend_report 工具。默认 true。 */
  registerTool?: boolean
}

/** 检测层配置:每个 family 一个动作档,匹配载荷默认 ask。 */
export interface DetectionConfig {
  /** 检测层开关。默认 true。 */
  enabled?: boolean
  /** 单次扫描的字符上限(只扫头部)。默认 10000。 */
  maxScanChars?: number
  /** 扫描前 NFKC/Unicode 归一化(堵 lookalike-Unicode 绕过)。默认 true。 */
  normalizeUnicode?: boolean
  /** 密钥命中后的最小 Shannon 熵(bits/字符),低于阈值视为误报丢弃。默认 3.0;0 关闭。 */
  secretMinEntropy?: number
  /** 注入载荷的默认动作 allow/ask/block。默认 ask。 */
  injectionAction?: 'allow' | 'ask' | 'block'
  /** 越狱模式的默认动作。默认 ask。 */
  jailbreakAction?: 'allow' | 'ask' | 'block'
  /** 密钥/凭证的默认动作。默认 ask。 */
  secretAction?: 'allow' | 'ask' | 'block'
  /** critical 级密钥无视 secretAction 一律 block(上游即时中断语义)。默认 true。 */
  secretBlockCritical?: boolean
  /** 拦截与命中是否写 defend/detection 审计事件。默认 true。 */
  audit?: boolean
  /**
   * 宿主不识别 ignorable 标记(截至 rc8/0.1.1-rc.2 的 Session.append 会静默
   * 丢弃第三个参数)时是否仍写会话日志审计 —— 未标记事件会让会话在更严格宿主机上无法
   * 恢复。默认 false:不识别即停用会话日志审计并告警一次。默认告警文案见
   * {@link DetectionAuditSink}。
   */
  allowUnmarkedAudit?: boolean
  /** defend_report 内存环形缓冲条数上限。默认 200。 */
  maxReportEntries?: number
}

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  action: z.union(['deny', 'ask']).default('deny'),
  toolNames: z.array(z.string()).default([...DEFAULT_TOOL_NAMES]),
  detection: z.object({
    enabled: z.boolean().default(true),
    maxScanChars: z.number().default(10_000),
    normalizeUnicode: z.boolean().default(true),
    secretMinEntropy: z.number().default(3.0),
    injectionAction: z.union(['allow', 'ask', 'block']).default('ask'),
    jailbreakAction: z.union(['allow', 'ask', 'block']).default('ask'),
    secretAction: z.union(['allow', 'ask', 'block']).default('ask'),
    secretBlockCritical: z.boolean().default(true),
    audit: z.boolean().default(true),
    allowUnmarkedAudit: z.boolean().default(false),
    maxReportEntries: z.number().default(200),
  }).default({
    enabled: true,
    maxScanChars: 10_000,
    normalizeUnicode: true,
    secretMinEntropy: 3.0,
    injectionAction: 'ask',
    jailbreakAction: 'ask',
    secretAction: 'ask',
    secretBlockCritical: true,
    audit: true,
    allowUnmarkedAudit: false,
    maxReportEntries: 200,
  }),
  registerCommand: z.boolean().default(true),
  registerTool: z.boolean().default(true),
})

/**
 * 破坏性删除动词(单词边界隔离;覆盖 PowerShell / cmd / POSIX / git)。
 * 匹配范围是整个命令文本,链式命令(`a && rm -rf x`)同样命中。
 */
const DESTRUCTIVE_VERBS = [
  /\bRemove-Item\b/i,
  /\brmdir\b/i,
  /\brd\b/i,
  /\bdel\b/i,
  /\berase\b/i,
  /\brm\b/i,
  /\bgit\s+clean\b/i,
] as const

/**
 * 递归开关:没有这些标志的删除(单文件 `del a.txt`、`rm -f a.txt`)风险低,不拦。
 * POSIX 短选项簇只收含 r/R 的确定形式(-r/-R/-rf/-fr/-fR/-Rf),不收
 * 单横线长选项缩写(-verbose 里也有 r,会误伤)。
 */
const RECURSIVE_FLAGS = [
  /-Recurse\b/i,                          // PowerShell
  /--recursive\b/,                        // GNU 长选项
  /(?:^|\s)-(?:r|R|rf|fr|fR|Rf)\b/,       // POSIX rm 短选项簇
  /\/s\b/i,                               // cmd rd /s、del /s
] as const

/** git clean 只有带 -f/-d/-x 簇或 --force 才会真正删除(-n/-i 不删)。 */
const GIT_CLEAN_FORCE = /(?:^|\s)-(?:[a-zA-Z]*[fdx][a-zA-Z]*|--force)\b/

/** 自带 dry-run/交互确认的标记:命中即放行 —— 这正是教训要求的删除前核对。 */
const DRY_RUN_MARKERS = [
  /-WhatIf\b/i,                           // PowerShell dry-run
  /-Confirm\b/i,                          // PowerShell 交互确认
  /--dry-run\b/,
  /(?:^|\s)-n\b/,                         // git clean -n
] as const

/** 词元级的跳过集合:标志、操作符、动词词本身(逐词精确匹配,不经正则)。 */
const FLAG_RE = /^(?:--?[A-Za-z]|\/[A-Za-z])/
const OPERATOR_WORDS = new Set(['&&', '||', ';', '|', '>', '>>', '<', '2>', '2>>', '1>', '&', '2>&1', '1>&2', '&>'])
const VERB_WORDS = new Set(['remove-item', 'rmdir', 'rd', 'del', 'erase', 'rm', 'git', 'clean'])

/** 空壳会话形状:跨装配取 session.header.cwd,以结构化类型为准。 */
interface SessionLike { header?: { cwd?: unknown } }

/** 已知环境变量 → 可静态解析的绝对路径(支持变量后接 \ 或 / 的子路径)。 */
function resolveEnvToken(raw: string): string | undefined {
  const token = raw.trim()
  const lower = token.toLowerCase()
  const home = os.homedir()
  const temp = os.tmpdir()
  if (lower === '~') return home
  if (lower.startsWith('~\\') || lower.startsWith('~/')) return path.join(home, token.slice(2))
  if (lower === '$home') return home
  if (lower.startsWith('$home\\') || lower.startsWith('$home/')) return path.join(home, token.slice(6))
  if (lower === '$env:temp' || lower === '$env:tmp') return temp
  if (lower.startsWith('$env:temp\\') || lower.startsWith('$env:temp/')) return path.join(temp, token.slice(9))
  if (lower.startsWith('$env:tmp\\') || lower.startsWith('$env:tmp/')) return path.join(temp, token.slice(8))
  const percentVar = /^%([^%]+)%(.*)$/.exec(token)
  if (percentVar !== null) {
    const varName = percentVar[1]?.toLowerCase()
    if (varName === undefined) return undefined
    const rest = percentVar[2] ?? ''
    const base = varName === 'userprofile' ? home
      : varName === 'temp' || varName === 'tmp' ? temp
        : varName === 'appdata' ? path.join(home, 'AppData', 'Roaming')
          : varName === 'localappdata' ? path.join(home, 'AppData', 'Local')
            : undefined
    if (base === undefined) return undefined
    return rest === '' ? base : path.join(base, rest.replace(/^[\\/]+/, ''))
  }
  return undefined
}

/**
 * 受保护前缀:两次事故的实际受灾点 + 系统根。命中一律拦截,即便目标同时
 * 位于工作区内。家目录本身不在此列(前缀语义会误伤家目录下的合法工作区,
 * 如 C:\Users\<name>\source\repos),它由 exactProtected 精确匹配拦截。
 */
function protectedPrefixes(): string[] {
  const home = os.homedir()
  const temp = os.tmpdir()
  const root = path.parse(home).root
  return [
    path.join(home, '.dsh'),
    path.join(home, '.claude'),
    path.join(home, 'AppData', 'Roaming', 'PowerShell'),
    path.join(home, 'Documents', 'WindowsPowerShell'),
    path.join(temp, 'dsh-subprocess-'),                  // 8·16 崩溃的间接元凶(mkdtemp 前缀)
    path.join(root, 'Windows'),
    path.join(root, 'Program Files'),
    path.join(root, 'Program Files (x86)'),
  ]
}

/**
 * 精确匹配的受保护路径:家目录本身(8·14 事故目标)与盘符根(仅拒绝完全相等
 * 的删除)。两者都不能做前缀 —— 前缀语义会误伤家目录下的合法工作区,
 * 盘符根作为前缀则会拦截整盘一切删除。
 */
function exactProtected(): string[] {
  return [os.homedir(), path.parse(os.homedir()).root]
}

/**
 * 大小写不敏感的路径包含判断(win32 语义;POSIX 上退化为全小写比较)。
 * 普通前缀要求路径分隔符边界(C:\Windows 不匹配 C:\WindowsUpdate);
 * 以 '-' 结尾的前缀按 mkdtemp 词干语义直接匹配续名(dsh-subprocess- 匹配
 * dsh-subprocess-CEThJl)。
 */
function isWithin(candidate: string, prefix: string): boolean {
  const a = path.resolve(candidate).toLowerCase()
  const b = path.resolve(prefix).toLowerCase()
  if (a === b) return true
  return a.startsWith(b.endsWith('-') ? b : b + path.sep)
}

/** 尊重双/单引号的最简词元切分(命令文本领域足够;不展开 shell 通配)。 */
function tokenize(command: string): string[] {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | undefined
  for (const ch of command) {
    if (quote !== undefined) {
      if (ch === quote) quote = undefined
      else current += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (/\s/.test(ch)) {
      if (current !== '') { tokens.push(current); current = '' }
    } else {
      current += ch
    }
  }
  if (current !== '') tokens.push(current)
  return tokens
}

/** 单一词元的分类结果:resolve 出绝对路径,或给出拒绝理由。 */
type TargetResolution =
  | { kind: 'resolved'; absolute: string }
  | { kind: 'denied'; reason: string }

/**
 * 解析一个目标词元。只有"可静态核实的绝对路径"才返回 resolved:
 * 盘符绝对路径(C:\x)、git-bash 挂载形式(/c/x)、已知环境变量与 ~ 展开。
 * 其余(相对路径、glob、未知变量、POSIX 根/UNC)一律拒绝 —— 这正是
 * "删除前必须先打印目标绝对路径并核对"的强制形态。
 */
function resolveTarget(raw: string): TargetResolution {
  const token = raw.trim()
  if (token === '') return { kind: 'denied', reason: 'empty target token' }
  if (/[*?[\]]/.test(token)) {
    return { kind: 'denied', reason: `glob target ${JSON.stringify(token)} cannot be verified individually; list the expanded absolute paths first` }
  }
  if (token.startsWith('~') || token.includes('$') || token.includes('%')) {
    const resolved = resolveEnvToken(token)
    if (resolved === undefined) {
      return { kind: 'denied', reason: `variable target ${JSON.stringify(token)} cannot be statically verified; use its absolute path instead` }
    }
    return { kind: 'resolved', absolute: resolved }
  }
  if (/^[A-Za-z]:[\\/]/.test(token)) return { kind: 'resolved', absolute: path.resolve(token) }
  const bashMount = /^\/([a-zA-Z])(?:[\\/]|$)/.exec(token)
  if (bashMount !== null) {
    return { kind: 'resolved', absolute: path.resolve(`${bashMount[1]}:\\${token.slice(2)}`) }
  }
  if (token.startsWith('/') || token.startsWith('\\')) {
    return { kind: 'denied', reason: `POSIX-root/UNC target ${JSON.stringify(token)} cannot be resolved under this machine's mount semantics; use a drive-letter absolute path` }
  }
  return { kind: 'denied', reason: `target ${JSON.stringify(token)} is not an explicit absolute path; dry-run and print every target path first, then verify` }
}

/** 门禁评审结果:undefined = 放行;{ kind: 'deny' } = 拒绝。 */
export interface ReviewVerdict {
  kind: 'deny'
  reason: string
}

/** 纯函数评审选项(测试与嵌入装配共用)。 */
export interface ReviewOptions {
  /** 会话工作区根(session.header.cwd);缺失时危险命令失败关闭。 */
  workspace?: string
  /** 受保护前缀覆盖(默认家目录/配置目录/临时目录/系统根)。 */
  protectedPrefixes?: string[]
}

/**
 * 评审一条 shell 命令:危险递归删除且任一目标未通过边界校验 → 返回拒绝
 * 判词;其余返回 undefined。无副作用、无 I/O(除 os 常量)。
 */
export function reviewDestructiveDelete(command: string, options: ReviewOptions = {}): ReviewVerdict | undefined {
  if (DRY_RUN_MARKERS.some(marker => marker.test(command))) return undefined
  const verbIndex = DESTRUCTIVE_VERBS.findIndex(verb => verb.test(command))
  if (verbIndex === -1) return undefined
  const isGitClean = verbIndex === DESTRUCTIVE_VERBS.length - 1
  const destructive = isGitClean
    ? GIT_CLEAN_FORCE.test(command)
    : RECURSIVE_FLAGS.some(flag => flag.test(command))
  if (!destructive) return undefined

  const workspace = options.workspace
  if (workspace === undefined || workspace === '') {
    return { kind: 'deny', reason: 'dangerous recursive delete command has no session workspace boundary (fail-closed): confirm the session cwd is available first' }
  }
  const workspaceRoot = path.resolve(workspace)
  const protected_ = options.protectedPrefixes ?? protectedPrefixes()

  const targets = tokenize(command).filter((token) => {
    if (FLAG_RE.test(token)) return false
    if (OPERATOR_WORDS.has(token)) return false
    if (VERB_WORDS.has(token.toLowerCase())) return false
    return true
  })
  if (targets.length === 0) {
    return {
      kind: 'deny',
      reason: `blocked dangerous recursive delete command (${command.slice(0, 160)}): no explicit target path was printed.`
        + ' Dry-run first (Remove-Item -WhatIf / git clean -n / list the directory), verify each target one by one, then retry with an explicit absolute path',
    }
  }
  for (const target of targets) {
    const resolution = resolveTarget(target)
    if (resolution.kind === 'denied') {
      return {
        kind: 'deny',
        reason: `blocked dangerous recursive delete command (${command.slice(0, 160)}): ${resolution.reason}.`
          + ` Workspace is ${workspaceRoot}; dry-run first (Remove-Item -WhatIf / git clean -n / list the directory)`
          + ' and verify each target path one by one, then retry with an explicit absolute path',
      }
    }
    for (const exact of exactProtected()) {
      if (path.resolve(resolution.absolute).toLowerCase() === path.resolve(exact).toLowerCase()) {
        return {
          kind: 'deny',
          reason: `blocked dangerous recursive delete command: target ${JSON.stringify(target)} hits a protected path (the home directory/drive root itself: ${exact}).`
            + ' This is exactly how incident 8·14 recursively deleted the entire home directory — always refused. Verify the path-variable resolution and retry',
        }
      }
    }
    for (const prefix of protected_) {
      if (isWithin(resolution.absolute, prefix)) {
        return {
          kind: 'deny',
          reason: `blocked dangerous recursive delete command: target ${JSON.stringify(target)} hits protected path ${JSON.stringify(prefix)}`
            + ' (personal config/DSH data/system directory) — always refused. Verify the path-variable resolution and retry',
        }
      }
    }
    if (isWithin(resolution.absolute, workspaceRoot) === false) {
      return {
        kind: 'deny',
        reason: `blocked dangerous recursive delete command: target ${JSON.stringify(target)} is outside the session workspace ${workspaceRoot}.`
          + ' To clean up something outside the workspace, narrow it to a path inside the workspace or confirm it manually in a terminal',
      }
    }
    if (isWithin(workspaceRoot, resolution.absolute)) {
      return {
        kind: 'deny',
        reason: `blocked dangerous recursive delete command: target ${JSON.stringify(target)} covers the session workspace root itself (${workspaceRoot}).`
          + ' To delete the entire workspace, confirm it manually in a terminal',
      }
    }
  }
  return undefined
}

/**
 * 从执行体取工作区根:会话 header.cwd。类型以结构化 cast 为准 —— 宿主装配
 * 的服务形状由运行时保证,门禁只做运行时防御。
 */
function workspaceOf(exec: ToolExecution): string | undefined {
  const session = exec.agent?.session as unknown as SessionLike | undefined
  const cwd = session?.header?.cwd
  return typeof cwd === 'string' && cwd !== '' ? cwd : undefined
}

/** 从已解析参数取命令文本(bash 类工具参数键的并集;非字符串一律放过)。 */
function commandOf(argumentsValue: unknown): string | undefined {
  if (typeof argumentsValue === 'string') return argumentsValue
  if (argumentsValue === null || typeof argumentsValue !== 'object') return undefined
  for (const key of ['command', 'cmd', 'input', 'script', 'code']) {
    const value = (argumentsValue as Record<string, unknown>)[key]
    if (typeof value === 'string') return value
  }
  return undefined
}

/**
 * 审计落盘的宿主能力探测:`defend/detection` 事件带 `ignorable: true` 追加
 * (见 events.ts)。截至 rc8/0.1.1-rc.2,所有已发布线的 `Session.append` 都会
 * 静默丢弃第三个参数,事件未标记落盘,会话随后在更严格宿主机上拒绝加载
 * (issue #2);harness master(0.1.2-alpha.1 起,42dc2a46c2)移除 ignorable 信封
 * 并改为 KNOWN_SESSION_EVENT_TYPES 读路径 fail-closed,`defend/detection`
 * 不在集合内,写盘即令会话拒读。0.1.2-alpha.2 恢复信封字段但仅用于存量日志
 * 读取兼容(宿主 note 2026-08-30-retain-ignorable-external-session-events):
 * 其 `Session.append` 第三参为仅 surface 事件的 `SurfaceIntent`,仍无法盖章
 * `ignorable`,故停写分类对 alpha.2 同样成立。因此先判后写:peer 版本已知未
 * 标记、或版本不可解析(宿主能力未知)时,第一次追加前即停用会话日志审计并
 * 告警一次,除非 `detection.allowUnmarkedAudit: true` 显式选择继续写入;仅当
 * 版本是已知带标记面的未来线时才走首次追加探测。
 */
export class DetectionAuditSink {
  private support: 'unknown' | 'supported' | 'unsupported' = 'unknown'
  private warned = false

  constructor(
    private readonly logger: { warn: (message: string) => unknown },
    private readonly allowUnmarked: boolean,
    private readonly sessionVersion: () => string | null = peerVersion,
  ) {}

  /** 追加一条检测审计事件(带 ignorable 标记纪律);宿主能力未知/未标记时先判后写,fail closed。 */
  append(session: Session, event: DetectionEvent): void {
    if (this.support === 'unsupported') return
    if (this.support === 'unknown' && !this.allowUnmarked) {
      const version = this.sessionVersion()
      if (version === null || isUnmarkedHostVersion(version)) {
        // 先判后写:未知/未标记宿主不落盘(0.1.2-alpha.1 起写盘即会话拒读)。
        this.support = 'unsupported'
        this.warnUnmarked()
        return
      }
    }
    try {
      const result = (session.append as unknown as AuditAppend)(DETECTION_EVENT, event, { ignorable: true })
      this.probe(result)
    } catch {
      // 审计补充失败不改写拦截结果(与门禁一致的约定)。
    }
  }

  /** 首次追加后探测返回 envelope 是否带上 ignorable 标记(宿主能力兜底检测)。 */
  probe(result: unknown): void {
    if (this.support === 'unknown' && !this.allowUnmarked) {
      if (isMarkedAuditEvent(result)) {
        this.support = 'supported'
      } else {
        this.support = 'unsupported'
        this.warnUnmarked()
      }
    }
  }

  /** 一次性告警:解释降级原因与重新开启的配置键。 */
  private warnUnmarked(): void {
    if (this.warned) return
    this.warned = true
    this.logger.warn(
      'dsh-defend: this host drops the ignorable marker on audit events or rejects unknown event types on read (Session.append predates the marker / fail-closed event vocabulary), which would make sessions unresumable — session-log audit is disabled; set detection.allowUnmarkedAudit: true to opt back in (see https://github.com/PerryLink/dsh-defend/issues/2)',
    )
  }
}

/** 已安装的 `@deepseek-ai/dsh-session` 版本;不可解析时返回 null(交由 append 探测兜底)。 */
export function peerVersion(): string | null {
  try {
    const pkg = createRequire(import.meta.url)('@deepseek-ai/dsh-session/package.json') as { version?: unknown }
    return typeof pkg.version === 'string' ? pkg.version : null
  } catch {
    return null
  }
}

/**
 * 版本线是否未实现可安全落盘的审计标记面。已发布的 `0.1.0-rc.1`–
 * `0.1.0-rc.8` 与 `0.1.1-rc.1`–`0.1.1-rc.2` 的 `Session.append` 都会静默
 * 丢弃 options 参数,写出的审计事件未标记,更严格宿主机上会拒绝加载会话日志
 * (rc8 复核 2026-08-22:盖章修复只在 harness master,未随任何已发布 rc 线);
 * harness master(`0.1.2-alpha.1` 起,42dc2a46c2)移除 ignorable 信封并改为
 * KNOWN_SESSION_EVENT_TYPES 读路径 fail-closed,`defend/detection` 不在集合
 * 内,写盘即令会话拒读——故 0.1.2-alpha.1 及之后的 0.1.x 线同样视为未标记
 * (0.1.2-rc.1 的 `Session.append` 第三参仍为 surface 意图,同样无法盖章)。
 * 更晚的 rc 与 0.2+ 无法预判,由 append 探测兜底验证。
 * @param version - 安装的 peer 版本字符串。
 * @returns 已知未标记的发布线返回 true。
 */
export function isUnmarkedHostVersion(version: string): boolean {
  const v = version.trim()
  const rc = /^0\.1\.(\d+)-rc\.(\d+)$/.exec(v)
  if (rc !== null) {
    const minor = Number(rc[1])
    const patch = Number(rc[2])
    if (minor === 0) return patch <= 8
    if (minor === 1) return patch <= 2
    // `0.1.2-rc.1` ships the alpha.5 surface: the third append parameter is
    // `SurfaceIntent` for surface event types only, so no 0.1.2 rc line can
    // stamp the marker either.
    return minor >= 2
  }
  const line = /^0\.1\.(\d+)(?:-.*)?$/.exec(v)
  if (line !== null) return Number(line[1]) >= 2
  return false
}

/**
 * 安装门禁监听。enabled:false 时不注册任何东西;监听随插件 fiber 卸载撤销。
 * @param ctx - 插件上下文。
 * @param config - 校验后的 {@link Config}(schemastery .default 保证字段齐全)。
 */
export function apply(ctx: Context, config: Config): void {
  const enabled = config.enabled ?? true
  if (!enabled) return
  const action = config.action ?? 'deny'
  const toolNames = new Set(config.toolNames ?? [...DEFAULT_TOOL_NAMES])
  const logger = ctx.logger(name)

  // 放行路径永远透传(绝不占据决策槽);拦截路径不调用 next(),瀑布止于本门禁。
  ctx.on('tools/pre-execute', (exec: ToolExecution, next: () => Promise<PreToolDecision>): Promise<PreToolDecision> => {
    if (!toolNames.has(exec.name)) return next()
    const command = commandOf(exec.arguments)
    if (command === undefined) return next()
    const workspace = workspaceOf(exec)
    const verdict = reviewDestructiveDelete(command, workspace === undefined ? {} : { workspace })
    if (verdict === undefined) return next()
    logger.warn(`blocked destructive delete on tool ${JSON.stringify(exec.name)}: ${verdict.reason}`)
    return Promise.resolve(action === 'ask' ? { kind: 'ask', reason: verdict.reason } : verdict)
  }, { prepend: true })

  // ── 检测层:注入/越狱/密钥扫描与三档决策 ────────────────────────────────
  const detection = config.detection ?? {}
  if (detection.enabled ?? true) {
    const scanner = buildScanner()
    const maxScanChars = detection.maxScanChars ?? 10_000
    const normalizeUnicode = detection.normalizeUnicode ?? true
    const minSecretEntropy = detection.secretMinEntropy ?? 3.0
    const maxReportEntries = Math.max(1, detection.maxReportEntries ?? 200)
    const records: DetectionEvent[] = []
    // 告警走父 logger:内容自带 dsh-defend 前缀,且测试可用 ctx.logger 直接观测。
    const audit = new DetectionAuditSink(ctx.logger, detection.allowUnmarkedAudit ?? false)

    const actionOf = (report: ScanReport, family: Family): 'allow' | 'ask' | 'block' => {
      const configured = family === 'injection' ? (detection.injectionAction ?? 'ask')
        : family === 'jailbreak' ? (detection.jailbreakAction ?? 'ask')
          : (detection.secretAction ?? 'ask')
      const critical = report.matches.some(match =>
        match.family === family && match.severity === 'critical' && (detection.secretBlockCritical ?? true))
      return critical ? 'block' : configured
    }

    const record = (session: Session | undefined, event: DetectionEvent): void => {
      records.push(event)
      if (records.length > maxReportEntries) records.shift()
      if (!(detection.audit ?? true)) return
      if (session === undefined) return
      audit.append(session, event)
    }

    const ask = async (agent: unknown, toolName: string, reason: string, signal?: AbortSignal): Promise<boolean> => {
      const approval = ctx.get('approval') as ApprovalService | undefined
      if (approval === undefined || agent === undefined) return false // fail closed
      try {
        const outcome = await approval.request({
          agent: agent as never,
          toolName,
          reason,
          ...(signal === undefined ? {} : { signal }),
        })
        return outcome === 'allowed-once'
      } catch {
        return false // 宿主在无审批回合时可能抛错(fail closed,拦截面不受影响)。
      }
    }

    // 1. 工具参数(进入执行体的模型生成参数)——deny/ask 走 pre-execute 决策。
    ctx.on('tools/pre-execute', (exec: ToolExecution, next: () => Promise<PreToolDecision>): Promise<PreToolDecision> => {
      const text = argumentsText(exec.arguments)
      if (text === undefined) return next()
      const report = scanner.scan(text, { maxChars: maxScanChars, normalize: normalizeUnicode, minSecretEntropy })
      if (report.matches.length === 0) return next()
      const session = exec.agent?.session as Session | undefined
      const family = topFamily(report)
      const chosen = actionOf(report, family)
      if (chosen === 'allow') return next()
      const top = report.matches[0]
      if (top === undefined) return next()
      const reason = `dsh-defend: ${family} 命中(规则 ${top.ruleId} 于工具参数);扫描 ${report.scannedLength} 字符`
      if (chosen === 'block') {
        record(session, detectionEvent('tool-arguments', report, top, family, 'block'))
        logger.warn(`blocked ${family} on tool ${JSON.stringify(exec.name)} (${top.ruleId})`)
        return Promise.resolve({ kind: 'deny', reason })
      }
      return ask(exec.agent, exec.name, reason, exec.signal).then((approved) => {
        record(session, detectionEvent('tool-arguments', report, top, family, 'ask', approved))
        return approved ? next() : { kind: 'deny', reason }
      })
    })

    // 2. 工具结果——block 决策把纠正性反馈还给模型;其余透传。
    ctx.on('tools/post-execute', (exec: ToolExecution, result: Readonly<ToolExecutionResult>, next: () => Promise<PostToolDecision>): Promise<PostToolDecision> => {
      const text = resultText(result)
      if (text === undefined) return next()
      const report = scanner.scan(text, { maxChars: maxScanChars, normalize: normalizeUnicode, minSecretEntropy })
      if (report.matches.length === 0) return next()
      const session = exec.agent?.session as Session | undefined
      const family = topFamily(report)
      const chosen = actionOf(report, family)
      if (chosen === 'allow') return next()
      const top = report.matches[0]
      if (top === undefined) return next()
      const reason = `dsh-defend: 工具 ${exec.name} 的结果包含 ${family} 匹配(规则 ${top.ruleId})`
      if (chosen === 'block') {
        record(session, detectionEvent('tool-result', report, top, family, 'block'))
        logger.warn(`blocked ${family} in result of tool ${JSON.stringify(exec.name)} (${top.ruleId})`)
        return Promise.resolve({ kind: 'block', feedback: [{ type: 'text', text: reason }] })
      }
      return ask(exec.agent, exec.name, reason, exec.signal).then((approved) => {
        record(session, detectionEvent('tool-result', report, top, family, 'ask', approved))
        return approved ? next() : { kind: 'block', feedback: [{ type: 'text', text: `${reason} — 审批未通过` }] }
      })
    })

    // 3. 进入模型的消息(agent/pre-step)——block 时 reject 本步。
    ctx.on('agent/pre-step', (payload: { agent: unknown; messages: UserMessage[]; turn: number; step: number; signal: AbortSignal }, next: () => Promise<PreStepDecision>): Promise<PreStepDecision> => {
      const text = messagesText(payload.messages)
      if (text === undefined) return next()
      const report = scanner.scan(text, { maxChars: maxScanChars, normalize: normalizeUnicode, minSecretEntropy })
      if (report.matches.length === 0) return next()
      const session = (payload.agent as { session?: unknown }).session as Session | undefined
      const family = topFamily(report)
      const chosen = actionOf(report, family)
      if (chosen === 'allow') return next()
      const top = report.matches[0]
      if (top === undefined) return next()
      if (chosen === 'block') {
        record(session, detectionEvent('message', report, top, family, 'block'))
        logger.warn(`blocked ${family} in pre-step messages (${top.ruleId})`)
        return Promise.resolve({ kind: 'reject' })
      }
      const reason = `dsh-defend: 消息内容包含 ${family} 匹配(规则 ${top.ruleId})`
      return ask(payload.agent, 'agent-message', reason, payload.signal).then((approved) => {
        record(session, detectionEvent('message', report, top, family, 'ask', approved))
        return approved ? next() : { kind: 'reject' }
      })
    })

    // 4. defend_report 工具与 /defend 命令(服务缺席时优雅降级,不阻断门禁)。
    const tools = ctx.get('tools') as import('@deepseek-ai/dsh-tools').ToolRuntime | undefined
    if ((config.registerTool ?? true) && tools !== undefined) {
      const tool = defineTool({
        name: 'defend_report',
        description: 'Report dsh-defend detection statistics: total scans/hits/blocks and the most recent matches per family (in-memory ring buffer, never contains secret text).',
        parameters: {},
        output: {
          schema: {
            type: 'object',
            properties: {
              ok: { type: 'boolean', const: true },
              total: { type: 'integer' },
              blocked: { type: 'integer' },
              asked: { type: 'integer' },
              byFamily: {
                type: 'object',
                properties: {
                  injection: { type: 'integer' },
                  jailbreak: { type: 'integer' },
                  secret: { type: 'integer' },
                },
                additionalProperties: false,
              },
              recent: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    surface: { type: 'string' },
                    ruleId: { type: 'string' },
                    family: { type: 'string' },
                    severity: { type: 'string' },
                    action: { type: 'string' },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
          render(_args, value): ContentBlock[] {
            const view = value as unknown as { total: number; blocked: number; asked: number }
            return [{ type: 'text', text: `dsh-defend: ${view.total} recorded detection(s), ${view.blocked} blocked, ${view.asked} asked.` }]
          },
        },
        timeoutMs: 15_000,
        async execute() {
          const counts = summarizeRecords(records)
          return counts
        },
      })
      ctx.effect(() => tools.register(tool), 'dsh-defend: defend_report tool')
    }
    const commands = ctx.get('commands')
    if ((config.registerCommand ?? true) && commands !== undefined) {
      ctx.effect(() => commands.register({
        name: 'defend',
        description: 'Show dsh-defend detection statistics and recent matches',
        handler: () => {
          const counts = summarizeRecords(records)
          const text = [
            `dsh-defend: ${counts.total} recorded detection(s) — ${counts.blocked} blocked, ${counts.asked} asked.`,
            `by family: injection ${counts.byFamily.injection}, jailbreak ${counts.byFamily.jailbreak}, secret ${counts.byFamily.secret}.`,
            ...counts.recent.map(entry => `- [${entry.family}/${entry.ruleId}] ${entry.surface} (${entry.action}, ${entry.severity})`),
          ].join('\n')
          return { kind: 'success' as const, text }
        },
      }), 'dsh-defend: /defend command')
    }
  }
}

/** 取报告中最严重匹配所属 family(并列时按 family 稳定序)。 */
function topFamily(report: ScanReport): Family {
  let best: { family: Family; severity: number } | undefined
  for (const match of report.matches) {
    const rank = severityRank(match.severity)
    if (best === undefined || rank > best.severity) best = { family: match.family, severity: rank }
  }
  return best?.family ?? 'injection'
}

/** 从工具参数提取可扫描文本(字符串本身或文档化命令键)。 */
function argumentsText(argumentsValue: unknown): string | undefined {
  if (typeof argumentsValue === 'string') return argumentsValue
  if (argumentsValue === null || typeof argumentsValue !== 'object') return undefined
  for (const key of ['command', 'cmd', 'input', 'text', 'content', 'prompt', 'script', 'code', 'query']) {
    const value = (argumentsValue as Record<string, unknown>)[key]
    if (typeof value === 'string' && value !== '') return value
  }
  try {
    const json = JSON.stringify(argumentsValue)
    return json === undefined ? undefined : json
  } catch {
    return undefined
  }
}

/** 从工具结果内容块提取可扫描文本。 */
function resultText(result: Readonly<ToolExecutionResult>): string | undefined {
  const parts: string[] = []
  const walk = (block: unknown): void => {
    if (block === null || typeof block !== 'object') return
    const record = block as Record<string, unknown>
    if (record.type === 'text' && typeof record.text === 'string') parts.push(record.text)
    else if (record.type === 'tool-result' && Array.isArray(record.content)) {
      for (const inner of record.content) walk(inner)
    }
  }
  for (const block of result.content) walk(block)
  if (!result.isError && typeof result.value === 'string') parts.push(result.value)
  return parts.length === 0 ? undefined : parts.join('\n')
}

/** 从 pre-step 消息提取可扫描文本(text 块 + 嵌套 tool-result 文本)。 */
function messagesText(messages: readonly UserMessage[]): string | undefined {
  const parts: string[] = []
  const walk = (block: unknown): void => {
    if (block === null || typeof block !== 'object') return
    const record = block as Record<string, unknown>
    if (record.type === 'text' && typeof record.text === 'string') parts.push(record.text)
    else if (record.type === 'tool-result' && Array.isArray(record.content)) {
      for (const inner of record.content) walk(inner)
    }
  }
  for (const message of messages) {
    for (const block of message.content) walk(block)
  }
  return parts.length === 0 ? undefined : parts.join('\n')
}

/** 审计事件草稿(ask 分支复用)。 */
function detectionEvent(
  surface: DetectionEvent['surface'],
  report: ScanReport,
  top: MatchInfo,
  family: Family,
  action: DetectionEvent['action'],
  approved?: boolean,
): DetectionEvent {
  return {
    surface,
    ruleId: top.ruleId,
    family,
    category: top.category,
    severity: top.severity,
    action,
    scannedLength: report.scannedLength,
    truncated: report.truncated,
    ...(top.secretType !== undefined ? { secretType: top.secretType } : {}),
    ...(approved !== undefined ? { approved } : {}),
  }
}

/** defend_report/defend 的输出汇总(不含任何匹配文本)。 */
function summarizeRecords(records: readonly DetectionEvent[]) {
  const byFamily = { injection: 0, jailbreak: 0, secret: 0 }
  let blocked = 0
  let asked = 0
  for (const record of records) {
    byFamily[record.family] += 1
    if (record.action === 'block') blocked += 1
    else if (record.action === 'ask') asked += 1
  }
  return {
    ok: true as const,
    total: records.length,
    blocked,
    asked,
    byFamily,
    recent: records.slice(-20).map(record => ({
      surface: record.surface,
      ruleId: record.ruleId,
      family: record.family,
      severity: record.severity,
      action: record.action,
    })),
  }
}
