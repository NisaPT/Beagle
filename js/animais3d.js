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

export const TEM3D = new Set(['cao', 'gato', 'vaca', 'pato']);
const FICHEIRO = id => `./modelos/animais/${id}.glb`;
const calmo = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

/* esc: tamanho na quinta · salto: para onde vai cada perna no salto (+1 = para trás, −1 = para a frente)
   balanco: baloiço do corpo ao andar · alegre: chance de dar um saltinho ao chegar */
export const CONFIG = {
  cao:  { esc: 1.12, andar: 1.1, tam: .62, salto: [-1, -1, 1, 1], balanco: .03, alegre: .35 },
  gato: { esc: .85, andar: 1.4, tam: .45, salto: [-1, -1, 1, 1], balanco: .02, alegre: .25 },
  vaca: { esc: 1.75, andar: .7, tam: 1.2, salto: [-1, -1, 1, 1], balanco: .025, alegre: .08 },
  pato: { esc: .95, andar: 1.6, tam: .5, salto: [1, 1], balanco: .16, alegre: .2, nada: true },
};

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
  return { g, malha, pernas, cab: ossos.cabeca, cauda: ossos.cauda, andar: cfg.andar, tam: cfg.tam,
           salto: cfg.salto, balanco: cfg.balanco, alegre: cfg.alegre, nada: !!cfg.nada, ossos };
}

/* animação de uma cartinha / vitrine: anda no lugar, vira-se devagar, salta ao toque.
   m = modelo de criaModelo; devolve função (dt, t) que anima. */
function animador(m){
  const fase0 = Math.random() * 6;
  let fase = fase0, salto = 0, giro = 0;
  const alvo = { y: 0 };
  const f = (dt, t) => {
    fase += dt * 7.5;
    for(let i = 0; i < m.pernas.length; i++)
      m.pernas[i].rotation.x = Math.sin(fase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * (calmo ? .12 : .5);
    let y = Math.abs(Math.sin(fase)) * .02;
    if(m.cab) m.cab.rotation.x = Math.sin(t * 1.3 + fase0) * .1;
    if(m.cauda) m.cauda.rotation.y = Math.sin(t * 6 + fase0) * .35;
    m.malha.parent.rotation.z = Math.sin(fase) * m.balanco;
    if(salto > 0){
      salto = Math.max(0, salto - dt * 1.5);
      const s = Math.sin((1 - salto) * Math.PI);
      y += s * .28;
      for(let i = 0; i < m.pernas.length; i++) m.pernas[i].rotation.x = (m.salto[i] || 0) * s * .8;
      if(m.cab) m.cab.rotation.x -= s * .4;
      m.malha.parent.scale.setScalar(CONFIG[m.id].esc).multiply(new THREE.Vector3(1 - s * .05, 1 + s * .1, 1 - s * .05));
    }else m.malha.parent.scale.setScalar(CONFIG[m.id].esc);
    giro = calmo ? -.5 : Math.sin(t * .7 + fase0) * .45 - .5;     /* meia-volta para se ver em 3D */
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

function cenaDe(id, dados){
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
  return { cena, cam, m, anima: animador(m) };
}

function monta(img){
  const id = img.dataset.a3d;
  if(!TEM3D.has(id) || !renderizador()) return;
  carrega(id).then(dados => {
    if(!img.isConnected) return;
    const c = document.createElement('canvas'); c.width = c.height = 256; c.className = 'a3d'; c.setAttribute('aria-hidden', 'true');
    c.style.cssText = img.getAttribute('style') || ''; c.style.setProperty('--giro', '0deg');
    const o = cenaDe(id, dados);
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
