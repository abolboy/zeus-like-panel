const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ---------- PNG encoder خالص ----------
function crc32(buf) {
  let t = crc32.t;
  if (!t) {
    t = crc32.t = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = t[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function makePng(size, pixelFn) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const c = pixelFn(x, y);
      raw[p++] = c[0]; raw[p++] = c[1]; raw[p++] = c[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}
function iconPixel(size) {
  const bg = [9, 12, 20], gold = [242, 183, 5];
  const m = size * 0.24;
  const gx0 = m, gx1 = size - m, gy0 = m, gy1 = size - m;
  const t = (gy1 - gy0) * 0.18;
  return function (x, y) {
    if (y >= size * 0.86 && y < size * 0.90 && x >= size * 0.12 && x < size * 0.88) return gold;
    if (x >= gx0 && x < gx1 && y >= gy0 && y < gy1) {
      if (y < gy0 + t) return gold;
      if (y >= gy1 - t) return gold;
      const span = (gy1 - t) - (gy0 + t);
      const prog = (y - (gy0 + t)) / span;
      const xc = (gx1 - t / 2) - prog * ((gx1 - t / 2) - (gx0 + t / 2));
      if (Math.abs(x - xc) <= t / 2) return gold;
    }
    return bg;
  };
}

fs.writeFileSync("public/icon-192.png", makePng(192, iconPixel(192)));
fs.writeFileSync("public/icon-512.png", makePng(512, iconPixel(512)));
console.log("✅ آیکون‌های PNG ساخته شدند");

// ---------- manifest ----------
const manifest = {
  name: "پنل زئوس",
  short_name: "زئوس",
  description: "پنل مدیریت کاربران و سرورها",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "any",
  dir: "rtl",
  lang: "fa",
  background_color: "#090c14",
  theme_color: "#090c14",
  icons: [
    { src: "/assets/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/assets/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
  ]
};
fs.writeFileSync("public/manifest.json", JSON.stringify(manifest, null, 2));
console.log("✅ manifest.json ساخته شد");

// ---------- service worker ----------
const sw = [
  'const CACHE = "zeus-pwa-v1";',
  'const PRECACHE = ["/", "/login", "/dashboard", "/assets/electric-fragments.css", "/assets/panel-extras.js", "/assets/zfx.js", "/assets/zex-i18n.js", "/assets/chart.umd.min.js", "/assets/analytics-widget.js", "/assets/phone-widget.js", "/assets/icon-192.png"];',
  'self.addEventListener("install", function (e) {',
  '  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE).catch(function () {}); }));',
  '  self.skipWaiting();',
  '});',
  'self.addEventListener("activate", function (e) {',
  '  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }));',
  '  self.clients.claim();',
  '});',
  'self.addEventListener("fetch", function (e) {',
  '  if (e.request.method !== "GET") return;',
  '  e.respondWith(caches.match(e.request).then(function (cached) {',
  '    const net = fetch(e.request).then(function (resp) {',
  '      if (resp && resp.ok && resp.type === "basic") {',
  '        const copy = resp.clone();',
  '        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });',
  '      }',
  '      return resp;',
  '    }).catch(function () { return cached; });',
  '    return cached || net;',
  '  }));',
  '});',
  'self.addEventListener("push", function (e) {',
  '  if (!e.data) return;',
  '  let d; try { d = e.data.json(); } catch (err) { d = { title: "Zeus", body: e.data.text() }; }',
  '  e.waitUntil(self.registration.showNotification(d.title || "Zeus", { body: d.body || "", icon: "/assets/icon-192.png", badge: "/assets/icon-192.png", vibrate: [100, 50, 100] }));',
  '});'
].join("\n");
fs.writeFileSync("public/sw-app.js", sw);
console.log("✅ sw-app.js ساخته شد");

// ---------- تگ‌های meta + ثبت SW در HTML ----------
function patchHtml(file) {
  let s = fs.readFileSync(file, "utf8");
  const meta = [
    '<link rel="manifest" href="/assets/manifest.json">',
    '<link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png">',
    '<link rel="apple-touch-icon" href="/assets/icon-192.png">',
    '<meta name="theme-color" content="#090c14">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    '<meta name="apple-mobile-web-app-title" content="زئوس">'
  ].join("\n    ");
  if (!s.includes('rel="manifest"')) {
    s = s.replace(/<head[^>]*>/i, function (m) { return m + "\n    " + meta; });
  }
  const swTag = '<script>if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/assets/sw-app.js").catch(function(){});});}</script>';
  if (!s.includes("sw-app.js")) {
    s = s.replace("</body>", swTag + "\n</body>");
  }
  fs.writeFileSync(file, s);
  console.log("✅ " + file + " پچ شد");
}
patchHtml("dashboard.html");
patchHtml("login.html");
