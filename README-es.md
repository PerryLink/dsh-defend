<div align="center">

# 🛡️ dsh-defend
- **Canal 1024 store**: `npm i -g dsh1024` una vez, luego `dsh1024 plugin --profile web add dsh-defend` (cuenta para el ranking de instalaciones de [deepseek1024.com](https://deepseek1024.com)).

**Defensa contra inyección de prompts, jailbreak y fugas de secretos para DeepSeek Harness.**

*Las reglas deciden lo conocido. La intercepción decide el resto — y todo queda auditado.*

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
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-defend?metric=downloads&lang=es)](https://dshfind.com/es/plugins/PerryLink/dsh-defend?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

## Compatibilidad

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-alpha.2` (verificado el 2026-09-22; rangos de peer `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`). En esta línea el tercer argumento de `Session.append` existe solo para tipos de superficie y es un `SurfaceIntent`, así que el tipo no-superficie `defend/detection` sigue sin poder estampar el marcador `ignorable`: la auditoría del log de sesión permanece deshabilitada fail-closed y `/defend` muestra ese estado explícitamente. El formato de sesión V4 ya no tiene bloque de contenido `tool-result` — este plugin nunca lo produjo, y sus dos recorredores de contenido conservan un respaldo de **solo lectura** para el envoltorio V3 retirado, de modo que las sesiones escritas antes de la actualización siguen analizándose. Verificado el 2026-09-22 (doble typecheck + suite completa + build + puertas self-contained/artifacts + pack; una sola copia del grafo de tipos del host). |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Todas (solo host; sin código nativo, sin red) |
| Modelo | Cualquiera (la detección ocurre antes de que el contenido llegue al modelo) |

## Qué obtienes

`dsh-defend` coloca dos capas independientes delante del agente:

1. **Guardia de borrado destructivo** — la forma ejecutable de la lección del postmortem 8·14/8·16. En `tools/pre-execute`, los comandos de shell que borran recursivamente se rechazan salvo que **cada** destino sea una ruta absoluta explícita dentro del espacio de trabajo de la sesión y fuera de los prefijos protegidos (configuración del home, `.dsh`/`.claude`, directorios del sistema). Los marcadores de dry-run (`-WhatIf`, `--dry-run`, `git clean -n`) pasan, porque son exactamente la verificación que la lección exige.
2. **Capa de detección** — portada de cuatro activos upstream (todos Apache-2.0, véase THIRD_PARTY_NOTICES.md): 25 reglas de Prompt-Injection-Payloads, 25 patrones de Jailbreak-Detector mediante un autómata Aho-Corasick en TypeScript puro, 12 gramáticas de secretos de Secret-Key-Leaker-Detect más las referencias públicas de los emisores, y el Prompt-Attack-Dataset conservado textualmente como referencia de regresión.

Tres puntos de intercepción, un mismo modelo de decisión:

| Punto | Contenido escaneado | Decisión |
|---|---|---|
| `agent/pre-step` | mensajes entrantes | allow → `next()`; ask → aprobación; block → rechazar el paso |
| `tools/pre-execute` | argumentos de herramientas | allow → `next()`; ask → aprobación; block → deny |
| `tools/post-execute` | resultados de herramientas | allow → `next()`; ask → aprobación; block → feedback correctivo |

Por defecto: `ask` para cada familia, `block` para secretos **critical** (la semántica de interrupción inmediata del upstream). Sin respondedor de aprobación = fallo cerrado. Todo paso a través llama a `next()` — los plugins de política aguas abajo nunca se cortocircuitan.

## Inicio rápido

```sh
# 1. instala el bundle en tu perfil
dsh plugin --profile web add "github:PerryLink/dsh-defend#main"

# o desde npm (versiones publicadas)
dsh plugin --profile web add dsh-defend

# 2. reinicia y verifica la fila
dsh --profile web --dump-config | grep -A3 'id: dsh-defend'
```

## Instalación y desinstalación

- **Canal git** (último `main`): `dsh plugin --profile web add "github:PerryLink/dsh-defend#main"` — el script `prepare` compila solo con dependencias de producción.
- **Canal npm** (versiones publicadas): `dsh plugin --profile web add dsh-defend`.
- **Canal tarball**: `pnpm pack` en este repositorio y luego `dsh plugin --profile web add ./dsh-defend-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-defend` (o elimina la fila del parche del perfil).

## Configuración

Todos los ajustes son campos `Config` de Schemastery (modificables desde cordis.yml). Una sobrescritura dirigida por id reemplaza toda la fila — vuelve a declarar cada clave. `cordis.patch.yml` documenta cada clave en línea.

| Clave | Por defecto | Significado |
|---|---|---|
| `enabled` | `true` | Interruptor maestro de ambas capas |
| `action` | `deny` | Acción de la guardia de borrado destructivo (`deny` / `ask`) |
| `toolNames` | `['bash','persistent-bash','terminal-bash']` | Nombres de herramientas cuyos argumentos revisa la guardia |
| `detection.enabled` | `true` | Interruptor de la capa de detección |
| `detection.maxScanChars` | `10000` | Límite de escaneo por intercepción (solo la cabeza) |
| `detection.normalizeUnicode` | `true` | Normalizar NFKC el texto antes de escanear (bloquea el bypass de Unicode lookalike) |
| `detection.secretMinEntropy` | `3.0` | Entropía de Shannon mínima (bits/carácter) para admitir un acierto de secreto; `0` desactiva |
| `detection.injectionAction` | `ask` | Familia inyección: `allow` / `ask` / `block` |
| `detection.jailbreakAction` | `ask` | Familia jailbreak: `allow` / `ask` / `block` |
| `detection.secretAction` | `ask` | Familia secretos: `allow` / `ask` / `block` |
| `detection.secretBlockCritical` | `true` | Los secretos critical bloquean siempre, sin importar `secretAction` |
| `detection.audit` | `true` | Escribir eventos de auditoría `defend/detection` |
| `detection.allowUnmarkedAudit` | `false` | Seguir escribiendo auditoría de sesión en hosts cuyo `Session.append` es anterior al marcador `ignorable` (todas las líneas publicadas hasta ahora), aceptando el riesgo de sesiones irrecuperables |
| `detection.maxReportEntries` | `200` | Límite del búfer circular en memoria |
| `registerCommand` | `true` | Registrar el comando `/defend` |
| `registerTool` | `true` | Registrar la herramienta `defend_report` |

## Herramientas y superficies

| Superficie | Tipo | Notas |
|---|---|---|
| `defend_report` | herramienta | Totales (registrados/bloqueados/preguntados), conteos por familia y las 20 coincidencias más recientes — nunca texto coincidente |
| `/defend` | comando | El mismo resumen como texto |
| `agent/pre-step` | listener | Escaneo de mensajes entrantes (enter/reject) |
| `tools/pre-execute` | listener | Escaneo de argumentos (deny/ask) + la guardia de borrado destructivo |
| `tools/post-execute` | listener | Escaneo de resultados (feedback de bloqueo) |

## Permisos y datos

- **Permisos**: las decisiones `ask` van por la costura oficial de aprobación; nada se reimplementa ni se esquiva. El plugin declara `session:append` y `network:none` en su manifiesto de workshop.
- **Datos**: nada se guarda en disco; el búfer circular del informe vive en memoria y está acotado. Sin peticiones de red, sin subprocesos.
- **Registro de sesión**: los eventos `defend/detection` llevan id de regla, familia, categoría, severidad, tipo de secreto, decisión y hechos del escaneo — el texto coincidente nunca llega al registro, y las coincidencias de secretos son solo de tipo por construcción.

## Límites de seguridad

- **Detección, no ejecución.** La guardia y la capa de detección solo producen decisiones deny/ask/block en las costuras oficiales; el sandbox y los sistemas de aprobación siguen siendo la autoridad de ejecución.
- **Fallo cerrado.** Sin respondedor de aprobación, sin sesión o sin superficie de servicios, se degrada a la decisión más estricta — nunca al paso silencioso.
- **Ningún contenido sale del proceso.** El escaneo es local; los eventos de auditoría están sanitizados; los secretos nunca se registran, muestran ni reportan.
- **Trabajo acotado.** Límites de escaneo, una coincidencia por regla y cotas del búfer circular impiden que entradas hostiles consuman recursos sin límite.

## Limitaciones conocidas

- **Huecos de detección.** La librería de reglas cubre los vocabularios portados y sus variantes tolerantes; frases nuevas, codificaciones Unicode lookalike (la normalización NFKC está como trabajo futuro) y ataques multi-paso pueden evadirla. La referencia fija el piso medido (27/28 en el dataset upstream) para que las regresiones sean visibles.
- **Sin veredictos a nivel de modelo.** `dsh-defend` es determinista; nunca llama a un modelo y no puede juzgar intención nueva.
- **El rechazo de mensajes es silencioso.** El reject de `agent/pre-step` no lleva razón al modelo (la costura no tiene campo de razón); el evento de auditoría registra los hechos de la regla.
- **Auditoría de sesión y el marcador `ignorable`.** Los appends de auditoría solicitan el marcador `ignorable: true` del envelope para que cualquier build del harness pueda cargar el registro. Todas las líneas publicadas hasta ahora (`0.1.0-rc.1`–`0.1.0-rc.8`, `0.1.1-rc.1`–`0.1.1-rc.2`) lo descartan en silencio — el evento queda sin marcar y hace la sesión irrecuperable en builds más estrictos; el host `0.1.2-rc.1` conserva el campo del envelope solo para compatibilidad de lectura de logs almacenados, pero `Session.append` sigue sin poder estamparlo y la ruta de lectura rechaza los tipos de evento desconocidos sin marcar (`defend/detection` no está registrado), de modo que escribir allí también hace la sesión incargable. Por eso, dsh-defend detecta esos hosts en el primer uso (precomprobación de la versión del peer + sondeo del envelope devuelto) y desactiva la auditoría del registro de sesión con una advertencia única. Establece `detection.allowUnmarkedAudit: true` para reactivarla; las filas `defend/detection` existentes sin marcar pueden repararse añadiendo `"ignorable": true` a sus envelopes. Véase [issue #2](https://github.com/PerryLink/dsh-defend/issues/2).

## Desarrollo

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra el checkout local del harness
pnpm run typecheck:ci  # tsc contra los tipos publicados 0.1.7-alpha.2 (sin paths)
pnpm test           # vitest: 96 tests, 9 suites (incluye la referencia de detección)
pnpm run build      # bundle tsdown + declaraciones tsc (lib/)
pnpm run verify:self-contained  # las especificaciones de dependencias resuelven desde el registry
pnpm run verify:artifacts       # cara ESM construida + archivos publicados presentes
pnpm pack           # el tarball publicado
```

### Benchmark

El benchmark red-team (P/R/F1 por categoría sobre 105 muestras, más el suelo 27/28 del fixture) está en [`benchmark/RESULTS.md`](benchmark/RESULTS.md); regenéralo con `node --experimental-strip-types benchmark/run.mjs` (cero dependencias nuevas, sin build).

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor: guardia de borrado destructivo, portado de detección de cuatro activos, cableado de intercepción, superficie de auditoría y la documentación en cinco idiomas.
- [@cuohua](https://github.com/cuohua) — el informe preciso sobre eventos `defend/detection` escritos sin marcar que hacen las sesiones irrecuperables en builds más estrictos ([#2](https://github.com/PerryLink/dsh-defend/issues/2)); la detección de capacidad de host en runtime y la disciplina del marcador `ignorable` derivan directamente de ese análisis.

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

### Instalar desde el mercado de DSH Desktop

Todos los plugins de PerryLink pueden explorarse en el mercado integrado de DSH Desktop: **Market → Sources → add source → pegar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ seleccionarlo**. La instalación sigue pasando por la verificación de identidad npm del mercado y tu confirmación.
