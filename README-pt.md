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
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-defend?metric=downloads&lang=pt)](https://dshfind.com/pt/plugins/PerryLink/dsh-defend?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-defend
```


</div>

---


**📖 Base de conhecimento do ecossistema** — dados medidos, não marketing: [guia de desenvolvimento · dados de seleção · critérios de manutenção](https://perrylink.github.io/dsh-plugin-guide/).

<!-- star-cta -->

## Instalação e desinstalação

- **Canal git** (último `main`): `dsh plugin --profile web add github:PerryLink/dsh-defend` — o script `prepare` compila apenas com dependências de produção.
- **Canal npm** (versões publicadas): `dsh plugin --profile web add dsh-defend`.
- **Canal tarball**: `pnpm pack` neste repositório e então `dsh plugin --profile web add ./dsh-defend-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-defend` (ou remova a linha do patch do perfil).

## What is dsh-defend?

Defesa contra injeção de prompts, jailbreak e vazamento de segredos para o DeepSeek Harness.

Regras decidem o conhecido. A interceptação decide o resto — e tudo fica auditado.

![Demonstração de terminal do dsh-defend: dsh-defend — install, then /defend and the red-team benchmark](https://raw.githubusercontent.com/PerryLink/dsh-defend/main/docs/assets/dsh-defend-hero.png)

![Animated terminal demo of dsh-defend](https://raw.githubusercontent.com/PerryLink/dsh-defend/main/docs/assets/dsh-defend-demo.gif)

*A mesma execução, animada.*

## Status de manutenção: 🧊 CONGELADO

> **Congelado em 2026-10-05. Sem novos recursos.** Este pacote continua funcionando e **não foi aposentado**, mas não recebe mais trabalho de recursos; apenas uma falha real será corrigida.

Os mantenedores consideram que nesta capacidade **já existem alternativas com melhor adoção**, então o esforço foi redirecionado. Comparação medida em 2026-10-05:

| | pacote | downloads semanais |
|---|---|---|
| **este pacote** | `dsh-defend` | 937 |
| alternativa mais adotada | [`cc-safety-net`](https://github.com/kenryu42/cc-safety-net) | **13,087** |

👉 **Para trabalho novo, prefira `cc-safety-net`.** Este pacote continua sendo o detector mais amplo, mas está congelado e não receberá novos recursos. As instalações existentes continuam funcionando sem alterações.

*Evidência completa: `dsh-plugin-supersession-review-20261005.md`. Texto completo na seção **Maintenance status: 🧊 FROZEN** de [README.md](README.md).*

## ⭐ 如果它帮到了你

Este plugin faz parte da [família de plugins DSH](https://github.com/PerryLink) (mais de 40, todos Apache-2.0). Se for útil, **deixe uma estrela**: não desbloqueia nada, mas ajuda a próxima pessoa a encontrá-lo.

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## Comparison

![Gráfico comparativo medido do dsh-defend](https://raw.githubusercontent.com/PerryLink/dsh-defend/main/docs/assets/dsh-defend-evidence.png)

105 samples (75 positive / 30 negative) · from benchmark/RESULTS.md in this repo

## Compatibilidade

| Superfície | Status |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (verificado em 2026-09-25; intervalos de peer `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`). Nesta linha o terceiro argumento de `Session.append` existe apenas para tipos de superfície e é um `SurfaceIntent`, então o tipo não-superfície `defend/detection` continua sem poder estampar o marcador `ignorable`: a auditoria do log de sessão permanece desabilitada fail-closed e o `/defend` mostra esse estado explicitamente. O formato de sessão V4 não tem mais bloco de conteúdo `tool-result` — este plugin nunca o produziu, e seus dois walkers de conteúdo mantêm um fallback **somente leitura** para o wrapper V3 aposentado, de modo que sessões gravadas antes da atualização continuam sendo analisadas. Verificado em 2026-09-25 (typecheck duplo + suíte completa + build + portas self-contained/artifacts + pack; uma única cópia do grafo de tipos do host). |
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
dsh plugin --profile web add github:PerryLink/dsh-defend
```

```sh
# 1. instale o bundle no seu perfil
dsh plugin --profile web add github:PerryLink/dsh-defend

# ou pelo npm (versões publicadas)
dsh plugin --profile web add dsh-defend

# 2. reinicie e verifique a linha
dsh --profile web --dump-config | grep -A3 'id: dsh-defend'
```

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
- **Auditoria de sessão e o marcador `ignorable`.** Os appends de auditoria solicitam o marcador `ignorable: true` do envelope para que qualquer build do harness consiga carregar o registro. Todas as linhas publicadas até agora (`0.1.0-rc.1`–`0.1.0-rc.8`, `0.1.1-rc.1`–`0.1.1-rc.2`, e o corredor `0.2` — reverificado em 2026-10-04 contra a publicada `0.2.1-alpha.1`, cujo `append(type, data, ...opts)` lê apenas `sourceEventSeqs`/`surfaceOp` do pacote de opções e monta o envelope como `{ type, seq, time, data }`) o descartam silenciosamente — o evento fica sem marcação e torna a sessão irrecuperável em builds mais estritos; o host `0.1.2-rc.1` mantém o campo do envelope apenas para compatibilidade de leitura de logs armazenados, mas o `Session.append` ainda não consegue estampá-lo e o caminho de leitura rejeita tipos de evento desconhecidos sem marcação (`defend/detection` não está registrado), então gravar lá também torna a sessão impossível de carregar. Portanto, o dsh-defend detecta esses hosts no primeiro uso (pré-checagem da versão do peer + sondagem do envelope devolvido) e desativa a auditoria do registro de sessão com um aviso único; os pré-lançamentos `0.2.x` são classificados como não marcados de antemão exatamente por isso, enquanto uma `0.2.x` estável continua recorrendo à sondagem do append. Defina `detection.allowUnmarkedAudit: true` para reativar; linhas `defend/detection` existentes sem marcação podem ser reparadas adicionando `"ignorable": true` aos envelopes. Veja [issue #2](https://github.com/PerryLink/dsh-defend/issues/2).

## Desenvolvimento

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra o checkout local do harness
pnpm run typecheck:ci  # tsc contra os tipos publicados 0.1.7-rc.2 (sem paths)
pnpm test           # vitest: 97 testes, 9 suítes (inclui a referência de detecção)
pnpm run build      # bundle tsdown + declarações tsc (lib/)
pnpm run verify:self-contained  # especificações de dependências resolvem pelo registry
pnpm run verify:artifacts       # face ESM construída + arquivos publicados presentes
pnpm pack           # o tarball publicado
```

### Benchmark

O benchmark red-team (P/R/F1 por categoria em 105 amostras, mais o piso 27/28 do fixture) está em [`benchmark/RESULTS.md`](benchmark/RESULTS.md); regenere-o com `node --experimental-strip-types benchmark/run.mjs` (zero dependências novas, sem build).

## Interoperabilidade com outros plugins do DSH

Verificado contra **DSH `0.2.0-rc.2`** (o runtime para o qual este README é publicado) e o conjunto de plugins com mais estrelas pesquisado em 2026-10-05.

Este plugin **não interfere** em outros plugins, incluindo os de mais estrelas:

- **Sem colisão de nome de ferramenta.** Todas as ferramentas têm namespace; nenhuma ocupa um nome puro já pertencente a uma ferramenta embutida ou a outro plugin.
- **Sem colisão de chave de serviço.** Não fornece nenhuma chave de serviço, portanto não pode colidir em uma.
- **Sem colisão de slot.** Não registra nenhuma chave de slot de cliente, então não disputa um assento `shadows-shipped-ui`.
- **Sem colisão de rota HTTP.** Não registra nenhum prefixo `webServer`.
- **Sem colisão na camada de patch.** O patch do bundle apenas faz `insert` da própria linha; nunca sobrescreve o `config` de uma linha embutida.
- **Sem mutação global.** Não altera protótipos, não reescreve `process.env` nem substitui o dispatcher global de fetch.

**Listeners de eventos compartilhados não interferem por construção.** Observa os eventos sensíveis à ordem `agent/pre-step`, `tools/post-execute`, `tools/pre-execute` com `ctx.on()` — o registro de difusão do Cordis, onde cada listener executa e nenhum pode privar outro do turno. **Todos os listeners aqui delegam via `next()`**, então a cadeia nunca é curto-circuitada:
  - `agent/pre-step` — also used by `dsh-routing-suite` (7000★, 7 listeners), `modlens` (4122★), `dsh-purge` (3317★), `dsh-agent-teams` (1923★), `dsh-context` (1849★).
  - `tools/post-execute` — also used by `cc-safety-net` (1576★).
  - `tools/pre-execute` — also used by `cc-safety-net` (1576★).

Evidência estática: `dsh-plugin-doctor` K10–K13 retornam `pass` em todas as verificações deste repositório.

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor: guarda de exclusão destrutiva, portado de detecção de quatro ativos, fiação de interceptação, superfície de auditoria e a documentação em cinco idiomas.
- [@cuohua](https://github.com/cuohua) — o relatório preciso sobre eventos `defend/detection` gravados sem marcação tornando sessões irrecuperáveis em builds mais estritos ([#2](https://github.com/PerryLink/dsh-defend/issues/2)); a detecção de capacidade de host em runtime e a disciplina do marcador `ignorable` derivam diretamente dessa análise.

## PerryLink DSH Plugin Family

Este projeto é um dos **87 plugins ativamente mantidos** do DeepSeek Harness da [PerryLink](https://github.com/PerryLink). O registro da família tem **95** plugins — **5 congelados**, **3 retirados** — e fica recolhido abaixo para que cada README mantenha uma primeira tela curta. Expanda para ver cada linha, com o motivo na coluna Status.

<details>
<summary>Expandir os 95 plugins</summary>

| Plugin | Uma linha | Status |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 CONGELADO — ver o README do repositório |
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
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** | 招标文件条款摘录核对（按出处与原文逐字核对摘录完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** | 评标因素评分矩阵核对（按分值上限与合计核对矩阵自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** | 质保期与索赔金额核对（按质保期月数与里程、索赔金额算式核对自洽，仅提示差异，不作出定性结论） |  |

</details>

</details>

</details>## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink podem ser explorados no mercado integrado do DSH Desktop: **Market → Sources → add source → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua passando pela verificação de identidade npm do mercado e pela sua confirmação.
