<div align="center">

# 🛡️ dsh-defend
- **Canal 1024 store**: `npm i -g dsh1024` uma vez, depois `dsh1024 plugin --profile web add dsh-defend` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

**Defesa contra injeção de prompts, jailbreak e vazamento de segredos para o DeepSeek Harness.**

*Regras decidem o conhecido. A interceptação decide o resto — e tudo fica auditado.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-defend)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-defend.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-defend/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-defend/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-defend?label=version)](https://github.com/PerryLink/dsh-defend/releases)
[![npm version](https://img.shields.io/npm/v/dsh-defend)](https://www.npmjs.com/package/dsh-defend)
[![npm downloads](https://img.shields.io/npm/dm/dsh-defend)](https://www.npmjs.com/package/dsh-defend)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

## Compatibilidade

| Superfície | Status |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-alpha.1` (verificado em 2026-09-22; intervalos de peer `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0`). Nesta linha o terceiro argumento de `Session.append` existe apenas para tipos de superfície e é um `SurfaceIntent`, então o tipo não-superfície `defend/detection` continua sem poder estampar o marcador `ignorable`: a auditoria do log de sessão permanece desabilitada fail-closed e o `/defend` mostra esse estado explicitamente. O formato de sessão V4 não tem mais bloco de conteúdo `tool-result` — este plugin nunca o produziu, e seus dois walkers de conteúdo mantêm um fallback **somente leitura** para o wrapper V3 aposentado, de modo que sessões gravadas antes da atualização continuam sendo analisadas. Verificado em 2026-09-22 (typecheck duplo + suíte completa + build + portas self-contained/artifacts + pack; uma única cópia do grafo de tipos do host). |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Todas (somente host; sem código nativo, sem rede) |
| Modelo | Qualquer (a detecção ocorre antes de o conteúdo chegar ao modelo) |

## O que você ganha

O `dsh-defend` coloca duas camadas independentes diante do agente:

1. **Guarda de exclusão destrutiva** — a forma executável da lição do postmortem 8·14/8·16. Em `tools/pre-execute`, comandos de shell que apagam recursivamente são recusados a menos que **cada** alvo seja um caminho absoluto explícito dentro do workspace da sessão e fora dos prefixos protegidos (configuração do home, `.dsh`/`.claude`, diretórios do sistema). Marcadores de dry-run (`-WhatIf`, `--dry-run`, `git clean -n`) passam, porque são exatamente a verificação que a lição exige.
2. **Camada de detecção** — portada de quatro ativos upstream (todos Apache-2.0, veja THIRD_PARTY_NOTICES.md): 25 regras do Prompt-Injection-Payloads, 25 padrões do Jailbreak-Detector por um autômato Aho-Corasick em TypeScript puro, 12 gramáticas de segredos do Secret-Key-Leaker-Detect mais as referências públicas dos emissores, e o Prompt-Attack-Dataset mantido literalmente como referência de regressão.

Três pontos de interceptação, um modelo de decisão:

| Ponto | Conteúdo escaneado | Decisão |
|---|---|---|
| `agent/pre-step` | mensagens de entrada | allow → `next()`; ask → aprovação; block → rejeitar o passo |
| `tools/pre-execute` | argumentos de ferramentas | allow → `next()`; ask → aprovação; block → deny |
| `tools/post-execute` | resultados de ferramentas | allow → `next()`; ask → aprovação; block → feedback corretivo |

Padrões: `ask` para cada família, `block` para segredos **critical** (a semântica de interrupção imediata do upstream). Sem respondedor de aprovação = falha fechada. Todo repasse chama `next()` — plugins de política a jusante nunca são curto-circuitados.

## Início rápido

```sh
# 1. instale o bundle no seu perfil
dsh plugin --profile web add "github:PerryLink/dsh-defend#main"

# ou pelo npm (versões publicadas)
dsh plugin --profile web add dsh-defend

# 2. reinicie e verifique a linha
dsh --profile web --dump-config | grep -A3 'id: dsh-defend'
```

## Instalação e desinstalação

- **Canal git** (último `main`): `dsh plugin --profile web add "github:PerryLink/dsh-defend#main"` — o script `prepare` compila apenas com dependências de produção.
- **Canal npm** (versões publicadas): `dsh plugin --profile web add dsh-defend`.
- **Canal tarball**: `pnpm pack` neste repositório e então `dsh plugin --profile web add ./dsh-defend-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-defend` (ou remova a linha do patch do perfil).

## Configuração

Todos os ajustes são campos `Config` do Schemastery (alteráveis pelo cordis.yml). Uma sobrescrita direcionada por id substitui a linha inteira — redeclare cada chave. O `cordis.patch.yml` documenta cada chave em linha.

| Chave | Padrão | Significado |
|---|---|---|
| `enabled` | `true` | Interruptor mestre das duas camadas |
| `action` | `deny` | Ação da guarda de exclusão destrutiva (`deny` / `ask`) |
| `toolNames` | `['bash','persistent-bash','terminal-bash']` | Ferramentas cujos argumentos a guarda revisa |
| `detection.enabled` | `true` | Interruptor da camada de detecção |
| `detection.maxScanChars` | `10000` | Limite de escaneamento por interceptação (somente a cabeça) |
| `detection.normalizeUnicode` | `true` | Normalizar NFKC o texto antes de escanear (bloqueia o bypass de Unicode lookalike) |
| `detection.secretMinEntropy` | `3.0` | Entropia de Shannon mínima (bits/caractere) para admitir um acerto de segredo; `0` desativa |
| `detection.injectionAction` | `ask` | Família injeção: `allow` / `ask` / `block` |
| `detection.jailbreakAction` | `ask` | Família jailbreak: `allow` / `ask` / `block` |
| `detection.secretAction` | `ask` | Família segredos: `allow` / `ask` / `block` |
| `detection.secretBlockCritical` | `true` | Segredos critical sempre bloqueiam, independente de `secretAction` |
| `detection.audit` | `true` | Gravar eventos de auditoria `defend/detection` |
| `detection.allowUnmarkedAudit` | `false` | Continuar gravando auditoria de sessão em hosts cujo `Session.append` é anterior ao marcador `ignorable` (todas as linhas publicadas até agora), aceitando o risco de sessões irrecuperáveis |
| `detection.maxReportEntries` | `200` | Limite do buffer circular em memória |
| `registerCommand` | `true` | Registrar o comando `/defend` |
| `registerTool` | `true` | Registrar a ferramenta `defend_report` |

## Ferramentas e superfícies

| Superfície | Tipo | Notas |
|---|---|---|
| `defend_report` | ferramenta | Totais (registrados/bloqueados/perguntados), contagens por família e as 20 correspondências mais recentes — nunca texto coincidente |
| `/defend` | comando | O mesmo resumo em texto |
| `agent/pre-step` | listener | Escaneamento de mensagens de entrada (enter/reject) |
| `tools/pre-execute` | listener | Escaneamento de argumentos (deny/ask) + a guarda de exclusão destrutiva |
| `tools/post-execute` | listener | Escaneamento de resultados (feedback de bloqueio) |

## Permissões e dados

- **Permissões**: decisões `ask` seguem a costura oficial de aprovação; nada é reimplementado ou contornado. O plugin declara `session:append` e `network:none` no seu manifesto de workshop.
- **Dados**: nada é gravado em disco; o buffer circular do relatório vive em memória e é limitado. Sem requisições de rede, sem subprocessos.
- **Registro de sessão**: eventos `defend/detection` carregam id da regra, família, categoria, severidade, tipo de segredo, decisão e fatos do escaneamento — texto coincidente nunca chega ao registro, e correspondências de segredos são somente-tipo por construção.

## Limites de segurança

- **Detecção, não execução.** A guarda e a camada de detecção apenas produzem decisões deny/ask/block nas costuras oficiais; o sandbox e os sistemas de aprovação continuam sendo a autoridade de execução.
- **Falha fechada.** Sem respondedor de aprovação, sem sessão ou sem superfície de serviços, degrada para a decisão mais estrita — nunca para o repasse silencioso.
- **Nenhum conteúdo sai do processo.** O escaneamento é local; eventos de auditoria são sanitizados; segredos nunca são registrados, exibidos ou reportados.
- **Trabalho limitado.** Limites de escaneamento, uma correspondência por regra e cotas do buffer circular impedem que entradas hostis consumam recursos sem limite.

## Limitações conhecidas

- **Lacunas de detecção.** A biblioteca de regras cobre os vocabulários portados e suas variantes tolerantes; frases novas, codificações Unicode lookalike (a normalização NFKC está como trabalho futuro) e ataques multi-passo podem escapar. A referência fixa o piso medido (27/28 no dataset upstream) para que regressões fiquem visíveis.
- **Sem veredictos no nível do modelo.** O `dsh-defend` é determinístico; nunca chama um modelo e não julga intenção nova.
- **A rejeição de mensagens é silenciosa.** O reject de `agent/pre-step` não leva razão ao modelo (a costura não tem campo de razão); o evento de auditoria registra os fatos da regra.
- **Auditoria de sessão e o marcador `ignorable`.** Os appends de auditoria solicitam o marcador `ignorable: true` do envelope para que qualquer build do harness consiga carregar o registro. Todas as linhas publicadas até agora (`0.1.0-rc.1`–`0.1.0-rc.8`, `0.1.1-rc.1`–`0.1.1-rc.2`) o descartam silenciosamente — o evento fica sem marcação e torna a sessão irrecuperável em builds mais estritos; o host `0.1.2-rc.1` mantém o campo do envelope apenas para compatibilidade de leitura de logs armazenados, mas o `Session.append` ainda não consegue estampá-lo e o caminho de leitura rejeita tipos de evento desconhecidos sem marcação (`defend/detection` não está registrado), então gravar lá também torna a sessão impossível de carregar. Portanto, o dsh-defend detecta esses hosts no primeiro uso (pré-checagem da versão do peer + sondagem do envelope devolvido) e desativa a auditoria do registro de sessão com um aviso único. Defina `detection.allowUnmarkedAudit: true` para reativar; linhas `defend/detection` existentes sem marcação podem ser reparadas adicionando `"ignorable": true` aos envelopes. Veja [issue #2](https://github.com/PerryLink/dsh-defend/issues/2).

## Desenvolvimento

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra o checkout local do harness
pnpm run typecheck:ci  # tsc contra os tipos publicados 0.1.7-alpha.1 (sem paths)
pnpm test           # vitest: 96 testes, 9 suítes (inclui a referência de detecção)
pnpm run build      # bundle tsdown + declarações tsc (lib/)
pnpm run verify:self-contained  # especificações de dependências resolvem pelo registry
pnpm run verify:artifacts       # face ESM construída + arquivos publicados presentes
pnpm pack           # o tarball publicado
```

### Benchmark

O benchmark red-team (P/R/F1 por categoria em 105 amostras, mais o piso 27/28 do fixture) está em [`benchmark/RESULTS.md`](benchmark/RESULTS.md); regenere-o com `node --experimental-strip-types benchmark/run.mjs` (zero dependências novas, sem build).

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor: guarda de exclusão destrutiva, portado de detecção de quatro ativos, fiação de interceptação, superfície de auditoria e a documentação em cinco idiomas.
- [@cuohua](https://github.com/cuohua) — o relatório preciso sobre eventos `defend/detection` gravados sem marcação tornando sessões irrecuperáveis em builds mais estritos ([#2](https://github.com/PerryLink/dsh-defend/issues/2)); a detecção de capacidade de host em runtime e a disciplina do marcador `ignorable` derivam diretamente dessa análise.

## PerryLink DSH Plugin Family

This project is one of the **45 DeepSeek Harness plugins** maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default | |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | DSH Desktop Market standard catalog source for the PerryLink family | |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` | |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers | |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit | |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | Community certification registry with repro-checkable grades and badges | |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins | |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill | |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins | |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card | |
| **[dsh-plugin-upgrade-015](https://github.com/PerryLink/dsh-plugin-upgrade-015)** | Merged `0.1.3-alpha.1` → `0.1.5-rc.1` upgrade corridor card plus a zero-dependency seam scanner | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. | |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools | |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. | |


## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink podem ser explorados no mercado integrado do DSH Desktop: **Market → Sources → add source → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua passando pela verificação de identidade npm do mercado e pela sua confirmação.
