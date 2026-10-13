#!/usr/bin/env python3
"""321生命操練 建置：組合單檔 index.html、產生 lang-zs.json（ICU 繁轉簡＋修正表）與 lang-en.json、
ES5 檢查、node --check、大小檢查、三處版本號一致。用法：python3 tools/build.py [--keys]"""
import os, re, json, sys, shutil, subprocess, time
sys.path.insert(0, os.path.dirname(__file__))
from t2s import t2s
W = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(W, 'src'); D = os.path.join(W, 'dist'); I = os.path.join(W, 'i18n')
rd = lambda p: open(os.path.join(S, p), encoding='utf-8').read()
import datetime
VER = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).strftime('2.0.%Y%m%d%H%M')
CJK = re.compile('[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef\u30fb]')

app = rd('app.js').replace('/*@@CKBASE@@*/', rd('ckbase.js'))
ext = rd('ext.js').replace('/*@@MDSPEAK@@*/', rd('ref_mdspeak.js')).replace('/*@@TTSFIX@@*/', rd('ref_ttsfix.js')).replace('/*@@BKZH@@*/', rd('ref_bkzh.js'))
upd = rd('update.js')
js = '\n'.join([rd('data.js'), app, ext, upd, rd('boot.js')])

# ---------- 抽出要翻譯的字串 ----------
def strip_noi18n(s):
    return re.sub(r'/\*NOI18N\*/.*?/\*END\*/', '', s, flags=re.S)
def js_strings(s):
    """依序掃描 JS：略過註解與正規式，回傳 (引號, 內容) 清單"""
    out = []; i = 0; n = len(s); prev = ''
    while i < n:
        c = s[i]
        if c in '"\'':
            j = i + 1; buf = []
            while j < n and s[j] != c:
                if s[j] == '\\': buf.append(s[j:j+2]); j += 2; continue
                buf.append(s[j]); j += 1
            out.append((c, ''.join(buf))); i = j + 1; prev = 'x'; continue
        if c == '/' and i + 1 < n and s[i+1] == '*':
            j = s.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if c == '/' and i + 1 < n and s[i+1] == '/':
            j = s.find('\n', i); i = n if j < 0 else j; continue
        if c == '/' and (prev == '' or prev in '(,=:[!&|?{};+\n'):
            j = i + 1; cls = False
            while j < n:
                if s[j] == '\\': j += 2; continue
                if s[j] == '[': cls = True
                elif s[j] == ']': cls = False
                elif s[j] == '/' and not cls: break
                elif s[j] == '\n': break
                j += 1
            i = j + 1; prev = 'x'; continue
        if not c.isspace(): prev = c
        elif c == '\n': prev = prev if prev else ''
        i += 1
    return out
def literals_dq(s):
    return [x for x in literals(s, '"')]
def literals(s, only=None):
    out = []
    for q, lit in js_strings(s):
        if only and q != only: continue
        if CJK.search(lit):
            try: out.append(json.loads('"' + lit.replace("\\'", "'").replace('"', '\\"') + '"'))
            except Exception: out.append(lit)
    return out
keys = []
for part in (strip_noi18n(rd('app.js')), strip_noi18n(rd('ext.js')), upd):
    keys += [x for q, x in [(q, l) for q, l in js_strings(part)] if False]
    keys += [k for k in literals_dq(part)]
datastr = subprocess.run(['node', '-e', '''
var fs=require("fs");eval(fs.readFileSync(process.argv[1],"utf8")+";global.__d={GROUPS:GROUPS,WEEK_FRUIT:WEEK_FRUIT,FRUITS:FRUITS,SCALE:SCALE,BANDS:BANDS,STEPS:STEPS,PRAYER:PRAYER};");
var o=[];(function w(x){if(typeof x==="string"){if(/[\\u4e00-\\u9fff]/.test(x))o.push(x);}else if(x&&typeof x==="object"){for(var k in x)w(x[k]);}})(__d);
console.log(JSON.stringify(o));''', os.path.join(S, 'data.js')], capture_output=True, text=True, check=True).stdout
keys += json.loads(datastr)
seen = set(); K = []
for k in keys:
    if k not in seen: seen.add(k); K.append(k)
# 單引號裡的中文（提醒用，通常是標點或不需翻譯的片段）
sq = set(l for q, l in js_strings(strip_noi18n(rd('app.js') + rd('ext.js'))) if q == "'" and CJK.search(l))
json.dump(K, open(os.path.join(W, 'keys.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

# ---------- 语言包 ----------
zsfix = json.load(open(os.path.join(I, 'zs_fix.json'), encoding='utf-8'))
en = json.load(open(os.path.join(I, 'en.json'), encoding='utf-8'))
zs = {}
for k in K:
    v = zsfix.get(k, t2s(k))
    if v != k: zs[k] = v
zs['@bkzs'] = rd('bk_zs.txt').strip()
missing = [k for k in K if k not in en]
unused = [k for k in en if k not in seen]
# {0} 佔位與 HTML 標籤要一致
bad = [k for k in K if k in en and (sorted(re.findall(r'\{\d\}', k)) != sorted(re.findall(r'\{\d\}', en[k])) or sorted(re.findall(r'</?\w+>', k)) != sorted(re.findall(r'</?\w+>', en[k])))]
if '--keys' in sys.argv or missing:
    print('KEYS', len(K), 'MISSING', len(missing), 'UNUSED', len(unused))
    json.dump(missing, open(os.path.join(W, 'missing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    if unused: print('unused:', unused[:20])
    if missing: print('missing sample:', missing[:10]); sys.exit(1)
if bad: print('PLACEHOLDER/TAG MISMATCH:', bad); sys.exit(1)
enp = {k: en[k] for k in K}

# ---------- 壓縮與檢查 ----------
def strip_js(s):
    s = re.sub(r'/\*NOI18N\*/|/\*END\*/', '', s)
    s = re.sub(r'(?m)^\s*/\*[^\n]*?\*/\s*$\n?', '', s)          # 整行單行註解
    s = re.sub(r'(?s)^\s*/\*(?:(?!\*/).)*?\*/\s*$', '', s, flags=re.M)  # 整段區塊註解（行首開始）
    s = re.sub(r'(?m)^\s*//[^\n]*$\n?', '', s)
    s = re.sub(r'\n{2,}', '\n', s)
    return s
js = strip_js(js).replace('@@VER@@', VER)
js = re.sub(r'font-size:(\d+(?:\.\d+)?)px', lambda m: 'font-size:%grem' % (float(m.group(1)) / 16), js)

def lint_es5(src, name):
    t = re.sub(r'([(,=:!&|?;{}\n+]\s*)/(?![/*])(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\n\\\[])+/[gimuy]*', r'\1RX', src)
    t = re.sub(r'"(?:[^"\\\n]|\\.)*"|\'(?:[^\'\\\n]|\\.)*\'', '""', t)
    t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
    t = re.sub(r'(?<![:"\\])//[^\n]*', '', t)
    errs = []
    for pat, lab in [(r'=>', 'arrow'), (r'`', 'template'), (r'\blet\s', 'let'), (r'\bconst\s', 'const'), (r'\.\.\.', 'spread'), (r'\bclass\s+\w', 'class')]:
        for m in re.finditer(pat, t):
            ln = t[:m.start()].count('\n') + 1
            errs.append('%s:%d %s' % (name, ln, lab))
    return errs

css = rd('style.css')
FIXED = ('nav.tabs', '.top', '.brand', '.mark', '.langsw', '.ib', '.fab', '.toast', '.spk', '.updbar', 'html')
def css_rem(c):
    out = []
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', c):
        sel, body = m.group(1), m.group(2)
        if not any(f in sel for f in FIXED):
            body = re.sub(r'font-size:(\d+(?:\.\d+)?)px', lambda x: 'font-size:%grem' % (float(x.group(1)) / 16), body)
        out.append((m.start(), m.end(), sel + '{' + body + '}'))
    r = c;
    for a, b, t in reversed(out): r = r[:a] + t + r[b:]
    return r
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
# @media 區塊內的規則也要處理：先整段處理內層
css = re.sub(r'(@media[^{]+\{)((?:[^{}]*\{[^{}]*\})*)\}', lambda m: m.group(1) + css_rem(m.group(2)) + '}', css)
css = css_rem(css)
css = re.sub(r'\n+', '\n', css)

html = rd('shell.html').replace('/*@@CSS@@*/', css).replace('/*@@JS@@*/', js)
if os.path.exists(D): shutil.rmtree(D)
os.makedirs(D)
open(os.path.join(D, 'index.html'), 'w', encoding='utf-8').write(html)
open(os.path.join(D, 'sw.js'), 'w', encoding='utf-8').write(rd('sw.js').replace('@@VER@@', VER))
json.dump({'v': VER}, open(os.path.join(D, 'version.json'), 'w'))
json.dump(zs, open(os.path.join(D, 'lang-zs.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(enp, open(os.path.join(D, 'lang-en.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for f in ['hero.jpg', 'hero-720.jpg', 'icon-512-v2.png', 'icon-maskable-512-v2.png', 'icon-192-v2.png', 'apple-touch-icon-v2.png', 'favicon-32.png', '.nojekyll', 'manifest.json', 'README.md']:
    if os.path.exists(os.path.join(S, f)): shutil.copy(os.path.join(S, f), D)
jsf = os.path.join(W, 'build_main.js'); open(jsf, 'w', encoding='utf-8').write(js)
errs = lint_es5(js, 'index.js') + lint_es5(rd('sw.js'), 'sw.js')
chk = subprocess.run(['node', '--check', jsf], capture_output=True, text=True)
chk2 = subprocess.run(['node', '--check', os.path.join(D, 'sw.js')], capture_output=True, text=True)
acn = subprocess.run(['node', '-e', 'var a=require("/opt/node-tools/node_modules/acorn"),fs=require("fs");a.parse(fs.readFileSync(process.argv[1],"utf8"),{ecmaVersion:5});', jsf], capture_output=True, text=True)
if acn.returncode: errs.append('ACORN ES5: ' + acn.stderr[-300:])
size = os.path.getsize(os.path.join(D, 'index.html'))
v1 = re.search(r'APPVER="([^"]+)"', html).group(1); v2 = re.search(r"VER = '([^']+)'", open(os.path.join(D, 'sw.js')).read()).group(1); v3 = json.load(open(os.path.join(D, 'version.json')))['v']
print('VER', VER, 'index.html', size, 'bytes', 'zs', os.path.getsize(os.path.join(D, 'lang-zs.json')), 'en', os.path.getsize(os.path.join(D, 'lang-en.json')))
print('keys', len(K), 'single-quoted CJK:', sorted(sq)[:30])
ok = True
if errs: print('ES5 LINT:', errs[:20]); ok = False
if chk.returncode or chk2.returncode: print('NODE CHECK FAIL', chk.stderr[:800], chk2.stderr[:400]); ok = False
if size >= 183 * 1024: print('TOO BIG'); ok = False
if not (v1 == v2 == v3 == VER): print('VERSION MISMATCH', v1, v2, v3); ok = False
print('BUILD OK' if ok else 'BUILD FAILED'); sys.exit(0 if ok else 1)
