/* 321生命操練 service worker — 更新版本時把 VERSION 加一 */
var VERSION = "321life-v1.3.0";
var SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "hero.jpg", "hero-720.jpg"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k.indexOf("321life-") === 0; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("message", function (e) {
  if (e.data === "skip") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  /* 頁面：先抓網路（拿到最新版），沒網路時用快取 */
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(VERSION).then(function (c) { c.put("index.html", copy); });
      return res;
    })["catch"](function () { return caches.match("index.html"); }));
    return;
  }

  /* 字型：用過一次就存起來，離線也能顯示 */
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open("321life-fonts").then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { c.put(req, res.clone()); return res; });
      });
    }));
    return;
  }

  /* 其他同站檔案：快取優先 */
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
  }
});
