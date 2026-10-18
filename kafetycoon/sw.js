// Köşe Kafe Tycoon: basit çevrimdışı önbellek.
// Sayfa (navigasyon) isteklerinde önce ağ denenir, çevrimdışıysa önbellek kullanılır.
// Aynı kaynaktan gelen diğer dosyalar önbellekten verilir ve arka planda yenilenir.
// Yazı tipleri, Supabase gibi başka kaynaklara dokunulmaz. Yeni sürümde CACHE adını artır.
const CACHE = 'kafetycoon-v30';
const CORE = ['./', 'index.html', 'three-view.js', 'vendor/three/three.module.min.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
// Şehir ve işletme içi modülleri: yüklenemezse kurulumu bozmaz, ilk açılıştan sonra çevrimdışı da çalışır
const EXTRA = ['three-hub.js', 'three-biz.js', 'vendor/three/loaders/GLTFLoader.js', 'vendor/three/utils/BufferGeometryUtils.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).then(() => Promise.all(EXTRA.map((u) => c.add(u).catch(() => {}))))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then((m) => m || caches.match('index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; }).catch(() => cached);
      return cached || net;
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => (cs.length ? cs[0].focus() : self.clients.openWindow('./'))));
});
