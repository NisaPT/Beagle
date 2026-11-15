/* Service worker — Escola dos Avós Beagle
   Para publicar uma nova versão: aumentar VERSAO. */
const VERSAO = 'eab-4.2.4';
const FICHEIROS = [
  './',
  './fonts/fredoka-latin-400-normal.woff2',
  './fonts/fredoka-latin-500-normal.woff2',
  './fonts/fredoka-latin-600-normal.woff2',
  './fonts/fredoka-latin-700-normal.woff2',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './index.html',
  './js/app.js',
  './js/arte.js',
  './js/bichos.js',
  './js/firebase-config.js',
  './js/idades.js',
  './js/jogos.js',
  './js/mapa.js',
  './js/nuvem.js',
  './js/poses.js',
  './js/quinta.js',
  './js/rig.js',
  './js/som.js',
  './js/voz_f.js',
  './js/voz_m.js',
  './lib/loaders/GLTFLoader.js',
  './lib/three.module.js',
  './lib/utils/BufferGeometryUtils.js',
  './manifest.webmanifest',
  './modelos/ava.js',
  './modelos/avo.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSAO)
      .then(c => c.addAll(FICHEIROS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('eab-') && k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // ex.: POST ao gateway de voz
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;       // nada de terceiros na cache

  /* páginas: rede primeiro, cache se estiver offline */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { const c = r.clone(); caches.open(VERSAO).then(k => k.put('./index.html', c)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* restantes ficheiros: cache primeiro e atualização em segundo plano */
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(emCache => {
      const rede = fetch(req).then(r => {
        if (r && r.ok) { const c = r.clone(); caches.open(VERSAO).then(k => k.put(req, c)); }
        return r;
      }).catch(() => emCache);
      return emCache || rede;
    })
  );
});
