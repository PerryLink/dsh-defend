<div align="center">

# 🛡️ dsh-defend

**Defensa contra inyección de prompts, jailbreak y fugas de secretos para DeepSeek Harness.**

*Las reglas deciden lo conocido. La intercepción decide el resto — y todo queda auditado.*

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

## Compatibilidad

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` (compatibilidad declarada para `0.1.0-rc.5`–`0.1.0-rc.6`) |
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
| `detection.injectionAction` | `ask` | Familia inyección: `allow` / `ask` / `block` |
| `detection.jailbreakAction` | `ask` | Familia jailbreak: `allow` / `ask` / `block` |
| `detection.secretAction` | `ask` | Familia secretos: `allow` / `ask` / `block` |
| `detection.secretBlockCritical` | `true` | Los secretos critical bloquean siempre, sin importar `secretAction` |
| `detection.audit` | `true` | Escribir eventos de auditoría `defend/detection` |
| `detection.allowUnmarkedAudit` | `false` | Seguir escribiendo auditoría de sesión en hosts cuyo `Session.append` es anterior al marcador `ignorable` (rc.1–rc.7), aceptando el riesgo de sesiones irrecuperables |
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
- **Auditoría de sesión y el marcador `ignorable`.** Los appends de auditoría solicitan el marcador `ignorable: true` del envelope para que cualquier build del harness pueda cargar el registro. Los hosts cuyo `Session.append` es anterior al marcador (las líneas publicadas `0.1.0-rc.1`–`0.1.0-rc.7`) lo descartan en silencio — el evento queda sin marcar y hace la sesión irrecuperable en builds más estrictos, por lo que dsh-defend detecta esos hosts en el primer uso (precomprobación de la versión del peer + sondeo del envelope devuelto) y desactiva la auditoría del registro de sesión con una advertencia única. Establece `detection.allowUnmarkedAudit: true` para reactivarla; las filas `defend/detection` existentes sin marcar pueden repararse añadiendo `"ignorable": true` a sus envelopes. Véase [issue #2](https://github.com/PerryLink/dsh-defend/issues/2).

## Desarrollo

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra el checkout local del harness
pnpm run typecheck:ci  # tsc contra los tipos publicados 0.1.0-rc.6 (sin paths)
pnpm test           # vitest: 49 tests, 4 suites (incluye la referencia de detección)
pnpm run build      # bundle tsdown + declaraciones tsc (lib/)
pnpm run verify:self-contained  # las especificaciones de dependencias resuelven desde el registry
pnpm run verify:artifacts       # cara ESM construida + archivos publicados presentes
pnpm pack           # el tarball publicado
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor: guardia de borrado destructivo, portado de detección de cuatro activos, cableado de intercepción, superficie de auditoría y la documentación en cinco idiomas.
- [@cuohua](https://github.com/cuohua) — el informe preciso sobre eventos `defend/detection` escritos sin marcar que hacen las sesiones irrecuperables en builds más estrictos ([#2](https://github.com/PerryLink/dsh-defend/issues/2)); la detección de capacidad de host en runtime y la disciplina del marcador `ignorable` derivan directamente de ese análisis.

## PerryLink DSH Plugin Family

Este proyecto es uno de los [29 complementos de DeepSeek Harness](https://github.com/PerryLink) mantenidos por [PerryLink](https://github.com/PerryLink). Si este te ayuda, los demás probablemente también:

| Plugin | One-liner |
|---|---|
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | Auto-revisión con segundo modelo en la cadena de aprobación, cerrado ante fallo por defecto |
| [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | Agentes secundarios en segundo plano y duraderos con barra lateral Web, mensajería e interrupción |
| [dsh-budget](https://github.com/PerryLink/dsh-budget) | Gobernanza de costes para DeepSeek Harness: presupuestos, carbono y latencia en un panel. |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Equivalente a /rewind de Claude Code: instantáneas, bifurcaciones y restauración de una vez |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | Migra sesiones, memoria, skills y CLAUDE.md de Claude Code a DSH |
| [dsh-click](https://github.com/PerryLink/dsh-click) | Control de escritorio nativo multiplataforma para DeepSeek Harness — Windows primero. |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Historial de entrada estilo terminal para el compositor web: flechas, búsqueda Ctrl+R |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Defensa contra inyección de prompts, jailbreak y fuga de secretos para DeepSeek Harness. |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | Guardia de disciplina de ingeniería: interrogatorio de requisitos, puertas de test, revisión adversaria |
| [dsh-draw](https://github.com/PerryLink/dsh-draw) | Enrutamiento unificado de generación de imágenes estáticas para DeepSeek Harness. |
| [dsh-fast](https://github.com/PerryLink/dsh-fast) | Diagnóstico de rendimiento de solo lectura para DeepSeek Harness. |
| [dsh-github](https://github.com/PerryLink/dsh-github) | Integración de PR/issues de GitHub para DSH, cada escritura con aprobación |
| [dsh-library](https://github.com/PerryLink/dsh-library) | Base de conocimiento documental local para DeepSeek Harness. |
| [dsh-local-ai](https://github.com/PerryLink/dsh-local-ai) | Integración de modelos locales (Ollama) para DeepSeek Harness. |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | Diagnóstico, formato, completado, acciones y renombrado LSP vía servidores de lenguaje |
| [dsh-mask](https://github.com/PerryLink/dsh-mask) | Middleware de enmascarado PII para DeepSeek Harness — anonimiza antes del modelo y restaura en la capa de visualización. |
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | Panel MCP de solo lectura: comando /mcp + pestaña de ajustes con estado, herramientas y errores |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | Memoria entre sesiones con puerta de aprobación: seam ctx.memory + SQLite + herramienta memory |
| [dsh-observe](https://github.com/PerryLink/dsh-observe) | Exportador de observabilidad OpenTelemetry y Langfuse para DeepSeek Harness. |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Cambio de estilos en tiempo de ejecución equivalente a outputStyles de Claude Code |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Reglas declarativas allow/deny/ask estilo Claude Code con auditoría |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | Base de conocimiento de desarrollo de complementos como skill de agente bajo demanda |
| [dsh-score](https://github.com/PerryLink/dsh-score) | Puntuación de calidad multidimensional para complementos de DeepSeek Harness. |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | Fija sesiones en la barra lateral Web con orden durable |
| [dsh-session-sync](https://github.com/PerryLink/dsh-session-sync) | Sincronización de sesiones entre dispositivos para DeepSeek Harness — un espejo git dedicado de tu almacén de sesiones. |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | Paquete de skills de auditoría de seguridad: escaneo de secretos, revisión de dependencias y cadena de suministro |
| [dsh-talk](https://github.com/PerryLink/dsh-talk) | Bucle de sesión con voz para DeepSeek Harness: háblale y escucha su respuesta. |
| [dsh-test-drive](https://github.com/PerryLink/dsh-test-drive) | Pruebas de instalación y arranque aisladas para complementos de DeepSeek Harness. |
| [dsh-translate](https://github.com/PerryLink/dsh-translate) | Traducción de parámetros entre proveedores y reparación determinista de JSON para DeepSeek Harness. |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors
