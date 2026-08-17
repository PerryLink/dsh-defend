<div align="center">

# 🛡️ dsh-defend

**DeepSeek Harness 的提示注入、越狱与密钥泄露防护。**

*规则裁决已知的，拦截裁决其余的——一切都有审计。*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-defend/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-defend/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-defend?label=version)](https://github.com/PerryLink/dsh-defend/releases)
[![npm version](https://img.shields.io/npm/v/dsh-defend)](https://www.npmjs.com/package/dsh-defend)
[![npm downloads](https://img.shields.io/npm/dm/dsh-defend)](https://www.npmjs.com/package/dsh-defend)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## 兼容性

| 方面 | 状态 |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6`（声明兼容 `0.1.0-rc.5`–`0.1.0-rc.6`） |
| Node | `^22.19.0 \|\| >=24.0.0` |
| 平台 | 全部（纯 host；无原生代码、无网络） |
| 模型 | 任意（检测发生在内容到达模型之前） |

## 你能得到什么

`dsh-defend` 在 agent 面前放了两层相互独立的防线：

1. **危险删除门禁** —— 8·14/8·16 事故教训的可执行形态。在 `tools/pre-execute` 上，递归删除类 shell 命令被拒绝，除非**每个**目标都是会话工作区内的显式绝对路径且不触碰受保护前缀（家目录配置、`.dsh`/`.claude`、系统目录）。dry-run 标记（`-WhatIf`、`--dry-run`、`git clean -n`）放行——它们正是教训要求的删除前核对。
2. **检测层** —— 移植自四个上游资产（均为 Apache-2.0，见 THIRD_PARTY_NOTICES.md）：25 条 Prompt-Injection-Payloads 规则、25 条 Jailbreak-Detector 模式（纯 TypeScript Aho-Corasick 自动机）、来自 Secret-Key-Leaker-Detect 与各签发方公开文档的 12 条密钥语法、以及原样保留为回归基准的 Prompt-Attack-Dataset。

三个拦截点，同一套决策模型：

| 拦截点 | 扫描内容 | 决策 |
|---|---|---|
| `agent/pre-step` | 进入模型的消息 | allow → `next()`；ask → 审批；block → 拒绝本步 |
| `tools/pre-execute` | 工具参数 | allow → `next()`；ask → 审批；block → deny |
| `tools/post-execute` | 工具结果 | allow → `next()`；ask → 审批；block → 纠正性反馈 |

默认：每个 family 均为 ask，**critical** 级密钥一律 block（上游「见即中断」语义）。没有审批应答者即失败关闭。每次放行都调用 `next()`——下游策略插件永不被短路。

```text
入站消息 ── agent/pre-step ── 扫描 ── 干净 → next()/enter
工具参数 ── tools/pre-execute ── 扫描 ── 放行 → next()
工具结果 ── tools/post-execute ── 扫描 ── 拦截 → 反馈
                              │
                              └─ defend/detection 审计（规则 id/类别/
                                 严重度/决策——从不含匹配文本）
```

## 快速开始

```sh
# 1. 把 bundle 装进你的 profile
dsh plugin --profile web add "github:PerryLink/dsh-defend#main"

# 或从 npm 安装（正式发布版）
dsh plugin --profile web add dsh-defend

# 2. 重启并核实行
dsh --profile web --dump-config | grep -A3 'id: dsh-defend'
```

## 安装与卸载

- **git 通道**（最新 `main`）：`dsh plugin --profile web add "github:PerryLink/dsh-defend#main"` —— `prepare` 脚本仅用生产依赖构建。
- **npm 通道**（正式发布版）：`dsh plugin --profile web add dsh-defend`。
- **tarball 通道**：在本仓库执行 `pnpm pack`，然后 `dsh plugin --profile web add ./dsh-defend-<version>.tgz`。
- **卸载**：`dsh plugin --profile web remove dsh-defend`（或从 profile patch 中删除该行）。

## 配置

所有可调项都是 Schemastery `Config` 字段（可在 cordis.yml 中修改）。按 id 定向覆盖会替换整行——需要重新声明每个键。`cordis.patch.yml` 内联说明了每个键。

| 键 | 默认值 | 含义 |
|---|---|---|
| `enabled` | `true` | 两层防线总开关 |
| `action` | `deny` | 危险删除门禁动作（`deny` / `ask`） |
| `toolNames` | `['bash','persistent-bash','terminal-bash']` | 门禁评审命令参数的工具注册名 |
| `detection.enabled` | `true` | 检测层开关 |
| `detection.maxScanChars` | `10000` | 每次拦截的扫描字符上限（只扫头部） |
| `detection.injectionAction` | `ask` | 注入类：`allow` / `ask` / `block` |
| `detection.jailbreakAction` | `ask` | 越狱类：`allow` / `ask` / `block` |
| `detection.secretAction` | `ask` | 密钥类：`allow` / `ask` / `block` |
| `detection.secretBlockCritical` | `true` | critical 密钥无视 secretAction 一律 block |
| `detection.audit` | `true` | 写 `defend/detection` 会话审计事件 |
| `detection.maxReportEntries` | `200` | 内存环形缓冲条数上限 |
| `registerCommand` | `true` | 注册 `/defend` 命令 |
| `registerTool` | `true` | 注册 `defend_report` 工具 |

## 工具与界面

| 界面 | 类型 | 说明 |
|---|---|---|
| `defend_report` | 工具 | 汇总（记录/拦截/询问数）、按 family 计数、最近 20 条——从不含匹配文本 |
| `/defend` | 命令 | 同样的汇总文本 |
| `agent/pre-step` | 监听 | 入站消息扫描（enter/reject） |
| `tools/pre-execute` | 监听 | 工具参数扫描（deny/ask）+ 危险删除门禁 |
| `tools/post-execute` | 监听 | 工具结果扫描（block 反馈） |

## 权限与数据

- **权限**：ask 决策走官方审批接缝；绝不重实现或绕过。workshop manifest 声明 `session:append` 与 `network:none`。
- **数据**：不落盘任何东西；报告环形缓冲仅在内存且有界。无网络请求、无子进程。
- **会话日志**：`defend/detection` 事件只带规则 id、family、类别、严重度、密钥类型、决策与扫描事实——匹配文本从不入日志，密钥匹配在构造上只留类型。

## 安全边界

- **检测，而非执法。** 门禁与检测层只在官方 seam 上产出 deny/ask/block 决策；沙箱与审批系统仍是执行权威。
- **失败关闭。** 审批应答者缺失、会话缺失或服务面缺失时，一律退化为最严格决策——绝不静默放行。
- **内容不出进程。** 扫描在本地完成；审计事件已脱敏；密钥绝不入日志、展示或报告。
- **有界工作。** 扫描上限、每规则至多一条匹配、环形缓冲上限，恶意输入无法消耗无界资源。

## 已知限制

- **检测缺口。** 规则库覆盖已移植词汇及其容错变体；新式措辞、形近 Unicode 编码（NFKC 归一化列为后续工作）与多步攻击可能绕过。基准把实测下限（上游数据集 27/28）钉进测试，回归可见。
- **无模型级判定。** `dsh-defend` 是确定性的，绝不调用模型，无法判断全新意图。
- **消息拒绝是静默的。** `agent/pre-step` 的 reject 不给模型理由（seam 没有理由字段）；审计事件记录规则事实。
- **较新 harness 构建上的会话审计。** 审计追加使用两参数 `Session.append`（钉住的 rc.6 peers 没有 append envelope 选项）；post-rc.6 构建上事件为 required-on-read，安装本插件即无碍，因为本插件声明了该事件类型。

## 开发

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc：src + tests，对照本地 harness checkout
pnpm run typecheck:ci  # tsc：对照已发布的 0.1.0-rc.6 类型（无 paths）
pnpm test           # vitest：49 个测试、4 个套件（含检测基准）
pnpm run build      # tsdown bundle + tsc 声明（lib/）
pnpm run verify:self-contained  # 依赖声明全部来自 registry
pnpm run verify:artifacts       # 构建产物 ESM 面 + 发布文件齐全
pnpm pack           # 发布用 tarball
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) —— 创建者与维护者：危险删除门禁、四资产检测移植、拦截接线、审计面与五语文档。

## PerryLink DSH Plugin Family

本项目是由 [PerryLink](https://github.com/PerryLink) 维护的 [29 个 DeepSeek Harness 插件](https://github.com/PerryLink)之一。如果这个对你有用，其他插件很可能也会：

| Plugin | One-liner |
|---|---|
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | 审批链上的第二模型自动审查，默认失败关闭 |
| [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | 持久化后台子代理，带 Web UI 侧边栏、消息与打断 |
| [dsh-budget](https://github.com/PerryLink/dsh-budget) | DeepSeek Harness 的成本治理：预算、碳排与延迟一屏呈现。 |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Claude Code /rewind 等价物：快照、会话分叉、一次性恢复 |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | 将 Claude Code 会话、记忆、技能与 CLAUDE.md 迁入 DSH |
| [dsh-click](https://github.com/PerryLink/dsh-click) | 跨平台原生桌面控制（DeepSeek Harness），Windows 优先。 |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Web 输入框的终端式输入历史：方向键、Ctrl+R 搜索 |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | DeepSeek Harness 的提示注入、越狱与密钥泄露防护。 |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | 工程纪律门禁：需求质询、测试门禁、对抗式审查 |
| [dsh-draw](https://github.com/PerryLink/dsh-draw) | DeepSeek Harness 的统一静态图像生成路由。 |
| [dsh-fast](https://github.com/PerryLink/dsh-fast) | DeepSeek Harness 的只读性能诊断。 |
| [dsh-github](https://github.com/PerryLink/dsh-github) | DSH 的 GitHub PR/issue 集成，每次写入都经审批门 |
| [dsh-library](https://github.com/PerryLink/dsh-library) | DeepSeek Harness 的本地文档知识库。 |
| [dsh-local-ai](https://github.com/PerryLink/dsh-local-ai) | DeepSeek Harness 的本地模型（Ollama）接入。 |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | 经语言服务器的 LSP 诊断、格式化、补全、代码操作与重命名 |
| [dsh-mask](https://github.com/PerryLink/dsh-mask) | DeepSeek Harness 的 PII 脱敏中间件——数据到模型前匿名化，展示层还原。 |
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | 只读 MCP 运行时面板：/mcp 命令 + 带状态、工具与错误的设置页 |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | 带审批门的跨会话记忆：ctx.memory 接缝 + SQLite + memory 工具 |
| [dsh-observe](https://github.com/PerryLink/dsh-observe) | DeepSeek Harness 的 OpenTelemetry 与 Langfuse 可观测导出器。 |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Claude Code outputStyles 等价的运行时样式切换 |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Claude Code 风格声明式 allow/deny/ask 权限规则，带审计 |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | 按需 agent 技能形式的插件开发知识库 |
| [dsh-score](https://github.com/PerryLink/dsh-score) | DeepSeek Harness 插件的多指标质量评分。 |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | 在 Web 侧边栏置顶会话，顺序持久化 |
| [dsh-session-sync](https://github.com/PerryLink/dsh-session-sync) | DeepSeek Harness 的跨设备会话同步——会话存储的专用 git 镜像。 |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | 安全审计技能包：密钥扫描、依赖与供应链审查 |
| [dsh-talk](https://github.com/PerryLink/dsh-talk) | DeepSeek Harness 的语音优先会话闭环：对它说，听它答。 |
| [dsh-test-drive](https://github.com/PerryLink/dsh-test-drive) | DeepSeek Harness 插件的隔离式安装冒烟实测。 |
| [dsh-translate](https://github.com/PerryLink/dsh-translate) | DeepSeek Harness 的厂商参数翻译与确定性 JSON 修复。 |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors
