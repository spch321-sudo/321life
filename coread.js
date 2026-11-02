/* 321生命操練 · 一起共讀（投影到別人的手機）
   帶領者開房間 → 得到 6 位數共讀碼／連結／QR；弟兄姊妹打開後，畫面跟著帶領者切到同一個畫面、同一個位置。
   只同步「在哪一個畫面、捲到哪裡、點／唸到哪一句」；個人填寫的檢視表、操練表、日記、健檢內容、設定、小智對話都不同步。
   傳輸：peerjs.min.js（相容 PeerJS 介面的 Cloudflare 中繼站連線層）。ES5。 */
(function () {
  var PEER_JS = ['peerjs.min.js?v=' + (typeof APPVER !== 'undefined' ? APPVER : '1')];
  var QR_JS = ['https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js', 'https://unpkg.com/qrcode-generator@1.4.4/qrcode.js', 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'];
  var PFX = 'lf321-', FOLLOW_COOL = 8000;
  var TX = {
    zh: { title: '一起共讀', desc: '開一個共讀房間，把共讀碼或連結傳給弟兄姊妹。他們打開後，手機畫面會跟著你切到同一個畫面、捲到同一個位置；你朗讀或點一句，大家的畫面也會一起亮起來。你填寫的檢視表、操練表、日記和健檢內容是個人的，不會被分享。', host: '開共讀房間（我來帶領）', join: '加入', codePH: '輸入 6 位數共讀碼', orJoin: '或加入別人的共讀', code: '共讀碼', people: '已有 {0} 人加入', waiting: '等待弟兄姊妹加入…', invite: '傳送邀請', copyLink: '複製連結', end: '結束共讀', leave: '離開共讀', inviteMsg: '📡 一起來共讀《321生命操練》！\n點連結加入：{0}\n或打開 App 按右上角「📡」輸入共讀碼：{1}', following: '跟著帶領共讀', paused: '你自己操作了 · 點這裡回到帶領者', connecting: '連線中…', hostChip: '共讀 {0} · {1} 人', hostNoSync: '共讀 {0} · 此頁不同步', elsewhere: '帶領者在其他頁面 · 等他回來', ended: '共讀已結束', joined: '已加入共讀，畫面會跟著帶領者', noRtc: '這支手機的瀏覽器不支援共讀，請改用 Chrome 或 Safari', loadErr: '共讀功能載入失敗，請確認網路後再試', badCode: '請輸入 6 位數共讀碼', notFound: '找不到這個共讀房間，請確認共讀碼，或請帶領者重新開房間', followOnly: '你正在跟著共讀', back2: '回到帶領者', tip: '提示：帶領者的手機請保持 App 開著、螢幕不要關，大家才會一直同步。', qrTip: '用手機相機掃描加入', btn: '共讀', joinedOne: '有一位弟兄姊妹加入共讀', hostLeft: '帶領者暫時離線，正在重新連線…', close: '關閉', scrT: '🖥 投影螢幕' },
    zs: { title: '一起共读', desc: '开一个共读房间，把共读码或链接传给弟兄姊妹。他们打开后，手机画面会跟着你切到同一个画面、滚动到同一个位置；你朗读或点一句，大家的画面也会一起亮起来。你填写的检视表、操练表、日记和健检内容是个人的，不会被分享。', host: '开共读房间（我来带领）', join: '加入', codePH: '输入 6 位数共读码', orJoin: '或加入别人的共读', code: '共读码', people: '已有 {0} 人加入', waiting: '等待弟兄姊妹加入…', invite: '发送邀请', copyLink: '复制链接', end: '结束共读', leave: '离开共读', inviteMsg: '📡 一起来共读《321生命操练》！\n点链接加入：{0}\n或打开 App 按右上角「📡」输入共读码：{1}', following: '跟着带领共读', paused: '你自己操作了 · 点这里回到带领者', connecting: '连接中…', hostChip: '共读 {0} · {1} 人', hostNoSync: '共读 {0} · 此页不同步', elsewhere: '带领者在其他页面 · 等他回来', ended: '共读已结束', joined: '已加入共读，画面会跟着带领者', noRtc: '这支手机的浏览器不支持共读，请改用 Chrome 或 Safari', loadErr: '共读功能加载失败，请确认网络后再试', badCode: '请输入 6 位数共读码', notFound: '找不到这个共读房间，请确认共读码，或请带领者重新开房间', followOnly: '你正在跟着共读', back2: '回到带领者', tip: '提示：带领者的手机请保持 App 开着、屏幕不要关，大家才会一直同步。', qrTip: '用手机相机扫描加入', btn: '共读', joinedOne: '有一位弟兄姊妹加入共读', hostLeft: '带领者暂时离线，正在重新连接…', close: '关闭', scrT: '🖥 投影屏幕' },
    en: { title: 'Read together', desc: 'Open a room and send the room code or link to others. When they open it, their phones follow you to the same screen and scroll position; when you read aloud or tap a sentence, it lights up on everyone’s screen. Your own check-up scores, practice answers, journal and Life Check text stay private and are never shared.', host: 'Open a room (I’ll lead)', join: 'Join', codePH: 'Enter the 6-digit room code', orJoin: 'Or join someone else’s room', code: 'Room code', people: '{0} joined', waiting: 'Waiting for others to join…', invite: 'Send invite', copyLink: 'Copy link', end: 'End session', leave: 'Leave', inviteMsg: '📡 Come practice together in 321 Life Practice!\nTap to join: {0}\nOr open the app, tap “📡” at the top and enter code {1}', following: 'Following the leader', paused: 'You moved on your own · tap to return to the leader', connecting: 'Connecting…', hostChip: 'Room {0} · {1}', hostNoSync: 'Room {0} · page not shared', elsewhere: 'Leader is on another page · waiting', ended: 'Reading session ended', joined: 'Joined — your screen will follow the leader', noRtc: 'This browser cannot join a reading room. Please use Chrome or Safari.', loadErr: 'Could not load reading-together. Check your connection and try again.', badCode: 'Please enter the 6-digit room code', notFound: 'Room not found. Check the code, or ask the leader to open a new room.', followOnly: 'You are following', back2: 'Back to leader', tip: 'Tip: the leader should keep the app open with the screen on so everyone stays in sync.', qrTip: 'Scan with a phone camera to join', btn: 'Together', joinedOne: 'Someone joined the room', hostLeft: 'The leader is offline for a moment — reconnecting…', close: 'Close', scrT: '🖥 Projector screen' }
  };
  function X(k) { var l = (typeof L === 'function' ? L() : 'zh'), s = (TX[l] || TX.zh)[k] || TX.zh[k] || k; for (var i = 1; i < arguments.length; i++) s = s.replace('{' + (i - 1) + '}', arguments[i]); return s; }
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ss(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k) || 'null'); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function $i(id) { return document.getElementById(id); }

  var loaded = {};
  function loadJs(urls, test, cb) {
    if (test()) { cb(true); return; } var i = 0;
    (function nx() {
      if (i >= urls.length) { cb(false); return; } var u = urls[i++];
      if (loaded[u]) { setTimeout(function () { cb(test()); }, 0); return; }
      var s = document.createElement('script'); s.src = u; s.async = true;
      s.onload = function () { loaded[u] = 1; if (test()) cb(true); else nx(); }; s.onerror = function () { nx(); };
      document.head.appendChild(s);
    })();
  }

  /* ---------- 狀態 ---------- */
  var C = { role: '', code: '', peer: null, conns: [], host: null, last: null, retry: 0, rt: null, manualAt: 0, ptEl: null, status: '', want: null, np: 0, navAt: 0, defer: 0 };
  function baseUrl() { return location.origin + location.pathname; }
  function joinUrl(code) { return baseUrl() + '?join=' + code; }
  function newCode() { var c = ''; for (var i = 0; i < 6; i++) c += Math.floor(Math.random() * 10); return c.charAt(0) === '0' ? '1' + c.slice(1) : c; }
  function live() { var o = []; for (var i = 0; i < C.conns.length; i++) if (C.conns[i].open) o.push(C.conns[i]); return o; }
  function isScr() { return !!window.CR_SCREEN; }

  /* ---------- 頁面定位：只認「哪一個畫面」，個人頁面回 null ---------- */
  function selKey(S) { var o = []; if (!S || !S.sel) return ''; for (var i = 0; i < GROUPS.length; i++) if (S.sel.indexOf(GROUPS[i].id) > -1) o.push(GROUPS[i].id); return o.join(','); }
  function crPage() {
    if (typeof state === 'undefined' || !state) return null;
    if ($i('setsheet') || (typeof XZ !== 'undefined' && XZ.open)) return null;
    var tb = state.tab;
    if (tb === 'home') return { tb: 'home' };
    if (tb === 'check') return (typeof ck !== 'undefined' && ck.show) ? null : { tb: 'check' };
    if (tb === 'exam' || tb === 'train') { var S = state[tb]; if (!S || S.done) return null; return { tb: tb, sel: selKey(S) }; }
    return null; /* growth／journal：個人紀錄，不同步 */
  }
  function ratio() { var mx = document.documentElement.scrollHeight - (window.innerHeight || 600); return mx > 0 ? Math.max(0, Math.min(1, Math.round(window.pageYOffset / mx * 1000) / 1000)) : 0; }
  function inApp(el) { var n = el; while (n && n !== document) { if (n === app) return true; n = n.parentNode; } return false; }

  /* ---------- 帶領者 ---------- */
  function host(code, quiet) {
    loadJs(PEER_JS, function () { return !!window.Peer; }, function (ok) {
      if (!ok) { toast(X('loadErr')); return; }
      teardown(); C.role = 'host'; C.code = code || newCode(); C.status = 'connecting'; ss('cr321', { r: 'host', c: C.code }); chip(); closeSheet();
      var p = C.peer = new Peer(PFX + C.code, { debug: 0 });
      p.on('open', function () { C.retry = 0; C.status = 'ok'; chip(); if (!quiet) sheet(); snap(true); });
      p.on('connection', function (c) {
        C.conns.push(c);
        c.on('open', function () { chip(); toast(X('joinedOne')); paintCount(); if (C.last) try { c.send(C.last); } catch (e) { } });
        c.on('close', function () { drop(c); }); c.on('error', function () { drop(c); });
      });
      p.on('disconnected', function () { if (C.role === 'host' && !p.destroyed) setTimeout(function () { try { p.reconnect(); } catch (e) { } }, 1500); });
      p.on('error', function (e) {
        if (C.role !== 'host') return;
        if (e && e.type === 'unavailable-id') { if (C.retry++ < 25) { C.status = 'connecting'; chip(); clearTimeout(C.rt); C.rt = setTimeout(function () { host(C.code, true); }, 3000); } else { toast(X('loadErr')); end(); } return; }
        if (e && (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error' || e.type === 'socket-closed')) { clearTimeout(C.rt); C.rt = setTimeout(function () { if (C.role === 'host') host(C.code, true); }, 4000); }
      });
    });
  }
  function drop(c) { var o = []; for (var i = 0; i < C.conns.length; i++) if (C.conns[i] !== c) o.push(C.conns[i]); C.conns = o; chip(); paintCount(); }
  function bcast(m) { if (C.role !== 'host') return; m.t = 'st'; m.ts = Date.now(); C.last = m; var cs = live(); for (var i = 0; i < cs.length; i++) try { cs[i].send(m); } catch (e) { } }
  /* ann＝換頁／重畫後：個人頁面也要告訴大家「帶領者在別處」；捲動時個人頁面就不送 */
  function snap(ann) {
    if (C.role !== 'host') return; var p = crPage();
    if (!p) { if (ann) bcast({ np: 1 }); chip(); return; }
    p.f = ratio(); bcast(p); chip();
  }
  function mark(el, hl) {
    if (C.role !== 'host' || !el || !el.getAttribute) return; var k = el.getAttribute('data-k'); if (k == null || !inApp(el)) return;
    var p = crPage(); if (!p) return; var all = app.querySelectorAll('.sent'), n = 0;
    for (var i = 0; i < all.length; i++) if (all[i].getAttribute('data-k') === k) n++;
    p.f = ratio(); p.k = k; p.s = +el.getAttribute('data-s') || 0; p.n = n; p.hl = hl ? 1 : 0; bcast(p);
  }
  var scT = null;
  window.addEventListener('scroll', function () {
    if (C.role === 'host') { if (typeof spk !== 'undefined' && spk.on) return; clearTimeout(scT); scT = setTimeout(function () { snap(false); }, 250); }
  }, { passive: true });
  function userMove() { if (C.role === 'follow' && !isScr()) { C.manualAt = Date.now(); chip(); } }
  window.addEventListener('touchmove', userMove, { passive: true }); window.addEventListener('wheel', userMove, { passive: true });
  document.addEventListener('click', function (e) {
    if (C.role !== 'follow' || isScr()) return; var n = e.target;
    while (n && n !== document) { if (n.id === 'crchip' || n.id === 'sheet' || n.id === 'crTop' || (n.className && String(n.className).indexOf('toast') === 0)) return; n = n.parentNode; }
    C.manualAt = Date.now(); chip();
  }, true);

  /* ---------- 跟隨者 ---------- */
  function join(code) {
    code = String(code || '').replace(/\D/g, ''); if (code.length !== 6) { toast(X('badCode')); return; }
    loadJs(PEER_JS, function () { return !!window.Peer; }, function (ok) {
      if (!ok) { toast(X('loadErr')); return; }
      teardown(); C.role = 'follow'; C.code = code; C.status = 'connecting'; C.first = true; C.misses = 0; C.manualAt = 0; ss('cr321', { r: 'follow', c: code, s: isScr() ? 1 : 0 }); chip(); closeSheet();
      var p = C.peer = new Peer({ debug: 0 });
      p.on('open', function () { dial(); });
      p.on('disconnected', function () { if (C.role === 'follow' && !p.destroyed) setTimeout(function () { try { p.reconnect(); } catch (e) { } }, 1500); });
      p.on('error', function (e) {
        if (C.role !== 'follow') return;
        if (e && e.type === 'peer-unavailable') { C.misses++; if (C.first && C.misses >= 3) { toast(X('notFound')); leave(true); return; } C.status = 'connecting'; chip(); redial(4000); return; }
        redial(4000);
      });
    });
  }
  function redial(ms) { clearTimeout(C.rt); C.rt = setTimeout(function () { if (C.role === 'follow') dial(); }, ms || 3000); }
  function dial() {
    var p = C.peer; if (!p || p.destroyed || C.role !== 'follow') return;
    if (p.disconnected) { try { p.reconnect(); } catch (e) { } redial(3000); return; }
    try { if (C.host) C.host.close(); } catch (e) { }
    var c = C.host = p.connect(PFX + C.code, { reliable: true });
    var to = setTimeout(function () { if (!c.open && C.role === 'follow' && C.host === c) { try { c.close(); } catch (e) { } redial(1000); } }, 12000);
    c.on('open', function () { clearTimeout(to); C.misses = 0; C.lastRx = Date.now(); C.status = 'ok'; if (C.first) { C.first = false; toast(X('joined')); } chip(); });
    c.on('data', function (m) { C.lastRx = Date.now(); if (C.status !== 'ok') { C.status = 'ok'; chip(); } if (!m) return; if (m.t === 'st') apply(m); else if (m.t === 'end') leave(); });
    c.on('close', function () { clearTimeout(to); if (C.role === 'follow' && C.host === c) { C.status = 'lost'; chip(); redial(2500); } });
    c.on('error', function () { });
  }
  function localBusy() {
    var a = document.activeElement;
    return !!($i('setsheet') || (typeof XZ !== 'undefined' && XZ.open) || (a && /TEXTAREA|INPUT|SELECT/.test(a.tagName) && !$i('crin')) || ($i('sheet') && !$i('crsheet')));
  }
  function free() { return !C.manualAt || Date.now() - C.manualAt > FOLLOW_COOL; }
  /* force＝按「回到帶領者」：不管剛才有沒有自己操作 */
  function apply(m, force) {
    if (C.role !== 'follow' || !m) return; C.want = m;
    if (force) C.manualAt = 0;
    if (m.np) { C.np = 1; chip(); return; } C.np = 0;
    if (!force && !free()) { chip(); return; }
    if (localBusy()) { C.defer = 1; return; }
    var cur = crPage(), same = cur && cur.tb === m.tb && (m.tb === 'home' || m.tb === 'check' || cur.sel === m.sel);
    if (!same) {
      if (Date.now() - C.navAt < 350) return; C.navAt = Date.now();
      if (typeof stopAll === 'function') stopAll();
      if (m.tb === 'exam' || m.tb === 'train') {
        var S = state[m.tb], ids = String(m.sel || '').split(','), sel = [];
        for (var i = 0; i < GROUPS.length; i++) if (ids.indexOf(GROUPS[i].id) > -1) sel.push(GROUPS[i].id);
        S.sel = sel; S.done = null;
      }
      if (m.tb === 'check' && typeof ck !== 'undefined') ck.show = null;
      if (state.tab !== m.tb) go(m.tb); else { render(); window.scrollTo(0, 0); }
      return; /* render 完會再呼叫 rendered() → apply */
    }
    C.defer = 0; point(force);
  }
  function findSent(m) {
    if (m.k == null) return null; var all = app.querySelectorAll('.sent'), grp = [], i;
    for (i = 0; i < all.length; i++) if (all[i].getAttribute('data-k') === m.k) grp.push(all[i]);
    if (!grp.length) return null;
    for (i = 0; i < grp.length; i++) if (+grp[i].getAttribute('data-s') === m.s && grp.length === m.n) return grp[i];
    return grp[Math.min(grp.length - 1, Math.round(m.n > 1 ? m.s / (m.n - 1) * (grp.length - 1) : 0))];
  }
  function clearPt() { var o = document.querySelectorAll('.cr-pt'); for (var i = 0; i < o.length; i++) o[i].className = o[i].className.replace(/\s*cr-pt/g, ''); C.ptEl = null; }
  function scrollTo_(y) { try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, y); } }
  function point(force) {
    var m = C.want; if (C.role !== 'follow' || !m || m.np) return; var e = findSent(m);
    clearPt();
    if (e && m.hl) { e.className += ' cr-pt'; C.ptEl = e; }
    if (force || free()) {
      C.manualAt = 0;
      if (e) { try { e.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (x) { e.scrollIntoView(); } }
      else { var mx = document.documentElement.scrollHeight - (window.innerHeight || 600); scrollTo_(Math.round(Math.max(0, mx) * (m.f || 0))); }
    }
    chip();
  }

  /* 心跳：帶領者每 5 秒報平安；跟隨者 15 秒沒收到就重新連線 */
  setInterval(function () {
    if (C.role === 'host') { var cs = live(); for (var i = 0; i < cs.length; i++) try { cs[i].send({ t: 'hb' }); } catch (e) { } }
    else if (C.role === 'follow') {
      if (C.host && C.lastRx && Date.now() - C.lastRx > 15000) { C.lastRx = 0; C.status = 'lost'; chip(); dial(); }
      if (C.defer && C.want && !localBusy()) { C.defer = 0; apply(C.want); }
    }
  }, 5000);
  window.addEventListener('pagehide', function () { if (C.role === 'host') { var cs = live(); for (var i = 0; i < cs.length; i++) try { cs[i].send({ t: 'hb' }); } catch (e) { } } });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && C.role === 'follow' && C.status !== 'ok') dial(); if (!document.hidden && C.role === 'host' && C.peer && C.peer.disconnected) try { C.peer.reconnect(); } catch (e) { } });

  /* ---------- 結束 ---------- */
  function teardown() { clearTimeout(C.rt); try { if (C.peer) C.peer.destroy(); } catch (e) { } C.peer = null; C.conns = []; C.host = null; C.want = null; C.np = 0; clearPt(); }
  function end() { var cs = live(); for (var i = 0; i < cs.length; i++) try { cs[i].send({ t: 'end' }); } catch (e) { }
    setTimeout(endNow, cs.length ? 300 : 0); }
  function endNow() { teardown(); C.role = ''; C.code = ''; C.last = null; ss('cr321', null); chip(); closeSheet(); toast(X('ended')); }
  function leave(quiet) { teardown(); C.role = ''; C.code = ''; C.manualAt = 0; ss('cr321', null); chip(); closeSheet(); if (!quiet) toast(X('ended')); }

  /* ---------- 畫面 ---------- */
  function chip() {
    var el = $i('crchip');
    if (!C.role) { if (el) el.parentNode.removeChild(el); return; }
    if (!el) { el = document.createElement('button'); el.id = 'crchip'; el.className = 'crchip'; el.onclick = function () { if (C.role === 'follow' && (C.manualAt || C.np)) { if (C.want) apply(C.want, true); return; } sheet(); }; document.body.appendChild(el); }
    var t, cls = 'crchip';
    if (C.role === 'host') { if (C.status !== 'ok') t = X('connecting'); else if (!crPage()) t = X('hostNoSync', C.code); else t = X('hostChip', C.code, live().length); }
    else if (C.status !== 'ok') { t = C.status === 'lost' ? X('hostLeft') : X('connecting'); cls += ' wait'; }
    else if (C.np) { t = X('elsewhere'); cls += ' wait'; }
    else if (C.manualAt) { t = X('paused'); cls += ' off'; }
    else t = X('following');
    el.className = cls + (C.role === 'host' ? ' host' : ''); el.innerHTML = '<span class="dot"></span>📡 ' + E(t);
    el.style.display = isScr() ? 'none' : '';
  }
  function qrInto(id, text) {
    loadJs(QR_JS, function () { return typeof window.qrcode === 'function'; }, function (ok) {
      var box = $i(id); if (!box || !ok) { if (box) box.style.display = 'none'; return; }
      try { var q = qrcode(0, 'M'); q.addData(text); q.make(); box.innerHTML = q.createImgTag(5, 10); } catch (e) { box.style.display = 'none'; }
    });
  }
  function paintCount() { var e = $i('crcount'); if (e) { var n = live().length; e.textContent = n ? X('people', n) : X('waiting'); } }
  function sheet() {
    var h = '<div class="sheet-title">📡 ' + E(X('title')) + '<button class="sheet-x" data-cr="close" aria-label="' + E(X('close')) + '">✕</button></div>';
    if (C.role === 'host') {
      var u = joinUrl(C.code);
      h += '<div class="cr-k">' + E(X('code')) + '</div><div class="cr-code">' + E(C.code.slice(0, 3) + ' ' + C.code.slice(3)) + '</div>' +
        '<div class="cr-qr" id="crqr"></div><div class="small cr-c">' + E(X('qrTip')) + '</div>' +
        '<div class="cr-count" id="crcount"></div>' +
        '<div class="cr-acts"><button class="btn new" data-cr="invite">↗ ' + E(X('invite')) + '</button><button class="btn ghost" data-cr="copy">⧉ ' + E(X('copyLink')) + '</button></div>' +
        (window.CR_SCR_UI ? CR_SCR_UI(function () { return X('title'); }, '') : '') + '<div class="small cr-tip">' + E(X('tip')) + '</div>' +
        '<div class="cr-acts"><button class="btn ghost" data-cr="end">■ ' + E(X('end')) + '</button><button class="btn ghost" data-cr="close">' + E(X('close')) + '</button></div>';
      window.__crScrU = baseUrl() + '?join=' + C.code + '&screen=1'; openSheet(h, 'crsheet'); paintCount(); qrInto('crqr', u); return;
    }
    if (C.role === 'follow') {
      h += '<div class="cr-k">' + E(X('followOnly')) + '</div><div class="cr-code">' + E(C.code.slice(0, 3) + ' ' + C.code.slice(3)) + '</div>' +
        '<div class="cr-acts"><button class="btn new" data-cr="back">' + E(X('back2')) + '</button><button class="btn ghost" data-cr="leave">' + E(X('leave')) + '</button></div>' +
        '<div class="cr-acts"><button class="btn ghost" data-cr="close">' + E(X('close')) + '</button></div>';
      openSheet(h, 'crsheet'); return;
    }
    h += '<div class="small cr-desc">' + E(X('desc')) + '</div>' +
      '<button class="btn new" data-cr="host">📡 ' + E(X('host')) + '</button>' +
      '<div class="cr-k" style="margin-top:6px">' + E(X('orJoin')) + '</div>' +
      '<div class="cr-join"><input id="crin" type="tel" inputmode="numeric" maxlength="7" autocomplete="off" placeholder="' + E(X('codePH')) + '"><button class="btn new" data-cr="join">' + E(X('join')) + '</button></div>' +
      '<div class="cr-acts"><button class="btn ghost" data-cr="close">' + E(X('close')) + '</button></div>';
    openSheet(h, 'crsheet'); var inp = $i('crin');
    if (inp) inp.onkeydown = function (e) { if (e.keyCode === 13) join(inp.value); };
  }
  document.addEventListener('click', function (e) {
    var n = e.target; while (n && n !== document && !(n.getAttribute && n.getAttribute('data-cr'))) n = n.parentNode; if (!n || n === document) return;
    var a = n.getAttribute('data-cr');
    if (a === 'host') { closeSheet(); host(); }
    else if (a === 'join') { var i = $i('crin'); join(i ? i.value : ''); }
    else if (a === 'invite') { shareText(X('inviteMsg', joinUrl(C.code), C.code)); }
    else if (a === 'copy') { copyText(joinUrl(C.code)); }
    else if (a === 'end') end();
    else if (a === 'leave') leave();
    else if (a === 'back') { closeSheet(); if (C.want) apply(C.want, true); }
    else if (a === 'close') { closeSheet(); if (C.role === 'host') snap(true); }
  }, false);

  /* 頂端列 📡 按鈕（每個畫面都有）；點了開共讀面板 */
  function topBtn() {
    var b = $i('crTop'), tools = document.querySelector('.tools');
    if (!b) { if (!tools) return; b = document.createElement('button'); b.className = 'ib'; b.id = 'crTop'; b.textContent = '📡'; tools.insertBefore(b, tools.firstChild); }
    b.setAttribute('aria-label', X('title'));
    if (!b.__cr) { b.__cr = 1; b.onclick = function () { if ($i('crsheet')) closeSheet(); else sheet(); }; }
  }
  function relabel() { var b = $i('crTop'); if (b) b.setAttribute('aria-label', X('title')); chip(); }

  /* ---------- 給主程式呼叫的接口 ---------- */
  window.CR = {
    on: function () { return !!C.role; },
    role: function () { return C.role; },
    sheet: sheet, join: join, host: host, end: end, leave: leave, page: crPage,
    text: function (k) { return X(k); },
    /* 帶領者：朗讀走到哪一句、點了哪一句 */
    mark: function (el, hl) { mark(el, hl); },
    /* 每次畫面重畫之後（render → afterRender） */
    rendered: function () {
      topBtn(); relabel();
      if (C.role === 'host') setTimeout(function () { snap(true); }, 120);
      else if (C.role === 'follow') setTimeout(function () { if (C.want) { if (free() && !C.want.np) apply(C.want); else if (C.want.k != null) { var e = findSent(C.want); clearPt(); if (e && C.want.hl) { e.className += ' cr-pt'; C.ptEl = e; } } } chip(); }, 80);
    },
    /* 跟隨者自己點、捲動 */
    manual: function () { if (C.role === 'follow' && !isScr()) { C.manualAt = Date.now(); chip(); } }
  };
  /* 自動重連／網址帶 ?join= 直接加入（投影螢幕 ?screen=1 的旗標由 <head> 先記下） */
  var jm = /[?&]join=(\d{6})(?:&|$)/.exec(location.search), keep = ss('cr321');
  if (jm) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { } setTimeout(function () { join(jm[1]); }, 600); }
  else if (keep && keep.c) { if (keep.s) window.CR_SCREEN = true; setTimeout(function () { if (keep.r === 'host') host(keep.c, true); else join(keep.c); }, 600); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', topBtn); else topBtn();
})();
