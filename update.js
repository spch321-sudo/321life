/* ---------- 自動更新（ES5）----------
   三道保險：① version.json 輪詢（不吃快取）② Service Worker 更新事件 ③ 新 SW 啟用時通知／重新導向舊頁面。
   正在上課、朗讀、錄影（isBusy()）時不打斷，只顯示更新條；空閒下來自動套用。
   防無限重整：同一個新版本最多自動重整一次，仍拿到舊檔就清快取硬更新一次，再不行只顯示更新條。 */
function isBusy(){return !!(spk.on||sayKey||chatBusy||ck.busy||ck.asking||hlOpen()||(document.activeElement&&/TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName)));}
/* ---------- 自動更新 AUPD（ES5，321 系 App 共用）----------
   偵測：載入後、回到前景、每 30 分鐘、恢復連線，讀 version.json（不吃快取）並呼叫 reg.update()。
   套用：偵測到新版，空閒時自動換新（先要求瀏覽器重抓主要檔案 → 通知新 SW 接手 → 重整），不必按。
        朗讀、錄音錄影、輸入框有未存內容、共讀、面板／工作室開著時只顯示「有新版本」更新條，空閒後自動套用。
   防無限重整：同一個新版只自動重整一次；仍是舊檔就清自家快取硬更新一次；再不行只留更新條（可點）。 */
var AUPD = (function () {
  var CFG = {
    ver: function () { return APPVER; },
    pfx: '321life-',
    sw: 'sw.js',
    busy: function () { return BUSY || isBusy(); },
    toast: function (m) { toast(m); },
    lang: function () { return (typeof L === 'function') ? L() : ''; },
    before: function () {  }
  };
  var U = { reg: null, target: '', pending: false, applying: 0, inited: 0 };
  var TX = {
    zh: { newVer: '有新版本，點一下立即更新', updating: '正在更新到新版…', latest: '目前已是最新版 v', found: '找到新版本，正在更新…', foundBusy: '找到新版本，忙完就會自動更新', netErr: '無法檢查更新，請確認網路', checking: '檢查更新中…', done: '已更新到最新版本' },
    zs: { newVer: '有新版本，点一下立即更新', updating: '正在更新到新版…', latest: '目前已是最新版 v', found: '找到新版本，正在更新…', foundBusy: '找到新版本，忙完就会自动更新', netErr: '无法检查更新，请确认网络', checking: '检查更新中…', done: '已更新到最新版本' },
    en: { newVer: 'A new version is ready. Tap to update', updating: 'Updating to the new version…', latest: 'You are on the latest version v', found: 'New version found, updating…', foundBusy: 'New version found. It will update when you are idle', netErr: 'Cannot check for updates. Please check your connection', checking: 'Checking for updates…', done: 'Updated to the latest version' }
  };
  function now() { return +new Date(); }
  function ver() { try { return String(CFG.ver()); } catch (e) { return ''; } }
  function lg() {
    var l = ''; try { l = CFG.lang() || ''; } catch (e) { }
    if (!l) l = document.documentElement.getAttribute('lang') || '';
    if (/^en/i.test(l)) return 'en';
    if (/hans|^zs|^sc|^zh-cn|^zh-sg/i.test(l)) return 'zs';
    return 'zh';
  }
  function T(k) { return (TX[lg()] || TX.zh)[k]; }
  function ssGet(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { } }
  function say(m) {
    if (CFG.toast) { try { CFG.toast(m); return; } catch (e) { } }
    var t = document.getElementById('aupd-toast');
    if (!t) {
      t = document.createElement('div'); t.id = 'aupd-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);max-width:86vw;background:rgba(30,30,30,.92);color:#fff;padding:10px 16px;border-radius:12px;font-size:15px;z-index:2147483000;text-align:center';
      document.body.appendChild(t);
    }
    t.textContent = m; t.style.display = 'block'; clearTimeout(say.tm); say.tm = setTimeout(function () { t.style.display = 'none'; }, 2600);
  }
  function busy() {
    try { if (CFG.busy && CFG.busy()) return true; } catch (e) { }
    try { if (window.CR) { var rl = window.CR.role; if (typeof rl === 'function') rl = rl(); if (rl || (typeof CR.on === 'function' && CR.on())) return true; } } catch (e) { }
    try { if (window.CR321 && CR321.on && CR321.on()) return true; } catch (e) { }
    try { if (window.MX && MX.busy && MX.busy()) return true; } catch (e) { }
    try { if (window.speechSynthesis && speechSynthesis.speaking) return true; } catch (e) { }
    try { var m = document.querySelectorAll('audio,video'); for (var i = 0; i < m.length; i++) { if (!m[i].paused && !m[i].ended && !m[i].muted && m[i].volume > 0) return true; } } catch (e) { }
    try {
      var a = document.activeElement;
      if (a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /^(text|search|url|email|tel|password|number|)$/i.test(a.type || '')) || a.isContentEditable) && (a.value || (a.isContentEditable && a.textContent))) return true;
    } catch (e) { }
    try { if (window.__recOn) return true; } catch (e) { }
    try { if (document.querySelector('.rw-mask,.hlsheet-mask,.gxs-ov.on,.spk-now')) return true; } catch (e) { }
    return false;
  }
  function bar(on) {
    var b = document.getElementById('updbar');
    if (!on) { if (b && b.parentNode) b.parentNode.removeChild(b); return; }
    if (!b) {
      b = document.createElement('div'); b.id = 'updbar'; b.className = 'updbar';
      b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483000;background:#B98A2E;color:#fff;font-weight:700;text-align:center;font-size:15px;cursor:pointer;padding:10px 16px;padding-top:calc(10px + env(safe-area-inset-top,0px))';
      b.onclick = function () { apply(ssGet('auTry') === U.target); };
      document.body.appendChild(b);
    }
    b.textContent = T('newVer');
  }
  function verFetch(ok, fail) {
    var x = new XMLHttpRequest();
    try { x.open('GET', 'version.json?t=' + now(), true); } catch (e) { if (fail) fail(); return; }
    try { x.setRequestHeader('Cache-Control', 'no-cache'); } catch (e) { }
    x.timeout = 15000;
    x.onload = function () { if (x.status >= 200 && x.status < 300) { try { return ok(JSON.parse(x.responseText)); } catch (e) { } } if (fail) fail(); };
    x.onerror = x.ontimeout = function () { if (fail) fail(); };
    x.send();
  }
  function reloadFresh() {
    if (window.__reloading) return; window.__reloading = 1;
    var s = location.search.replace(/([?&])u=\d+&?/, '$1').replace(/[?&]$/, '');
    s += (s ? '&' : '?') + 'u=' + now();
    try { location.replace(location.pathname + s + location.hash); } catch (e) { location.reload(); }
  }
  /* 換新檔之前先叫瀏覽器重抓主要檔案，免得重整後又讀到 HTTP 快取裡的舊檔 */
  function prefetch(cb) {
    var done = 0, fin = function () { if (!done) { done = 1; cb(); } };
    setTimeout(fin, 2500);
    try {
      var seen = {}, urls = [], add = function (u) { if (u && !seen[u]) { seen[u] = 1; urls.push(u); } };
      add(location.pathname); add(CFG.sw);
      var ss = document.getElementsByTagName('script');
      for (var i = 0; i < ss.length; i++) { if (ss[i].src && ss[i].src.indexOf(location.origin) === 0) add(ss[i].src); }
      Promise.all(urls.map(function (u) { return fetch(u, { cache: 'reload' })['catch'](function () { }); })).then(fin, fin);
    } catch (e) { fin(); }
  }
  /* 重整前先登出本 App 的 Service Worker：新舊 SW 交接的瞬間導覽請求會被舊 SW 卡住（實測 8 秒以上、
     甚至讀到舊頁），登出後導覽直接走網路，重整後新頁面會重新註冊乾淨的新 SW。 */
  function dropSW(done) {
    var fired = 0, fin = function () { if (!fired) { fired = 1; done(); } };
    setTimeout(fin, 1500);
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then(function (r) { return r && r.unregister(); }).then(fin, fin);
      else fin();
    } catch (e) { fin(); }
  }
  function apply(hard) {
    if (U.applying) return; U.applying = 1; setTimeout(function () { U.applying = 0; }, 12000);
    bar(false); say(T('updating'));
    ssSet('auTry', U.target || 'x'); if (hard) ssSet('auHard', U.target || 'x');
    try { CFG.before(); } catch (e) { }
    prefetch(function () {
      if (!hard) { dropSW(function () { setTimeout(reloadFresh, 100); }); return; }
      var jobs = [], go = function () { setTimeout(reloadFresh, 100); };
      try { if (window.caches && caches.keys) jobs.push(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return !CFG.pfx || k.indexOf(CFG.pfx) === 0; }).map(function (k) { return caches['delete'](k); })); })); } catch (e) { }
      try { if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) jobs.push(navigator.serviceWorker.getRegistration().then(function (r) { return r && r.unregister(); })); } catch (e) { }
      if (window.Promise) Promise.all(jobs).then(go, go); else go();
      setTimeout(go, 2000);
    });
  }
  /* 空閒才套用；同一版：第一次一般更新、第二次硬更新、硬更新過仍是舊檔就只留更新條 */
  function tick() {
    if (!U.pending || busy()) return;
    var v = U.target;
    if (ssGet('auHard') === v) { U.pending = false; bar(true); return; }
    apply(ssGet('auTry') === v);
  }
  function onNew(v) {
    if (!v || v === ver()) return;
    U.target = v; U.pending = true;
    if (busy()) { bar(true); return; }
    tick();
  }
  function check(manual) {
    if (navigator.onLine === false) { if (manual) say(T('netErr')); return; }
    if (manual) say(T('checking'));
    try { if (U.reg) { var up = U.reg.update(); if (up && up['catch']) up['catch'](function () { }); } } catch (e) { }
    verFetch(function (j) {
      var v = j && (j.v || j.version); v = v ? String(v) : '';
      if (v && v !== ver()) {
        if (manual) { U.target = v; U.pending = false; say(T('found')); apply(ssGet('auTry') === v); }
        else onNew(v);
      } else if (manual) say(T('latest') + ver());
    }, function () { if (manual) say(T('netErr')); });
  }
  function force() { U.target = U.target || 'force'; U.pending = false; apply(true); }
  function register() {
    if (!('serviceWorker' in navigator) || !/^https?:/.test(location.protocol)) return;
    var sw = navigator.serviceWorker;
    try {
      sw.register(CFG.sw, { updateViaCache: 'none' }).then(function (reg) {
        U.reg = reg;
        var track = function (w) { if (w) w.addEventListener('statechange', function () { if (w.state === 'installed' && sw.controller) check(0); }); };
        track(reg.installing); track(reg.waiting);
        reg.addEventListener('updatefound', function () { track(reg.installing); });
      })['catch'](function () { });
    } catch (e) { }
    /* 同網域的各 321 App 共用 origin，別支 App 的 SW 也可能廣播 sw-updated：只理會自己這支 sw.js 的通知，而且不直接相信版本字串，回頭讀 version.json 確認 */
    sw.addEventListener('message', function (e) {
      var d = e.data || {}; if (d.t !== 'sw-updated') return;
      try { var src = e.source && e.source.scriptURL; if (src && src !== new URL(CFG.sw, location.href).href) return; } catch (x) { }
      check(0);
    });
    sw.addEventListener('controllerchange', function () { if (U.target && !busy()) tick(); });
  }
  function init() {
    if (U.inited) return; U.inited = 1;
    if (!/^https?:/.test(location.protocol)) return;
    try { if (/[?&]u=\d+/.test(location.search) && history.replaceState) { var s = location.search.replace(/([?&])u=\d+&?/, '$1').replace(/[?&]$/, ''); history.replaceState(null, '', location.pathname + s + location.hash); } } catch (e) { }
    if (ssGet('auTry') && ssGet('auTry') === ver()) { ssSet('auTry', ''); ssSet('auHard', ''); setTimeout(function () { say(T('done')); }, 1200); }
    register();
    setTimeout(function () { check(0); }, 2500);
    setInterval(function () { check(0); }, 30 * 60 * 1000);
    setInterval(function () { if (U.pending) tick(); }, 15000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') check(0); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) check(0); });
    window.addEventListener('online', function () { check(0); });
  }
  return { init: init, check: check, force: force, tick: tick, busy: busy, ver: ver, state: U };
})();
AUPD.init();
var UPD = AUPD.state;
function ssGet(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }
function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { } }
function checkUpdate(manual) { AUPD.check(!!manual); }
function updIdle() { AUPD.tick(); }
function applyUpdate(hard) { if (hard) AUPD.force(); else AUPD.tick(); }
function onNewVersion(v) { if (v && v !== APPVER) { UPD.target = v; UPD.pending = true; AUPD.tick(); } }
function initUpdate() { }   /* AUPD 載入時已自行啟動（偵測、註冊 SW、計時器） */
