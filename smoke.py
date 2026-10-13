import asyncio, json, sys, re, os
from playwright.async_api import async_playwright
URL = sys.argv[1]; OUT = sys.argv[2]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        errs = []
        for lang in ['zh', 'zs', 'en']:
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, service_workers='block')
            await ctx.add_init_script("localStorage.setItem('r321-life-set', JSON.stringify({lang:'%s',font:0,theme:'',voice:0,rate:0,human:true,aud:'adult'}))" % lang)
            pg = await ctx.new_page()
            pg.on('console', lambda m, l=lang: errs.append((l, m.text)) if m.type == 'error' else None)
            pg.on('pageerror', lambda e, l=lang: errs.append((l, 'PAGEERROR ' + str(e))))
            await pg.route(re.compile(r'https://[^/]+\.workers\.dev.*'), lambda r: r.fulfill(status=500, body='x'))
            await pg.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'), lambda r: r.fulfill(status=200, body='', content_type='text/css'))
            await pg.goto(URL + '#home'); await pg.wait_for_timeout(800)
            await pg.screenshot(path=f'{OUT}/home-{lang}.png', full_page=False)
            for tab in ['check', 'exam', 'train', 'growth', 'journal']:
                await pg.click(f'#tabs button[data-tab="{tab}"]'); await pg.wait_for_timeout(250)
                await pg.screenshot(path=f'{OUT}/{tab}-{lang}.png', full_page=False)
            # 橫向溢出檢查
            ov = await pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            print(lang, 'overflow', ov, 'title', await pg.title())
            await ctx.close()
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
