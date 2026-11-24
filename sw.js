/* Шалгалтын анализ — service worker (утсанд апп шиг суулгах, интернэтгүй үед нээгдэх).
   Хуудас: эхлээд сүлжээнээс (шинэ хувилбар шууд орно), интернэтгүй бол хадгалсан хуулбар.
   Бусад сайт (Supabase, PDF уншигч, Google) руу явах хүсэлтэд огт оролцохгүй. */
const CACHE = 'shalgalt-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (r.mode === 'navigate') {
    /* index.html, ?exam=… (сурагчийн QR) — сүлжээ эхэнд */
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); }
      return res;
    }).catch(() => caches.match('index.html').then(m => m || caches.match('./'))));
    return;
  }
  /* дүрс, manifest: хадгалсныг шууд өгч, ард нь шинэчилнэ */
  if (SHELL.some(p => u.pathname.endsWith('/' + p.replace('./', '')))) {
    e.respondWith(caches.match(r).then(m => {
      const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => m);
      return m || net;
    }));
  }
});
