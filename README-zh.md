<div align="center">

# 🛡️ dsh-defend
- **1024 商店渠道**：先 `npm i -g dsh1024`，再 `dsh1024 plugin --profile web add dsh-defend`（计入 [deepseek1024.com](https://deepseek1024.com) 安装排行）。

**DeepSeek Harness 的提示注入、越狱与密钥泄露防护。**

*规则裁决已知的，拦截裁决其余的——一切都有审计。*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-defend)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-defend.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-defend/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-defend/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-defend?label=version)](https://github.com/PerryLink/dsh-defend/releases)
[![npm version](https://img.shields.io/npm/v/dsh-defend)](https://www.npmjs.com/package/dsh-defend)
[![npm downloads](https://img.shields.io/npm/dm/dsh-defend)](https://www.npmjs.com/package/dsh-defend)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-defend?metric=downloads&lang=zh)](https://dshfind.com/zh/plugins/PerryLink/dsh-defend?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-defend
```


</div>

---


**📖 生态实测知识库**（实测数据，不是营销）：[插件开发指南 · 选型实测数据 · 维护取舍判据](https://perrylink.github.io/dsh-plugin-guide/)。

<!-- star-cta -->

## What is dsh-defend?

DeepSeek Harness 的提示注入、越狱与密钥泄露防护。

规则裁决已知的，拦截裁决其余的——一切都有审计。

![dsh-defend 终端演示：dsh-defend — install, then /defend and the red-team benchmark](https://raw.githubusercontent.com/PerryLink/dsh-defend/main/docs/assets/dsh-defend-hero.png)

![Animated terminal demo of dsh-defend](https://raw.githubusercontent.com/PerryLink/dsh-defend/main/docs/assets/dsh-defend-demo.gif)

*同一次运行，动图版。*

## 维护状态：🧊 已冻结

> **2026-10-05 起冻结，不再新增功能。** 本包仍可正常使用，**没有退役**——但不再投入功能开发，只有真实故障才会修复。

维护者判定该能力面**已出现采用度更高、更值得推荐的替代方案**，因此把精力移到了别处。

| | 包 | 周下载量 |
|---|---|---|
| **本包** | `dsh-defend` | 937 |
| 更值得推荐的替代品 | [`cc-safety-net`](https://github.com/kenryu42/cc-safety-net) | **13,087** |

**为什么替代品更强。** `cc-safety-net` 作为编程 Agent 的 CLI hook，拦截破坏性命令与密钥文件访问。

**本包仍然独有的能力。** 从 prompt-injection / jailbreak / secret-leaker 三个上游资产集移植的 **Aho-Corasick 模式引擎**；对**用户消息、工具参数、工具结果**三处做 allow/ask/block 三档拦截；以及经脱敏的 `defend/*` 会话审计事件。上面的替代品范围更窄（只管破坏性命令与密钥文件），但采用度高出一个数量级。

👉 **新工作请优先使用 `cc-safety-net`**（若你只需要破坏性命令闸门）；若你要的是更宽的检测面，本包仍是更广的那个，但已冻结不再加功能。 已安装的照常可用，没有任何东西被移除。

*完整证据（含宿主版本兼容矩阵）见 `dsh-plugin-supersession-review-20261005.md`；英文版见 [README.md](README.md) 的 **Maintenance status: 🧊 FROZEN** 一节。*

## ⭐ 如果它帮到了你

这个插件是 [DSH 插件家族](https://github.com/PerryLink)的一员（95 个，全部 Apache-2.0）。如果你在用，**给个 star** —— 它不会解锁任何功能，但会让下一个人在搜索里更容易找到它。

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## Comparison

![dsh-defend 的实测对比柱状图](https://raw.githubusercontent.com/PerryLink/dsh-defend/main/docs/assets/dsh-defend-evidence.png)

105 samples (75 positive / 30 negative) · from benchmark/RESULTS.md in this repo

## 兼容性

| 方面 | 状态 |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1`（2026-09-24 核验；peer 范围 `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`）。该线上 `Session.append` 的第三参仅对表面事件类型存在且为 `SurfaceIntent`，因此非表面的 `defend/detection` 仍无法盖章 `ignorable`：会话日志审计保持失败关闭式停用，`/defend` 显式渲染该状态。会话格式 V4 已无 `tool-result` 内容块——本插件从不生产它，两个内容 walker 只为退役的 V3 包裹块保留**只读**回退，使升级前写下的会话仍可被扫描。已于 2026-09-24 核验（双 typecheck 尺子 + 全量测试 + build + self-contained/artifacts 门 + pack；宿主类型图仅一份）。 |
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
dsh plugin --profile web add github:PerryLink/dsh-defend
```

```sh
# 1. 把 bundle 装进你的 profile
dsh plugin --profile web add github:PerryLink/dsh-defend

# 或从 npm 安装（正式发布版）
dsh plugin --profile web add dsh-defend

# 2. 重启并核实行
dsh --profile web --dump-config | grep -A3 'id: dsh-defend'
```

## 安装与卸载

- **git 通道**（最新 `main`）：`dsh plugin --profile web add github:PerryLink/dsh-defend` —— `prepare` 脚本仅用生产依赖构建。
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
| `detection.allowUnmarkedAudit` | `false` | 宿主不识别 `ignorable` 标记（截至目前所有已发布线，含 `0.2.x` 预发布线）或对未知事件类型 fail-closed（宿主 `0.1.2-rc.1` 及以后）时是否仍写会话日志审计（接受会话无法恢复的风险） |
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
- **会话审计与 `ignorable` 标记。** 审计追加请求 envelope 的 `ignorable: true` 标记，任何 harness 构建都能加载日志。截至目前所有已发布线（`0.1.0-rc.1`–`0.1.0-rc.8`、`0.1.1-rc.1`–`0.1.1-rc.2`，以及 `0.2` 走廊——2026-10-04 对已发布 `0.2.1-alpha.1` 复核：其 `append(type, data, ...opts)` 只从 options 取 `sourceEventSeqs`/`surfaceOp`，信封固定为 `{ type, seq, time, data }`）都会静默丢弃它——事件未标记落盘，更严格构建上会话将无法恢复；宿主 `0.1.2-rc.1` 保留信封字段但仅用于存量日志读取兼容、`Session.append` 仍无法盖章，且读取路径对未标记未知事件类型 fail-closed（`defend/detection` 未注册），写入同样会让会话无法加载。因此 dsh-defend 在第一次追加前即判定（peer 版本预判；版本不可解析时同样 fail closed）并以一次性告警停用会话日志审计；`0.2.x` **预发布线**正因如此被提前归入未标记，稳定的 `0.2.x` 仍回落到追加探测。设 `detection.allowUnmarkedAudit: true` 可重新开启。见 [issue #2](https://github.com/PerryLink/dsh-defend/issues/2)。

## 开发

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc：src + tests，对照本地 harness checkout
pnpm run typecheck:ci  # tsc：对照已发布的 0.1.7-rc.2 类型（无 paths）
pnpm test           # vitest：97 个测试、9 个套件（含检测基准）
pnpm run build      # tsdown bundle + tsc 声明（lib/）
pnpm run verify:self-contained  # 依赖声明全部来自 registry
pnpm run verify:artifacts       # 构建产物 ESM 面 + 发布文件齐全
pnpm pack           # 发布用 tarball
```

### Benchmark

红队基准（105 个样本的逐类 P/R/F1 + 27/28 fixture 下限）见 [`benchmark/RESULTS.md`](benchmark/RESULTS.md)；用 `node --experimental-strip-types benchmark/run.mjs` 复现（零新依赖、无需构建）。

## 与其他 DSH 插件的互操作

已对照 **DSH `0.2.0-rc.2`**（本 README 面向的运行时）与 2026-10-05 实测的高星插件集验证。

本插件**不干扰**其他插件，包括广泛安装的高星插件：

- **无工具名冲突。** 所有工具都带命名空间，不占用任何已被内置工具或其他插件持有的裸名。
- **无服务键冲突。** 不提供任何服务键，因此不存在服务键冲突。
- **无 slot 冲突。** 不注册客户端 slot key，因此不参与 `shadows-shipped-ui` 座位争抢。
- **无 HTTP 路由冲突。** 不注册任何 `webServer` 前缀。
- **无 patch 层冲突。** 组合包 patch 只 `insert` 自己那一行，从不覆写内置行的 `config`。
- **无全局改写。** 不改原型、不改写 `process.env`、不替换全局 fetch dispatcher。

**共享事件监听器在构造上就不互相干扰。** 它用 `ctx.on()` 监听顺序敏感事件 `agent/pre-step`, `tools/post-execute`, `tools/pre-execute` —— Cordis 的**广播**语义：每个监听器都会运行，任何一个都无法饿死其他监听器。**此处每个监听器都通过 `next()` 委托**，因此链条绝不会被短路；改写作用在 `next()` 产出的值上，而不是用它顶替返回：
  - `agent/pre-step` — also used by `dsh-routing-suite` (7000★, 7 listeners), `modlens` (4122★), `dsh-purge` (3317★), `dsh-agent-teams` (1923★), `dsh-context` (1849★).
  - `tools/post-execute` — also used by `cc-safety-net` (1576★).
  - `tools/pre-execute` — also used by `cc-safety-net` (1576★).

静态证据：`dsh-plugin-doctor` 的 K10–K13 在本仓全部为 `pass`。

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) —— 创建者与维护者：危险删除门禁、四资产检测移植、拦截接线、审计面与五语文档。
- [@cuohua](https://github.com/cuohua) —— 关于 `defend/detection` 事件未标记落盘导致会话在更严格构建上无法恢复的精准报告（[#2](https://github.com/PerryLink/dsh-defend/issues/2)）；运行时的宿主能力检测与 `ignorable` 标记纪律直接源自该分析。

## PerryLink DSH Plugin Family

本项目是 [PerryLink](https://github.com/PerryLink) 维护的 DeepSeek Harness 插件家族成员：**87 个活跃维护**，名册共 **95** 个，其中 **5 个已冻结**、**3 个已退役**。完整名单默认折叠，避免每个 README 的首屏被长表淹没；点击展开可查看每一行，原因见「状态」列。

<details>
<summary>展开全部 95 个插件</summary>

| 插件 | 一句话 | 状态 |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 已退役 — 见仓库 README |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 已冻结 — 见仓库 README |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 已冻结 — 见仓库 README |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 已冻结 — 见仓库 README |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 已冻结 — 见仓库 README |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** | 应急演练脚本核对（按阶段、响应分级、指挥与资源要素核对脚本齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** | 环评导则适用性核对（按要素、导则名称与执行标准核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** | 应急预案要素齐备性与条款级页码定位（依据 GB/T 29639-2020 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** | 作文量表评分核对（按评分项、原文定位与分值算术核对评分自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** | 证据清单齐备性核对（按待证事实与证据要素核对清单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** | 出口管制物项核对（按管制清单、最终用途与许可证核对台账齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** | FMEA 分析表要素齐备性与风险顺序数一致性核对（按公开的 FMEA 方法标准核对表内自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** | 预测准确率考核核对（按准确率、门槛与考核单价核对考核费用的算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** | 公文流转与办理时限核对（按公开的公文处理规范核对环节完整性与时限，仅提示差异，不作出定性结论） |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** | 公文格式要素核对（按公开的党政机关公文格式标准核对版头与主体要素，仅提示差异，不作出定性结论） |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** | 劳动保护与安全防护用品配置表核对（按公开的配备标准核对品名规格与配置数量，仅提示差异，不作出定性结论） |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** | 危险化学品临界量与重大危险源辨识核对（按储存量与临界量核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** | HAZOP 分析表要素齐备性与偏差推导一致性核对（依据公开的危险与可操作性分析标准，仅提示差异，不作出定性结论） |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** | 安全隐患台账→《工贸企业重大事故隐患判定标准》（应急管理部令第10号）条款映射提示（仅提示差异，不作出定性结论） |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** | 商品归类层级一致性核对（按章、品目、子目与商品编号的层级关系核对自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** | ICD 合并编码与星剑号配对提示（依据 GB/T 14396-2016 与公开的 ICD 使用说明，仅提示差异，不作出定性结论） |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** | 法条引用与文书要素核对（按名称、条号、原文与效力状态核对引用可核验性，仅提示差异，不作出定性结论） |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** | 信用证单据条款核对（按单据种类、份数、期限与不符点核对交单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** | 能力差距与培养计划核对（按能力等级差、培养措施与完成期限核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** | 病案首页形式质控与逻辑矛盾提示（依据国卫办医发〔2016〕24号等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** | 国家自然科学基金申请书形式审查与匿名化提示（依据《国家自然科学基金条例》与申请人导入的当年指南，仅提示差异，不作出定性结论） |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** | 护理记录时限、签名与评估表完整性校验（依据《病历书写基本规范》等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** | 原产地区域价值成分核对（按 RVC 定义式与门槛核对原产地判定自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** | 在线点评回复台账核对（按回复时限、问题分类与整改状态核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** | 试卷解析结构核对（按题型、答案、分值与 yotta 标识核对试卷结构自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** | 行政许可办理核对（按申请材料、法定时限与决定记录核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** | 项目全流程文件链条核对（按环节先后与金额口径核对链条自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** | 起诉状要素齐备性核对（按诉请、事实、证据、法条四要素核对文书齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** | 政策专报要素核对（按观点、依据、出处与建议核对专报齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** | 线损电量拆分与考核表核对（依据公开的线损计算口径，仅提示差异，不作出定性结论） |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** | 电力工作票要素齐备性与签发许可顺序核对（依据现行电力安全工作规程，仅提示差异，不作出定性结论） |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** | PPAP 提交要素齐备性核对（按公开的 PPAP 手册与提交等级核对要素齐备与版本填写，仅提示差异，不作出定性结论） |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** | 质疑与投诉期限核对（按公开的政府采购质疑投诉规定核对期限与台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** | 铁路施工天窗台账核对（按时间窗、时长算术与命令号核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 已冻结 — 见仓库 README |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 已退役 — 见仓库 README |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 已退役 — 见仓库 README |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** | 招标文件条款摘录核对（按出处与原文逐字核对摘录完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** | 评标因素评分矩阵核对（按分值上限与合计核对矩阵自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** | 质保期与索赔金额核对（按质保期月数与里程、索赔金额算式核对自洽，仅提示差异，不作出定性结论） |  |

</details>

</details>

</details>

## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors

### 从 DSH Desktop 市场安装

所有 PerryLink 插件均可在 DSH Desktop 内置市场中浏览：**市场 → 来源 → 添加来源 → 粘贴** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ 选中**。安装仍需通过市场的 npm 身份校验与你的确认。
