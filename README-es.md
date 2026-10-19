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

```sh
dsh plugin --profile <name> add dsh-defend
```


</div>

---


**📖 Base de conocimiento del ecosistema** — datos medidos, no marketing: [guía de desarrollo · datos de selección · criterios de mantenimiento](https://perrylink.github.io/dsh-plugin-guide/).

<!-- star-cta -->

## Instalación y desinstalación

- **Canal git** (último `main`): `dsh plugin --profile web add github:PerryLink/dsh-defend` — el script `prepare` compila solo con dependencias de producción.
- **Canal npm** (versiones publicadas): `dsh plugin --profile web add dsh-defend`.
- **Canal tarball**: `pnpm pack` en este repositorio y luego `dsh plugin --profile web add ./dsh-defend-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-defend` (o elimina la fila del parche del perfil).

## What is dsh-defend?

Defensa contra inyección de prompts, jailbreak y fugas de secretos para DeepSeek Harness.

Las reglas deciden lo conocido. La intercepción decide el resto — y todo queda auditado.

![Diagrama de flujo de dsh-defend: solicitud → política/revisión → veredicto.](docs/assets/dsh-defend-flow.svg)

*Resumen del flujo: solicitud → política/revisión → veredicto. Los ejemplos siguientes usan la superficie de comandos real.*


*La misma ejecución, animada.*

## Estado de mantenimiento: 🧊 CONGELADO

> **Congelado el 2026-10-05. Sin nuevas funciones.** Este paquete sigue funcionando y **no está retirado**, pero ya no recibe trabajo de funciones; solo se corregirá una avería real.

Los mantenedores consideran que en esta capacidad **ya existen alternativas con mejor adopción**, así que el esfuerzo se ha trasladado. Comparativa medida el 2026-10-05:

| | paquete | descargas semanales |
|---|---|---|
| **este paquete** | `dsh-defend` | 937 |
| alternativa mejor adoptada | [`cc-safety-net`](https://github.com/kenryu42/cc-safety-net) | **13,087** |

👉 **Para trabajo nuevo, prefiera `cc-safety-net`.** Este paquete sigue siendo el detector más amplio, pero está congelado y no recibirá nuevas funciones. Las instalaciones existentes siguen funcionando sin cambios.

*Evidencia completa: `dsh-plugin-supersession-review-20261005.md`. Texto completo en la sección **Maintenance status: 🧊 FROZEN** de [README.md](README.md).*

## ⭐ 如果它帮到了你

Este plugin forma parte de la [familia de plugins DSH](https://github.com/PerryLink) (más de 40, todos Apache-2.0). Si te resulta útil, **dale una estrella**: no desbloquea nada, pero ayuda a que la siguiente persona lo encuentre antes.

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## Comparison

![Gráfico comparativo medido de dsh-defend](https://raw.githubusercontent.com/PerryLink/dsh-defend/main/docs/assets/dsh-defend-evidence.png)

105 samples (75 positive / 30 negative) · from benchmark/RESULTS.md in this repo

## Compatibilidad

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (verificado el 2026-09-25; rangos de peer `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`). En esta línea el tercer argumento de `Session.append` existe solo para tipos de superficie y es un `SurfaceIntent`, así que el tipo no-superficie `defend/detection` sigue sin poder estampar el marcador `ignorable`: la auditoría del log de sesión permanece deshabilitada fail-closed y `/defend` muestra ese estado explícitamente. El formato de sesión V4 ya no tiene bloque de contenido `tool-result` — este plugin nunca lo produjo, y sus dos recorredores de contenido conservan un respaldo de **solo lectura** para el envoltorio V3 retirado, de modo que las sesiones escritas antes de la actualización siguen analizándose. Verificado el 2026-09-25 (doble typecheck + suite completa + build + puertas self-contained/artifacts + pack; una sola copia del grafo de tipos del host). |
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
dsh plugin --profile web add github:PerryLink/dsh-defend
```

```sh
# 1. instala el bundle en tu perfil
dsh plugin --profile web add github:PerryLink/dsh-defend

# o desde npm (versiones publicadas)
dsh plugin --profile web add dsh-defend

# 2. reinicia y verifica la fila
dsh --profile web --dump-config | grep -A3 'id: dsh-defend'
```

### Ejemplos

Son los puntos de entrada reales; instala y llama a uno.

#### Ejemplo detallado

**Comando**

~~~sh
defend_report
~~~

**Entrada**

~~~json
{}
~~~

**Salida**

~~~text
dsh-defend: 0 recorded detection(s), 0 blocked, 0 asked.
~~~

*Observado en `tests/lifecycle.spec.ts:91-126 (canonical empty value at :110-117); src/index.ts:772-775`*

#### Ejemplos breves

- `/defend`

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
| `detection.allowUnmarkedAudit` | `false` | Seguir escribiendo auditoría de sesión en hosts cuyo `Session.append` es anterior al marcador `ignorable` (todas las líneas publicadas hasta ahora, incluidas las versiones preliminares `0.2.x`), aceptando el riesgo de sesiones irrecuperables |
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
- **Auditoría de sesión y el marcador `ignorable`.** Los appends de auditoría solicitan el marcador `ignorable: true` del envelope para que cualquier build del harness pueda cargar el registro. Todas las líneas publicadas hasta ahora (`0.1.0-rc.1`–`0.1.0-rc.8`, `0.1.1-rc.1`–`0.1.1-rc.2`, y el corredor `0.2` — reverificado el 2026-10-04 contra la publicada `0.2.1-alpha.1`, cuyo `append(type, data, ...opts)` solo lee `sourceEventSeqs`/`surfaceOp` del paquete de opciones y arma el envelope como `{ type, seq, time, data }`) lo descartan en silencio — el evento queda sin marcar y hace la sesión irrecuperable en builds más estrictos; el host `0.1.2-rc.1` conserva el campo del envelope solo para compatibilidad de lectura de logs almacenados, pero `Session.append` sigue sin poder estamparlo y la ruta de lectura rechaza los tipos de evento desconocidos sin marcar (`defend/detection` no está registrado), de modo que escribir allí también hace la sesión incargable. Por eso, dsh-defend detecta esos hosts en el primer uso (precomprobación de la versión del peer + sondeo del envelope devuelto) y desactiva la auditoría del registro de sesión con una advertencia única; las versiones preliminares `0.2.x` se clasifican como no marcadas de antemano justamente por eso, mientras que una `0.2.x` estable sigue recurriendo al sondeo del append. Establece `detection.allowUnmarkedAudit: true` para reactivarla; las filas `defend/detection` existentes sin marcar pueden repararse añadiendo `"ignorable": true` a sus envelopes. Véase [issue #2](https://github.com/PerryLink/dsh-defend/issues/2).

## Desarrollo

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra el checkout local del harness
pnpm run typecheck:ci  # tsc contra los tipos publicados 0.1.7-rc.2 (sin paths)
pnpm test           # vitest: 97 tests, 9 suites (incluye la referencia de detección)
pnpm run build      # bundle tsdown + declaraciones tsc (lib/)
pnpm run verify:self-contained  # las especificaciones de dependencias resuelven desde el registry
pnpm run verify:artifacts       # cara ESM construida + archivos publicados presentes
pnpm pack           # el tarball publicado
```

### Benchmark

El benchmark red-team (P/R/F1 por categoría sobre 105 muestras, más el suelo 27/28 del fixture) está en [`benchmark/RESULTS.md`](benchmark/RESULTS.md); regenéralo con `node --experimental-strip-types benchmark/run.mjs` (cero dependencias nuevas, sin build).

## Interoperabilidad con otros plugins de DSH

Verificado contra **DSH `0.2.0-rc.2`** (el runtime para el que se publica este README) y el conjunto de plugins con más estrellas sondeado el 2026-10-05.

Este plugin **no interfiere** con otros plugins, incluidos los de más estrellas:

- **Sin colisión de nombres de herramienta.** Todas las herramientas llevan espacio de nombres; ninguna ocupa un nombre desnudo ya perteneciente a una herramienta incluida u otro plugin.
- **Sin colisión de clave de servicio.** No provee ninguna clave de servicio, así que no puede colisionar en una.
- **Sin colisión de slot.** No registra ninguna clave de slot de cliente, así que no disputa un asiento `shadows-shipped-ui`.
- **Sin colisión de ruta HTTP.** No registra ningún prefijo `webServer`.
- **Sin colisión en la capa de patch.** El patch del bundle solo hace `insert` de su propia fila; nunca sobrescribe el `config` de una fila incluida.
- **Sin mutación global.** No parchea prototipos, ni reescribe `process.env`, ni reemplaza el dispatcher global de fetch.

**Los listeners de eventos compartidos no interfieren por construcción.** Observa los eventos sensibles al orden `agent/pre-step`, `tools/post-execute`, `tools/pre-execute` con `ctx.on()` — el registro de difusión de Cordis, donde cada listener se ejecuta y ninguno puede dejar sin turno a otro. **Todos los listeners aquí delegan por `next()`**, así que la cadena nunca se cortocircuita:
  - `agent/pre-step` — also used by `dsh-routing-suite` (7000★, 7 listeners), `modlens` (4122★), `dsh-purge` (3317★), `dsh-agent-teams` (1923★), `dsh-context` (1849★).
  - `tools/post-execute` — also used by `cc-safety-net` (1576★).
  - `tools/pre-execute` — also used by `cc-safety-net` (1576★).

Evidencia estática: `dsh-plugin-doctor` K10–K13 dan `pass` en todas las comprobaciones de este repositorio.

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor: guardia de borrado destructivo, portado de detección de cuatro activos, cableado de intercepción, superficie de auditoría y la documentación en cinco idiomas.
- [@cuohua](https://github.com/cuohua) — el informe preciso sobre eventos `defend/detection` escritos sin marcar que hacen las sesiones irrecuperables en builds más estrictos ([#2](https://github.com/PerryLink/dsh-defend/issues/2)); la detección de capacidad de host en runtime y la disciplina del marcador `ignorable` derivan directamente de ese análisis.

## PerryLink DSH Plugin Family

Este proyecto forma parte de la familia de plugins de DeepSeek Harness de [PerryLink](https://github.com/PerryLink). El registro permanece plegado abajo para que cada README conserve una primera pantalla corta; expándelo para ver cada fila y su estado.

<details>
<summary>Expandir todos los plugins</summary>

| Plugin | Estado |
|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** |  |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** |  |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** |  |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** |  |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** |  |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** |  |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** |  |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** |  |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 RETIRADO — ver el README del repositorio |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 RETIRADO — ver el README del repositorio |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 RETIRADO — ver el README del repositorio |

</details>

## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors

### Instalar desde el mercado de DSH Desktop

Todos los plugins de PerryLink pueden explorarse en el mercado integrado de DSH Desktop: **Market → Sources → add source → pegar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ seleccionarlo**. La instalación sigue pasando por la verificación de identidad npm del mercado y tu confirmación.
