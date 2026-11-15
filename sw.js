/* Service worker — Escola dos Avós Beagle
   Para publicar uma nova versão: aumentar VERSAO. */
const VERSAO = 'eab-4.14.0';
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
  './js/minhaquinta.js',
  './js/curiosidades.js',
  './js/natureza.js',
  './js/nuvem.js',
  './js/poses.js',
  './js/quinta.js',
  './js/quinta3d.js',
  './js/festa.js',
  './js/amigos3d.js',
  './js/rig.js',
  './js/som.js',
  './js/voz_f.js',
  './js/voz_m.js',
  './lib/loaders/GLTFLoader.js',
  './modelos/menino.glb',
  './modelos/menina.glb',
  './media/img/menino.webp',
  './media/img/menina.webp',
  './lib/three.module.js',
  './lib/utils/BufferGeometryUtils.js',
  './manifest.webmanifest',
  './media/ava-intro.jpg',
  './media/img/abacate.webp',
  './media/img/abobora.webp',
  './media/img/aipo.webp',
  './media/img/alcachofra.webp',
  './media/img/alface.webp',
  './media/img/alho.webp',
  './media/img/alhoporro.webp',
  './media/img/amora.webp',
  './media/img/ananas.webp',
  './media/img/baleia.webp',
  './media/img/banana.webp',
  './media/img/batata.webp',
  './media/img/batatadoce.webp',
  './media/img/beringela.webp',
  './media/img/beterraba.webp',
  './media/img/brocolos.webp',
  './media/img/caju.webp',
  './media/img/canguru.webp',
  './media/img/cao.webp',
  './media/img/carambola.webp',
  './media/img/cavalo.webp',
  './media/img/cebola.webp',
  './media/img/cenoura.webp',
  './media/img/cerejas.webp',
  './media/img/coala.webp',
  './media/img/coco.webp',
  './media/img/coelho.webp',
  './media/img/cogumelo.webp',
  './media/img/courgette.webp',
  './media/img/couve.webp',
  './media/img/couveflor.webp',
  './media/img/crocodilo.webp',
  './media/img/damasco.webp',
  './media/img/diospiro.webp',
  './media/img/elefante.webp',
  './media/img/ervilhas.webp',
  './media/img/espargos.webp',
  './media/img/espinafres.webp',
  './media/img/esquilo.webp',
  './media/img/feijaoverde.webp',
  './media/img/figo.webp',
  './media/img/foca.webp',
  './media/img/framboesa.webp',
  './media/img/funcho.webp',
  './media/img/galo.webp',
  './media/img/gato.webp',
  './media/img/gengibre.webp',
  './media/img/girafa.webp',
  './media/img/goiaba.webp',
  './media/img/golfinho.webp',
  './media/img/kiwi.webp',
  './media/img/laranja.webp',
  './media/img/leao.webp',
  './media/img/lichia.webp',
  './media/img/limao.webp',
  './media/img/lobo.webp',
  './media/img/maca.webp',
  './media/img/macaco.webp',
  './media/img/manga.webp',
  './media/img/melancia.webp',
  './media/img/melao.webp',
  './media/img/milho.webp',
  './media/img/mirtilos.webp',
  './media/img/morango.webp',
  './media/img/nabo.webp',
  './media/img/ourico.webp',
  './media/img/ovelha.webp',
  './media/img/panda.webp',
  './media/img/papaia.webp',
  './media/img/pato.webp',
  './media/img/pepino.webp',
  './media/img/pera.webp',
  './media/img/pessego.webp',
  './media/img/pimento.webp',
  './media/img/pinguim.webp',
  './media/img/pitaia.webp',
  './media/img/porco.webp',
  './media/img/quiabo.webp',
  './media/img/ra.webp',
  './media/img/rabanete.webp',
  './media/img/raposa.webp',
  './media/img/roma.webp',
  './media/img/tartaruga.webp',
  './media/img/tigre.webp',
  './media/img/tomate.webp',
  './media/img/urso.webp',
  './media/img/uvas.webp',
  './media/img/vaca.webp',
  './media/img/zebra.webp',
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
  if (req.headers.has('range') || url.pathname.endsWith('.mp4')) return;  // vídeo: o navegador trata (o Safari exige respostas parciais)

  /* páginas: rede primeiro, cache se estiver offline */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { const c = r.clone(); caches.open(VERSAO).then(k => k.put('./index.html', c)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* código (js/html/css): rede primeiro, para a versão nova aparecer logo após publicar; cache se offline */
  if (/\.(js|html|css|webmanifest)$/.test(url.pathname) && !url.pathname.startsWith('/lib/')) {
    e.respondWith(
      fetch(req)
        .then(r => { if (r && r.ok) { const c = r.clone(); caches.open(VERSAO).then(k => k.put(req, c)); } return r; })
        .catch(() => caches.match(req, { ignoreSearch: true }))
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
