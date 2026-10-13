import asyncio, subprocess, time, re, json
from playwright.async_api import async_playwright
D='/tmp/claude-0/upd'
srv = subprocess.Popen(['python3','-m','http.server','8768','-d',D],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
old = json.load(open(D+'/version.json'))['v']
def setver(a,b):
    for f in ['index.html','sw.js','version.json']:
        p=D+'/'+f; s=open(p,encoding='utf-8').read().replace(a,b); open(p,'w',encoding='utf-8').write(s)
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width':390,'height':844})
    await ctx.route(re.compile(r'https://.*'), lambda r: r.fulfill(status=500, body='x'))
    pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto('http://localhost:8768/index.html'); await pg.wait_for_timeout(2500)
    print('v0', await pg.evaluate('APPVER'), 'sw', await pg.evaluate('!!navigator.serviceWorker.controller'))
    setver(old,'9.9.TEST')
    await pg.evaluate("spk.on=true; checkUpdate(0)"); await pg.wait_for_timeout(1500)
    print('busy -> bar only', await pg.evaluate("!!document.getElementById('updbar')"), await pg.evaluate('APPVER'))
    async with pg.expect_navigation(timeout=15000):
        await pg.evaluate("spk.on=false; render()")
    await pg.wait_for_timeout(2500)
    print('after idle', await pg.evaluate('APPVER'), pg.url)
    setver('9.9.TEST','9.9.NEW')
    async with pg.expect_navigation(timeout=15000):
        await pg.evaluate("checkUpdate(0)")
    await pg.wait_for_timeout(2000)
    print('idle auto', await pg.evaluate('APPVER'))
    print('caches', await pg.evaluate("caches.keys()"))
    # 離線：已快取能開
    await ctx.set_offline(True)
    await pg.reload(); await pg.wait_for_timeout(1500)
    print('offline ok', await pg.evaluate("document.querySelectorAll('#app .card').length>0"), await pg.evaluate('APPVER'))
    print('errs', errs); await b.close()
asyncio.run(main()); srv.terminate()
