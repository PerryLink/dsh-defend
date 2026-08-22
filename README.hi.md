<div align="center">

# 🛡️ dsh-defend

**DeepSeek Harness के लिए प्रॉम्प्ट-इंजेक्शन, जेलब्रेक और सीक्रेट-लीक सुरक्षा।**

*नियम ज्ञात को तय करते हैं। बाकी को इंटरसेप्शन तय करता है — और सब कुछ ऑडिटेड रहता है।*

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

## संगतता

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `0.1.1-rc.2` (peer रेंज `>=0.1.0-rc.8 <0.2.0`) |
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
- **सत्र ऑडिट और `ignorable` मार्कर।** ऑडिट ऐपेंड एनवलप के `ignorable: true` मार्कर का अनुरोध करते हैं ताकि कोई भी हार्नेस बिल्ड लॉग लोड कर सके। अब तक की सभी प्रकाशित लाइनें (`0.1.0-rc.1`–`0.1.0-rc.8`, `0.1.1-rc.1`–`0.1.1-rc.2`) उसे चुपचाप गिरा देती हैं — इवेंट बिना मार्क के लिखा जाता है और कड़े बिल्ड पर सत्र अप्राप्य हो जाता है, इसलिए dsh-defend ऐसे होस्ट को पहले उपयोग पर पहचानता है (पीयर-संस्करण पूर्व-जांच + लौटाए गए एनवलप की जांच) और एक बार की चेतावनी के साथ सत्र-लॉग ऑडिट बंद कर देता है। `detection.allowUnmarkedAudit: true` सेट करके दोबारा चालू करें; मौजूदा बिना-मार्क `defend/detection` पंक्तियों के एनवलप में `"ignorable": true` जोड़कर मरम्मत की जा सकती है। देखें [issue #2](https://github.com/PerryLink/dsh-defend/issues/2)।

## विकास

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests स्थानीय हार्नेस चेकआउट के विरुद्ध
pnpm run typecheck:ci  # tsc प्रकाशित 0.1.1-rc.2 प्रकारों के विरुद्ध (बिना paths)
pnpm test           # vitest: 75 टेस्ट, 8 सुइट (पहचान बेंचमार्क सहित)
pnpm run build      # tsdown बंडल + tsc घोषणाएँ (lib/)
pnpm run verify:self-contained  # निर्भरता स्पेक registry से हल होती हैं
pnpm run verify:artifacts       # निर्मित ESM फ़ेस + प्रकाशित फ़ाइलें मौजूद
pnpm pack           # प्रकाशित tarball
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — निर्माता और मेंटेनर: विनाशकारी-डिलीट गार्ड, चार-परिसंपत्ति पहचान पोर्ट, इंटरसेप्शन वायरिंग, ऑडिट सतह और पाँच-भाषा दस्तावेज़।
- [@cuohua](https://github.com/cuohua) — बिना मार्क के लिखे गए `defend/detection` इवेंट से कड़े बिल्ड पर सत्र अप्राप्य होने की सटीक रिपोर्ट ([#2](https://github.com/PerryLink/dsh-defend/issues/2)); runtime होस्ट-क्षमता पहचान और `ignorable` मार्कर अनुशासन सीधे उसी विश्लेषण से निकले हैं।

## PerryLink DSH Plugin Family

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) द्वारा अनुरक्षित [29 DeepSeek Harness प्लगइनों](https://github.com/PerryLink) में से एक है। अगर यह आपकी मदद करता है, तो बाकी भी करेंगे:

| Plugin | One-liner |
|---|---|
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | अनुमोदन श्रृंखला पर दूसरे मॉडल से स्वतः-समीक्षा, डिफ़ॉल्ट रूप से असफल-बंद |
| [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | Web UI साइडबार, संदेश और रुकावट के साथ स्थायी पृष्ठभूमि चाइल्ड एजेंट |
| [dsh-budget](https://github.com/PerryLink/dsh-budget) | DeepSeek Harness के लिए लागत प्रशासन: बजट, कार्बन और विलंबता एक पैनल में। |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Claude Code /rewind-समतुल्य: स्नैपशॉट, सत्र फोर्क, एक-बार पुनर्स्थापन |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | Claude Code सत्र, स्मृति, skills और CLAUDE.md को DSH में स्थानांतरित करें |
| [dsh-click](https://github.com/PerryLink/dsh-click) | DeepSeek Harness के लिए क्रॉस-प्लेटफ़ॉर्म नेटिव डेस्कटॉप नियंत्रण — Windows पहले। |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Web कंपोज़र के लिए टर्मिनल-शैली इनपुट इतिहास: तीर, Ctrl+R खोज |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | DeepSeek Harness के लिए प्रॉम्प्ट-इंजेक्शन, जेलब्रेक और सीक्रेट-लीक रक्षा। |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | इंजीनियरिंग-अनुशासन गार्ड: आवश्यकताएँ पूछताछ, परीक्षण द्वार, विरोधी समीक्षा |
| [dsh-draw](https://github.com/PerryLink/dsh-draw) | DeepSeek Harness के लिए एकीकृत स्थैतिक-छवि निर्माण रूटिंग। |
| [dsh-fast](https://github.com/PerryLink/dsh-fast) | DeepSeek Harness के लिए केवल-पठन प्रदर्शन निदान। |
| [dsh-github](https://github.com/PerryLink/dsh-github) | DSH के लिए GitHub PR/issues एकीकरण, हर लेखन अनुमोदन-द्वारित |
| [dsh-library](https://github.com/PerryLink/dsh-library) | DeepSeek Harness के लिए स्थानीय दस्तावेज़ ज्ञानकोश। |
| [dsh-local-ai](https://github.com/PerryLink/dsh-local-ai) | DeepSeek Harness के लिए स्थानीय-मॉडल (Ollama) एकीकरण। |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | भाषा सर्वरों पर LSP निदान, फ़ॉर्मेटिंग, पूर्णता, कोड क्रियाएँ और नाम बदलना |
| [dsh-mask](https://github.com/PerryLink/dsh-mask) | DeepSeek Harness के लिए PII मास्किंग मिडलवेयर — मॉडल तक पहुँचने से पहले व्यक्तिगत डेटा अनाम करता है, प्रदर्शन परत पर बहाल करता है। |
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | केवल-पठन MCP रनटाइम पैनल: /mcp कमांड + स्थिति, टूल और त्रुटियों वाला सेटिंग टैब |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | अनुमोदन-द्वारित क्रॉस-सत्र स्मृति: ctx.memory seam + SQLite + memory टूल |
| [dsh-observe](https://github.com/PerryLink/dsh-observe) | DeepSeek Harness के लिए OpenTelemetry और Langfuse अवलोकनीयता निर्यातक। |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Claude Code outputStyles-समतुल्य रनटाइम शैली स्विचिंग |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Claude Code-शैली घोषणात्मक allow/deny/ask अनुमति नियम, ऑडिट के साथ |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | माँग-पर एजेंट स्किल के रूप में प्लगइन-विकास ज्ञानकोश |
| [dsh-score](https://github.com/PerryLink/dsh-score) | DeepSeek Harness प्लगइनों के लिए बहु-आयामी गुणवत्ता स्कोरिंग। |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | Web साइडबार में सत्र पिन करें, स्थायी क्रम के साथ |
| [dsh-session-sync](https://github.com/PerryLink/dsh-session-sync) | DeepSeek Harness के लिए क्रॉस-डिवाइस सत्र सिंक — आपके सत्र स्टोर का एक समर्पित git मिरर। |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | सुरक्षा-ऑडिट स्किल पैक: सीक्रेट स्कैन, निर्भरता और आपूर्ति-श्रृंखला समीक्षा |
| [dsh-talk](https://github.com/PerryLink/dsh-talk) | DeepSeek Harness के लिए आवाज़-प्रथम सत्र लूप: बोलें और उत्तर सुनें। |
| [dsh-test-drive](https://github.com/PerryLink/dsh-test-drive) | DeepSeek Harness प्लगइनों के लिए पृथक इंस्टॉल-और-स्मोक परीक्षण। |
| [dsh-translate](https://github.com/PerryLink/dsh-translate) | DeepSeek Harness के लिए वेंडर पैरामीटर अनुवाद और नियतात्मक JSON मरम्मत। |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors
