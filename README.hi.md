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
| Harness | DeepSeek Harness `0.1.0-rc.6` (`0.1.0-rc.5`–`0.1.0-rc.6` के लिए घोषित संगतता) |
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
- **नए हार्नेस बिल्ड पर सत्र ऑडिट।** ऑडिट ऐपेंड दो-तर्क वाले `Session.append` रूप का उपयोग करते हैं (पिन किए rc.6 peers के पास एनवलप विकल्प नहीं); पोस्ट-rc.6 बिल्ड पर इवेंट required-on-read हैं, जो प्लगइन इंस्टॉल रहने पर सही है क्योंकि वह इवेंट प्रकार घोषित करता है।

## विकास

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests स्थानीय हार्नेस चेकआउट के विरुद्ध
pnpm run typecheck:ci  # tsc प्रकाशित 0.1.0-rc.6 प्रकारों के विरुद्ध (बिना paths)
pnpm test           # vitest: 49 टेस्ट, 4 सुइट (पहचान बेंचमार्क सहित)
pnpm run build      # tsdown बंडल + tsc घोषणाएँ (lib/)
pnpm run verify:self-contained  # निर्भरता स्पेक registry से हल होती हैं
pnpm run verify:artifacts       # निर्मित ESM फ़ेस + प्रकाशित फ़ाइलें मौजूद
pnpm pack           # प्रकाशित tarball
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `security`, `prompt-injection`, `jailbreak`, `secret-scanning`, `ai-safety`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — निर्माता और मेंटेनर: विनाशकारी-डिलीट गार्ड, चार-परिसंपत्ति पहचान पोर्ट, इंटरसेप्शन वायरिंग, ऑडिट सतह और पाँच-भाषा दस्तावेज़।

## License

[Apache License 2.0](LICENSE) © 2026 dsh-defend contributors
