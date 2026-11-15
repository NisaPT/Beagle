/* A Minha Quinta em 3D.
   Cena Three.js própria (um segundo canvas), com os 12 edifícios do catálogo
   em formas moles, como o barro dos avós, e animais 3D a passear lá dentro.
   Toca-se num edifício: a câmara voa até à porta, a porta abre, o telhado
   levanta e a parede da frente desce — e a criança vê os animais por dentro.

   Desempenho: sem mapas de sombras (sombras falsas em bolhas), materiais
   Lambert, geometrias partilhadas. Só renderiza quando o ecrã está aberto. */

import * as THREE from 'three';
import { EDIFICIOS, BICHOS } from './minhaquinta.js';
import { Amigos } from './amigos3d.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rnd = (a, b) => a + Math.random() * (b - a);
const lim = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = t => { t = lim(t); return t * t * (3 - 2 * t); };
const mais = (t, a, b) => lim((t - a) / (b - a));
const calmo = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

function semente(s){ return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ============================================================ geometria */
const _geo = new Map();
const cacheGeo = (k, f) => { let g = _geo.get(k); if(!g){ g = f(); _geo.set(k, g); } return g; };
const ESF = () => cacheGeo('esf', () => new THREE.SphereGeometry(1, 16, 12));

/* caixa de cantos redondos: forma arredondada extrudida com bisel */
function geoMole(w, h, d, r){
  return cacheGeo(`m${w}|${h}|${d}|${r}`, () => {
    const b = Math.min(.07, w / 3, h / 3, d / 3);
    const sw = w - 2 * b, sh = h - 2 * b, rr = Math.max(.001, Math.min(r, sw / 2 - .001, sh / 2 - .001));
    const s = new THREE.Shape();
    s.moveTo(-sw / 2 + rr, -sh / 2); s.lineTo(sw / 2 - rr, -sh / 2);
    s.absarc(sw / 2 - rr, -sh / 2 + rr, rr, -Math.PI / 2, 0);
    s.lineTo(sw / 2, sh / 2 - rr); s.absarc(sw / 2 - rr, sh / 2 - rr, rr, 0, Math.PI / 2);
    s.lineTo(-sw / 2 + rr, sh / 2); s.absarc(-sw / 2 + rr, sh / 2 - rr, rr, Math.PI / 2, Math.PI);
    s.lineTo(-sw / 2, -sh / 2 + rr); s.absarc(-sw / 2 + rr, -sh / 2 + rr, rr, Math.PI, Math.PI * 1.5);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.001, d - 2 * b), bevelEnabled: true,
      bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 4 });
    g.translate(0, 0, -(d - 2 * b) / 2);
    return g;
  });
}
/* prisma triangular (telhado de duas águas) */
function geoPrisma(w, h, d){
  return cacheGeo(`p${w}|${h}|${d}`, () => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d - .2, bevelEnabled: true, bevelThickness: .1, bevelSize: .1, bevelSegments: 2 });
    g.translate(0, 0, -(d - .2) / 2);
    return g;
  });
}

const colocar = (o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); return o; };
function ad(pai, o, x = 0, y = 0, z = 0){ pai.add(o); o.position.set(x, y, z); return o; }
const caixa = (w, h, d, mat, r = .12) => new THREE.Mesh(geoMole(w, h, d, r), mat);
const simples = (w, h, d, mat) => new THREE.Mesh(cacheGeo(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)), mat);
const bola = (mat, rx, ry = rx, rz = rx) => { const o = new THREE.Mesh(ESF(), mat); o.scale.set(rx, ry, rz); return o; };
const cil = (rt, rb, h, mat, seg = 14) => new THREE.Mesh(cacheGeo(`c${rt}|${rb}|${h}|${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), mat);
const cone = (r, h, mat, seg = 12) => new THREE.Mesh(cacheGeo(`k${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg)), mat);

/* fábrica de materiais: cada edifício tem os seus (para o poder esbater) */
function contexto(){
  const mats = new Set();
  const m = (cor, o = {}) => { const x = new THREE.MeshLambertMaterial({ color: cor, ...o }); mats.add(x); return x; };
  return { m, mats };
}
/* animais partilham materiais por cor */
const _ma = new Map();
const MA = cor => { let m = _ma.get(cor); if(!m){ m = new THREE.MeshLambertMaterial({ color: cor }); _ma.set(cor, m); } return m; };

/* sombra falsa, em bolha */
let _sombraTex = null;
function sombra(rx, rz, op = .38){
  if(!_sombraTex){
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(30,55,30,.9)'); gr.addColorStop(.6, 'rgba(30,55,30,.35)'); gr.addColorStop(1, 'rgba(30,55,30,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    _sombraTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(cacheGeo('plano', () => new THREE.PlaneGeometry(2, 2)),
    new THREE.MeshBasicMaterial({ map: _sombraTex, transparent: true, opacity: op, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.scale.set(rx, rz, 1); m.position.y = .03; m.renderOrder = 1;
  return m;
}

/* ============================================================ animais */
/* Todos olham para +z, com os pés em y=0. Pernas = pivôs que balançam. */
function perna(grupo, lista, x, z, alt, r, cor, y0 = alt, casco = null){
  const p = new THREE.Group(); p.position.set(x, y0, z);
  ad(p, cil(r, r * .9, alt, MA(cor), 8), 0, -alt / 2, 0);
  if(casco) ad(p, bola(MA(casco), r * 1.05, r * .7, r * 1.15), 0, -alt, .01);
  grupo.add(p); lista.push(p); return p;
}
const olhos = (g, x, y, z, r = .035) => {
  for(const s of [-1, 1]){
    ad(g, bola(MA('#2A2018'), r), s * x, y, z);
    ad(g, bola(MA('#fff'), r * .35), s * x + s * -r * .2, y + r * .4, z + r * .75);
  }
};

const FEITIOS = {
  cao(){
    const g = new THREE.Group(), pernas = [];
    const pel = '#D9A15E', cla = '#F2D9A8';
    ad(g, bola(MA(pel), .26, .23, .46), 0, .55, 0);
    ad(g, bola(MA(cla), .2, .17, .3), 0, .48, .12);
    const cab = new THREE.Group(); ad(g, cab, 0, .8, .5);
    ad(cab, bola(MA(pel), .21, .2, .21));
    ad(cab, bola(MA(cla), .11, .09, .14), 0, -.06, .17);
    ad(cab, bola(MA('#3A2A1E'), .045, .035, .04), 0, -.01, .31);
    olhos(cab, .085, .06, .17);
    for(const s of [-1, 1]){ const o = bola(MA('#9C6A34'), .07, .15, .06); ad(cab, o, s * .19, .02, -.02); o.rotation.z = s * .35; }
    const cauda = new THREE.Group(); ad(g, cauda, 0, .68, -.46);
    const c = cil(.035, .05, .34, MA(pel), 8); ad(cauda, c, 0, .15, -.05); cauda.rotation.x = -.7;
    for(const [x, z] of [[-.13, .3], [.13, .3], [-.13, -.3], [.13, -.3]]) perna(g, pernas, x, z, .36, .065, pel, .4, cla);
    return { g, pernas, cab, cauda, andar: 1.1, tam: .5 };
  },
  gato(){
    const g = new THREE.Group(), pernas = [];
    const pel = '#8A8F98', cla = '#EDEDED';
    ad(g, bola(MA(pel), .16, .15, .32), 0, .34, 0);
    ad(g, bola(MA(cla), .11, .1, .2), 0, .28, .1);
    const cab = new THREE.Group(); ad(g, cab, 0, .5, .3);
    ad(cab, bola(MA(pel), .15, .14, .14));
    ad(cab, bola(MA('#F0A0B0'), .03, .022, .02), 0, -.02, .135);
    olhos(cab, .06, .03, .12, .028);
    for(const s of [-1, 1]){ const o = cone(.06, .13, MA(pel), 4); ad(cab, o, s * .09, .15, 0); o.rotation.z = -s * .18; }
    const cauda = new THREE.Group(); ad(g, cauda, 0, .38, -.3);
    ad(cauda, cil(.025, .035, .42, MA(pel), 8), 0, .2, -.06); cauda.rotation.x = -.5;
    ad(cauda, bola(MA(cla), .04), 0, .42, -.06);
    for(const [x, z] of [[-.09, .2], [.09, .2], [-.09, -.2], [.09, -.2]]) perna(g, pernas, x, z, .22, .04, pel, .24, cla);
    return { g, pernas, cab, cauda, andar: 1.4, tam: .35 };
  },
  galo(){
    const g = new THREE.Group(), pernas = [];
    ad(g, bola(MA('#B5542B'), .21, .22, .3), 0, .5, 0);
    ad(g, bola(MA('#E8B04A'), .16, .15, .17), 0, .45, .16);
    const cab = new THREE.Group(); ad(g, cab, 0, .78, .2);
    ad(cab, bola(MA('#B5542B'), .09, .12, .09), 0, -.04, -.03);
    ad(cab, bola(MA('#C94B2A'), .085), 0, .05, .02);
    ad(cab, cone(.035, .09, MA('#F0A93C'), 6), 0, .04, .12).rotation.x = Math.PI / 2;
    ad(cab, bola(MA('#D93A32'), .03, .05, .02), 0, -.06, .1);
    for(const dz of [-.04, 0, .04]) ad(cab, bola(MA('#D93A32'), .03, .06, .035), 0, .15 - Math.abs(dz) * .8, dz);
    olhos(cab, .065, .06, .06, .022);
    const cauda = new THREE.Group(); ad(g, cauda, 0, .6, -.28);
    for(const [cor, a, l] of [['#2F7D5B', 0, .36], ['#1B4D8F', -.35, .3], ['#D93A32', .35, .3]]){
      const f = bola(MA(cor), .05, l / 2, .12); ad(cauda, f, a * .5, l / 2 * .8, -.05); f.rotation.z = a; f.rotation.x = -.35;
    }
    for(const s of [-1, 1]) ad(g, bola(MA('#9C3E1E'), .04, .14, .22), s * .2, .5, -.02);
    for(const x of [-.07, .07]) perna(g, pernas, x, .02, .26, .02, '#E8A33C', .27);
    return { g, pernas, cab, cauda, andar: 1.8, tam: .4 };
  },
  coelho(){
    const g = new THREE.Group(), pernas = [];
    const pel = '#F1E6D6', rosa = '#E9A9B8';
    ad(g, bola(MA(pel), .19, .17, .26), 0, .2, 0);
    const cab = new THREE.Group(); ad(g, cab, 0, .34, .2);
    ad(cab, bola(MA(pel), .13, .12, .13));
    ad(cab, bola(MA(rosa), .025), 0, -.01, .125);
    olhos(cab, .055, .03, .1, .022);
    for(const s of [-1, 1]){ const o = bola(MA(pel), .04, .17, .03); ad(cab, o, s * .06, .2, -.02); o.rotation.z = -s * .12;
      const i = bola(MA(rosa), .02, .12, .01); ad(cab, i, s * .06, .2, .0); i.rotation.z = -s * .12; }
    ad(g, bola(MA('#fff'), .08), 0, .24, -.27);
    for(const s of [-1, 1]){ ad(g, bola(MA(pel), .06, .05, .13), s * .13, .06, -.06); ad(g, bola(MA(pel), .045, .045, .07), s * .09, .05, .2); }
    return { g, pernas, cab, cauda: null, salta: true, tam: .35 };
  },
  pato(){
    const g = new THREE.Group(), pernas = [];
    ad(g, bola(MA('#F6D44C'), .2, .14, .29), 0, .2, 0);
    for(const s of [-1, 1]){ const a = bola(MA('#E5BC2C'), .04, .1, .2); ad(g, a, s * .18, .24, -.02); a.rotation.z = s * .2; }
    const cab = new THREE.Group(); ad(g, cab, 0, .38, .2);
    ad(cab, bola(MA('#F6D44C'), .12));
    ad(cab, bola(MA('#F08A2C'), .06, .025, .1), 0, -.025, .15);
    olhos(cab, .06, .03, .09, .022);
    const c = cone(.05, .12, MA('#F6D44C'), 6); ad(g, c, 0, .26, -.34).rotation.x = -Math.PI / 2 - .5;
    for(const x of [-.07, .07]) perna(g, pernas, x, .02, .1, .02, '#F08A2C', .1);
    return { g, pernas, cab, cauda: null, nada: true, andar: 1.6, tam: .4 };
  },
  ra(){
    const g = new THREE.Group(), pernas = [];
    const ver = '#5BBF5E';
    ad(g, bola(MA(ver), .16, .1, .19), 0, .1, 0);
    ad(g, bola(MA('#C8EFA0'), .11, .05, .13), 0, .06, .05);
    const cab = new THREE.Group(); ad(g, cab, 0, .14, .14);
    for(const s of [-1, 1]){
      ad(cab, bola(MA(ver), .06), s * .08, .08, 0);
      ad(cab, bola(MA('#fff'), .045), s * .08, .1, .02);
      ad(cab, bola(MA('#1d2a1d'), .025), s * .08, .1, .055);
    }
    ad(cab, bola(MA('#3E9B52'), .1, .035, .09), 0, 0, .04);
    for(const s of [-1, 1]){ ad(g, bola(MA(ver), .05, .05, .12), s * .14, .05, -.08); ad(g, bola(MA(ver), .035, .03, .08), s * .1, .03, .17); }
    return { g, pernas, cab, cauda: null, salta: true, tam: .3 };
  },
  tartaruga(){
    const g = new THREE.Group(), pernas = [];
    ad(g, bola(MA('#6E8F3E'), .3, .17, .36), 0, .2, 0);
    for(const [x, z] of [[0, 0], [.14, .14], [-.14, .14], [.15, -.14], [-.15, -.14], [0, .22], [0, -.24]])
      ad(g, bola(MA('#55742C'), .09, .05, .09), x, .3 - Math.hypot(x, z) * .18, z);
    ad(g, bola(MA('#D8C58A'), .27, .06, .33), 0, .09, 0);
    const cab = new THREE.Group(); ad(g, cab, 0, .17, .36);
    ad(cab, bola(MA('#9CB868'), .09, .08, .12), 0, 0, .06);
    olhos(cab, .05, .04, .13, .02);
    for(const [x, z] of [[-.22, .2], [.22, .2], [-.22, -.2], [.22, -.2]]) ad(g, bola(MA('#9CB868'), .07, .05, .09), x, .07, z);
    return { g, pernas, cab, cauda: null, andar: .5, tam: .45 };
  },
  ovelha(){
    const g = new THREE.Group(), pernas = [];
    const la = '#FBF6EA', cara = '#4B3B32';
    for(const [x, y, z, r] of [[0, .6, 0, .3], [-.16, .52, .2, .24], [.16, .52, .2, .24], [-.18, .52, -.2, .25], [.18, .52, -.2, .25], [0, .74, -.1, .22], [0, .72, .16, .2], [0, .48, -.34, .2]])
      ad(g, bola(MA(la), r), x, y, z);
    const cab = new THREE.Group(); ad(g, cab, 0, .68, .44);
    ad(cab, bola(MA(cara), .13, .15, .17), 0, 0, .04);
    ad(cab, bola(MA(la), .1, .06, .09), 0, .16, -.02);
    olhos(cab, .06, .03, .15, .025);
    for(const s of [-1, 1]){ const o = bola(MA(cara), .1, .04, .05); ad(cab, o, s * .16, .02, -.02); o.rotation.z = s * .5; }
    for(const [x, z] of [[-.16, .22], [.16, .22], [-.16, -.22], [.16, -.22]]) perna(g, pernas, x, z, .34, .05, cara, .36);
    return { g, pernas, cab, cauda: null, andar: .9, tam: .65 };
  },
  porco(){
    const g = new THREE.Group(), pernas = [];
    const pele = '#F4A9B7', esc = '#E88CA0';
    ad(g, bola(MA(pele), .34, .3, .5), 0, .5, 0);
    const cab = new THREE.Group(); ad(g, cab, 0, .58, .52);
    ad(cab, bola(MA(pele), .24, .22, .22));
    const foc = cil(.11, .11, .1, MA(esc), 12); ad(cab, foc, 0, -.04, .22).rotation.x = Math.PI / 2;
    for(const s of [-1, 1]) ad(cab, bola(MA('#8A3E52'), .02), s * .04, -.04, .275);
    olhos(cab, .09, .07, .17, .03);
    for(const s of [-1, 1]){ const o = cone(.09, .14, MA(esc), 4); ad(cab, o, s * .15, .2, .0); o.rotation.z = -s * .6; o.rotation.x = .5; }
    const cauda = new THREE.Group(); ad(g, cauda, 0, .6, -.5);
    const t = new THREE.Mesh(cacheGeo('torus', () => new THREE.TorusGeometry(.06, .018, 6, 12, Math.PI * 1.6)), MA(esc)); ad(cauda, t);
    for(const [x, z] of [[-.2, .3], [.2, .3], [-.2, -.3], [.2, -.3]]) perna(g, pernas, x, z, .26, .07, esc, .28);
    return { g, pernas, cab, cauda, andar: .9, tam: .85 };
  },
  vaca(){
    const g = new THREE.Group(), pernas = [];
    const br = '#FFFDF6', pt = '#2C2A2A', rosa = '#F4B6B6';
    const C = V3(0, .9, 0), R = V3(.46, .4, .8);
    ad(g, bola(MA(br), R.x, R.y, R.z), C.x, C.y, C.z);
    for(const [dx, dy, dz, s] of [[.8, .5, .3, .2], [-.9, .3, -.2, .24], [.3, .8, -.5, .2], [-.4, .7, .4, .17], [.9, -.1, -.4, .17], [0, .95, 0, .22]]){
      const u = V3(dx, dy, dz).normalize();
      const o = bola(MA(pt), s, s * .9, s); ad(g, o, C.x + u.x * R.x * .96, C.y + u.y * R.y * .96, C.z + u.z * R.z * .96);
    }
    ad(g, bola(MA(rosa), .16, .09, .14), 0, .55, -.46);
    const cab = new THREE.Group(); ad(g, cab, 0, 1.0, .82);
    ad(cab, bola(MA(br), .25, .24, .3));
    ad(cab, bola(MA(rosa), .19, .14, .13), 0, -.1, .24);
    for(const s of [-1, 1]) ad(cab, bola(MA('#8A3E52'), .025), s * .07, -.08, .35);
    olhos(cab, .12, .08, .22, .035);
    ad(cab, bola(MA(pt), .1, .08, .09), .1, .17, .05);
    for(const s of [-1, 1]){
      const h = cone(.045, .14, MA('#F3E2B0'), 8); ad(cab, h, s * .14, .26, -.05); h.rotation.z = -s * .4;
      const o = bola(MA(s > 0 ? pt : br), .15, .05, .08); ad(cab, o, s * .3, .1, -.06); o.rotation.z = s * .3;
    }
    const cauda = new THREE.Group(); ad(g, cauda, 0, 1.05, -.78);
    ad(cauda, cil(.02, .02, .5, MA(br), 6), 0, -.25, 0); ad(cauda, bola(MA(pt), .06, .1, .06), 0, -.52, 0);
    for(const [x, z] of [[-.26, .5], [.26, .5], [-.26, -.5], [.26, -.5]]) perna(g, pernas, x, z, .55, .085, br, .6, pt);
    return { g, pernas, cab, cauda, andar: .7, tam: 1.1 };
  },
  cavalo(){
    const g = new THREE.Group(), pernas = [];
    const pel = '#9C5B2E', cri = '#2E1B10';
    ad(g, bola(MA(pel), .38, .38, .78), 0, 1.0, 0);
    const pesc = new THREE.Group(); ad(g, pesc, 0, 1.15, .6); pesc.rotation.x = .75;
    ad(pesc, cil(.15, .24, .6, MA(pel), 10), 0, .3, 0);
    for(let i = 0; i < 4; i++) ad(pesc, bola(MA(cri), .06, .1, .09), 0, .05 + i * .15, -.15);
    const cab = new THREE.Group(); ad(pesc, cab, 0, .66, .05); cab.rotation.x = -.55;
    ad(cab, bola(MA(pel), .17, .2, .23), 0, .02, .05);
    ad(cab, bola(MA('#B8794A'), .13, .13, .17), 0, -.14, .2);
    ad(cab, bola(MA('#F5F0E4'), .03, .14, .02), 0, .03, .27);
    olhos(cab, .14, .08, .13, .03);
    for(const s of [-1, 1]) ad(cab, cone(.05, .14, MA(pel), 6), s * .09, .24, -.05);
    ad(cab, bola(MA(cri), .07, .08, .08), 0, .21, -.07);
    const cauda = new THREE.Group(); ad(g, cauda, 0, 1.15, -.74);
    const f = cone(.1, .75, MA(cri), 8); ad(cauda, f, 0, -.35, -.1); f.rotation.x = Math.PI + .25;
    for(const [x, z] of [[-.22, .55], [.22, .55], [-.22, -.52], [.22, -.52]]) perna(g, pernas, x, z, .8, .075, pel, .82, cri);
    return { g, pernas, cab: pesc, cauda, andar: .75, tam: 1.3 };
  },
};

class Animal {
  constructor(id){
    this.id = id;
    const f = FEITIOS[id]();
    this.g = new THREE.Group(); this.g.add(f.g);
    this.corpo = f.g; this.pernas = f.pernas; this.cab = f.cab; this.cauda = f.cauda;
    this.salta = !!f.salta; this.nada = !!f.nada; this.vel = (f.andar || 1) * .9; this.tam = f.tam;
    this.sombra = sombra(this.tam * .8, this.tam * 1.05, .3); this.g.add(this.sombra);
    this.fase = Math.random() * 6; this.pausa = rnd(.2, 2); this.dest = null; this.t = 0; this.pulo = 0;
    this.toque = 0; this.cabBase = this.cab ? this.cab.rotation.x : 0; this.yBase = 0;
    this.g.traverse(o => { if(o.isMesh) o.userData.animal = this; });
    this.g.rotation.y = rnd(0, 6.28);
  }
  boing(){ this.toque = 1; }
  atualiza(dt, t, ed){
    const g = this.g, anda = this.dest && this.pausa <= 0;
    this.toque = Math.max(0, this.toque - dt * 1.6);
    if(this.pausa > 0){
      this.pausa -= dt;
      if(this.pausa <= 0){ this.dest = ed.sorteia(this.id, g.position); this.pulo = 0; }
    }
    let y = this.yBase;
    if(anda){
      const dx = this.dest.x - g.position.x, dz = this.dest.z - g.position.z, dist = Math.hypot(dx, dz);
      const alvoRot = Math.atan2(dx, dz);
      let da = alvoRot - g.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da));
      g.rotation.y += da * Math.min(1, dt * 6);
      if(dist < .12){ this.pausa = this.salta ? rnd(.4, 1.8) : rnd(1, 3.5); this.dest = null; }
      else if(this.salta){
        this.pulo += dt / .5;
        const p = this.pulo % 1;
        y += Math.sin(p * Math.PI) * .28;
        const passo = Math.min(dist, this.vel * 2.2 * dt * (p < .9 ? 1 : .2));
        g.position.x += dx / dist * passo; g.position.z += dz / dist * passo;
        if(this.pulo >= 3 + Math.random()){ this.pausa = rnd(.5, 1.6); this.dest = null; this.pulo = 0; }
      }else{
        const passo = Math.min(dist, this.vel * dt);
        g.position.x += dx / dist * passo; g.position.z += dz / dist * passo;
        this.fase += dt * this.vel * 7 / Math.max(.5, this.tam * 1.2);
        for(let i = 0; i < this.pernas.length; i++) this.pernas[i].rotation.x = Math.sin(this.fase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * .55;
        y += Math.abs(Math.sin(this.fase)) * .025;
      }
    }else{
      for(const p of this.pernas) p.rotation.x *= .9;
    }
    if(this.nada) y += Math.sin(t * 2 + this.fase) * .012;
    /* pequenos gestos de quem está parado */
    if(this.cab){
      this.cab.rotation.x = this.cabBase + (anda ? 0 : Math.sin(t * 1.3 + this.fase) * .12 + (Math.sin(t * .4 + this.fase * 2) > .85 ? .45 : 0));
    }
    if(this.cauda) this.cauda.rotation.y = Math.sin(t * 6 + this.fase) * (anda ? .25 : .45);
    /* toque: salto e esticão */
    if(this.toque > 0){
      const k = this.toque, s = Math.sin((1 - k) * Math.PI);
      y += s * (.25 + this.tam * .18);
      this.corpo.scale.set(1 - s * .06, 1 + s * .1, 1 - s * .06);
      if(this.cab) this.cab.rotation.x = this.cabBase - s * .5;
    }else this.corpo.scale.set(1, 1, 1);
    g.position.y = y + ed.chaoY;
    this.sombra.position.y = .03 - y;
    this.sombra.scale.x = this.tam * .8 * (1 - y * .35);
  }
}

/* ============================================================ edifícios */
const ALTURA_PORTA = 2.3, LARGURA_PORTA = 1.7;

function janela(pai, x, y, z, w = 1, h = .9, ry = 0, c){
  const g = new THREE.Group(); ad(pai, g, x, y, z); g.rotation.y = ry;
  ad(g, caixa(w + .24, h + .24, .12, c.m('#FFFBF2'), .05), 0, 0, 0);
  ad(g, caixa(w, h, .14, c.m('#A9D8EE'), .03), 0, 0, .02);
  ad(g, simples(.06, h, .16, c.m('#FFFBF2')), 0, 0, .03); ad(g, simples(w, .06, .16, c.m('#FFFBF2')), 0, 0, .03);
  return g;
}
function fardo(pai, c, x, y, z, ry = 0, s = 1){
  const g = new THREE.Group(); ad(pai, g, x, y, z); g.rotation.y = ry; g.scale.setScalar(s);
  ad(g, caixa(.95, .55, .6, c.m('#E8C57A'), .12), 0, .28, 0);
  for(const dx of [-.28, .28]) ad(g, simples(.05, .57, .62, c.m('#B98B3E')), dx, .28, 0);
  return g;
}
function caixote(pai, c, x, z, w = 1.4, ry = 0, cor = '#8A5A28'){
  const g = new THREE.Group(); ad(pai, g, x, 0, z); g.rotation.y = ry;
  ad(g, caixa(w, .38, .5, c.m(cor), .08), 0, .3, 0);
  ad(g, caixa(w - .2, .12, .34, c.m('#5A7A8A'), .05), 0, .5, 0);
  return g;
}

/* edifício fechado: paredes, porta, telhado; a parede da frente e o telhado
   saem do caminho quando se entra */
function fechada(c, o){
  const { w = 7, d = 6, h = 3, pw = LARGURA_PORTA, ph = ALTURA_PORTA } = o;
  const g = new THREE.Group();
  const parede = c.m(o.parede), tel = c.m(o.telhado), mad = c.m(o.porta || '#8A5A28');
  ad(g, caixa(w - .1, .2, d - .1, c.m(o.chao || '#D9B77E'), .06), 0, .1, 0);
  ad(g, caixa(w, h, .3, parede, .1), 0, h / 2, -d / 2 + .15);
  for(const s of [-1, 1]) ad(g, caixa(.3, h, d, parede, .1), s * (w / 2 - .15), h / 2, 0);
  const fr = new THREE.Group(); ad(g, fr, 0, 0, d / 2 - .15);
  const lw = (w - pw) / 2;
  for(const s of [-1, 1]) ad(fr, caixa(lw, h, .3, parede, .1), s * (pw / 2 + lw / 2), h / 2, 0);
  ad(fr, caixa(pw + .02, h - ph, .3, parede, .08), 0, ph + (h - ph) / 2, 0);
  const po = new THREE.Group(); ad(fr, po, -pw / 2, 0, .06);
  ad(po, caixa(pw, ph, .14, mad, .05), pw / 2, ph / 2, 0);
  ad(po, bola(c.m('#F5C344'), .06), pw - .2, ph * .48, .1);
  const rf = new THREE.Group(); ad(g, rf, 0, h - .05, 0);
  ad(rf, new THREE.Mesh(geoPrisma(w + 1.1, o.rh || 2, d + 1), tel), 0, 0, 0);
  ad(rf, caixa(w + 1.2, .14, d + 1.1, c.m(o.beiral || o.telhado), .06), 0, .02, 0);
  const sw = sombra(w * .75, d * .75, .32); g.add(sw);
  return { g, fr, po, rf, w, d, h, pw, ph };
}

/* cerca baixa com portão no meio da frente */
function cerca(pai, c, w, d, cor = '#C98F55', portao = true, pw = 1.8){
  const mad = c.m(cor), esc = c.m('#A8672F');
  const lado = (x0, z0, x1, z1) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.3));
    for(let i = 0; i <= n; i++) ad(pai, caixa(.2, .85, .2, mad, .07), x0 + (x1 - x0) * i / n, .43, z0 + (z1 - z0) * i / n);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, L = Math.hypot(x1 - x0, z1 - z0);
    for(const y of [.35, .65]){
      const r = ad(pai, caixa(L, .09, .09, esc, .04), cx, y, cz); r.rotation.y = Math.atan2(x0 - x1, z1 - z0) + Math.PI / 2;
    }
  };
  lado(-w / 2, -d / 2, w / 2, -d / 2); lado(-w / 2, -d / 2, -w / 2, d / 2); lado(w / 2, -d / 2, w / 2, d / 2);
  if(portao){
    lado(-w / 2, d / 2, -pw / 2, d / 2); lado(pw / 2, d / 2, w / 2, d / 2);
    const po = new THREE.Group(); ad(pai, po, -pw / 2 + .05, 0, d / 2 + .02);
    ad(po, caixa(pw - .1, .75, .08, mad, .04), (pw - .1) / 2, .45, 0);
    ad(po, simples(pw - .1, .07, .1, esc), (pw - .1) / 2, .3, 0); ad(po, simples(pw - .1, .07, .1, esc), (pw - .1) / 2, .62, 0);
    return po;
  }
  lado(-w / 2, d / 2, w / 2, d / 2);
  return null;
}

const FAB = {};

FAB.casa = c => {
  const e = fechada(c, { parede: '#FFF1DC', telhado: '#D9503C', porta: '#8A5A28', chao: '#C98F55', w: 7.4, d: 6, h: 3 });
  const { g, fr, rf } = e;
  const ch = ad(rf, caixa(.8, 1.7, .8, c.m('#B5543A'), .1), 1.6, 1.0, -.8);
  ad(ch, caixa(1.0, .22, 1, c.m('#8A3E2A'), .06), 0, .9, 0);
  e.fumo = [0, 1, 2].map(i => { const b = bola(c.m('#fff', { transparent: true, opacity: .7 }), .28); rf.add(b); b.position.set(1.6, 2.2, -.8); b.userData.i = i; return b; });
  const lw = (e.w - e.pw) / 2;
  for(const s of [-1, 1]){
    janela(fr, s * (e.pw / 2 + lw / 2), 1.7, .2, 1.1, 1, 0, c);
    ad(fr, caixa(1.3, .3, .32, c.m('#8A5A28'), .06), s * (e.pw / 2 + lw / 2), 1.0, .2);
    for(const [dx, cor] of [[-.35, '#F26B8A'], [0, '#F5C344'], [.35, '#fff']]) ad(fr, bola(c.m(cor), .13), s * (e.pw / 2 + lw / 2) + dx, 1.28, .22);
  }
  /* sala: tapete, almofada do cão, cesto do gato, quadro */
  ad(g, cil(1.7, 1.7, .05, c.m('#D96A5B'), 24), .3, .22, .4).scale.z = .7;
  ad(g, cil(1.3, 1.3, .06, c.m('#F2C98B'), 24), .3, .25, .4).scale.z = .7;
  ad(g, caixa(1.1, .28, .9, c.m('#5B8FD0'), .14), -2.1, .35, -1.6);
  const cesto = ad(g, cil(.55, .45, .35, c.m('#B98B3E'), 16), 2.1, .38, -1.6); ad(cesto, cil(.42, .42, .06, c.m('#F2A8B8'), 14), 0, .12, 0);
  ad(g, caixa(1.2, .9, .08, c.m('#8A5A28'), .04), 0, 2.0, -e.d / 2 + .34); ad(g, caixa(1.0, .7, .1, c.m('#9FD8EF'), .03), 0, 2.0, -e.d / 2 + .36);
  ad(g, bola(c.m('#FFD95E'), .16), .25, 2.1, -e.d / 2 + .43); ad(g, cone(.3, .3, c.m('#6FB174'), 4), -.2, 1.82, -e.d / 2 + .43);
  Object.assign(e, { zona: { x0: -2.5, x1: 2.5, z0: -1.4, z1: 1.8 }, chaoY: .2 });
  return e;
};

FAB.galinheiro = c => {
  const e = fechada(c, { parede: '#D9503C', telhado: '#A8672F', porta: '#8A5A28', chao: '#E8C96A', w: 6.4, d: 5.6, h: 2.8, pw: 1.6, ph: 2.2 });
  const { g, fr } = e;
  const lw = (e.w - e.pw) / 2;
  ad(fr, cil(.42, .42, .12, c.m('#4A2E14'), 16), -(e.pw / 2 + lw / 2), 1.7, .2).rotation.x = Math.PI / 2;
  ad(fr, new THREE.Mesh(cacheGeo('anel', () => new THREE.TorusGeometry(.42, .07, 8, 20)), c.m('#F5C344')), -(e.pw / 2 + lw / 2), 1.7, .22);
  janela(fr, e.pw / 2 + lw / 2, 1.6, .2, .9, .8, 0, c);
  const rampa = ad(fr, caixa(1.0, .1, 1.6, c.m('#C98F55'), .04), 2.2, .3, .9); rampa.rotation.x = -.35;
  ad(fr, caixa(.3, .08, .3, c.m('#A8672F'), .03), 2.2, .6, 1.6);
  /* palha, ninhos, ovos */
  ad(g, caixa(e.w - .8, .1, e.d - .8, c.m('#F0D888'), .05), 0, .24, 0);
  for(const x of [-2, 0, 2]){
    ad(g, cil(.5, .42, .22, c.m('#C49A4A'), 14), x, .36, -2.0);
    ad(g, cil(.36, .36, .1, c.m('#F2D26E'), 14), x, .45, -2.0);
    ad(g, bola(c.m('#FFF8E8'), .11, .14, .11), x - .08, .55, -2.0); ad(g, bola(c.m('#FFF8E8'), .11, .14, .11), x + .1, .53, -1.95);
  }
  ad(g, simples(.12, 1, .12, c.m('#8A5A28')), -2.6, .6, 1.2); ad(g, simples(.12, 1, .12, c.m('#8A5A28')), -2.6, .6, -.4);
  ad(g, simples(.12, .12, 1.8, c.m('#8A5A28')), -2.6, 1.1, .4);
  fardo(g, c, 2.4, .2, 1.3, .3, .8);
  Object.assign(e, { zona: { x0: -2.4, x1: 2.4, z0: -.7, z1: 1.9 }, chaoY: .3 });
  return e;
};

FAB.pocilga = c => {
  const e = fechada(c, { parede: '#C98F55', telhado: '#7A4E22', porta: '#8A5A28', chao: '#B8884E', w: 7, d: 6, h: 2.8 });
  const { g, fr } = e;
  for(const x of [-2.4, -1.4, 1.4, 2.4]) ad(fr, simples(.07, 2.6, .12, c.m('#8A5A28')), x, 1.4, .17);
  ad(g, cil(1.6, 1.6, .06, c.m('#8A6038', {}), 20), -1.2, .22, -.6).scale.z = .65;
  ad(g, cil(1.1, 1.1, .08, c.m('#A67A4A'), 20), -1.4, .24, -.6).scale.z = .6;
  const coxo = ad(g, caixa(2.2, .4, .7, c.m('#6B4A2A'), .1), 2.0, .4, -2.0); ad(coxo, caixa(1.9, .12, .45, c.m('#D8B070'), .05), 0, .2, 0);
  fardo(g, c, -2.5, .2, -2.1, 0, .8);
  Object.assign(e, { zona: { x0: -2.5, x1: 2.4, z0: -1.4, z1: 1.8 }, chaoY: .2 });
  return e;
};

FAB.vacaria = c => {
  const e = fechada(c, { parede: '#FFF8EA', telhado: '#5BAF6A', porta: '#8A5A28', chao: '#E2C58C', w: 8, d: 6.8, h: 3.2, pw: 2, ph: 2.5, rh: 2.2 });
  const { g, fr, rf } = e;
  const lw = (e.w - e.pw) / 2;
  for(const [x, z, s] of [[-2.6, 1.7, .5], [2.7, 1.7, .4], [-2.2, 2.4, .3]]) ad(fr, bola(c.m('#2C2A2A'), s * .5, s * .6, .05), x, z, .18);
  for(const s of [-1, 1]) janela(fr, s * (e.pw / 2 + lw / 2), 1.8, .2, 1.1, .9, 0, c);
  ad(rf, bola(c.m('#FFFDF6'), .5, .5, .1), 0, 1.0, (e.d + 1) / 2 - .05); ad(rf, bola(c.m('#2C2A2A'), .13, .13, .1), -.12, 1.08, (e.d + 1) / 2 + .02);
  ad(g, caixa(e.w - .8, .1, e.d - .8, c.m('#EAD28A'), .05), 0, .24, 0);
  const coxo = ad(g, caixa(3, .45, .7, c.m('#8A5A28'), .1), 0, .45, -2.6); ad(coxo, caixa(2.7, .15, .45, c.m('#7DBA68'), .05), 0, .22, 0);
  fardo(g, c, -3, .2, -2.4, .2, .9); fardo(g, c, -3, .75, -2.4, .2, .9);
  const lata = ad(g, cil(.3, .36, .75, c.m('#C8D0D8'), 12), 3.0, .62, -2.4); ad(lata, cil(.22, .3, .15, c.m('#9AA6B0'), 12), 0, .43, 0);
  Object.assign(e, { zona: { x0: -2.9, x1: 2.9, z0: -1.5, z1: 2.0 }, chaoY: .3 });
  return e;
};

FAB.estabulo = c => {
  const e = fechada(c, { parede: '#A8672F', telhado: '#7A2E22', porta: '#E8C196', chao: '#C9A06A', w: 7.2, d: 6.2, h: 3, pw: 1.9, ph: 2.4 });
  const { g, fr, po, rf } = e;
  for(const s of [-1, 1]){ const x = ad(po, simples(.1, 2.6, .12, c.m('#8A5A28')), .95, 1.2, .1); x.rotation.z = s * .8; }
  const lw = (e.w - e.pw) / 2;
  for(const s of [-1, 1]){ janela(fr, s * (e.pw / 2 + lw / 2), 1.7, .2, 1, .9, 0, c); }
  ad(rf, new THREE.Mesh(cacheGeo('ferr', () => new THREE.TorusGeometry(.32, .07, 8, 16, Math.PI * 1.5)), c.m('#F5C344')), 0, 1.0, (e.d + 1) / 2 + .02).rotation.z = Math.PI * .75;
  ad(g, caixa(e.w - .8, .1, e.d - .8, c.m('#E8CF8A'), .05), 0, .24, 0);
  fardo(g, c, -2.5, .2, -2.3, 0, .9); fardo(g, c, -1.5, .2, -2.4, .1, .9); fardo(g, c, -2.0, .75, -2.3, 0, .9);
  const balde = ad(g, cil(.3, .22, .4, c.m('#5A7A8A'), 12), 2.5, .45, -2.2); ad(balde, cil(.24, .24, .02, c.m('#9FD8EF'), 12), 0, .19, 0);
  const coxo = ad(g, caixa(1.7, .4, .55, c.m('#8A5A28'), .08), 1.2, .4, -2.6);
  Object.assign(e, { zona: { x0: -2, x1: 2.2, z0: -1.6, z1: 1.8 }, chaoY: .3 });
  return e;
};

FAB.celeiro = c => {
  const e = fechada(c, { parede: '#D9503C', telhado: '#9C2F26', porta: '#FFF1DC', chao: '#CDA568', w: 8.2, d: 6.6, h: 3.4, pw: 2.6, ph: 2.9, rh: 2.4 });
  const { g, fr, po, rf, w, d } = e;
  const lw = (w - e.pw) / 2;
  ad(po, simples(.1, 3.3, .1, c.m('#D9503C')), 1.3, 1.45, .1).rotation.z = .75; ad(po, simples(.1, 3.3, .1, c.m('#D9503C')), 1.3, 1.45, .1).rotation.z = -.75;
  ad(rf, caixa(1.1, .9, .12, c.m('#F2D49B'), .05), 0, .9, (d + 1) / 2 - .02);
  ad(g, caixa(w - .8, .1, d - .8, c.m('#EAD28A'), .05), 0, .24, 0);
  for(const [x, y, z, r] of [[-2.8, .2, -2.3, 0], [-1.7, .2, -2.3, 0], [-2.3, .75, -2.3, 0], [2.8, .2, -2.2, .2], [2.0, .2, -2.4, 0], [2.6, .75, -2.3, .1]]) fardo(g, c, x, y, z, r, 1);
  for(const [x, z] of [[-2.8, 1.2], [-2.3, 2.0]]){ const s = ad(g, cil(.4, .45, .8, c.m('#F2E6C8'), 12), x, .62, z); ad(s, cone(.3, .3, c.m('#F2E6C8'), 12), 0, .5, 0); }
  const f = ad(g, simples(.06, 1.6, .06, c.m('#8A5A28')), 3, 1.0, 1.4); f.rotation.z = .2; for(const dx of [-.12, 0, .12]) ad(f, simples(.04, .3, .04, c.m('#9AA6B0')), dx, .85, 0);
  Object.assign(e, { zona: { x0: -2, x1: 2, z0: -1, z1: 2 }, chaoY: .3 });
  return e;
};

/* ---------- edifícios abertos ---------- */
function aberta(c, w, d){
  const g = new THREE.Group();
  const e = { g, w, d, aberto: true, fr: null, rf: null, po: null, h: 2 };
  g.add(sombra(w * .6, d * .62, .22));
  return e;
}
function canteiro(pai, c, x, z, w, l, tipo){
  const g = new THREE.Group(); ad(pai, g, x, 0, z);
  ad(g, caixa(w, .45, l, c.m('#B88555'), .1), 0, .25, 0); ad(g, caixa(w - .3, .12, l - .3, c.m('#6B4426'), .05), 0, .48, 0);
  const n = Math.floor(l / .8);
  for(let i = 0; i < n; i++) for(const dx of [-w * .22, w * .22]){
    const px = dx, pz = -l / 2 + .5 + i * (l - 1) / Math.max(1, n - 1);
    if(tipo === 'alface'){ ad(g, bola(c.m(i % 2 ? '#7FD16A' : '#5BB85C'), .3, .22, .3), px, .68, pz); }
    else if(tipo === 'cenoura'){ ad(g, cone(.2, .5, c.m('#F3822B'), 8), px, .54, pz).rotation.x = Math.PI; for(const a of [0, 2.1, 4.2]) ad(g, bola(c.m('#5BB85C'), .08, .3, .08), px + Math.cos(a) * .1, .86, pz + Math.sin(a) * .1); }
    else if(tipo === 'tomate'){ ad(g, cil(.03, .03, .9, c.m('#8A5A28'), 6), px, .95, pz); ad(g, bola(c.m('#5BB85C'), .27, .3, .27), px, .95, pz); ad(g, bola(c.m('#E0342A'), .13), px + .17, .85, pz + .12); ad(g, bola(c.m('#E0342A'), .12), px - .12, 1.1, pz - .1); }
    else { ad(g, bola(c.m('#6FBF7A'), .34, .26, .34), px, .7, pz); ad(g, bola(c.m('#8FD59A'), .22, .2, .22), px, .8, pz); }
  }
  return g;
}

FAB.horta = c => {
  const e = aberta(c, 9.6, 7.6);
  const { g } = e;
  ad(g, caixa(9.4, .22, 7.4, c.m('#A8844E'), .2), 0, .11, 0);
  ad(g, caixa(9, .1, 7, c.m('#B8975F'), .15), 0, .24, 0);
  e.po = cerca(g, c, 9.2, 7.2);
  canteiro(g, c, -2.6, -2.0, 3.4, 2, 'alface'); canteiro(g, c, 1.0, -2.0, 3.4, 2, 'cenoura'); canteiro(g, c, 3.9, -1.4, 1.4, 3, 'tomate');
  canteiro(g, c, -4.0, -.1, 1.4, 2.6, 'couve');
  /* espantalho */
  const ep = ad(g, new THREE.Group(), 3.7, 0, 1.6);
  ad(ep, cil(.05, .05, 1.8, c.m('#8A5A28'), 6), 0, .9, 0); ad(ep, simples(1.5, .08, .08, c.m('#8A5A28')), 0, 1.4, 0);
  ad(ep, bola(c.m('#F2D49B'), .24), 0, 1.85, 0); ad(ep, cone(.34, .3, c.m('#D9503C'), 12), 0, 2.15, 0);
  ad(ep, caixa(.7, .8, .3, c.m('#5B8FD0'), .1), 0, 1.25, 0);
  olhos(ep, .08, 1.88, .22, .03);
  Object.assign(e, { zona: { x0: -3.4, x1: 3.0, z0: .6, z1: 2.8 }, chaoY: .29, cenarioAlvo: V3(0, .3, .2) });
  return e;
};

FAB.redil = c => {
  const e = aberta(c, 10.4, 8);
  const { g } = e;
  ad(g, cil(5.3, 5.3, .22, c.m('#7DC070'), 32), 0, .11, 0).scale.z = .78;
  ad(g, cil(4.7, 4.7, .1, c.m('#8FCF7F'), 32), 0, .26, 0).scale.z = .76;
  e.po = cerca(g, c, 10, 7.6, '#C98F55');
  /* abrigo */
  const ab = ad(g, new THREE.Group(), 3.2, 0, -2.4);
  ad(ab, caixa(3, 2, 2.2, c.m('#E8C196'), .1), 0, 1.0, 0);
  ad(ab, new THREE.Mesh(geoPrisma(3.8, 1.3, 2.9), c.m('#8A5A28')), 0, 2.0, 0);
  ad(ab, caixa(1.1, 1.4, .1, c.m('#6B4426'), .05), 0, .7, 1.12);
  const coxo = ad(g, caixa(2, .4, .6, c.m('#8A5A28'), .08), -3.2, .45, -2.8); ad(coxo, caixa(1.7, .12, .4, c.m('#5BB3D6'), .05), 0, .2, 0);
  fardo(g, c, -1.0, .25, -3.0, .2, .9); fardo(g, c, 0.1, .25, -3.1, 0, .9);
  for(const [x, z] of [[-4, 1.2], [4.1, 1.8], [-3.6, -.6]]) ad(g, bola(c.m(x > 0 ? '#F26B8A' : '#F5C344'), .15), x, .4, z);
  Object.assign(e, { zona: { x0: -3.8, x1: 2.2, z0: -2.0, z1: 2.6 }, chaoY: .3 });
  return e;
};

FAB.lago = c => {
  const e = aberta(c, 10.4, 8);
  const { g } = e;
  ad(g, cil(5.3, 5.3, .22, c.m('#7DC070'), 32), 0, .11, 0).scale.z = .78;
  ad(g, cil(4.0, 4.0, .3, c.m('#B58A58'), 32), 0, .15, 0).scale.z = .66;
  const agua = ad(g, cil(3.6, 3.6, .3, c.m('#5DB4D8'), 32), 0, .2, 0); agua.scale.z = .62;
  e.agua = agua;
  e.ondas = [0, 1, 2].map(i => { const o = new THREE.Mesh(cacheGeo('onda', () => new THREE.RingGeometry(.94, 1, 40)), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, depthWrite: false, side: THREE.DoubleSide }));
    o.rotation.x = -Math.PI / 2; o.position.y = .38; g.add(o); o.userData.i = i; return o; });
  for(const [x, z, r, f] of [[-1.7, -.5, .5, '#F26B8A'], [1.6, .9, .45, '#fff'], [.4, -1.3, .4, '#F5C344'], [-.3, 1.1, .38, null]]){
    ad(g, cil(r, r, .05, c.m('#4FA464'), 14), x, .4, z);
    if(f) ad(g, bola(c.m(f), r * .35), x, .5, z);
  }
  for(const [x, z] of [[-4.2, -1.8], [-4.7, -.8], [4.4, -1.5], [4.6, -.3], [-3.2, -3]]){
    for(let i = 0; i < 3; i++){ const j = ad(g, cil(.035, .05, 1.5 + i * .25, c.m('#6FA34A'), 6), x + i * .18, .9, z + i * .1); j.rotation.z = (i - 1) * .15; }
    ad(g, cil(.09, .09, .5, c.m('#8A5A28'), 8), x + .18, 1.9, z + .1);
  }
  for(let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2; ad(g, bola(c.m(i % 2 ? '#B7B2A5' : '#9C978B'), .34, .22, .3), Math.cos(a) * 3.95, .3, Math.sin(a) * 2.6); }
  Object.assign(e, { zona: { x0: -3, x1: 3, z0: -2, z1: 2 }, chaoY: .3, lago: true });
  return e;
};

FAB.pomar = c => {
  const e = aberta(c, 10.4, 8);
  const { g } = e;
  ad(g, cil(5.3, 5.3, .22, c.m('#78BB6C'), 32), 0, .11, 0).scale.z = .78;
  e.po = cerca(g, c, 10, 7.6, '#C98F55');
  e.arvores = [];
  for(const [x, z, s] of [[-3.2, -1.8, 1.05], [3, -1.9, 1], [-3.4, 1.4, .9], [3.3, 1.3, 1], [0, -2.6, .85]]){
    const t = ad(g, new THREE.Group(), x, 0, z); t.scale.setScalar(s); e.arvores.push(t);
    ad(t, cil(.2, .3, 1.6, c.m('#8A5A28'), 8), 0, .9, 0);
    const fo = c.m('#58B05A'), fo2 = c.m('#6BC264');
    ad(t, bola(fo, 1.3, 1.1, 1.3), 0, 2.4, 0); ad(t, bola(fo2, .9, .8, .9), -.7, 2.1, .5); ad(t, bola(fo, .9, .8, .9), .8, 2.2, -.3); ad(t, bola(fo2, .8, .7, .8), .1, 3, .2);
    for(const [ax, ay, az] of [[-.6, 2.3, 1.0], [.7, 2.0, 1.0], [-1.0, 2.7, -.2], [.9, 2.8, .4], [.1, 3.2, .8], [-.2, 1.9, -1.1]]) ad(t, bola(c.m('#E0342A'), .15), ax, ay, az);
  }
  const cesto = ad(g, cil(.6, .45, .5, c.m('#C49A4A'), 12), 0, .5, 2.0); for(const dx of [-.2, .15, 0]) ad(cesto, bola(c.m('#E0342A'), .16), dx, .3, dx * .5);
  e.borb = [0, 1].map(i => { const b = new THREE.Group(); g.add(b); const cor = i ? '#F5C344' : '#F3822B';
    for(const s of [-1, 1]){ const a = new THREE.Group(); b.add(a); ad(a, bola(c.m(cor), .22, .02, .16), s * .2, 0, 0); a.userData.s = s; }
    ad(b, bola(c.m('#5A3C20'), .04, .04, .14)); b.userData.i = i; return b; });
  Object.assign(e, { zona: { x0: -2, x1: 2, z0: -1, z1: 2 }, chaoY: .3 });
  return e;
};

FAB.estufa = c => {
  const e = aberta(c, 7.2, 6.4);
  const { g } = e;
  const R = 3.2, L = 6;
  ad(g, caixa(R * 2 + .3, .3, L + .2, c.m('#F6F6F0'), .1), 0, .15, 0);
  ad(g, caixa(R * 2 - .3, .1, L - .2, c.m('#C9A06A'), .06), 0, .33, 0);
  const vidro = c.m('#CFEFF8', { transparent: true, opacity: .38, side: THREE.DoubleSide, depthWrite: false });
  const arco = new THREE.Mesh(cacheGeo('arco', () => new THREE.CylinderGeometry(R, R, L, 20, 1, true, 0, Math.PI)), vidro);
  arco.rotation.set(Math.PI / 2, 0, Math.PI / 2); arco.position.set(0, .3, 0); g.add(arco);
  const aro = cacheGeo('aro', () => new THREE.TorusGeometry(R, .07, 6, 24, Math.PI));
  const branco = c.m('#FFFFFF');
  for(const z of [-L / 2, -L / 4, 0, L / 4]) ad(g, new THREE.Mesh(aro, branco), 0, .3, z);
  const fr = new THREE.Group(); ad(g, fr, 0, .3, L / 2); e.fr = fr;
  const frente = new THREE.Mesh(cacheGeo('semi', () => new THREE.CircleGeometry(R, 20, 0, Math.PI)), vidro); fr.add(frente);
  ad(fr, new THREE.Mesh(aro, branco));
  for(const s of [-1, 1]) ad(fr, simples(.07, 2.4, .07, branco), s * LARGURA_PORTA / 2, 1.2, .03);
  ad(fr, simples(LARGURA_PORTA, .07, .07, branco), 0, 2.4, .03);
  const po = new THREE.Group(); ad(fr, po, -LARGURA_PORTA / 2, 0, .06); e.po = po;
  ad(po, simples(LARGURA_PORTA, 2.3, .06, c.m('#E3F4FA', { transparent: true, opacity: .55 })), LARGURA_PORTA / 2, 1.15, 0);
  ad(po, simples(LARGURA_PORTA, .07, .08, branco), LARGURA_PORTA / 2, 1.15, 0);
  for(const s of [-1, 1]){
    const fila = ad(g, new THREE.Group(), s * 1.9, .4, 0);
    ad(fila, caixa(1.1, .35, L - 1, c.m('#B88555'), .1), 0, .17, 0);
    for(let i = 0; i < 6; i++){ const z = -L / 2 + 1 + i * .95;
      ad(fila, cil(.03, .03, 1.1, c.m('#8A5A28'), 6), 0, .8, z);
      ad(fila, bola(c.m('#4FA464'), .3, .35, .3), 0, .85, z);
      ad(fila, bola(c.m(s > 0 ? '#E0342A' : '#8FD14F'), .13), .22, .75, z + .08); ad(fila, bola(c.m(s > 0 ? '#E0342A' : '#8FD14F'), .12), -.2, 1.0, z - .06);
    }
  }
  const rega = ad(g, cil(.25, .25, .4, c.m('#5BAF6A'), 10), 0, .6, -2.2); ad(rega, cil(.04, .04, .6, c.m('#5BAF6A'), 6), .35, .15, 0).rotation.z = -.9;
  Object.assign(e, { zona: { x0: -.5, x1: .5, z0: -1, z1: 1 }, chaoY: .4, h: R });
  return e;
};

FAB.moinho = c => {
  const e = aberta(c, 5.6, 5.6);
  const { g } = e;
  const Rb = 2.6, Rt = 1.7, H = 6;
  ad(g, cil(Rb + .3, Rb + .3, .3, c.m('#B7B2A5'), 24), 0, .15, 0);
  ad(g, cil(Rb - .2, Rb - .2, .1, c.m('#CDA568'), 24), 0, .33, 0);
  const par = c.m('#F4E1B4', { side: THREE.DoubleSide });
  const FA = Math.PI / 2.1;
  /* a frente é o setor à volta de +z; a porta fica aí */
  const cobre = (a0, a1) => new THREE.Mesh(cacheGeo(`torre${a0}|${a1}`, () => new THREE.CylinderGeometry(Rt, Rb, H, 20, 1, true, a0, a1 - a0)), par);
  ad(g, cobre(FA / 2 + .0, Math.PI * 2 - FA / 2), 0, H / 2 + .3, 0).rotation.y = 0;
  /* CylinderGeometry: theta 0 aponta para +z; dá a volta com o sinal de +x */
  const fr = new THREE.Group(); ad(g, fr, 0, 0, 0); e.fr = fr;
  const fa = new THREE.Mesh(cacheGeo('torreF', () => new THREE.CylinderGeometry(Rt, Rb, H, 12, 1, true, -FA / 2, FA)), par); ad(fr, fa, 0, H / 2 + .3, 0);
  /* corrigir a faixa traseira para fechar o círculo */
  e.fr = fr;
  const po = new THREE.Group(); ad(fr, po, -.85, .3, Rb - .08); e.po = po;
  ad(po, caixa(1.7, 2.3, .14, c.m('#8A5A28'), .05), .85, 1.15, 0);
  const rf = new THREE.Group(); ad(g, rf, 0, H + .3, 0); e.rf = rf;
  ad(rf, cone(Rt + .5, 1.9, c.m('#D9503C'), 20), 0, .95, 0); ad(rf, cil(Rt + .45, Rt + .45, .2, c.m('#B5392E'), 20), 0, .05, 0);
  const pas = new THREE.Group(); ad(rf, pas, 0, -.4, Rt + .7); e.pas = pas;
  for(let i = 0; i < 4; i++){ const b = new THREE.Group(); pas.add(b); b.rotation.z = i * Math.PI / 2;
    ad(b, caixa(.2, 5.2, .15, c.m('#8A5A28'), .04), 0, 2.6, 0); ad(b, caixa(.9, 3, .08, c.m('#FFF1DC'), .04), .5, 3, .06);
    for(const y of [1.3, 2.4, 3.5, 4.6]) ad(b, simples(.9, .05, .1, c.m('#C98F55')), .5, y, .06); }
  ad(pas, bola(c.m('#8A5A28'), .3), 0, 0, 0);
  ad(fr, janela(new THREE.Group(), 0, 0, 0, .7, .8, 0, c), 0, 4.2, Rt + .15);
  /* sacos de farinha e mó */
  ad(g, cil(1.1, 1.1, .35, c.m('#A8A39A'), 20), 0, .5, -.6);
  for(const [x, z] of [[-1.5, -.2], [1.4, -.5], [1.1, 1.0]]){ const s = ad(g, cil(.38, .45, .85, c.m('#F2E6C8'), 12), x, .75, z); ad(s, cone(.3, .3, c.m('#F2E6C8'), 12), 0, .55, 0); ad(s, bola(c.m('#fff'), .1), .0, .0, .4); }
  Object.assign(e, { zona: null, chaoY: .4, h: H, w: 4.6, d: 4.6 });
  return e;
};

/* nomes e ordem no mapa */
const ORDEM = ['estufa', 'celeiro', 'moinho', 'estabulo', 'pomar', 'vacaria', 'redil', 'pocilga', 'casa', 'horta', 'galinheiro', 'lago'];
const PASSO_X = 13.5, PASSO_Z = 14.5;

/* ============================================================ etiquetas */
function etiqueta(texto, sub){
  const c = document.createElement('canvas'); c.width = 320; c.height = sub ? 150 : 110;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false });
  const s = new THREE.Sprite(mat); s.renderOrder = 10;
  s.userData.pinta = () => {
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    const H = c.height - 14;
    g.fillStyle = '#C98F55'; g.strokeStyle = '#8A5A28'; g.lineWidth = 7;
    g.beginPath(); g.roundRect(8, 4, c.width - 16, H, 28); g.fill(); g.stroke();
    g.fillStyle = '#E8C196'; g.beginPath(); g.roundRect(14, 10, c.width - 28, H / 2 - 4, 22); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#4A2E14'; let px = 46;
    do{ g.font = `700 ${px}px Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif`; px -= 2; }while(g.measureText(texto).width > c.width - 48 && px > 20);
    g.fillText(texto, c.width / 2, sub ? 52 : H / 2 + 4);
    if(sub){ g.fillStyle = '#fff'; g.font = '700 44px Fredoka, system-ui, sans-serif'; g.strokeStyle = '#8A5A28'; g.lineWidth = 6;
      g.strokeText(sub, c.width / 2, 108); g.fillText(sub, c.width / 2, 108); }
    t.needsUpdate = true;
  };
  s.userData.pinta();
  s.scale.set(3.3, 3.3 * c.height / c.width, 1);
  return s;
}

/* ============================================================ a cena */
export class Quinta3D {
  static suportado(){
    try{ const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
    catch(e){ return false; }
  }

  constructor(canvas, cb = {}){
    this.canvas = canvas; this.cb = cb;
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.r.outputColorSpace = THREE.SRGBColorSpace;
    this.r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.cena = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(40, 1, .5, 400);
    this.relogio = new THREE.Clock();
    this.t = 0; this.ligada = false;
    this.itens = {}; this.edif = {}; this.estado = 'fora'; this.prog = 0; this.dir = 0; this.atual = null;
    this.pan = new THREE.Vector2(0, 2); this.panVis = this.pan.clone(); this.cols = 4;
    this.alvoCam = V3(); this.posCam = V3();
    this.pulos = [];
    this.ray = new THREE.Raycaster(); this.pt = new THREE.Vector2();

    this.fazCeu(); this.fazLuz(); this.fazMundo();
    for(const def of EDIFICIOS) this.fazEdificio(def);
    this.layout(true);
    this.amigos = new Amigos(this);
    this.liga();
    this.redimensiona();
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(() => { for(const k in this.edif){ const s = this.edif[k].rotulo; if(s) s.userData.pinta(); } });
    this.ro = new ResizeObserver(() => this.redimensiona()); this.ro.observe(canvas.parentElement || canvas);
  }

  /* ------------------------------------------------ cenário */
  fazCeu(){
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#8FD0EC'); gr.addColorStop(.55, '#CDEBF6'); gr.addColorStop(1, '#FDF3DC');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    this.cena.background = t;
    this.cena.fog = new THREE.Fog(0xdff0e4, 120, 260);
  }
  fazLuz(){
    this.cena.add(new THREE.HemisphereLight(0xeaf6ff, 0xa8c48a, 2.1));
    const sol = new THREE.DirectionalLight(0xfff0d0, 2.2); sol.position.set(-20, 40, 26); this.cena.add(sol);
  }
  fazMundo(){
    const verde = new THREE.MeshLambertMaterial({ color: '#8CCB78' });
    const chao = new THREE.Mesh(new THREE.CircleGeometry(150, 48), verde); chao.rotation.x = -Math.PI / 2; this.cena.add(chao);
    const rs = semente(7);
    /* montes ao fundo */
    for(const [x, z, r, s, cor] of [[-70, -95, 40, .35, '#7DBE72'], [10, -110, 55, .3, '#6FB174'], [80, -90, 42, .38, '#86C47C'], [-20, -125, 60, .28, '#8FC98C']]){
      const m = bola(new THREE.MeshLambertMaterial({ color: cor }), r, r * s, r); m.position.set(x, 0, z); this.cena.add(m);
    }
    /* árvores à volta */
    this.borda = new THREE.Group(); this.cena.add(this.borda);
    this.arvoresMundo = [];
    for(let i = 0; i < 46; i++){
      const a = rs() * Math.PI * 2, d = 1;
      const t = new THREE.Group(); const s = .8 + rs() * .9;
      const mt = MA('#8A5A28'), mf = MA(['#4E9A4E', '#5FAE58', '#53A352'][i % 3]);
      ad(t, cil(.22, .32, 1.8, mt, 7), 0, .9, 0); ad(t, bola(mf, 1.5, 1.3, 1.5), 0, 2.7, 0); ad(t, bola(MA('#6BC264'), 1, .9, 1), -.5, 3.2, .3);
      t.scale.setScalar(s * 1.2); t.userData.a = a; t.userData.r = rs(); this.arvoresMundo.push(t); this.borda.add(t);
    }
    /* flores */
    const fl = new THREE.Group(); this.cena.add(fl);
    this.flores = fl;
    for(let i = 0; i < 90; i++){
      const f = bola(MA(['#F26B8A', '#F5C344', '#fff', '#9B7FD4'][i % 4]), .16, .12, .16);
      f.userData.a = rs() * 6.283; f.userData.r = rs(); fl.add(f);
    }
    /* nuvens */
    this.nuvens = [];
    const bn = MA('#ffffff');
    for(let i = 0; i < 7; i++){
      const n = new THREE.Group();
      for(const [x, y, r] of [[0, 0, 3], [3, -.4, 2.3], [-3, -.5, 2.3], [1.4, 1.2, 2.3]]) ad(n, bola(bn, r, r * .7, r * .8), x, y, 0);
      n.position.set(-100 + i * 36, 38 + (i % 3) * 7, -70 + (i % 4) * 26); n.userData.v = .6 + (i % 3) * .3; n.scale.setScalar(1 + (i % 3) * .3);
      this.cena.add(n); this.nuvens.push(n);
    }
    this.caminhos = new THREE.Group(); this.cena.add(this.caminhos);
    this.raiz = new THREE.Group(); this.cena.add(this.raiz);
  }

  fazEdificio(def){
    const c = contexto();
    const e = FAB[def.id](c);
    e.def = def; e.c = c; e.id = def.id;
    e.root = new THREE.Group(); e.root.add(e.g);
    e.g.userData.ed = def.id;
    e.root.traverse(o => { if(o.isMesh) o.userData.ed = def.id; });
    e.animais = []; e.anima = e.anima || null;
    e.possui = null; e.pop = 1; e.porta = 0; e.tetoK = 0; e.frenteK = 0;
    /* etiqueta */
    e.rotulo = etiqueta(def.nome, `⭐ ${def.preco}`); e.rotuloNome = def.nome;
    e.rotulo.position.set(0, (e.h || 3) + (e.aberto ? 3.5 : 4.6), e.aberto ? 2 : 0);
    e.root.add(e.rotulo);
    e.sorteia = (id, de) => {
      if(e.lago){
        if(id === 'pato'){ const a = Math.random() * 6.28, r = Math.sqrt(Math.random()); return V3(Math.cos(a) * 2.8 * r, 0, Math.sin(a) * 1.7 * r); }
        const a = Math.random() * 6.28; return V3(Math.cos(a) * (id === 'ra' ? 4.15 : 4.3), 0, Math.sin(a) * (id === 'ra' ? 2.95 : 3.1));
      }
      const z = e.zona; return V3(rnd(z.x0, z.x1), 0, rnd(z.z0, z.z1));
    };
    this.raiz.add(e.root);
    this.edif[def.id] = e;
  }

  /* ------------------------------------------------ disposição */
  layout(forca){
    const asp = this.cam.aspect || 1.6;
    const cols = asp < .95 ? 3 : 4;
    if(cols === this.cols && !forca) return;
    this.cols = cols;
    const rows = Math.ceil(ORDEM.length / cols);
    this.extX = cols * PASSO_X / 2; this.extZ = rows * PASSO_Z / 2;
    ORDEM.forEach((id, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = (col - (cols - 1) / 2) * PASSO_X, z = (row - (rows - 1) / 2) * PASSO_Z;
      this.edif[id].root.position.set(x, 0, z);
    });
    /* caminhos: uma faixa em frente a cada fila */
    this.caminhos.clear();
    const terra = new THREE.MeshLambertMaterial({ color: '#D9BE8C' });
    for(let row = 0; row < rows; row++){
      const z = (row - (rows - 1) / 2) * PASSO_Z + 6.6;
      const f = new THREE.Mesh(cacheGeo('plano', () => new THREE.PlaneGeometry(2, 2)), terra); f.rotation.x = -Math.PI / 2;
      f.scale.set(this.extX + 7, 1.7, 1); f.position.set(0, .04, z); this.caminhos.add(f);
    }
    /* árvores e flores à volta, fora da quinta */
    const W = this.extX + 12, D = this.extZ + 10;
    for(const t of this.arvoresMundo){
      const a = t.userData.a, k = t.userData.r;
      const ca = Math.cos(a), sa = Math.sin(a);
      const m = 1 / Math.max(Math.abs(ca) / W, Math.abs(sa) / D);
      const r = 1 + .1 + k * .55;
      t.position.set(ca * m * r, 0, sa * m * r);
      if(t.position.z > D * .85) t.position.z = -t.position.z * .6;
    }
    for(const f of this.flores.children){
      const a = f.userData.a, k = f.userData.r;
      let x = Math.cos(a) * (this.extX + 4) * (.2 + k * .85), z = Math.sin(a) * (this.extZ + 3) * (.2 + k * .95);
      f.position.set(x, .12, z);
      /* longe dos edifícios: empurra para a faixa entre filas */
      const rowZ = Math.round(((z / PASSO_Z) + (rows - 1) / 2)) ; void rowZ;
    }
    this.ajustaZoom();
  }

  ajustaZoom(){
    const a = this.cam.aspect, fov = this.cam.fov * Math.PI / 180;
    const larg = this.cols === 4 ? this.cols * PASSO_X + 6 : 2 * PASSO_X + 3;
    this.elev = 55 * Math.PI / 180;
    const rows = Math.ceil(ORDEM.length / this.cols);
    const prof = this.cols === 4 ? rows * PASSO_Z + 4 : 2.3 * PASSO_Z;
    const dL = larg / (2 * Math.tan(fov / 2) * a);
    const dP = prof * Math.sin(this.elev) / (2 * Math.tan(fov / 2)) * 1.0;
    this.dist = lim(Math.max(dL, dP), 30, 120);
    const meioL = this.dist * Math.tan(fov / 2) * a;
    const meioP = this.dist * Math.tan(fov / 2) / Math.sin(this.elev);
    this.panMax = V3(Math.max(0, this.extX + 3 - meioL), 0, Math.max(0, this.extZ + 6 - meioP * .85));
  }

  poseGeral(){
    const d = this.dist, e = this.elev;
    const alvo = V3(this.panVis.x, 0, this.panVis.y);
    const pos = alvo.clone().add(V3(0, Math.sin(e) * d, Math.cos(e) * d));
    return { pos, alvo };
  }

  /* ------------------------------------------------ posses */
  posesDe(e){
    const w = e.w, d = e.d, asp = this.cam.aspect, tv = Math.tan(this.cam.fov * Math.PI / 360);
    const base = e.root.position, local = (x, y, z) => V3(x, y, z).add(base);
    const alvoY = e.aberto ? .5 : .6;
    const centroZ = e.aberto ? -.2 : -d * .12;
    const dentroAlvo = e.cenarioAlvo ? e.cenarioAlvo.clone().add(base) : local(0, alvoY, centroZ);
    const Dd = 1.12 * Math.max(e.aberto ? 7 : 5, (w * .54) / (tv * Math.max(.3, asp)), (d * .46) / tv);
    const dir = V3(0, .66, 1).normalize();
    const dentro = dentroAlvo.clone().add(dir.multiplyScalar(Dd));
    const frente = d / 2 + (e.aberto ? 1.2 : .5);
    const aproxima = { pos: local(0, 2.0, d / 2 + 6.2 + (e.aberto ? 1 : 0)), alvo: local(0, 1.3, 0) };
    const porta = { pos: local(0, 1.7, frente + .6), alvo: local(0, 1.1, -1) };
    return { aproxima, porta, dentro: { pos: dentro, alvo: dentroAlvo } };
  }

  /* ------------------------------------------------ estado do mundo */
  atualiza(itens, novo){
    this.itens = itens || {};
    for(const def of EDIFICIOS){
      const e = this.edif[def.id], tem = !!this.itens[def.id];
      if(tem !== e.possui){
        e.possui = tem;
        this.fantasma(e, !tem);
        e.rotulo.visible = true;
        if(tem && novo === def.id){ e.pop = 0; }
      }
      /* etiqueta: nome só, ou nome + preço */
      const nome = def.nome;
      const novoSub = tem ? null : `⭐ ${def.preco}`;
      if(e.rotuloSub !== novoSub || !e.rotuloFeito){
        e.root.remove(e.rotulo);
        e.rotulo.material.map.dispose(); e.rotulo.material.dispose();
        const y = e.rotulo.position.y, z = e.rotulo.position.z;
        e.rotulo = etiqueta(nome, novoSub); e.rotulo.position.set(0, y, z); e.root.add(e.rotulo);
        e.rotuloSub = novoSub; e.rotuloFeito = true;
      }
      /* animais: acerta as contagens */
      const quer = [];
      for(const b of BICHOS.filter(b => b.casa === def.id)) for(let i = 0; i < (this.itens[b.id] || 0); i++) quer.push(b.id);
      const tem2 = e.animais.map(a => a.id);
      for(let i = e.animais.length - 1; i >= 0; i--){
        const k = quer.indexOf(e.animais[i].id);
        if(k < 0){ e.root.remove(e.animais[i].g); e.animais.splice(i, 1); } else quer.splice(k, 1);
      }
      void tem2;
      for(const id of quer){
        const a = new Animal(id); const p = e.sorteia(id); a.g.position.set(p.x, 0, p.z); e.g.add(a.g);
        a.g.position.y = e.chaoY; a.pausa = rnd(.2, 1.5); a.entra = 0;
        e.animais.push(a);
        if(novo === id || (this.atual === e)) a.boing();
      }
    }
    if(novo && this.edif[novo] && !this.atual) this.mostraEdificio(novo);
    this.amigos.sincroniza(this.itens, novo);       /* o menino e a menina, se já são teus */
  }

  fantasma(e, on){
    for(const m of e.c.mats){
      if(on){ if(m.userData.op === undefined){ m.userData.op = m.opacity; m.userData.tr = m.transparent; m.userData.dw = m.depthWrite; }
        m.transparent = true; m.opacity = Math.min(m.opacity, .3); m.depthWrite = false; }
      else if(m.userData.op !== undefined){ m.opacity = m.userData.op; m.transparent = m.userData.tr; m.depthWrite = m.userData.dw; }
      m.needsUpdate = true;
    }
  }

  mostraEdificio(id){
    const e = this.edif[id]; if(!e) return;
    const p = e.root.position;
    this.pan.set(lim(p.x, -this.panMax.x, this.panMax.x), lim(p.z + 3, -this.panMax.z, this.panMax.z));
  }

  /* ------------------------------------------------ entrar e sair */
  get dentro(){ return this.estado === 'dentro' || this.estado === 'entrando'; }
  get nomeAtual(){ return this.atual ? this.atual.def : null; }

  entra(id){
    const e = this.edif[id]; if(!e || this.estado !== 'fora') return;
    if(!e.possui){ this.cb.vazio && this.cb.vazio(id); return; }
    this.atual = e; this.estado = 'entrando';
    const g0 = this.poseGeral();
    this.k = this.posesDe(e);
    this.k0 = { pos: this.cam.position.clone().lengthSq() ? this.cam.position.clone() : g0.pos, alvo: this.alvoCam.clone() };
    const sobe = this.k.aproxima.pos.clone().add(V3(0, 7, 5));
    this.curvaA = new THREE.CatmullRomCurve3([this.k0.pos, this.k0.pos.clone().lerp(sobe, .55).add(V3(0, 2, 0)), this.k.aproxima.pos], false, 'centripetal');
    this.tem = !!e.po;
    const f = calmo ? .35 : 1;
    this.T1 = 1.15 * f; this.T2 = (this.tem ? .55 : 0) * f; this.T3 = 1.35 * f; this.T = this.T1 + this.T2 + this.T3;
    this.curvaB = new THREE.CatmullRomCurve3(this.tem
      ? [this.k.aproxima.pos, this.k.porta.pos, this.k.dentro.pos.clone().lerp(this.k.porta.pos, .0)] : [this.k.aproxima.pos, this.k.aproxima.pos.clone().lerp(this.k.dentro.pos, .5), this.k.dentro.pos]);
    this.curvaC = new THREE.CatmullRomCurve3(this.tem
      ? [this.k.aproxima.alvo, this.k.porta.alvo, this.k.dentro.alvo] : [this.k.aproxima.alvo, this.k.aproxima.alvo.clone().lerp(this.k.dentro.alvo, .5), this.k.dentro.alvo]);
    this.prog = 0; this.dir = 1;
    e.rotulo.visible = false;
    for(const a of e.animais) if(a.g) a.g.visible = true;
    this.cb.entrou && this.cb.entrou(e.def);
  }
  sai(){
    if(this.estado !== 'dentro' && !(this.estado === 'entrando')) return;
    this.estado = 'saindo'; this.dir = -1;
    this.cb.saiu && this.cb.saiu(this.atual.def);
  }

  /* aplica o instante `s` (0..T) da sequência de entrada */
  sequencia(s){
    const e = this.atual, k = this.k;
    const { T1, T2, T3 } = this;
    let pos, alvo, porta = 0, teto = 0, frente = 0;
    if(s < T1){
      const u = suave(s / T1);
      pos = this.curvaA.getPoint(u);
      alvo = this.k0.alvo.clone().lerp(k.aproxima.alvo, u);
    }else if(s < T1 + T2){
      const u = (s - T1) / T2;
      pos = k.aproxima.pos.clone().lerp(k.porta.pos, suave(u) * .12); alvo = k.aproxima.alvo.clone();
      porta = suave(u);
    }else{
      const u = suave((s - T1 - T2) / T3);
      const uu = this.tem ? u : u;
      const pa = this.tem ? this.curvaB : this.curvaB;
      pos = pa.getPoint(uu); alvo = this.curvaC.getPoint(uu);
      porta = this.tem ? 1 : 0;
      teto = mais(u, .35, .85); frente = mais(u, .55, .95);
    }
    this.pose(pos, alvo);
    e.porta = porta; e.tetoK = teto; e.frenteK = frente;
  }

  pose(pos, alvo){ this.posCam.copy(pos); this.alvoCam.copy(alvo); this.cam.position.copy(pos); this.cam.lookAt(alvo); }

  /* partes do edifício segundo os seus estados */
  poePartes(e, dt){
    if(e.po){
      const abre = e.aberto && !e.fr ? -1.7 : -1.95;
      e.po.rotation.y = abre * e.porta;
    }
    if(e.rf){ e.rf.position.y = (e.rfY0 === undefined ? (e.rfY0 = e.rf.position.y) : e.rfY0) + e.tetoK * 9; e.rf.scale.setScalar(1 - e.tetoK * .0); e.rf.visible = e.tetoK < .98; }
    if(e.fr){ e.fr.scale.y = Math.max(.001, 1 - e.frenteK); e.fr.visible = e.frenteK < .99; }
  }

  /* ------------------------------------------------ interação */
  liga(){
    const cv = this.canvas; let p0 = null, arrasta = false, ult = null;
    cv.addEventListener('pointerdown', ev => { cv.setPointerCapture(ev.pointerId); p0 = { x: ev.clientX, y: ev.clientY, t: performance.now() }; ult = { x: ev.clientX, y: ev.clientY }; arrasta = false; });
    cv.addEventListener('pointermove', ev => {
      if(!p0) return;
      if(Math.hypot(ev.clientX - p0.x, ev.clientY - p0.y) > 9) arrasta = true;
      if(arrasta && this.estado === 'fora'){
        const th = 2 * this.dist * Math.tan(this.cam.fov * Math.PI / 360);
        this.pan.x -= (ev.clientX - ult.x) * th * this.cam.aspect / Math.max(1, cv.clientWidth);
        this.pan.y -= (ev.clientY - ult.y) * th / Math.max(1, cv.clientHeight) / Math.sin(this.elev);
        this.pan.x = lim(this.pan.x, -this.panMax.x, this.panMax.x); this.pan.y = lim(this.pan.y, -this.panMax.z, this.panMax.z);
      }
      ult = { x: ev.clientX, y: ev.clientY };
    });
    const fim = ev => {
      if(!p0) return;
      const toque = !arrasta && performance.now() - p0.t < 700;
      p0 = null;
      if(toque) this.toca(ev.clientX, ev.clientY);
    };
    cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', () => { p0 = null; });
  }

  acerta(x, y, alvos){
    const r = this.canvas.getBoundingClientRect();
    this.pt.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height * 2 - 1));
    this.ray.setFromCamera(this.pt, this.cam);
    const hits = this.ray.intersectObjects(alvos, true);
    for(const h of hits){ let o = h.object; while(o){ if(o.userData && (o.userData.animal || o.userData.ed || o.userData.amigo)) return o.userData; o = o.parent; } }
    return null;
  }

  toca(x, y){
    if(this.estado === 'fora'){
      const am = this.acerta(x, y, this.amigos.alvos());
      if(am && am.amigo){ am.amigo.toque(); this.cb.amigo && this.cb.amigo(am.amigo.id); return; }
      const alvos = Object.values(this.edif).map(e => e.root);
      const u = this.acerta(x, y, alvos);
      if(u){ const id = u.ed || (u.animal && Object.values(this.edif).find(e => e.animais.includes(u.animal)).id); if(id) this.cb.toque && this.cb.toque(id); }
    }else if(this.estado === 'dentro'){
      const u = this.acerta(x, y, this.atual.animais.map(a => a.g));
      if(u && u.animal){ u.animal.boing(); this.cb.bicho && this.cb.bicho(u.animal.id); }
    }
  }

  /* ------------------------------------------------ ciclo */
  ativa(on){
    if(on === this.ligada) return;
    this.ligada = on;
    if(on){ this.redimensiona(); this.relogio.getDelta(); this.loop(); }
  }
  loop = () => {
    if(!this.ligada) return;
    requestAnimationFrame(this.loop);
    const dt = Math.min(this.relogio.getDelta(), .05); this.t += dt;
    this.passo(dt, this.t);
    this.r.render(this.cena, this.cam);
  };

  passo(dt, t){
    /* sequência de entrada/saída */
    if(this.estado === 'entrando' || this.estado === 'saindo'){
      this.prog = lim(this.prog + this.dir * dt, 0, this.T);
      this.sequencia(this.prog);
      if(this.estado === 'entrando' && this.prog >= this.T){ this.estado = 'dentro'; this.cb.dentro && this.cb.dentro(this.atual.def); }
      if(this.estado === 'saindo' && this.prog <= 0){
        const e = this.atual; e.porta = e.tetoK = e.frenteK = 0; this.poePartes(e, 0);
        this.estado = 'fora'; e.rotulo.visible = true; this.atual = null;
        this.panVis.copy(this.pan);
        const g = this.poseGeral(); this.pose(g.pos, g.alvo);
        this.cb.fora && this.cb.fora();
      }
    }else if(this.estado === 'dentro'){
      const bal = calmo ? 0 : 1;
      const p = this.k.dentro.pos.clone(); p.x += Math.sin(t * .45) * .14 * bal; p.y += Math.sin(t * .6) * .05 * bal;
      this.pose(p, this.k.dentro.alvo);
    }else{
      this.panVis.lerp(this.pan, 1 - Math.exp(-6 * dt));
      const g = this.poseGeral();
      if(!calmo) g.pos.x += Math.sin(t * .2) * .6;
      this.pose(g.pos, g.alvo);
    }
    /* edifícios e animais */
    for(const id in this.edif){
      const e = this.edif[id];
      if(e.pop < 1){ e.pop = Math.min(1, e.pop + dt / .8); const k = e.pop; const s = k < .6 ? .3 + k / .6 * .85 : 1.15 - (k - .6) / .4 * .15; e.root.scale.setScalar(s); } else e.root.scale.setScalar(1);
      if(this.atual === e) this.poePartes(e, dt); else if(e.porta || e.tetoK || e.frenteK){ e.porta = e.tetoK = e.frenteK = 0; this.poePartes(e, dt); }
      const visivel = e.aberto ? e.possui : (this.atual === e);
      for(const a of e.animais){
        a.g.visible = visivel;
        if(visivel) a.atualiza(dt, t, e);
      }
      if(e.fumo){ for(const b of e.fumo){ const k = ((t * .3 + b.userData.i / 3) % 1); b.position.y = 2.2 + k * 2.4; b.scale.setScalar(.15 + k * .3); b.material.opacity = (1 - k) * .6; b.visible = this.atual !== e; } }
      if(e.pas) e.pas.rotation.z = t * .9;
      if(e.ondas) for(const o of e.ondas){ const k = (t * .25 + o.userData.i / 3) % 1; o.scale.set(.6 + k * 3.1, .4 + k * 2.0, 1); o.material.opacity = (1 - k) * .55; o.position.y = .38; o.scale.y = (.4 + k * 2.0); }
      if(e.borb) for(const b of e.borb){ const i = b.userData.i, k = t * .6 + i * 3; b.position.set(Math.sin(k) * 2.6 + (i ? -1 : 1), 1.8 + Math.sin(k * 3) * .4, Math.cos(k * .8) * 1.8); b.rotation.y = k; for(const a of b.children) if(a.userData.s) a.rotation.z = a.userData.s * Math.sin(t * 20 + i) * .8; }
      /* etiquetas acima: sobem e descem de leve */
      e.rotulo.position.y += Math.sin(t * 1.6 + e.root.position.x) * .003;
      e.rotulo.visible = this.estado === 'fora';
    }
    this.amigos.passo(dt, t);
    for(const n of this.nuvens){ n.position.x += n.userData.v * dt * 1.4; if(n.position.x > 130) n.position.x = -130; }
  }

  redimensiona(){
    const p = this.canvas.parentElement || this.canvas;
    const w = Math.max(1, p.clientWidth), h = Math.max(1, p.clientHeight);
    this.r.setSize(w, h, false);
    this.cam.aspect = w / h;
    this.cam.fov = w / h < .8 ? 48 : 40;
    this.cam.updateProjectionMatrix();
    this.layout(false); this.ajustaZoom();
    this.pan.x = lim(this.pan.x, -this.panMax.x, this.panMax.x); this.pan.y = lim(this.pan.y, -this.panMax.z, this.panMax.z);
    if(this.estado === 'fora') this.panVis.copy(this.pan);
    if(this.atual) this.k = this.posesDe(this.atual);
    if(this.estado === 'fora' || this.t === 0){ const g = this.poseGeral(); this.pose(g.pos, g.alvo); }
  }
}
