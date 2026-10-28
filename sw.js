// Guarda la app en el celular para que abra al instante, aunque no haya señal o sea mala.
// Cambia VERSION cada vez que publiques una actualización.
const VERSION = 'fiadito-v12';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'privacidad.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero responde con lo guardado (rápido) y, por detrás, baja la versión nueva para la próxima vez.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const guardado = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
      const red = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (guardado) {
        e.waitUntil(red);
        return guardado;
      }
      const res = await red;
      if (res) return res;
      // Sin internet y sin copia: si es la página, muestra la app guardada
      if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
      return Response.error();
    })
  );
});
