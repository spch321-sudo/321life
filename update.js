/* ---------- 自動更新（ES5）----------
   三道保險：① version.json 輪詢（不吃快取）② Service Worker 更新事件 ③ 新 SW 啟用時通知／重新導向舊頁面。
   正在上課、朗讀、錄影（isBusy()）時不打斷，只顯示更新條；空閒下來自動套用。
   防無限重整：同一個新版本最多自動重整一次，仍拿到舊檔就清快取硬更新一次，再不行只顯示更新條。 */
function isBusy(){return !!(spk.on||sayKey||chatBusy||ck.busy||ck.asking||hlOpen()||(document.activeElement&&/TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName)));}
var UPD = { reg: null, target: '', pending: false };
function ssGet(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }
function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { } }
function verFetch(ok, fail) {
  var x = new XMLHttpRequest();
  x.open('GET', 'version.json?t=' + now(), true);
  try { x.setRequestHeader('Cache-Control', 'no-cache'); } catch (e) { }
  x.timeout = 15000;
  x.onload = function () { if (x.status >= 200 && x.status < 300) { try { return ok(JSON.parse(x.responseText)); } catch (e) { } } if (fail) fail(); };
  x.onerror = x.ontimeout = function () { if (fail) fail(); };
  x.send();
}
function updBar(on) {
  var b = $("updbar");
  if (!on) { if (b) b.parentNode.removeChild(b); return; }
  if (!b) { b = document.createElement('div'); b.id = 'updbar'; b.className = 'updbar'; b.onclick = function () { applyUpdate(false); }; document.body.appendChild(b); }
  b.textContent = T("已有新版本，點這裡立即更新");
}
function reloadFresh() { if (window.__reloading) return; window.__reloading = 1; location.replace(location.pathname + '?u=' + now() + location.hash); }
function applyUpdate(hard) {
  updBar(false); toast(T("正在更新到新版本……"));
  ssSet('updTry', UPD.target || 'x');
  if (!hard && navigator.serviceWorker && UPD.reg) {
    try { if (UPD.reg.waiting) UPD.reg.waiting.postMessage('skip'); UPD.reg.update(); } catch (e) { }
    setTimeout(reloadFresh, 900); return;
  }
  ssSet('updHard', UPD.target || 'x');
  var done = 0, fin = function () { if (!done) { done = 1; reloadFresh(); } };
  try {
    if (window.caches && caches.keys) caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches['delete'](k); })); })['catch'](function () { });
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) navigator.serviceWorker.getRegistrations().then(function (rs) { for (var i = 0; i < rs.length; i++) rs[i].unregister(); setTimeout(fin, 300); }, fin);
  } catch (e) { }
  setTimeout(fin, 1500);
}
/* 發現新版：閒著就套用；忙著就先掛更新條，等 isBusy() 解除（render 會呼叫 updIdle）。
   同一版第二次遇到 → 硬更新；硬更新過仍是舊檔（CDN 尚未生效）→ 只提示。 */
function onNewVersion(v) {
  if (!v || v === APPVER) return;
  UPD.target = v;
  if (isBusy()) { UPD.pending = true; updBar(true); return; }
  if (ssGet('updHard') === v) { updBar(true); return; }
  applyUpdate(ssGet('updTry') === v);
}
function updIdle() {
  if (UPD.pending && isBusy()) { if (!UPD.t) UPD.t = setTimeout(function () { UPD.t = 0; updIdle(); }, 20000); return; } if (UPD.pending && !isBusy()) { UPD.pending = false; onNewVersion(UPD.target); } }
function checkUpdate(manual) {
  if (navigator.onLine === false) { if (manual) toast(T("網路連不上，請稍後再試")); return; }
  try { if (UPD.reg) UPD.reg.update(); } catch (e) { }
  verFetch(function (j) {
    if (j && j.v && j.v !== APPVER) onNewVersion(j.v);
    else if (manual) toast(T("已是最新版本"));
  }, function () { if (manual) toast(T("網路連不上，請稍後再試")); });
}
function initUpdate() {
  if (!/^https?:/.test(location.protocol)) return;
  if (/[?&]u=\d+/.test(location.search) && history.replaceState) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { } }
  if ('serviceWorker' in navigator) {
    var sw = navigator.serviceWorker;
    sw.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
      UPD.reg = reg;
      var track = function (w) { if (w) w.addEventListener('statechange', function () { if (w.state === 'installed' && sw.controller) checkUpdate(0); }); };
      track(reg.installing); track(reg.waiting);
      reg.addEventListener('updatefound', function () { track(reg.installing); });
    })['catch'](function () { });
    sw.addEventListener('message', function (e) { var d = e.data || {}; if (d.t === 'sw-updated' && d.v && d.v !== APPVER) onNewVersion(d.v); });
    sw.addEventListener('controllerchange', function () { if (UPD.target && !isBusy()) reloadFresh(); });
  }
  setTimeout(function () { checkUpdate(0); }, 2500);
  setInterval(function () { checkUpdate(0); }, 30 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') checkUpdate(0); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) checkUpdate(0); });
  window.addEventListener('online', function () { checkUpdate(0); });
}
