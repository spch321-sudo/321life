import asyncio, json, sys, re
from playwright.async_api import async_playwright
URL = sys.argv[1]; OUT = sys.argv[2]
WAV = open('tests/s1.wav', 'rb').read()
LONG_ZH = "### 先看見\n舊人有己常在不知不覺中作王。" + "我們要在每一件小事上操練無己，讓耶穌在裡面活。" * 8 + "\n\n> 不再是我，乃是基督在我裡面活著（加2:20）\n\n| 舊人 | 新人 |\n|---|---|\n| 辯解 | 認錯 |\n| 抱怨 | 感恩 |\n\n1. 停三秒禱告\n2. 說「謝謝你提醒我」\n"
LONG_EN = "### First, see\nThe old self often reigns without our noticing. " + "We practice no-self in every small thing so Jesus lives in us. " * 8 + "\n\n> It is no longer I that live, but Christ living in me (Galatians 2:20)\n\n| Old | New |\n|---|---|\n| Defend | Confess |\n\n1. Pause and pray\n2. Say thank you\n"
CK_JSON = {"title": "面子比關係重要嗎", "who": "新舊交戰", "picture": "你很累，也覺得委屈。但回嘴讓關係更遠。", "chain": [{"k": "感應", "old": "只聽到指責", "new": "聽到她也累了"}, {"k": "反應", "old": "她不體諒我", "new": "我們都需要被體諒"}, {"k": "回應", "old": "頂嘴、離開", "new": "「對不起，我來洗。」"}], "root": "我要被體諒、要面子。", "view": {"from": "她在找麻煩", "to": "神要我先謙卑"}, "area": "講", "fruit": {"lack": "強硬辯解", "grow": "溫柔、忍耐"}, "verses": [{"ref": "雅各書1:19", "text": "你們各人要快快的聽，慢慢的說，慢慢的動怒。"}], "steps": ["先向神認罪", "向太太道歉"], "tomorrow": "晚餐後主動洗碗。", "asks": ["我該怎麼開口？"], "prayer": "主啊，求你赦免我。奉主耶穌基督的名禱告，阿們。"}
calls = []
async def handle(route):
    req = route.request; url = req.url
    if 'azure-tts' in url:
        if FAILTTS[0]: return await route.fulfill(status=500, body='no')
        return await route.fulfill(status=200, body=WAV, content_type='audio/mpeg')
    body = json.loads(req.post_data or '{}'); calls.append(body)
    sysm = body.get('system', ''); last = body['messages'][-1]['content']
    en = 'English' in sysm and 'Write every word' in sysm
    if '只輸出一個 JSON' in sysm:
        return await route.fulfill(status=200, content_type='application/json', body=json.dumps({"content": [{"type": "text", "text": json.dumps(CK_JSON, ensure_ascii=False)}], "stop_reason": "end_turn"}))
    if '接著寫完' in last or 'continue exactly' in last or '接着写完' in last:
        t = ("\n3. 最後，凡事謝恩。\n\n**得勝的下一步：**今晚先道歉。" if not en else "\n3. Finally, give thanks.\n\n**Next step to overcome:** apologize tonight.")
        return await route.fulfill(status=200, content_type='application/json', body=json.dumps({"content": [{"type": "text", "text": t}], "stop_reason": "end_turn"}))
    t = LONG_EN if en else LONG_ZH
    sr = 'max_tokens' if len([c for c in calls if '只輸出一個 JSON' not in c.get('system', '')]) == 1 else 'end_turn'
    return await route.fulfill(status=200, content_type='application/json', body=json.dumps({"content": [{"type": "text", "text": t}], "stop_reason": sr}))
FAILTTS = [False]
async def run(b, lang):
    global calls; calls = []; FAILTTS[0] = False
    errs = []
    ctx = await b.new_context(viewport={'width': 375, 'height': 812}, service_workers='block')
    await ctx.add_init_script("if(!localStorage.getItem('r321-life-set'))localStorage.setItem('r321-life-set', JSON.stringify({lang:'%s',font:0,theme:'',voice:0,rate:0,human:true,aud:'adult'}))" % lang)
    pg = await ctx.new_page()
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and '500' not in m.text else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    await pg.route(re.compile(r'https://[^/]+\.workers\.dev.*'), handle)
    await pg.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'), lambda r: r.fulfill(status=200, body='', content_type='text/css'))
    await pg.goto(URL + '#home'); await pg.wait_for_timeout(600)
    R = {}
    # --- 畫線 ---
    s = pg.locator('.sent[data-k="h:gal"]').first
    await s.click(); await pg.wait_for_timeout(150)
    R['hl_created'] = await s.get_attribute('data-hl') == '1'
    await s.click(); await pg.wait_for_timeout(150)
    R['sheet'] = await pg.locator('#sheet').count() == 1
    await pg.click('.hlswatch[data-c="green"]'); await pg.wait_for_timeout(100)
    R['color'] = await s.get_attribute('data-color') == 'green'
    await pg.click('[data-ha="sp"][data-d="p"]'); await pg.wait_for_timeout(100)
    await pg.fill('#hlNote', 'note test' if lang == 'en' else '默想測試')
    await pg.screenshot(path=f'{OUT}/f-sheet-{lang}.png')
    await pg.click('[data-ha="save"]'); await pg.wait_for_timeout(150)
    R['note'] = await pg.locator('.hl-note').count() == 1
    # --- 畫線清單、回到原處 ---
    await pg.click('#tabs button[data-tab="journal"]'); await pg.click('[data-jmode="marks"]'); await pg.wait_for_timeout(150)
    R['marks'] = await pg.locator('.hitem').count() >= 1
    await pg.click('[data-mk="go"]'); await pg.wait_for_timeout(300)
    R['go_back'] = (await pg.evaluate('state.tab')) == 'home' and await pg.locator('.sent[data-k="h:gal"][data-hl]').count() >= 1
    # --- 朗讀（真人語音 mock）---
    await pg.click('#tabs button[data-tab="exam"]'); await pg.wait_for_timeout(200)
    await pg.click('#fabtts'); await pg.wait_for_timeout(700)
    R['spk_bar'] = await pg.locator('#spk').count() == 1
    R['reading'] = await pg.locator('.tts-reading').count() == 1
    idx0 = await pg.evaluate('spk.idx'); await pg.wait_for_timeout(2600)
    R['advance'] = (await pg.evaluate('spk.idx')) > idx0
    # 重畫中仍接得回標示
    await pg.evaluate('keepScroll()'); await pg.wait_for_timeout(200)
    R['rebind'] = await pg.locator('.tts-reading').count() == 1
    R['items']=await pg.evaluate('spk.items.length')
    await pg.click('#spk [data-spk="0"]'); await pg.wait_for_timeout(100)
    R['stopped'] = not await pg.evaluate('spk.on')
    # 失敗 → 內建語音
    FAILTTS[0] = True
    await pg.evaluate("window.__t=[];var _t=toast;toast=function(x){__t.push(x);_t(x)}")
    await pg.click('#fabtts'); await pg.wait_for_timeout(4500)
    _tt = await pg.evaluate('__t'); print('TOASTS', _tt)
    R['fallback_toast'] = any(('內建' in str(x) or '内建' in str(x) or 'built-in' in str(x)) for x in _tt)
    await pg.evaluate('stopAll()'); FAILTTS[0] = False
    # --- 朗讀文字整理 ---
    R['prep'] = await pg.evaluate("""[ttsPrep('要彼此相愛（林前12:27）。'), ttsPrep('馬太福音7:3說'), ttsPrep('天天數算主恩😀，與主同行'), ttsPrep('Read John 3:16 now (Rom 5:8).')]""")
    # --- 小智：截斷接續、收合、追問 ---
    await pg.click('#fabxz'); await pg.wait_for_timeout(200)
    await pg.fill('#chatIn', 'test question' if lang == 'en' else '怎樣操練無己？')
    await pg.click('[data-xa="send"]'); await pg.wait_for_timeout(1500)
    n1 = len(calls)
    R['continue_calls'] = n1 == 2
    txt = await pg.evaluate('CHAT[CHAT.length-1].text')
    R['joined'] = ('得勝的下一步' in txt or '得胜的下一步' in txt or 'Next step' in txt) and ('先看見' in txt or 'First, see' in txt or '先看见' in txt)
    R['md_table'] = await pg.locator('#chatlog table.mdtb').count() >= 1
    R['followups'] = await pg.locator('.fu-chip').count() == 6
    await pg.click('.fu-chip >> nth=0'); await pg.wait_for_timeout(1200)
    R['fold_old'] = await pg.locator('.msg.ai.fold').count() == 1
    await pg.click('[data-xa="foldall"]'); await pg.wait_for_timeout(200)
    R['fold_all'] = await pg.locator('.msg.ai.fold').count() == 2
    await pg.click('.msg-more >> nth=0'); await pg.wait_for_timeout(100)
    R['unfold'] = await pg.locator('.msg.ai.fold').count() == 1
    sys_en = calls[-1]['system']
    R['sys_lang'] = ('Write every word' in sys_en) if lang == 'en' else (('简体' in sys_en) if lang == 'zs' else ('繁體中文' in sys_en))
    await pg.screenshot(path=f'{OUT}/f-xz-{lang}.png')
    await pg.click('[data-xa="close"]')
    # --- 生命健檢 ---
    await pg.click('#tabs button[data-tab="check"]'); await pg.wait_for_timeout(150)
    await pg.fill('#c-ev', 'event'); await pg.fill('#c-thought', 'thought')
    await pg.click('[data-ck="run"]'); await pg.wait_for_timeout(800)
    R['ck_result'] = await pg.locator('.who').count() == 1 and await pg.locator('.sent[data-k^="c:check-"]').count() > 5
    await pg.click('[data-ckask]'); await pg.wait_for_timeout(1200)
    R['ck_chat'] = await pg.locator('.turn .ans').count() == 1 and await pg.locator('[data-cka="tts"]').count() == 1
    # --- 設定、字級、主題 ---
    await pg.click('#btnfont'); await pg.wait_for_timeout(100)
    R['font'] = await pg.evaluate("document.documentElement.classList.contains('fs-lg')")
    await pg.click('#btnset'); await pg.wait_for_timeout(100)
    await pg.click('[data-set="theme"][data-v="dark"]'); await pg.wait_for_timeout(100)
    R['theme'] = await pg.evaluate("document.documentElement.getAttribute('data-theme')") == 'dark'
    await pg.click('[data-set="font"][data-v="3"]'); await pg.wait_for_timeout(100)
    await pg.screenshot(path=f'{OUT}/f-set-{lang}.png')
    await pg.click('[data-sa="close"]') if await pg.locator('[data-sa="close"]').count() else None
    await pg.click('#tabs button[data-tab="exam"]'); await pg.wait_for_timeout(200)
    await pg.screenshot(path=f'{OUT}/f-xxl-{lang}.png')
    R['xxl_overflow'] = await pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    # 320 寬
    await pg.set_viewport_size({'width': 320, 'height': 640}); await pg.wait_for_timeout(200)
    R['w320_overflow'] = await pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    await pg.screenshot(path=f'{OUT}/f-320-{lang}.png')
    # 切換語言保留畫線（依語言分開）
    await pg.evaluate("switchLang('%s')" % ('en' if lang != 'en' else 'zh')); await pg.wait_for_timeout(600)
    R['lang_switched'] = await pg.evaluate("L()") == ('en' if lang != 'en' else 'zh')
    print(lang, json.dumps(R, ensure_ascii=False))
    print(lang, 'ERRORS', errs)
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        for lang in ['zh', 'zs', 'en']: await run(b, lang)
        await b.close()
asyncio.run(main())
