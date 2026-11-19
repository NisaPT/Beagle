/* Service worker — Escola dos Avós Beagle
   Para publicar uma nova versão: aumentar VERSAO. */
const VERSAO = 'eab-4.30.0';
const FICHEIROS_TODOS = [
  './',
  './fonts/fredoka-latin-400-normal.woff2',
  './fonts/fredoka-latin-500-normal.woff2',
  './fonts/fredoka-latin-600-normal.woff2',
  './fonts/fredoka-latin-700-normal.woff2',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './index.html',
  './privacidade.html',
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
  './js/movimento.js',
  './js/jogos2.js',
  './js/jogos3.js',
  './js/tarefas.js',
  './js/vida3d.js',
  './js/historias.js',
  './js/historias_dados.js',
  './js/brincar.js',
  './js/nuvem.js',
  './js/poses.js',
  './js/quinta.js',
  './js/quinta3d.js',
  './js/festa.js',
  './js/amigos3d.js',
  './js/animais3d.js',
  './js/rig.js',
  './js/som.js',
  './js/voz_f.js',
  './js/voz_m.js',
  './js/voz_extra_f.js',
  './js/voz_extra_m.js',
  './lib/loaders/GLTFLoader.js',
  './modelos/animais/cao.glb',
  './modelos/animais/gato.glb',
  './modelos/animais/vaca.glb',
  './modelos/animais/pato.glb',
  './modelos/animais/galo.glb',
  './modelos/animais/galinha.glb',
  './modelos/animais/coelho.glb',
  './modelos/animais/porco.glb',
  './modelos/animais/ra.glb',
  './modelos/animais/tartaruga.glb',
  './modelos/animais/cavalo.glb',
  './modelos/animais/ovelha.glb',
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
  './media/img/3d-cao.webp',
  './media/img/3d-gato.webp',
  './media/img/3d-vaca.webp',
  './media/img/3d-pato.webp',
  './media/img/3d-galo.webp',
  './media/img/3d-galinha.webp',
  './media/img/3d-coelho.webp',
  './media/img/3d-porco.webp',
  './media/img/3d-ra.webp',
  './media/img/3d-tartaruga.webp',
  './media/img/3d-cavalo.webp',
  './media/img/3d-ovelha.webp',
  './media/img/galinha.webp',
  './media/img/zebra.webp',
  './modelos/ava.js',
  './modelos/avo.js'
];

/* Duas fases: o essencial (pequeno) instala-se já e bloqueia a instalação se falhar;
   o resto (vozes, modelos, imagens ~30 MB) descarrega-se em segundo plano e tolera falhas.
   Nada disto altera os ficheiros de voz: só a forma de os guardar em cache. */
const PESADO = /^\.\/(js\/voz_[fm]\.js|modelos\/|media\/img\/|media\/ava-intro)/;
const ESSENCIAL = FICHEIROS_TODOS.filter(f => !PESADO.test(f));
const RESTO = FICHEIROS_TODOS.filter(f => PESADO.test(f));

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSAO)
      .then(c => Promise.all(ESSENCIAL.map(f => c.add(new Request(f, { cache: 'reload' })))))
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

/* A página pede o resto em segundo plano depois de arrancar (assim a ativação não fica presa a 30 MB).
   Uma a uma, sem rebentar com a rede; as que já estão na cache saltam-se. */
self.addEventListener('message', e => {
  if(!e.data || e.data.tipo !== 'precarrega') return;
  e.waitUntil(caches.open(VERSAO).then(async c => {
    for(const f of RESTO){
      try{ if(!(await c.match(f))) await c.add(new Request(f, { cache: 'reload' })); }catch(err){}
    }
  }));
});

/* rede primeiro, mas com limite de tempo: com Wi-Fi mau cai logo para a cache */
function redePrimeiro(req, ms){
  return new Promise(resolve => {
    let feito = false;
    const cai = () => caches.match(req, { ignoreSearch: true }).then(r => { if(!feito && r){ feito = true; resolve(r); } });
    const t = setTimeout(cai, ms);
    fetch(req).then(r => {
      clearTimeout(t);
      if(r && r.ok){ const c = r.clone(); caches.open(VERSAO).then(k => k.put(req, c)); }
      if(!feito){ feito = true; resolve(r); }
    }).catch(() => { clearTimeout(t); cai().then(() => { if(!feito){ feito = true; resolve(Response.error()); } }); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // ex.: POST ao gateway de voz
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;       // nada de terceiros na cache
  if (req.headers.has('range') || url.pathname.endsWith('.mp4')) return;  // vídeo: o navegador trata (o Safari exige respostas parciais)

  /* páginas: rede primeiro, cache se estiver offline */
  if (req.mode === 'navigate') {
    /* só a página principal é guardada como index.html (antes, qualquer página, como a política de
       privacidade, ficava no lugar da app); só respostas boas; e com limite de tempo para não ficar em branco */
    const eRaiz = url.pathname === '/' || /\/index(\.html)?$/.test(url.pathname);
    e.respondWith((async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const r = await fetch(req, { signal: ctrl.signal });
        clearTimeout(t);
        if (r.ok && eRaiz) { const c = r.clone(); e.waitUntil(caches.open(VERSAO).then(k => k.put('./index.html', c))); }
        return r;
      } catch (_) {
        return (!eRaiz && await caches.match(req, { ignoreSearch: true })) || await caches.match('./index.html');
      }
    })());
    return;
  }

  /* ficheiros pesados e versionados (vozes, modelos, imagens, bibliotecas): cache primeiro e SEM revalidar.
     A VERSAO nova volta a descarregá-los; assim não se reescrevem ~20 MB a cada arranque. */
  if (/\/(js\/voz_(extra_)?[fm]\.js|modelos\/|media\/|lib\/|fonts\/|icons\/)/.test(url.pathname)) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(emCache => emCache || fetch(req).then(r => {
        if (r && r.ok) { const c = r.clone(); caches.open(VERSAO).then(k => k.put(req, c)); }
        return r;
      }))
    );
    return;
  }

  /* código (js/html/css): rede primeiro com limite de 3 s, para a versão nova aparecer logo após publicar */
  if (/\.(js|html|css|webmanifest)$/.test(url.pathname)) {
    e.respondWith(redePrimeiro(req, 3000));
    return;
  }

  /* restantes ficheiros: cache primeiro, com atualização em segundo plano */
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
