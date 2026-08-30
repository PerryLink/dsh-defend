<div align="center">

# 🛡️ dsh-defend
- **Canal 1024 store**: `npm i -g dsh1024` uma vez, depois `dsh1024 plugin --profile web add dsh-defend` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

**Defesa contra injeção de prompts, jailbreak e vazamento de segredos para o DeepSeek Harness.**

*Regras decidem o conhecido. A interceptação decide o resto — e tudo fica auditado.*

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

## Compatibilidade

| Superfície | Status |
|---|---|
| Harness | DeepSeek Harness `0.1.1-rc.2` (intervalos de peer `>=0.1.0-rc.8 <0.2.0`) |
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
- **Auditoria de sessão e o marcador `ignorable`.** Os appends de auditoria solicitam o marcador `ignorable: true` do envelope para que qualquer build do harness consiga carregar o registro. Todas as linhas publicadas até agora (`0.1.0-rc.1`–`0.1.0-rc.8`, `0.1.1-rc.1`–`0.1.1-rc.2`) o descartam silenciosamente — o evento fica sem marcação e torna a sessão irrecuperável em builds mais estritos, então o dsh-defend detecta esses hosts no primeiro uso (pré-checagem da versão do peer + sondagem do envelope devolvido) e desativa a auditoria do registro de sessão com um aviso único. Defina `detection.allowUnmarkedAudit: true` para reativar; linhas `defend/detection` existentes sem marcação podem ser reparadas adicionando `"ignorable": true` aos envelopes. Veja [issue #2](https://github.com/PerryLink/dsh-defend/issues/2).

## Desenvolvimento

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra o checkout local do harness
pnpm run typecheck:ci  # tsc contra os tipos publicados 0.1.1-rc.2 (sem paths)
pnpm test           # vitest: 75 testes, 8 suítes (inclui a referência de detecção)
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

Este projeto é um dos [33 plugins de DeepSeek Harness](https://github.com/PerryLink) mantidos por [PerryLink](https://github.com/PerryLink). Se este ajuda você, os outros provavelmente também:

| Plugin | One-liner |
|---|---|
| **[dsh-dsh-auto-review](https://github.com/PerryLink/dsh-dsh-auto-review)** | Auto-revisão de segundo modelo na cadeia de aprovação, com falha fechada por padrão | |
| **[dsh-dsh-background-agents](https://github.com/PerryLink/dsh-dsh-background-agents)** | Agentes filhos em segundo plano duráveis com barra lateral de UI web, mensagens e interrupção | |
| **[dsh-dsh-budget](https://github.com/PerryLink/dsh-dsh-budget)** | Governança de custos para DeepSeek Harness: orçamentos, carbono e latência em um painel. | |
| **[dsh-dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-dsh-checkpoint-rewind)** | Equivalente ao /rewind do Claude Code: instantâneos, bifurcações de sessão, restauração de uso único | |
| **[dsh-dsh-claude-move](https://github.com/PerryLink/dsh-dsh-claude-move)** | Migre sessões, memória, habilidades e CLAUDE.md do Claude Code para o DSH | |
| **[dsh-dsh-click](https://github.com/PerryLink/dsh-dsh-click)** | Controle de desktop nativo multiplataforma para DeepSeek Harness — Windows primeiro. | |
| **[dsh-dsh-composer-history](https://github.com/PerryLink/dsh-dsh-composer-history)** | Histórico de entrada estilo terminal para o compositor web: setas, busca Ctrl+R | |
| **[dsh-dsh-data-quality](https://github.com/PerryLink/dsh-dsh-data-quality)** | Verificações de qualidade de datasets e verificação de citações (a ponte numérica opcional consumida aqui) | |
| **[dsh-dsh-doublecheck](https://github.com/PerryLink/dsh-dsh-doublecheck)** | Guardião de disciplina de engenharia: sabatina de requisitos, portões de teste, revisão adversária | |
| **[dsh-dsh-draw](https://github.com/PerryLink/dsh-dsh-draw)** | Roteamento unificado de geração de imagens estáticas para DeepSeek Harness. | |
| **[dsh-dsh-fast](https://github.com/PerryLink/dsh-dsh-fast)** | Diagnóstico de desempenho só de leitura para DeepSeek Harness. | |
| **[dsh-dsh-fund-research](https://github.com/PerryLink/dsh-dsh-fund-research)** | Relatórios de pesquisa deterministas para fundos mútuos públicos chineses | |
| **[dsh-dsh-github](https://github.com/PerryLink/dsh-dsh-github)** | Integração de PR/issues do GitHub para o DSH, cada escrita controlada por aprovação | |
| **[dsh-dsh-industry-research](https://github.com/PerryLink/dsh-dsh-industry-research)** | Orquestração de pesquisa setorial que sela as suas entregas através do `ctx.researchReport.assemble` deste plugin | |
| **[dsh-dsh-library](https://github.com/PerryLink/dsh-dsh-library)** | Base de conhecimento documental local para DeepSeek Harness. | |
| **[dsh-dsh-local-ai](https://github.com/PerryLink/dsh-dsh-local-ai)** | Integração de modelos locais (Ollama) para DeepSeek Harness. | |
| **[dsh-dsh-lsp-actions](https://github.com/PerryLink/dsh-dsh-lsp-actions)** | Diagnósticos, formatação, autocompletar, ações de código e renomeação LSP sobre servidores de linguagem | |
| **[dsh-dsh-mask](https://github.com/PerryLink/dsh-dsh-mask)** | Middleware de mascaramento de PII: anonimiza no limite do modelo, restaura na camada de exibição | |
| **[dsh-dsh-mcp-panel](https://github.com/PerryLink/dsh-dsh-mcp-panel)** | Painel de tempo de execução MCP somente leitura: comando /mcp + aba Settings com status, ferramentas e erros | |
| **[dsh-dsh-memento](https://github.com/PerryLink/dsh-dsh-memento)** | Memória entre sessões controlada por aprovação: costura ctx.memory + SQLite + ferramenta de memória | |
| **[dsh-dsh-observe](https://github.com/PerryLink/dsh-dsh-observe)** | Exportador de observabilidade OpenTelemetry e Langfuse para DeepSeek Harness. | |
| **[dsh-dsh-output-styles](https://github.com/PerryLink/dsh-dsh-output-styles)** | Troca de estilo em tempo de execução equivalente ao outputStyles do Claude Code | |
| **[dsh-dsh-permission-rules](https://github.com/PerryLink/dsh-dsh-permission-rules)** | Regras de permissão declarativas allow/deny/ask estilo Claude Code com auditoria | |
| **[dsh-dsh-plugin-guide](https://github.com/PerryLink/dsh-dsh-plugin-guide)** | Base de conhecimento de desenvolvimento de plugins como habilidade de agente sob demanda | |
| **[dsh-dsh-research-report](https://github.com/PerryLink/dsh-dsh-research-report)** | Motor de relatórios de pesquisa verificáveis com evidência endereçada por conteúdo | |
| **[dsh-dsh-score](https://github.com/PerryLink/dsh-dsh-score)** | Pontuação de qualidade multidimensional para plugins de DeepSeek Harness. | |
| **[dsh-dsh-session-pin](https://github.com/PerryLink/dsh-dsh-session-pin)** | Fixe sessões na barra lateral web com ordenação durável | |
| **[dsh-dsh-session-sync](https://github.com/PerryLink/dsh-dsh-session-sync)** | Sincronização de sessões entre dispositivos para DeepSeek Harness — um espelho git dedicado do seu armazenamento de sessões. | |
| **[dsh-dsh-skill-pack-security](https://github.com/PerryLink/dsh-dsh-skill-pack-security)** | Pacote de habilidades de auditoria de segurança: varredura de segredos, revisão de dependências e cadeia de suprimentos | |
| **[dsh-dsh-talk](https://github.com/PerryLink/dsh-dsh-talk)** | Loop de sessão com voz para DeepSeek Harness: fale e ouça a resposta. | |
| **[dsh-dsh-test-drive](https://github.com/PerryLink/dsh-dsh-test-drive)** | Test drives isolados de instalação e smoke para plugins de DeepSeek Harness. | |
| **[dsh-dsh-translate](https://github.com/PerryLink/dsh-dsh-translate)** | Tradução de parâmetros entre fornecedores e reparo determinístico de JSON para DeepSeek Harness. | |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors
