/* Os animais 3D da Escola dos Avós Beagle: cão, gato, vaca e pato.
   Cada um é um modelo leve (≈24 mil triângulos, cores do original) com um
   esqueleto simples: corpo, cabeça, cauda e pernas (p0 p1 à frente, p2 p3 atrás;
   o pato tem só p0 e p1). Servem a quinta 3D e as cartas dos desafios.

   - carrega(id)          descarrega o modelo uma só vez
   - criaModelo(id, dados) devolve { g, pernas, cab, cauda, ... } já com a escala da quinta
   - ativaCartas(raiz)    troca as <img data-a3d="cao"> por um animal 3D vivo
                          (um único WebGL partilhado; cada carta recebe o seu quadro) */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const TEM3D = new Set(['cao', 'gato', 'vaca', 'pato', 'galo', 'galinha', 'coelho', 'porco', 'ra', 'tartaruga', 'cavalo', 'ovelha']);
const FICHEIRO = id => `./modelos/animais/${id}.glb`;
const calmo = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

/* esc: tamanho na quinta · salto: para onde vai cada perna no salto (+1 = para trás, −1 = para a frente)
   balanco: baloiço do corpo ao andar · alegre: chance de dar um saltinho ao chegar */
export const CONFIG = {
  cao:  { esc: 1.12, andar: 1.1, tam: .62, salto: [-1, -1, 1, 1], balanco: .03, alegre: .35 },
  gato: { esc: .85, andar: 1.4, tam: .45, salto: [-1, -1, 1, 1], balanco: .02, alegre: .25 },
  vaca: { esc: 1.75, andar: .7, tam: 1.2, salto: [-1, -1, 1, 1], balanco: .025, alegre: .08 },
  pato: { esc: .95, andar: 1.6, tam: .5, salto: [1, 1], balanco: .16, alegre: .2, nada: true },
  /* v4.29: modelos novos. mov = o gesto próprio de cada um (ver gestos) · pula = anda aos saltinhos */
  galo:      { esc: .62, andar: 1.6, tam: .4,  salto: [1, 1], balanco: .08, alegre: .3, mov: 'ave' },
  galinha:   { esc: .56, andar: 1.5, tam: .36, salto: [1, 1], balanco: .08, alegre: .3, mov: 'ave' },
  coelho:    { esc: .5,  andar: 1.4, tam: .3,  salto: [-1, -1, 1, 1], balanco: .01, alegre: .3, mov: 'pulo', pula: true },
  ra:        { esc: .42, andar: 1.4, tam: .28, salto: [-1, -1, 1, 1], balanco: .01, alegre: .3, mov: 'pulo', pula: true },
  tartaruga: { esc: .55, andar: .45, tam: .35, salto: [-1, -1, 1, 1], balanco: .03, alegre: .05, mov: 'lenta' },
  porco:     { esc: 1.5, andar: .9,  tam: .6,  salto: [-1, -1, 1, 1], balanco: .03, alegre: .2, mov: 'porco' },
  ovelha:    { esc: 1.55, andar: .9, tam: .6,  salto: [-1, -1, 1, 1], balanco: .025, alegre: .15, mov: 'pasto' },
  cavalo:    { esc: 1.95, andar: 1.2, tam: .9, salto: [-1, -1, 1, 1], balanco: .02, alegre: .2, mov: 'cavalo' },
};

/* gestos próprios de cada animal, parado (anda = false) ou a andar.
   Devolve { cab: rotação x da cabeça (+ = baixa o focinho), cauda: rotação y da cauda, pescoco: avanço da cabeça, pata: [índice, rotação x] ou null }.
   Usado nas cartas, na loja, nos jogos e na quinta 3D, para o mesmo animal fazer o mesmo gesto em todo o lado. */
export function gestos(mov, t, fase, anda){
  const r = { cab: 0, cauda: 0, pescoco: 0, pata: null };
  switch(mov){
    case 'ave':      /* bica o chão; a andar, a cabeça vai e vem */
      r.cab = anda ? Math.sin(fase * 2) * .18 : Math.pow(Math.max(0, Math.sin(t * 1.7 + fase)), 10) * .9 + Math.sin(t * 1.3 + fase) * .05;
      r.cauda = Math.sin(t * 5 + fase) * .3; break;
    case 'pulo':     /* orelhas/olhos atentos: cabeça a farejar */
      r.cab = Math.sin(t * 5 + fase) * .06 + Math.sin(t * .9 + fase) * .1;
      r.cauda = Math.sin(t * 8 + fase) * .25; break;
    case 'lenta':    /* tartaruga: põe e tira a cabeça */
      r.cab = Math.sin(t * .8 + fase) * .1;
      r.pescoco = (Math.sin(t * .6 + fase) * .5 + .5) * .06 - .02; break;
    case 'porco':    /* fareja com o focinho */
      r.cab = anda ? Math.sin(fase * 2) * .06 : Math.sin(t * 7 + fase) * .06 + Math.max(0, Math.sin(t * .8 + fase)) * .2;
      r.cauda = Math.sin(t * 7 + fase) * .6; break;
    case 'pasto':    /* ovelha: baixa a cabeça a comer erva */
      r.cab = anda ? Math.sin(fase * 2) * .05 : Math.max(0, Math.sin(t * .55 + fase)) * .55 + Math.sin(t * 1.3 + fase) * .04;
      break;
    case 'cavalo':   /* baixa a cabeça, sacode a cauda e bate com a pata */
      r.cab = anda ? Math.sin(fase * 2) * .06 : Math.max(0, Math.sin(t * .5 + fase)) * .45 - Math.pow(Math.max(0, Math.sin(t * .37 + fase * 2)), 14) * .5;
      r.cauda = Math.sin(t * 3 + fase) * .5;
      if(!anda && Math.sin(t * .31 + fase * 3) > .94) r.pata = [0, -Math.abs(Math.sin(t * 9)) * .7];
      break;
    default:
      r.cab = Math.sin(t * 1.3 + fase) * .1; r.cauda = Math.sin(t * 6 + fase) * .35;
  }
  return r;
}

/* ------------------------------------------------------------ carregamento */
const _dados = new Map();
export function carrega(id){
  let p = _dados.get(id);
  if(p) return p;
  p = new Promise((ok, erro) => {
    new GLTFLoader().load(FICHEIRO(id), gltf => {
      let sm = null;
      gltf.scene.traverse(o => { if(o.isSkinnedMesh) sm = o; });
      if(!sm) return erro(new Error('sem malha'));
      const ossos = sm.skeleton.bones.map(b => ({ nome: b.name, pai: b.parent && b.parent.isBone ? b.parent.name : null, pos: b.position.toArray() }));
      ok({ id, geo: sm.geometry, ossos });
    }, undefined, erro);
  });
  p.catch(e => { _dados.delete(id); console.warn('Animal 3D indisponível', id, e); });
  _dados.set(id, p);
  return p;
}
/* para a quinta: se já estiver descarregado devolve já, senão null */
const _prontos = new Map();
export function pronto(id){ return _prontos.get(id) || null; }
export function preCarrega(ids = [...TEM3D]){
  return Promise.all(ids.map(id => carrega(id).then(d => { _prontos.set(id, d); return d; }).catch(() => null)));
}

let _mat = null;
const material = () => _mat || (_mat = new THREE.MeshLambertMaterial({ vertexColors: true }));

/* ------------------------------------------------------------ modelo */
export function criaModelo(id, dados){
  const cfg = CONFIG[id];
  const ossos = {}, lista = [];
  for(const o of dados.ossos){ const b = new THREE.Bone(); b.name = o.nome; b.position.fromArray(o.pos); ossos[o.nome] = b; lista.push(b); }
  for(const o of dados.ossos) if(o.pai) ossos[o.pai].add(ossos[o.nome]);
  const malha = new THREE.SkinnedMesh(dados.geo, material());
  malha.frustumCulled = false;
  malha.add(lista[0]);
  const g = new THREE.Group(); g.add(malha); g.updateMatrixWorld(true);
  malha.bind(new THREE.Skeleton(lista), malha.matrixWorld);   /* pose de repouso = pose original */
  g.scale.setScalar(cfg.esc);
  const pernas = lista.filter(b => /^p\d$/.test(b.name)).sort((a, b) => a.name.localeCompare(b.name));
  return { g, malha, pernas, cab: ossos.cabeca, cauda: ossos.cauda, andar: cfg.andar, tam: cfg.tam, mov: cfg.mov || null, pula: !!cfg.pula,
           cabZ0: ossos.cabeca ? ossos.cabeca.position.z : 0,
           salto: cfg.salto, balanco: cfg.balanco, alegre: cfg.alegre, nada: !!cfg.nada, ossos };
}

/* animação de uma cartinha / vitrine: anda no lugar, vira-se devagar, salta ao toque.
   m = modelo de criaModelo; devolve função (dt, t) que anima. */
function animador(m, quieto = false){
  const fase0 = Math.random() * 6;
  let fase = fase0, salto = 0, giro = 0, hop = Math.random();
  const f = (dt, t) => {
    fase += dt * (m.pula ? 4 : quieto ? 1.1 : 7.5);
    const ges = gestos(m.mov, t, fase0, true), parado = gestos(m.mov, t, fase0, false);
    let y = 0;
    if(m.pula){
      /* anda aos saltinhos: sobe, estica as patas e cai */
      hop = (hop + dt / 1.5) % 1;
      const u = hop < .4 ? hop / .4 : 0, s = Math.sin(u * Math.PI);
      y = s * .13;
      for(let i = 0; i < m.pernas.length; i++) m.pernas[i].rotation.x = (m.salto[i] || 0) * s * (calmo ? .2 : .7);
      if(m.cab) m.cab.rotation.x = parado.cab - s * .15;
    }else{
      for(let i = 0; i < m.pernas.length; i++)
        m.pernas[i].rotation.x = Math.sin(fase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * (calmo ? .12 : quieto ? .09 : (m.mov === 'lenta' ? .3 : .5));
      y = Math.abs(Math.sin(fase)) * (quieto ? .004 : .02);
      if(m.cab) m.cab.rotation.x = (m.mov ? (Math.floor(t * .35 + fase0) % 2 ? ges.cab : parado.cab) : ges.cab);
    }
    if(parado.pata && !m.pula && m.pernas[parado.pata[0]]) m.pernas[parado.pata[0]].rotation.x = parado.pata[1];
    if(m.cab && m.mov === 'lenta') m.cab.position.z = m.cabZ0 + parado.pescoco;
    if(m.cauda) m.cauda.rotation.y = parado.cauda || ges.cauda;
    m.malha.parent.rotation.z = m.pula ? 0 : Math.sin(fase) * m.balanco * (quieto ? .15 : 1);
    if(salto > 0){
      salto = Math.max(0, salto - dt * 1.5);
      const s = Math.sin((1 - salto) * Math.PI);
      y += s * .28;
      for(let i = 0; i < m.pernas.length; i++) m.pernas[i].rotation.x = (m.salto[i] || 0) * s * .8;
      if(m.cab) m.cab.rotation.x -= s * .4;
      m.malha.parent.scale.setScalar(CONFIG[m.id].esc).multiply(new THREE.Vector3(1 - s * .05, 1 + s * .1, 1 - s * .05));
    }else m.malha.parent.scale.setScalar(CONFIG[m.id].esc);
    giro = calmo ? -.5 : quieto ? Math.sin(t * .3 + fase0) * .12 - .45 : Math.sin(t * .7 + fase0) * .45 - .5;     /* meia-volta para se ver em 3D */
    m.raiz.rotation.y = giro;
    m.raiz.position.y = y;
  };
  f.salta = () => { salto = 1; };
  return f;
}

/* ------------------------------------------------------------ cartas dos desafios */
let R = null;                      /* { renderer } partilhado */
const cartas = new Set();
let ciclo = 0, ultimo = 0;

function renderizador(){
  if(R !== null) return R;
  try{
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(1); renderer.setSize(256, 256, false); renderer.setClearColor(0x000000, 0);
    R = { renderer };
  }catch(e){ console.warn('Animais 3D nas cartas indisponíveis', e); R = false; }
  return R;
}

function cenaDe(id, dados, quieto = false){
  const cena = new THREE.Scene();
  cena.add(new THREE.HemisphereLight(0xffffff, 0xb9a98a, 1.65));
  const sol = new THREE.DirectionalLight(0xffffff, 1.5); sol.position.set(2, 4, 3); cena.add(sol);
  const m = criaModelo(id, dados);
  m.id = id;
  const raiz = new THREE.Group(); raiz.add(m.g); cena.add(raiz); m.raiz = raiz;
  const cfg = CONFIG[id], ext = dados.geo.boundingBox || (dados.geo.computeBoundingBox(), dados.geo.boundingBox);
  const alt = (ext.max.y - ext.min.y) * cfg.esc, comp = (ext.max.z - ext.min.z) * cfg.esc;
  const r = Math.max(alt, comp * .95) * .55 + .06;
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 50);
  const d = r / Math.tan(THREE.MathUtils.degToRad(15));
  cam.position.set(d * .3, alt * .55 + d * .12, d * .95); cam.lookAt(0, alt * .46, 0);
  return { cena, cam, m, anima: animador(m, quieto) };
}

function monta(img){
  const id = img.dataset.a3d;
  if(!TEM3D.has(id) || img.dataset.viva || !renderizador()) return;
  img.dataset.viva = '1';
  carrega(id).then(dados => {
    if(!img.isConnected) return;
    const c = document.createElement('canvas'); c.width = c.height = 256; c.className = 'a3d'; c.setAttribute('aria-hidden', 'true');
    c.style.cssText = img.getAttribute('style') || ''; c.style.setProperty('--giro', '0deg');
    const o = cenaDe(id, dados, img.dataset.quieto === '1');
    const carta = { canvas: c, ctx: c.getContext('2d'), img, ...o, t0: performance.now() / 1000, pronta: false };
    img.after(c);
    const botao = img.closest('button');
    if(botao){ const f = () => carta.anima.salta(); botao.addEventListener('pointerdown', f); carta.limpa = () => botao.removeEventListener('pointerdown', f); }
    cartas.add(carta);
    if(!ciclo) ciclo = requestAnimationFrame(passo);
  }).catch(() => {});
}

function passo(agora){
  ciclo = 0;
  for(const c of cartas){
    if(!c.canvas.isConnected){ cartas.delete(c); if(c.limpa) c.limpa(); c.m.malha.skeleton.dispose(); }
  }
  if(!cartas.size) return;
  if(!document.hidden && agora - ultimo > (cartas.size > 4 ? 60 : 30)){   /* 30 imagens por segundo chegam (15 se houver muitas cartas) */
    const dt = Math.min(.1, (agora - ultimo) / 1000); ultimo = agora;
    const t = agora / 1000;
    const { renderer } = R;
    for(const c of cartas){
      c.anima(dt, t);
      renderer.render(c.cena, c.cam);
      c.ctx.clearRect(0, 0, 256, 256);
      c.ctx.drawImage(renderer.domElement, 0, 0);
      if(!c.pronta){ c.pronta = true; c.img.style.display = 'none'; }
    }
  }
  ciclo = requestAnimationFrame(passo);
}

/* troca as imagens dos animais com modelo 3D pelas cartas vivas */
export function ativaCartas(raiz){
  raiz.querySelectorAll('img[data-a3d]').forEach(monta);
}
