<div align="center">

# 🛡️ dsh-defend
- **1024 स्टोर चैनल**: एक बार `npm i -g dsh1024`, फिर `dsh1024 plugin --profile web add dsh-defend` ([deepseek1024.com](https://deepseek1024.com) इंस्टॉल रैंकिंग में गिना जाता है)।

**DeepSeek Harness के लिए प्रॉम्प्ट-इंजेक्शन, जेलब्रेक और सीक्रेट-लीक सुरक्षा।**

*नियम ज्ञात को तय करते हैं। बाकी को इंटरसेप्शन तय करता है — और सब कुछ ऑडिटेड रहता है।*

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
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-defend?metric=downloads&lang=hi)](https://dshfind.com/hi/plugins/PerryLink/dsh-defend?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

## संगतता

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-rc.1` (2026-09-24 को सत्यापित; peer रेंज `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`)। इस लाइन पर `Session.append` का तीसरा पैरामीटर केवल सरफ़ेस-योग्य प्रकारों के लिए है और वह `SurfaceIntent` है, इसलिए गैर-सरफ़ेस `defend/detection` अब भी `ignorable` मार्कर स्टैम्प नहीं कर सकता: सत्र-लॉग ऑडिट fail-closed रूप से बंद रहता है और `/defend` वह स्थिति स्पष्ट रूप से दिखाता है। सत्र प्रारूप V4 में `tool-result` कंटेंट ब्लॉक अब नहीं है — यह प्लगइन उसे कभी बनाता नहीं था, और इसके दो कंटेंट वॉकर सेवानिवृत्त V3 रैपर के लिए **केवल-पढ़ने** का फ़ॉलबैक रखते हैं, ताकि अपग्रेड से पहले लिखे गए सत्र अब भी स्कैन हों। 2026-09-24 को सत्यापित (दोहरा typecheck + पूरी टेस्ट सूट + build + self-contained/artifacts गेट + pack; होस्ट टाइप ग्राफ़ की एक ही प्रति)। |
| Node | `^22.19.0 \|\| >=24.0.0` |
| प्लेटफ़ॉर्म | सभी (केवल host; कोई नेटिव कोड नहीं, कोई नेटवर्क नहीं) |
| मॉडल | कोई भी (पहचान मॉडल तक सामग्री पहुँचने से पहले होती है) |

## आपको क्या मिलता है

`dsh-defend` एजेंट के सामने दो स्वतंत्र परतें रखता है:

1. **विनाशकारी-डिलीट गार्ड** — 8·14/8·16 पोस्टमॉर्टम सबक का निष्पादन योग्य रूप। `tools/pre-execute` पर, पुनरावर्ती रूप से हटाने वाले शेल कमांड तब तक अस्वीकार होते हैं जब तक **हर** लक्ष्य सत्र कार्यक्षेत्र के भीतर एक स्पष्ट निरपेक्ष पथ न हो और संरक्षित उपसर्गों (होम कॉन्फ़िग, `.dsh`/`.claude`, सिस्टम निर्देशिकाएँ) से बाहर न हो। dry-run चिह्न (`-WhatIf`, `--dry-run`, `git clean -n`) पास होते हैं — वे ठीक वही जाँच हैं जो सबक माँगता है।
2. **पहचान परत** — चार अपस्ट्रीम परिसंपत्तियों से पोर्टेड (सभी Apache-2.0, देखें THIRD_PARTY_NOTICES.md): 25 Prompt-Injection-Payloads नियम, शुद्ध-TypeScript Aho-Corasick ऑटोमेटन पर 25 Jailbreak-Detector पैटर्न, Secret-Key-Leaker-Detect व जारीकर्ताओं के सार्वजनिक संदर्भों से 12 सीक्रेट व्याकरण, और Prompt-Attack-Dataset को रिग्रेशन बेंचमार्क के रूप में जस का तस रखा गया।

तीन इंटरसेप्शन बिंदु, एक निर्णय मॉडल:

| बिंदु | स्कैन की गई सामग्री | निर्णय |
|---|---|---|
| `agent/pre-step` | आवक संदेश | allow → `next()`; ask → स्वीकृति; block → चरण अस्वीकार |
| `tools/pre-execute` | टूल तर्क | allow → `next()`; ask → स्वीकृति; block → deny |
| `tools/post-execute` | टूल परिणाम | allow → `next()`; ask → स्वीकृति; block → सुधारात्मक फ़ीडबैक |

डिफ़ॉल्ट: हर परिवार के लिए `ask`, **critical** सीक्रेट के लिए `block` (अपस्ट्रीम की तुरंत-बाधित शैली)। कोई स्वीकृति उत्तरदाता नहीं = fail closed। हर पास-थ्रू `next()` बुलाता है — डाउनस्ट्रीम नीति प्लगइन कभी शॉर्ट-सर्किट नहीं होते।

## त्वरित शुरुआत

```sh
# 1. बंडल को अपने प्रोफ़ाइल में इंस्टॉल करें
dsh plugin --profile web add "github:PerryLink/dsh-defend#main"

# या npm से (प्रकाशित रिलीज़)
dsh plugin --profile web add dsh-defend

# 2. पुनः आरंभ करें और पंक्ति सत्यापित करें
dsh --profile web --dump-config | grep -A3 'id: dsh-defend'
```

## इंस्टॉल और अनइंस्टॉल

- **git चैनल** (नवीनतम `main`): `dsh plugin --profile web add "github:PerryLink/dsh-defend#main"` — `prepare` स्क्रिप्ट केवल प्रोडक्शन निर्भरताओं से बिल्ड करती है।
- **npm चैनल** (प्रकाशित रिलीज़): `dsh plugin --profile web add dsh-defend`।
- **tarball चैनल**: इस रेपो में `pnpm pack`, फिर `dsh plugin --profile web add ./dsh-defend-<version>.tgz`।
- **अनइंस्टॉल**: `dsh plugin --profile web remove dsh-defend` (या प्रोफ़ाइल पैच से पंक्ति हटाएँ)।

## कॉन्फ़िगरेशन

सभी समायोजन Schemastery `Config` फ़ील्ड हैं (cordis.yml से बदले जा सकते हैं)। id-लक्षित ओवरराइड पूरी पंक्ति बदल देता है — ज़रूरत की हर कुंजी फिर से लिखें। `cordis.patch.yml` हर कुंजी को इनलाइन समझाता है।

| कुंजी | डिफ़ॉल्ट | अर्थ |
|---|---|---|
| `enabled` | `true` | दोनों परतों का मुख्य स्विच |
| `action` | `deny` | विनाशकारी-डिलीट गार्ड क्रिया (`deny` / `ask`) |
| `toolNames` | `['bash','persistent-bash','terminal-bash']` | वे टूल नाम जिनके तर्क गार्ड समीक्षा करता है |
| `detection.enabled` | `true` | पहचान परत स्विच |
| `detection.maxScanChars` | `10000` | प्रति इंटरसेप्शन स्कैन सीमा (केवल शीर्ष) |
| `detection.normalizeUnicode` | `true` | स्कैन से पहले टेक्स्ट को NFKC-सामान्यीकृत करें (lookalike-Unicode बायपास रोकता है) |
| `detection.secretMinEntropy` | `3.0` | सीक्रेट हिट स्वीकारने हेतु न्यूनतम Shannon एंट्रॉपी (bits/char); `0` अक्षम करता है |
| `detection.injectionAction` | `ask` | इंजेक्शन परिवार: `allow` / `ask` / `block` |
| `detection.jailbreakAction` | `ask` | जेलब्रेक परिवार: `allow` / `ask` / `block` |
| `detection.secretAction` | `ask` | सीक्रेट परिवार: `allow` / `ask` / `block` |
| `detection.secretBlockCritical` | `true` | critical सीक्रेट `secretAction` की परवाह किए बिना हमेशा block |
| `detection.audit` | `true` | `defend/detection` सत्र ऑडिट इवेंट लिखें |
| `detection.allowUnmarkedAudit` | `false` | ऐसे होस्ट पर सत्र ऑडिट लिखना जारी रखें जिनका `Session.append` `ignorable` मार्कर से पुराना है (अब तक की सभी प्रकाशित लाइनें), अप्राप्य सत्र का जोखिम स्वीकार करते हुए |
| `detection.maxReportEntries` | `200` | मेमोरी में रिंग-बफ़र सीमा |
| `registerCommand` | `true` | `/defend` कमांड पंजीकृत करें |
| `registerTool` | `true` | `defend_report` टूल पंजीकृत करें |

## टूल और सतहें

| सतह | प्रकार | टिप्पणियाँ |
|---|---|---|
| `defend_report` | टूल | योग (दर्ज/ब्लॉक/पूछे), प्रति-परिवार गिनती और हाल की 20 पहचान — कभी मिलान टेक्स्ट नहीं |
| `/defend` | कमांड | वही सारांश टेक्स्ट रूप में |
| `agent/pre-step` | श्रोता | आवक संदेश स्कैन (enter/reject) |
| `tools/pre-execute` | श्रोता | तर्क स्कैन (deny/ask) + विनाशकारी-डिलीट गार्ड |
| `tools/post-execute` | श्रोता | परिणाम स्कैन (block फ़ीडबैक) |

## अनुमतियाँ और डेटा

- **अनुमतियाँ**: `ask` निर्णय आधिकारिक स्वीकृति सीम से जाते हैं; कुछ भी फिर से लागू या बायपास नहीं होता। प्लगइन अपने वर्कशॉप मैनिफ़ेस्ट में `session:append` व `network:none` घोषित करता है।
- **डेटा**: डिस्क पर कुछ नहीं लिखा जाता; रिपोर्ट रिंग-बफ़र केवल मेमोरी में और सीमित है। कोई नेटवर्क अनुरोध नहीं, कोई सबप्रोसेस नहीं।
- **सत्र लॉग**: `defend/detection` इवेंट में नियम id, परिवार, श्रेणी, गंभीरता, सीक्रेट प्रकार, निर्णय व स्कैन तथ्य होते हैं — मिलान टेक्स्ट कभी लॉग तक नहीं पहुँचता, और सीक्रेट पहचान निर्माण से ही केवल-प्रकार होती है।

## सुरक्षा सीमाएँ

- **पहचान, प्रवर्तन नहीं।** गार्ड और पहचान परत केवल आधिकारिक सीम पर deny/ask/block निर्णय बनाती हैं; सैंडबॉक्स व स्वीकृति प्रणालियाँ ही प्रवर्तन प्राधिकार हैं।
- **Fail closed।** स्वीकृति उत्तरदाता, सत्र या सेवा सतह के बिना, सख्ततम निर्णय पर गिरता है — कभी मूक पास-थ्रू नहीं।
- **कोई सामग्री प्रक्रिया से बाहर नहीं जाती।** स्कैन स्थानीय है; ऑडिट इवेंट सैनिटाइज़्ड हैं; सीक्रेट कभी लॉग, दिखाए या रिपोर्ट नहीं होते।
- **सीमित कार्य।** स्कैन सीमाएँ, प्रति नियम एक पहचान व रिंग-बफ़र कोटा शत्रुतापूर्ण इनपुट को असीमित संसाधन खाने से रोकते हैं।

## ज्ञात सीमाएँ

- **पहचान अंतराल।** नियम पुस्तकालय पोर्टेड शब्दावली व उनके सहिष्णु रूपों को कवर करता है; नई वाक्यरचना, lookalike-Unicode एन्कोडिंग (NFKC सामान्यीकरण भावी कार्य है) और बहु-चरणीय हमले बच सकते हैं। बेंचमार्क मापा गया आधार (अपस्ट्रीम डेटासेट पर 27/28) टेस्ट में कीलित है ताकि रिग्रेशन दिखे।
- **मॉडल-स्तर के फ़ैसले नहीं।** `dsh-defend` नियतात्मक है; कभी मॉडल नहीं बुलाता और नई मंशा नहीं आँक सकता।
- **संदेश अस्वीकृति मूक है।** `agent/pre-step` का reject मॉडल को कारण नहीं देता (सीम में कारण क्षेत्र नहीं); ऑडिट इवेंट नियम तथ्य दर्ज करता है।
- **सत्र ऑडिट और `ignorable` मार्कर।** ऑडिट ऐपेंड एनवलप के `ignorable: true` मार्कर का अनुरोध करते हैं ताकि कोई भी हार्नेस बिल्ड लॉग लोड कर सके। अब तक की सभी प्रकाशित लाइनें (`0.1.0-rc.1`–`0.1.0-rc.8`, `0.1.1-rc.1`–`0.1.1-rc.2`) उसे चुपचाप गिरा देती हैं — इवेंट बिना मार्क के लिखा जाता है और कड़े बिल्ड पर सत्र अप्राप्य हो जाता है; होस्ट `0.1.2-rc.1` एनवलप फ़ील्ड को केवल संग्रहीत-लॉग पठन संगतता के लिए रखता है, लेकिन `Session.append` अब भी उसे स्टैम्प नहीं कर सकता और रीड पथ बिना-मार्क वाले अज्ञात घटना प्रकारों को अस्वीकार करता है (`defend/detection` पंजीकृत नहीं है), इसलिए वहाँ लिखना भी सत्र को लोड-अयोग्य बना देता है। इसलिए dsh-defend ऐसे होस्ट को पहले उपयोग पर पहचानता है (पीयर-संस्करण पूर्व-जांच + लौटाए गए एनवलप की जांच) और एक बार की चेतावनी के साथ सत्र-लॉग ऑडिट बंद कर देता है। `detection.allowUnmarkedAudit: true` सेट करके दोबारा चालू करें; मौजूदा बिना-मार्क `defend/detection` पंक्तियों के एनवलप में `"ignorable": true` जोड़कर मरम्मत की जा सकती है। देखें [issue #2](https://github.com/PerryLink/dsh-defend/issues/2)।

## विकास

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests स्थानीय हार्नेस चेकआउट के विरुद्ध
pnpm run typecheck:ci  # tsc प्रकाशित 0.1.7-rc.1 प्रकारों के विरुद्ध (बिना paths)
pnpm test           # vitest: 96 टेस्ट, 9 सुइट (पहचान बेंचमार्क सहित)
pnpm run build      # tsdown बंडल + tsc घोषणाएँ (lib/)
pnpm run verify:self-contained  # निर्भरता स्पेक registry से हल होती हैं
pnpm run verify:artifacts       # निर्मित ESM फ़ेस + प्रकाशित फ़ाइलें मौजूद
pnpm pack           # प्रकाशित tarball
```

### Benchmark

रेड-टीम बेंचमार्क (105 नमूनों पर प्रति-श्रेणी P/R/F1 + 27/28 fixture फ़्लोर) [`benchmark/RESULTS.md`](benchmark/RESULTS.md) में है; `node --experimental-strip-types benchmark/run.mjs` से दोबारा बनाएँ (कोई नई निर्भरता नहीं, कोई build नहीं)।

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — निर्माता और मेंटेनर: विनाशकारी-डिलीट गार्ड, चार-परिसंपत्ति पहचान पोर्ट, इंटरसेप्शन वायरिंग, ऑडिट सतह और पाँच-भाषा दस्तावेज़।
- [@cuohua](https://github.com/cuohua) — बिना मार्क के लिखे गए `defend/detection` इवेंट से कड़े बिल्ड पर सत्र अप्राप्य होने की सटीक रिपोर्ट ([#2](https://github.com/PerryLink/dsh-defend/issues/2)); runtime होस्ट-क्षमता पहचान और `ignorable` मार्कर अनुशासन सीधे उसी विश्लेषण से निकले हैं।

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

### DSH Desktop मार्केट से इंस्टॉल करें

सभी PerryLink प्लगइन DSH Desktop के बिल्ट-इन मार्केट में देखे जा सकते हैं: **Market → Sources → add source → पेस्ट करें** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ चुनें**। इंस्टॉलेशन मार्केट के npm-identity सत्यापन और आपकी पुष्टि से ही होता है।
