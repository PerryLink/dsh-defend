#!/usr/bin/env python3
"""README visuals for dsh-defend: one hero banner + one pipeline diagram.

Both figures are derived from the code in this repo, not from the prose:

  * three interception seams — `agent/pre-step` (user messages),
    `tools/pre-execute` (tool arguments), `tools/post-execute` (tool results);
  * one scan core — NFKC normalize, 10,000-char head cap, a single
    Aho-Corasick automaton over every needle plus per-rule regexes, the
    secret-entropy gate, one match per rule (src/detect/scanner.ts);
  * three-tier verdict — allow / ask / block, `ask` going through
    `ctx.approval` and failing closed without an answerer (src/index.ts);
  * the prepended destructive-delete guard riding `tools/pre-execute`
    (deny/ask, dry-run markers pass);
  * the sanitized `defend/detection` audit event — rule id, family,
    severity, decision, never the matched text.

Hero: the evidence a scan leaves behind — a scan ledger of real rule ids
(`ii-001`, `jd-013`, `sk-openai`, the delete guard) with their verdicts and
one redacted credential, closed by the audit stream. It is deliberately NOT
the pipeline drawing; the pipeline is the second figure.

Flow: a three-lane convergence — the three seams merge through a bus into
one scan core, the core fans out into the allow/ask/block tiers, the
early-exit "no match" path sits under the core, the delete guard is an
inline side-check on the tool-argument lane, and the audit band closes the
bottom. No row of five boxes with arrows.

Fonts: Microsoft YaHei (msyh.ttc / msyhbd.ttc) for CJK, Consolas for mono.
Run:  python scripts/gen-readme-assets.py
"""
import os
from html import escape

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'assets')

FONT_CJK = r'C:\Windows\Fonts\msyh.ttc'
FONT_CJK_BOLD = r'C:\Windows\Fonts\msyhbd.ttc'
FONT_MONO = r'C:\Windows\Fonts\consola.ttf'
FONT_EN = r'C:\Windows\Fonts\segoeui.ttf'
FONT_EN_BOLD = r'C:\Windows\Fonts\segoeuib.ttf'
for _p in (FONT_CJK, FONT_CJK_BOLD, FONT_MONO, FONT_EN, FONT_EN_BOLD):
    if not os.path.exists(_p):
        raise SystemExit(f'FATAL: font missing: {_p}')

SKIN = {
    'light': dict(
        bg_from='#f9f6fd', bg_to='#e4eaf8', card='#ffffff', card_edge='#e6e2f0',
        text='#14141a', sub='#4d5261', faint='#8f94a4', accent='#4B67B4',
        pill='#ece7f9', grid='#e9e5f2', shadow=(38, 30, 68),
        injection='#4B67B4', jailbreak='#7351AE', secret='#AE3F62',
        guard='#94651D', allow='#2E7D5B', ask='#A9701A', block='#A63A4C',
        inset='#faf9fd'),
    'dark': dict(
        bg_from='#131a2a', bg_to='#0c1016', card='#1b2231', card_edge='#2e374b',
        text='#eef2fa', sub='#a8b1c4', faint='#767f92', accent='#8496f5',
        pill='#242d42', grid='#232b3d', shadow=(0, 0, 0),
        injection='#8496f5', jailbreak='#B39BEA', secret='#EE9CB4',
        guard='#DDB57A', allow='#6FD3AC', ask='#E7B45E', block='#F08A9C',
        inset='#1f2738'),
}


# ── small colour / font helpers ───────────────────────────────

def font(size, kind='cjk_bold'):
    return ImageFont.truetype({
        'cjk': FONT_CJK, 'cjk_bold': FONT_CJK_BOLD, 'mono': FONT_MONO,
        'en': FONT_EN, 'en_bold': FONT_EN_BOLD}[kind], int(size))


def hx(s):
    if isinstance(s, tuple):
        return s[:3]
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def blend(a, b, t):
    """Paint colour a over base b at `t` (t = how much of a survives)."""
    pa, pb = hx(a) if isinstance(a, str) else a, hx(b) if isinstance(b, str) else b
    return tuple(int(y * (1 - t) + x * t) for x, y in zip(pa, pb))


def gradient(w, h, c1, c2):
    img = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(img)
    a, b = hx(c1), hx(c2)
    for y in range(h):
        t = 0.25 * (y / h) + 0.75 * (y / h) ** 1.6
        d.line([(0, y), (w, y)], fill=tuple(int(p + (q - p) * t) for p, q in zip(a, b)))
    return img


def glow(img, cx, cy, r, color, alpha=48):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(10, 0, -1):
        rr = r * i / 10
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=color + (int(alpha * (1 - i / 11)),))
    return Image.alpha_composite(img.convert('RGBA'), layer).convert('RGB')


def card(img, box, skin, radius=20, lift=10, strength=1.0, outline=None, width=2):
    """White card with a soft shadow (radius 18-22 per the family spec)."""
    x0, y0, x1, y1 = box
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([x0 + 2, y0 + lift, x1 + 2, y1 + lift + 4], radius=radius,
                         fill=skin['shadow'] + (int(34 * strength),))
    base = Image.alpha_composite(img.convert('RGBA'),
                                 sh.filter(ImageFilter.GaussianBlur(14)))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=hx(skin['card']),
                        outline=hx(outline or skin['card_edge']), width=width)
    return base.convert('RGB')


def rrect(img, box, radius, fill, outline=None, width=2):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, radius=radius, fill=fill,
                        outline=None if outline is None else hx(outline), width=width)
    return Image.alpha_composite(img.convert('RGBA'), layer).convert('RGB')


def pill(img, xy, text, skin, size=17, fg=None, bg=None, kind='cjk_bold',
         dot=None, pad=32):
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    tw = d.textlength(text, font=f)
    x, y = xy
    h = size + 18
    d.rounded_rectangle([x, y, x + tw + pad, y + h], radius=h // 2,
                        fill=hx(bg or skin['pill']))
    tx = x + pad / 2
    if dot is not None:
        d.ellipse([x + 14, y + h / 2 - 4, x + 22, y + h / 2 + 4], fill=hx(dot))
        tx = x + 30
    d.text((tx, y + 8), text, font=f, fill=hx(fg or skin['accent']))
    return x + tw + pad


def fit(d, text, maxw, start, kind, floor=20):
    size = start
    while size > floor:
        f = font(size, kind)
        if d.textlength(text, font=f) <= maxw:
            return f
        size -= 2
    return font(floor, kind)


def shield(img, x, y, w, h, color):
    """Small shield glyph for the kicker pill."""
    d = ImageDraw.Draw(img)
    top = [(x, y + h * 0.10), (x + w * 0.5, y), (x + w, y + h * 0.10)]
    body = [(x + w, y + h * 0.10), (x + w, y + h * 0.52),
            (x + w * 0.5, y + h), (x, y + h * 0.52)]
    d.polygon(top + body[1:], fill=hx(color))
    d.line([(x + w * 0.30, y + h * 0.52), (x + w * 0.45, y + h * 0.68),
            (x + w * 0.72, y + h * 0.38)], fill=(255, 255, 255), width=max(2, int(w * 0.12)))


# ── hero ──────────────────────────────────────────────────────

HERO = {
    'zh': dict(
        kicker='DeepSeek Harness · 安全插件',
        value=['三道闸拦在模型与工具之前。', '命中即裁决，全程可审计。'],
        sub='62 条规则，一次 Aho-Corasick 通行。',
        meta='三处拦截点 · 失败关闭 · 无网络 · 无原生依赖',
        foot='Apache-2.0 · github.com/PerryLink/dsh-defend',
        legend=['注入 / 越狱 50', '密钥语法 12'],
        win_head='检测层 · 命中即裁决',
        rows=[
            dict(id='ii-001', family='注入', sev='high',
                 pre='', hit='Ignore all previous instructions', post='.',
                 verdict='ask', gloss='审批'),
            dict(id='jd-013', family='越狱', sev='high',
                 pre='', hit='act as if you have no restrictions', post='',
                 verdict='ask', gloss='审批'),
            dict(id='sk-openai-project', family='密钥', sev='critical',
                 pre='OPENAI_API_KEY=', hit='sk-proj-••••••••', post='',
                 verdict='block', gloss='拦截', redact=True),
        ],
        win_foot='每规则至多 1 命中 · 匹配文本不入审计，密钥只记类型',
        guard_pill='门禁层',
        guard_head='tools/pre-execute · prepend',
        guard_cmd='Remove-Item -Recurse .',
        guard_note='无显式绝对路径 → 拒绝',
        guard_verdict='deny', guard_gloss='拒绝',
        audit_key='defend/detection',
        audit_fields='规则 id · family · 严重度 · 决策',
        audit_never='无匹配文本',
    ),
    'en': dict(
        kicker='DeepSeek Harness · security plugin',
        value=['Three gates before any trust.', 'Every decision is audited.'],
        sub='62 rules, one Aho-Corasick pass.',
        meta='three seams · fail closed · no network',
        foot='Apache-2.0 · github.com/PerryLink/dsh-defend',
        legend=['injection / jailbreak 50', 'secret grammars 12'],
        win_head='detection layer · decide on hit',
        rows=[
            dict(id='ii-001', family='injection', sev='high',
                 pre='', hit='Ignore all previous instructions', post='.',
                 verdict='ask', gloss='approval'),
            dict(id='jd-013', family='jailbreak', sev='high',
                 pre='', hit='act as if you have no restrictions', post='',
                 verdict='ask', gloss='approval'),
            dict(id='sk-openai-project', family='secret', sev='critical',
                 pre='OPENAI_API_KEY=', hit='sk-proj-••••••••', post='',
                 verdict='block', gloss='refused', redact=True),
        ],
        win_foot='one match per rule · matched text never enters the audit, secrets are type-only',
        guard_pill='guard',
        guard_head='tools/pre-execute · prepend',
        guard_cmd='Remove-Item -Recurse .',
        guard_note='no explicit absolute path → denied',
        guard_verdict='deny', guard_gloss='denied',
        audit_key='defend/detection',
        audit_fields='rule id · family · severity · decision',
        audit_never='never matched text',
    ),
}

VERDICT_COLOR = {'ask': 'ask', 'block': 'block', 'deny': 'guard', 'allow': 'allow'}


def hero(lang, skin):
    s = SKIN[skin]
    H = HERO[lang]
    W, Hh = 1440, 576
    img = gradient(W, Hh, s['bg_from'], s['bg_to'])
    img = glow(img, 1180, 90, 400, hx(s['accent']), 26 if skin == 'light' else 42)
    img = glow(img, 240, 600, 300, hx(s['secret']), 10 if skin == 'light' else 16)
    d = ImageDraw.Draw(img)

    m = 72
    # kicker pill with shield glyph
    fk = font(18, 'cjk_bold')
    ktw = d.textlength(H['kicker'], font=fk)
    ph = 38
    d.rounded_rectangle([m, 74, m + ktw + 62, 74 + ph], radius=ph // 2, fill=hx(s['pill']))
    shield(img, m + 16, 82, 15, 19, s['accent'])
    d = ImageDraw.Draw(img)
    d.text((m + 42, 84), H['kicker'], font=fk, fill=hx(s['accent']))

    tf = fit(d, 'dsh-defend', 520, 84, 'mono')
    d.text((m, 128), 'dsh-defend', font=tf, fill=hx(s['text']))

    y = 250
    for line in H['value']:
        f = fit(d, line, 540, 40, 'cjk_bold' if lang == 'zh' else 'en_bold', floor=30)
        d.text((m, y), line, font=f, fill=hx(s['text']))
        y += 58

    fsub = fit(d, H['sub'], 540, 26, 'cjk' if lang == 'zh' else 'en', floor=18)
    d.text((m, 372), H['sub'], font=fsub, fill=hx(s['sub']))

    fmeta = fit(d, H['meta'], 540, 21, 'cjk' if lang == 'zh' else 'en', floor=16)
    d.text((m, 414), H['meta'], font=fmeta, fill=hx(s['faint']))
    d.line([m, 452, m + 520, 452], fill=hx(s['grid']), width=2)
    d.text((m, 466), H['foot'], font=font(17, 'mono'), fill=hx(s['faint']))

    # ── right: the scan ledger ───────────────────────────────
    x0, x1 = 620, 1368
    # legend
    lx = x0
    for i, label in enumerate(H['legend']):
        dot = s['injection'] if i == 0 else s['secret']
        lx = pill(img, (lx, 58), label, s, size=17,
                  fg=s['sub'] if skin == 'light' else s['sub'], bg=s['pill'],
                  kind='cjk' if lang == 'zh' else 'en', dot=dot) + 12
        d = ImageDraw.Draw(img)
    d.text((x1 - 6, 64), '62 RULES', font=font(17, 'mono'), fill=hx(s['faint']),
           anchor='ra')

    # window
    img = card(img, (x0, 100, x1, 368), s, radius=22, lift=12)
    d = ImageDraw.Draw(img)
    fh = fit(d, H['win_head'], 470, 20, 'cjk_bold' if lang == 'zh' else 'en_bold')
    d.text((x0 + 28, 118), H['win_head'], font=fh, fill=hx(s['text']))
    d.text((x1 - 28, 121), 'Aho-Corasick · NFKC · 10k chars', font=font(17, 'mono'),
           fill=hx(s['faint']), anchor='ra')
    d.line([x0 + 28, 148, x1 - 28, 148], fill=hx(s['grid']), width=2)

    rowh = 62
    for i, row in enumerate(H['rows']):
        ry = 148 + i * rowh
        fam = row['family']
        fcol = s['injection'] if fam in ('注入', 'injection') else (
            s['jailbreak'] if fam in ('越狱', 'jailbreak') else s['secret'])
        if i:
            d.line([x0 + 28, ry, x1 - 28, ry], fill=hx(s['grid']), width=1)
        # family bar
        d.rounded_rectangle([x0 + 28, ry + 14, x0 + 32, ry + 50], radius=2, fill=hx(fcol))
        # id line
        d.text((x0 + 46, ry + 10), row['id'], font=font(18, 'mono'), fill=hx(fcol))
        idw = d.textlength(row['id'], font=font(18, 'mono'))
        d.text((x0 + 46 + idw + 10, ry + 9), fam, font=font(17, 'cjk_bold' if lang == 'zh' else 'en_bold'),
               fill=hx(fcol))
        famw = d.textlength(fam, font=font(17, 'cjk_bold' if lang == 'zh' else 'en_bold'))
        d.text((x0 + 46 + idw + 10 + famw + 10, ry + 11), row['sev'],
               font=font(16, 'mono'), fill=hx(s['faint']))

        # content line
        cx = x0 + 46
        cy = ry + 34
        if row['pre']:
            d.text((cx, cy), row['pre'], font=font(20, 'mono'), fill=hx(s['sub']))
            cx += d.textlength(row['pre'], font=font(20, 'mono'))
        hitw = d.textlength(row['hit'], font=font(20, 'mono'))
        if row.get('redact'):
            # redacted credential block
            d.rounded_rectangle([cx + 1, cy - 2, cx + hitw + 9, cy + 24], radius=6,
                                fill=blend(s['secret'], s['card'], 0.16 if skin == 'light' else 0.20))
            d.text((cx + 5, cy - 3), row['hit'], font=font(20, 'mono'), fill=hx(s['secret']))
            d.text((cx + hitw + 22, cy - 3), '[REDACTED]', font=font(15, 'mono'),
                   fill=hx(s['secret']))
        else:
            d.rounded_rectangle([cx - 4, cy - 2, cx + hitw + 5, cy + 24], radius=6,
                                fill=blend(fcol, s['card'], 0.12 if skin == 'light' else 0.16))
            d.text((cx, cy - 3), row['hit'], font=font(20, 'mono'), fill=hx(fcol))
            if row['post']:
                d.text((cx + hitw + 7, cy - 3), row['post'], font=font(20, 'mono'),
                       fill=hx(s['sub']))

        # verdict chip
        vcol = s[VERDICT_COLOR[row['verdict']]]
        vt = row['verdict']
        fv = font(18, 'mono')
        fg = font(16, 'cjk_bold' if lang == 'zh' else 'en_bold')
        vw = d.textlength(vt, font=fv) + d.textlength(row['gloss'], font=fg) + 34
        vx = x1 - 28 - vw
        d.rounded_rectangle([vx, ry + 14, vx + vw, ry + 50], radius=18,
                            fill=blend(vcol, s['card'], 0.14 if skin == 'light' else 0.18))
        d.text((vx + 14, ry + 21), vt, font=fv, fill=hx(vcol))
        d.text((vx + 14 + d.textlength(vt, font=fv) + 9, ry + 23), row['gloss'],
               font=fg, fill=hx(vcol))

    # window footer
    d.line([x0 + 28, 336, x1 - 28, 336], fill=hx(s['grid']), width=1)
    fwf = fit(d, H['win_foot'], 690, 17, 'cjk' if lang == 'zh' else 'en', floor=14)
    d.text((x0 + 28, 341), H['win_foot'], font=fwf, fill=hx(s['faint']))

    # guard strip (second layer)
    gcol = s['guard']
    gimg = img
    img = rrect(gimg, (x0, 382, x1, 464), 18,
                blend(gcol, s['card'], 0.08 if skin == 'light' else 0.10) + (255,),
                outline=blend(gcol, s['card'], 0.30 if skin == 'light' else 0.34), width=2)
    d = ImageDraw.Draw(img)
    gx = x0 + 28
    gw = pill(img, (gx, 396), H['guard_pill'], s, size=16, fg=gcol,
              bg=blend(gcol, s['card'], 0.22 if skin == 'light' else 0.26))
    d = ImageDraw.Draw(img)
    d.text((gw + 14, 399), H['guard_head'], font=font(17, 'mono'), fill=hx(s['faint']))
    d.text((gx, 428), H['guard_cmd'], font=font(19, 'mono'), fill=hx(s['text']))
    cmdw = d.textlength(H['guard_cmd'], font=font(19, 'mono'))
    d.text((gx + cmdw + 14, 430), H['guard_note'],
           font=font(17, 'cjk' if lang == 'zh' else 'en'), fill=hx(s['sub']))
    # guard verdict chip — a refusal, so it keeps the block colour
    dcol = s['block']
    fv = font(18, 'mono')
    fg = font(16, 'cjk_bold' if lang == 'zh' else 'en_bold')
    vw = d.textlength(H['guard_verdict'], font=fv) + d.textlength(H['guard_gloss'], font=fg) + 34
    vx = x1 - 28 - vw
    d.rounded_rectangle([vx, 403, vx + vw, 439], radius=18,
                        fill=blend(dcol, s['card'], 0.16 if skin == 'light' else 0.20))
    d.text((vx + 14, 410), H['guard_verdict'], font=fv, fill=hx(dcol))
    d.text((vx + 14 + d.textlength(H['guard_verdict'], font=fv) + 9, 412),
           H['guard_gloss'], font=fg, fill=hx(dcol))

    # audit ribbon
    d.line([x0, 480, x1, 480], fill=hx(s['grid']), width=2)
    d.text((x0, 493), H['audit_key'], font=font(18, 'mono'), fill=hx(s['accent']))
    ktw = d.textlength(H['audit_key'], font=font(18, 'mono'))
    d.text((x0 + ktw + 18, 495), H['audit_fields'],
           font=font(16, 'cjk' if lang == 'zh' else 'en'), fill=hx(s['sub']))
    d.text((x1, 495), H['audit_never'], font=font(16, 'cjk_bold' if lang == 'zh' else 'en_bold'),
           fill=hx(s['block']), anchor='ra')

    path = os.path.join(OUT, f'dsh-defend-hero-{lang}-{skin}.webp')
    img.save(path, 'WEBP', quality=92, method=6)
    print(f'wrote {os.path.relpath(path, ROOT)}')


# ── flow diagram (hand-written SVG) ───────────────────────────

SANS = 'Segoe UI, Microsoft YaHei, PingFang SC, Noto Sans CJK SC, sans-serif'
MONO = 'Consolas, SFMono-Regular, Menlo, monospace'


def flow_svg(skin):
    s = SKIN[skin]
    W, H = 1100, 660
    shadow_op = '0.14' if skin == 'light' else '0.50'
    tint = lambda c, t: '#%02x%02x%02x' % blend(c, s['card'], t)
    e = []

    def add(x):
        e.append(x)

    def txt(x, y, body, size=15, color=None, weight='400', mono=False,
            anchor='start', op=None, ls=None):
        fam = MONO if mono else SANS
        extra = f' letter-spacing="{ls}"' if ls else ''
        fo = f' opacity="{op}"' if op else ''
        add(f'<text x="{x}" y="{y}" fill="{color or s["text"]}" font-family="{fam}" '
            f'font-size="{size}" font-weight="{weight}"{extra} text-anchor="{anchor}"{fo}>'
            f'{escape(body)}</text>')

    def rect(x, y, w, h, r=16, fill=None, stroke=None, sw=1.5, shadow=False, op=None):
        g = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill or s["card"]}"'
        if stroke:
            g += f' stroke="{stroke}" stroke-width="{sw}"'
        if op:
            g += f' opacity="{op}"'
        g += '/>'
        add(f'<g filter="url(#soft)">{g}</g>' if shadow else g)

    def line(x1, y1, x2, y2, stroke, w=2, dash=None, marker=None, op=None):
        g = f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="round"'
        if dash:
            g += f' stroke-dasharray="{dash}"'
        if marker:
            g += f' marker-end="url(#{marker})"'
        if op:
            g += f' opacity="{op}"'
        add(g + '/>')

    def path(d, stroke, w=2, dash=None, marker=None, fill='none'):
        g = f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"'
        if dash:
            g += f' stroke-dasharray="{dash}"'
        if marker:
            g += f' marker-end="url(#{marker})"'
        add(g + '/>')

    add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}" role="img" aria-label="dsh-defend detection pipeline: three interception seams converge on one scan core, which fans out into allow, ask and block verdicts, with an inline destructive-delete guard and a sanitized audit band">')
    add('<title>dsh-defend · detection pipeline</title>')
    add('<defs>')
    add('<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="{s["bg_from"]}"/><stop offset="1" stop-color="{s["bg_to"]}"/></linearGradient>')
    add(f'<filter id="soft" x="-30%" y="-30%" width="170%" height="180%">'
        f'<feDropShadow dx="0" dy="8" stdDeviation="11" flood-color="#1b1735" flood-opacity="{shadow_op}"/></filter>')
    add(f'<marker id="arr" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" '
        f'orient="auto-start-reverse"><path d="M0.5 0.5 L9.5 5 L0.5 9.5 z" fill="{s["accent"]}"/></marker>')
    add(f'<marker id="arr-dim" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" '
        f'orient="auto-start-reverse"><path d="M0.5 0.5 L9.5 5 L0.5 9.5 z" fill="{s["faint"]}"/></marker>')
    add(f'<marker id="arr-allow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" '
        f'orient="auto-start-reverse"><path d="M0.5 0.5 L9.5 5 L0.5 9.5 z" fill="{s["allow"]}"/></marker>')
    add('</defs>')
    add(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')
    add(f'<circle cx="1010" cy="86" r="230" fill="{s["accent"]}" opacity="{0.05 if skin == "light" else 0.10}"/>')

    # header
    txt(44, 50, 'dsh-defend · detection pipeline', 24, s['text'], '700')
    txt(44, 78, 'three seams → one automaton pass → allow / ask / block → one audit event',
        15, s['sub'])
    txt(1056, 46, 'src/index.ts · src/detect/scanner.ts', 14, s['faint'], mono=True, anchor='end')
    txt(1056, 72, '62 rules = 50 patterns + 12 secret grammars', 14, s['accent'], mono=True, anchor='end')

    # ── lanes
    lane_x0, lane_w = 44, 256
    lanes = [
        dict(y=104, h=76, title='user message', seam='agent/pre-step'),
        dict(y=192, h=108, title='tool arguments', seam='tools/pre-execute'),
        dict(y=312, h=76, title='tool results', seam='tools/post-execute'),
    ]
    for i, ln in enumerate(lanes):
        wide = 40 if i == 1 else 0
        rect(lane_x0, ln['y'], lane_w + wide, ln['h'], 16, s['card'], s['card_edge'], shadow=True)
        txt(lane_x0 + 20, ln['y'] + 28, ln['title'], 17, s['text'], '600')
        txt(lane_x0 + 20, ln['y'] + 50, ln['seam'], 14, s['accent'], mono=True)
        if i == 1:
            gy = ln['y'] + 58
            rect(lane_x0 + 16, gy, lane_w + wide - 32, 42, 12, tint(s['guard'], 0.10),
                 tint(s['guard'], 0.30), sw=1.2)
            txt(lane_x0 + 30, gy + 16, 'destructive-delete guard', 14, s['guard'], '700')
            txt(lane_x0 + 30, gy + 34, 'prepend → deny / ask', 14, s['guard'], mono=True)

    # bus: three lanes converge on one arrow into the core
    path('M 300 142 H 344 Q 354 142 354 152 V 246', s['accent'], 2.2)
    path('M 300 350 H 344 Q 354 350 354 340 V 246', s['accent'], 2.2)
    line(340, 246, 358, 246, s['accent'], 2.2)
    line(354, 246, 392, 246, s['accent'], 2.4, marker='arr')

    # ── scan core
    cx0, cy0, cw, ch = 396, 104, 324, 284
    rect(cx0, cy0, cw, ch, 18, s['card'], s['accent'], sw=1.6, shadow=True)
    txt(cx0 + 24, cy0 + 34, 'scan core', 18, s['text'], '700')
    txt(cx0 + cw - 24, cy0 + 34, 'buildScanner()', 14, s['accent'], mono=True, anchor='end')
    line(cx0 + 24, cy0 + 50, cx0 + cw - 24, cy0 + 50, s['grid'], 1.5)

    steps = [
        ('01', 'NFKC normalize', 'lookalike Unicode folds to ASCII'),
        ('02', '10k-char head cap', 'only the head is scanned'),
        ('03', 'needles + per-rule regex', 'one automaton over every needle'),
        ('04', 'entropy ≥ 3.0', 'one match per rule · secrets type-only'),
    ]
    for i, (num, head, note) in enumerate(steps):
        ry = cy0 + 76 + i * 44
        add(f'<circle cx="{cx0 + 34}" cy="{ry - 5}" r="10.5" fill="{tint(s["accent"], 0.14)}"/>')
        txt(cx0 + 34, ry, num, 13, s['accent'], '700', mono=True, anchor='middle')
        txt(cx0 + 56, ry, head, 16, s['text'], '600', mono=True)
        txt(cx0 + 56, ry + 17, note, 14, s['faint'])
    line(cx0 + 24, cy0 + ch - 34, cx0 + cw - 24, cy0 + ch - 34, s['grid'], 1.5)
    txt(cx0 + 24, cy0 + ch - 13, '50 patterns + 12 secret grammars', 14, s['faint'], mono=True)

    # ── decision column
    dx0, dw = 752, 304
    tiers = [
        dict(y=104, h=88, key='allow', title='allow', body='→ next()',
             note='downstream never short-circuited'),
        dict(y=204, h=104, key='ask', title='ask', body='approval.request → allowed-once',
             note='no answerer = fail closed'),
        dict(y=320, h=108, key='block', title='block', body='', note='per seam: message / args / result'),
    ]
    for t in tiers:
        col = s[t['key']]
        rect(dx0, t['y'], dw, t['h'], 16, s['card'], tint(col, 0.35), sw=1.5, shadow=True)
        txt(dx0 + 20, t['y'] + 30, t['title'], 18, col, '700', mono=True)
        if t['body']:
            txt(dx0 + 20, t['y'] + 54, t['body'], 14, s['sub'], mono=True)
        if t['key'] == 'block':
            chips = ['reject', 'deny', 'feedback']
            cxp = dx0 + 20
            for c in chips:
                wch = 12 + len(c) * 8.6
                add(f'<rect x="{cxp}" y="{t["y"] + 44}" width="{wch}" height="26" rx="8" '
                    f'fill="{tint(col, 0.14)}"/>')
                txt(cxp + wch / 2, t['y'] + 62, c, 14, col, '600', mono=True, anchor='middle')
                cxp += wch + 8
        txt(dx0 + 20, t['y'] + t['h'] - 12, t['note'], 14, s['faint'])

    # fan-out bus from the core
    line(cx0 + cw, 246, 736, 246, s['accent'], 2.2)
    line(736, 148, 736, 374, s['accent'], 2.2)
    for y in (148, 256, 374):
        line(736, y, dx0 - 4, y, s['accent'], 2.2, marker='arr')

    # early exit: no match
    line(cx0 + cw / 2, cy0 + ch, cx0 + cw / 2, 404, s['allow'], 2.2, marker='arr-allow')
    rect(cx0, 404, cw, 60, 14, tint(s['allow'], 0.08), tint(s['allow'], 0.26), sw=1.2)
    txt(cx0 + 20, 430, 'no match → next()', 15, s['allow'], '600', mono=True)
    txt(cx0 + 20, 452, 'zero decisions · one automaton pass', 14, s['sub'])

    # ── audit band
    ay = 492
    rect(44, ay, 1012, 74, 16, s['card'], s['card_edge'], shadow=True)
    line(904, 428, 904, ay, s['faint'], 1.6, dash='5 5')
    txt(912, 458, 'every verdict, one event', 14, s['faint'])
    txt(66, ay + 26, 'defend/detection', 15, s['accent'], '600', mono=True)
    txt(228, ay + 26, 'rule id · family · category · severity · decision · secretType',
        14, s['sub'])
    txt(1034, ay + 26, 'never matched text', 14, s['block'], '700', anchor='end')
    txt(66, ay + 54, 'append-only session event · ring buffer 200 → /defend · defend_report',
        14, s['faint'])

    txt(44, 610, 'Apache-2.0 · PerryLink DSH plugin family · 3 seams · 3 tiers · fail closed',
        14, s['faint'])

    add('</svg>')
    path = os.path.join(OUT, f'dsh-defend-flow-v5-{skin}.svg')
    with open(path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(e) + '\n')
    print(f'wrote {os.path.relpath(path, ROOT)}')


def main():
    os.makedirs(OUT, exist_ok=True)
    for skin in ('light', 'dark'):
        for lang in ('zh', 'en'):
            hero(lang, skin)
        flow_svg(skin)


if __name__ == '__main__':
    main()
