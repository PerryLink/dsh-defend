<div align="center">

# 🛡️ dsh-defend

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
| Harness | DeepSeek Harness `0.1.0-rc.6` (compatibilidade declarada para `0.1.0-rc.5`–`0.1.0-rc.6`) |
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
| `detection.injectionAction` | `ask` | Família injeção: `allow` / `ask` / `block` |
| `detection.jailbreakAction` | `ask` | Família jailbreak: `allow` / `ask` / `block` |
| `detection.secretAction` | `ask` | Família segredos: `allow` / `ask` / `block` |
| `detection.secretBlockCritical` | `true` | Segredos critical sempre bloqueiam, independente de `secretAction` |
| `detection.audit` | `true` | Gravar eventos de auditoria `defend/detection` |
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
- **Auditoria de sessão em builds mais novos.** Os appends de auditoria usam a forma de dois argumentos de `Session.append` (os peers fixados rc.6 não têm opção de envelope); em builds pós-rc.6 os eventos são required-on-read, o que é correto enquanto o plugin estiver instalado, pois ele declara o tipo de evento.

## Desenvolvimento

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra o checkout local do harness
pnpm run typecheck:ci  # tsc contra os tipos publicados 0.1.0-rc.6 (sem paths)
pnpm test           # vitest: 49 testes, 4 suítes (inclui a referência de detecção)
pnpm run build      # bundle tsdown + declarações tsc (lib/)
pnpm run verify:self-contained  # especificações de dependências resolvem pelo registry
pnpm run verify:artifacts       # face ESM construída + arquivos publicados presentes
pnpm pack           # o tarball publicado
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor: guarda de exclusão destrutiva, portado de detecção de quatro ativos, fiação de interceptação, superfície de auditoria e a documentação em cinco idiomas.

## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors
