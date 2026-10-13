#!/usr/bin/env python3
"""多音字盤點：掃描 App 全部要朗讀的文字，列出每個多音字的上下文詞組與次數，
並標出還沒被 TTS_FIX 處理的詞，供人工（Claude）逐一判斷正確讀音後補進 TTS_FIX。
用法：python3 tools/polyphone_audit.py <內容資料夾或檔案...> [--js app/ext.js]
"""
import sys, os, re, json, collections
POLY = '長行重為差背得著數朝應傳教種中便樂和好少曾降處更調假藏參大說會重還將當相角識乾率省降給露血薄削剝殼塞'
def texts(paths):
    for p in paths:
        if os.path.isdir(p):
            for r, _, fs in os.walk(p):
                for f in fs:
                    if f.endswith(('.json', '.txt', '.md', '.js')): yield open(os.path.join(r, f), encoding='utf-8', errors='ignore').read()
        else: yield open(p, encoding='utf-8', errors='ignore').read()
def main():
    a = sys.argv[1:]; js = 'app/ext.js'
    if '--js' in a: i = a.index('--js'); js = a[i + 1]; a = a[:i] + a[i + 2:]
    fixed = set(re.findall(r"\[/\(?([^/\[\]()|]+?)\)?/g", open(js, encoding='utf-8').read())) if os.path.exists(js) else set()
    cnt = collections.Counter()
    for t in texts(a):
        for m in re.finditer('[一-鿿]{0,1}[' + POLY + '][一-鿿]{0,1}', t):
            w = m.group(0)
            if len(w) >= 2: cnt[w] += 1
    by = collections.defaultdict(list)
    for w, n in cnt.items():
        for ch in w:
            if ch in POLY: by[ch].append((w, n))
    for ch in POLY:
        if ch not in by: continue
        ws = sorted(by[ch], key=lambda x: -x[1])[:40]
        print(ch, '：', '、'.join(('✔' if any(w in f for f in fixed) else '') + '%s×%d' % (w, n) for w, n in ws))
if __name__ == '__main__': main()
