<div align="center">

# 🛡️ dsh-defend
- **1024 商店渠道**：先 `npm i -g dsh1024`，再 `dsh1024 plugin --profile web add dsh-defend`（计入 [deepseek1024.com](https://deepseek1024.com) 安装排行）。

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
| Harness | DeepSeek Harness `0.1.1-rc.2`（peer 范围 `>=0.1.0-rc.8 <0.2.0`；已于 2026-09-01 对照 checkout `0.1.2-alpha.5` 核验） 0.1.2-alpha.5（2026-09-02 已适配）：会话信封保留 ignorable 字段但仅用于存量日志读取兼容——Session.append 仍无法盖章，门控行为不变。 |
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
| `detection.normalizeUnicode` | `true` | 扫描前 NFKC/Unicode 归一化（堵 lookalike-Unicode 绕过） |
| `detection.secretMinEntropy` | `3.0` | 密钥命中后的最小 Shannon 熵（bits/字符），低于阈值视为误报丢弃；`0` 关闭 |
| `detection.injectionAction` | `ask` | 注入类：`allow` / `ask` / `block` |
| `detection.jailbreakAction` | `ask` | 越狱类：`allow` / `ask` / `block` |
| `detection.secretAction` | `ask` | 密钥类：`allow` / `ask` / `block` |
| `detection.secretBlockCritical` | `true` | critical 密钥无视 secretAction 一律 block |
| `detection.audit` | `true` | 写 `defend/detection` 会话审计事件 |
| `detection.allowUnmarkedAudit` | `false` | 宿主不识别 `ignorable` 标记（截至目前所有已发布线）或对未知事件类型 fail-closed（宿主 `0.1.2-alpha.5` 及以后）时是否仍写会话日志审计（接受会话无法恢复的风险） |
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
- **会话审计与 `ignorable` 标记。** 审计追加请求 envelope 的 `ignorable: true` 标记，任何 harness 构建都能加载日志。截至目前所有已发布线（`0.1.0-rc.1`–`0.1.0-rc.8`、`0.1.1-rc.1`–`0.1.1-rc.2`）都会静默丢弃它——事件未标记落盘，更严格构建上会话将无法恢复；宿主 `0.1.2-alpha.5` 保留信封字段但仅用于存量日志读取兼容、`Session.append` 仍无法盖章，且读取路径对未标记未知事件类型 fail-closed（`defend/detection` 未注册），写入同样会让会话无法加载。因此 dsh-defend 在第一次追加前即判定（peer 版本预判；版本不可解析时同样 fail closed）并以一次性告警停用会话日志审计。设 `detection.allowUnmarkedAudit: true` 可重新开启。见 [issue #2](https://github.com/PerryLink/dsh-defend/issues/2)。

## 开发

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc：src + tests，对照本地 harness checkout
pnpm run typecheck:ci  # tsc：对照已发布的 0.1.1-rc.2 类型（无 paths）
pnpm test           # vitest：75 个测试、8 个套件（含检测基准）
pnpm run build      # tsdown bundle + tsc 声明（lib/）
pnpm run verify:self-contained  # 依赖声明全部来自 registry
pnpm run verify:artifacts       # 构建产物 ESM 面 + 发布文件齐全
pnpm pack           # 发布用 tarball
```

### Benchmark

红队基准（105 个样本的逐类 P/R/F1 + 27/28 fixture 下限）见 [`benchmark/RESULTS.md`](benchmark/RESULTS.md)；用 `node --experimental-strip-types benchmark/run.mjs` 复现（零新依赖、无需构建）。

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) —— 创建者与维护者：危险删除门禁、四资产检测移植、拦截接线、审计面与五语文档。
- [@cuohua](https://github.com/cuohua) —— 关于 `defend/detection` 事件未标记落盘导致会话在更严格构建上无法恢复的精准报告（[#2](https://github.com/PerryLink/dsh-defend/issues/2)）；运行时的宿主能力检测与 `ignorable` 标记纪律直接源自该分析。

## PerryLink DSH Plugin Family

这是 [PerryLink](https://github.com/PerryLink) 维护的 [33 个 DeepSeek Harness 插件](https://github.com/PerryLink) 之一。如果它能帮到你，其他的也会：

| Plugin | One-liner |
|---|---|
| **[dsh-dsh-auto-review](https://github.com/PerryLink/dsh-dsh-auto-review)** | 审批链上的第二模型自动审查，默认失败关闭 | |
| **[dsh-dsh-background-agents](https://github.com/PerryLink/dsh-dsh-background-agents)** | 带 Web UI 侧栏、消息与中断的持久后台子代理 | |
| **[dsh-dsh-budget](https://github.com/PerryLink/dsh-dsh-budget)** | DeepSeek Harness 的成本治理：预算、碳排与延迟一屏呈现。 | |
| **[dsh-dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-dsh-checkpoint-rewind)** | Claude Code /rewind 等价：快照、会话 fork、一次性恢复 | |
| **[dsh-dsh-claude-move](https://github.com/PerryLink/dsh-dsh-claude-move)** | 把 Claude Code 会话、记忆、技能与 CLAUDE.md 迁入 DSH | |
| **[dsh-dsh-click](https://github.com/PerryLink/dsh-dsh-click)** | 跨平台原生桌面控制（DeepSeek Harness），Windows 优先。 | |
| **[dsh-dsh-composer-history](https://github.com/PerryLink/dsh-dsh-composer-history)** | Web 输入框的终端式历史：方向键、Ctrl+R 搜索 | |
| **[dsh-dsh-data-quality](https://github.com/PerryLink/dsh-dsh-data-quality)** | 数据集质量检查与引文核查（本插件可选消费的数字核查桥） | |
| **[dsh-dsh-doublecheck](https://github.com/PerryLink/dsh-dsh-doublecheck)** | 工程纪律守卫：需求质询、测试门禁、对手评审 | |
| **[dsh-dsh-draw](https://github.com/PerryLink/dsh-dsh-draw)** | DeepSeek Harness 的统一静态图像生成路由。 | |
| **[dsh-dsh-fast](https://github.com/PerryLink/dsh-dsh-fast)** | DeepSeek Harness 只读性能诊断。 | |
| **[dsh-dsh-fund-research](https://github.com/PerryLink/dsh-dsh-fund-research)** | 面向中国公募基金的确定性研究报告 | |
| **[dsh-dsh-github](https://github.com/PerryLink/dsh-dsh-github)** | 面向 DSH 的 GitHub PR/issues 集成，每次写入经审批门控 | |
| **[dsh-dsh-industry-research](https://github.com/PerryLink/dsh-dsh-industry-research)** | 行业研究编排，经本插件的 `ctx.researchReport.assemble` 封存交付物 | |
| **[dsh-dsh-library](https://github.com/PerryLink/dsh-dsh-library)** | DeepSeek Harness 的本地文档知识库。 | |
| **[dsh-dsh-local-ai](https://github.com/PerryLink/dsh-dsh-local-ai)** | DeepSeek Harness 的本地模型（Ollama）接入。 | |
| **[dsh-dsh-lsp-actions](https://github.com/PerryLink/dsh-dsh-lsp-actions)** | 通过语言服务器的 LSP 诊断、格式化、补全、代码操作与重命名 | |
| **[dsh-dsh-mask](https://github.com/PerryLink/dsh-dsh-mask)** | PII 脱敏中间件：模型边界匿名化、展示层还原 | |
| **[dsh-dsh-mcp-panel](https://github.com/PerryLink/dsh-dsh-mcp-panel)** | 只读 MCP 运行时面板：/mcp 命令 + 带状态、工具与错误的 Settings 标签页 | |
| **[dsh-dsh-memento](https://github.com/PerryLink/dsh-dsh-memento)** | 审批门控的跨会话记忆：ctx.memory 接缝 + SQLite + 记忆工具 | |
| **[dsh-dsh-observe](https://github.com/PerryLink/dsh-dsh-observe)** | DeepSeek Harness 的 OpenTelemetry 与 Langfuse 可观测导出器。 | |
| **[dsh-dsh-output-styles](https://github.com/PerryLink/dsh-dsh-output-styles)** | Claude Code outputStyles 等价的运行时风格切换 | |
| **[dsh-dsh-permission-rules](https://github.com/PerryLink/dsh-dsh-permission-rules)** | Claude Code 风格声明式 allow/deny/ask 权限规则，带审计 | |
| **[dsh-dsh-plugin-guide](https://github.com/PerryLink/dsh-dsh-plugin-guide)** | 作为按需代理技能的插件开发知识库 | |
| **[dsh-dsh-research-report](https://github.com/PerryLink/dsh-dsh-research-report)** | 可验证研究报告引擎：内容寻址证据账本与封存版本 | |
| **[dsh-dsh-score](https://github.com/PerryLink/dsh-dsh-score)** | DeepSeek Harness 插件的多维质量评分。 | |
| **[dsh-dsh-session-pin](https://github.com/PerryLink/dsh-dsh-session-pin)** | 在 Web 侧栏置顶会话，带持久排序 | |
| **[dsh-dsh-session-sync](https://github.com/PerryLink/dsh-dsh-session-sync)** | DeepSeek Harness 的跨设备会话同步——会话存储的专用 git 镜像。 | |
| **[dsh-dsh-skill-pack-security](https://github.com/PerryLink/dsh-dsh-skill-pack-security)** | 安全审计技能包：密钥扫描、依赖与供应链审查 | |
| **[dsh-dsh-talk](https://github.com/PerryLink/dsh-dsh-talk)** | DeepSeek Harness 的语音优先会话闭环：对它说，听它答。 | |
| **[dsh-dsh-test-drive](https://github.com/PerryLink/dsh-dsh-test-drive)** | DeepSeek Harness 插件的隔离试装冒烟。 | |
| **[dsh-dsh-translate](https://github.com/PerryLink/dsh-dsh-translate)** | DeepSeek Harness 的厂商参数翻译与确定性 JSON 修复。 | |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors
