/* Os meninos Beagle na quinta 3D: depois de comprados, passeiam pelos
   caminhos de terra entre os edifícios, param para brincar (acenar, dançar,
   saltar, bater palmas…) e, às vezes, vão ter com o outro para festejar juntos.
   Os modelos só são descarregados quando a personagem foi comprada. */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Rig } from './rig.js';

const FICHEIRO = { menino: './modelos/menino.glb', menina: './modelos/menina.glb' };
const TAM = 3.3;                       /* altura na quinta (os edifícios têm 4 a 6) */
const VEL = 2.5;                       /* unidades por segundo */
const calmo = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

/* [pose, segundos] */
/* nome por cima do boneco */
function etiquetaNome(texto){
  const c = document.createElement('canvas'); c.width = 360; c.height = 104;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false });
  const s = new THREE.Sprite(mat); s.renderOrder = 12;
  s.userData.pinta = nome => {
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = 'rgba(255,255,255,.96)'; g.strokeStyle = '#1B4D8F'; g.lineWidth = 7;
    g.beginPath(); g.roundRect(8, 8, c.width - 16, c.height - 24, 30); g.fill(); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#4A2E14';
    let px = 52;
    do{ g.font = `700 ${px}px Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif`; px -= 2; }while(g.measureText(nome).width > c.width - 56 && px > 22);
    g.fillText(nome, c.width / 2, (c.height - 16) / 2 + 6);
    t.needsUpdate = true;
  };
  s.userData.pinta(texto);
  s.scale.set(1.5, 1.5 * c.height / c.width, 1);
  return s;
}

const BRINCADEIRAS = calmo
  ? [['acenar', 2.4], ['palmas', 2.6], ['pensar', 2.6]]
  : [['acenar', 2.4], ['dancar', 4.4], ['saltar', 3.2], ['palmas', 3], ['festejar', 3], ['pensar', 2.6], ['dancar', 3.6]];

class Amigo {
  constructor(id, gltf, mundo, opcoes = {}){
    this.id = id; this.mundo = mundo; this.codigo = opcoes.codigo || null;
    this.g = new THREE.Group();
    this.rig = new Rig(this.g, gltf, { esqueleto: true, limpaPesos: true, local: true });
    this.g.scale.setScalar(.001);
    this.g.userData.amigo = this;
    if(opcoes.nome){          /* um amigo de visita: leva o nome por cima */
      this.nome = opcoes.nome;
      this.rotulo = etiquetaNome(opcoes.nome); this.rotulo.position.set(0, 1.3, 0); this.g.add(this.rotulo);
    }
    mundo.q.cena.add(this.g);
    this.dono = true; this.pop = 0; this.estado = 'espera'; this.tempo = rnd(.3, 1.5);
    this.rumo = rnd(0, 6.28); this.g.rotation.y = this.rumo;
    this.fila = 0; this.rotas = []; this.olha = null; this.pose = null;
    const p = mundo.pontoNoCaminho();
    this.g.position.set(p.x, 0, p.z); this.fila = p.fila;
  }

  /* roda suavemente para um rumo */
  vira(alvo, dt, forca = 7){
    let d = alvo - this.rumo; d = Math.atan2(Math.sin(d), Math.cos(d));
    this.rumo += d * Math.min(1, dt * forca);
    this.g.rotation.y = this.rumo;
  }

  decide(){
    const m = this.mundo, outro = m.outroDe(this);
    let r;
    if(outro && outro.g.visible && Math.random() < .3){
      /* vai ter com o outro e festejam juntos */
      const lado = this.g.position.x < outro.g.position.x ? -1 : 1;
      r = m.rota(this, outro.fila, outro.g.position.x + lado * 2.3, outro.g.position.z - this.mundo.zFila(outro.fila));
      this.olha = outro;
    }else{
      const fila = Math.random() < .55 ? this.fila : Math.floor(Math.random() * m.filas());
      const L = m.larguraCaminho() - 2;
      r = m.rota(this, fila, rnd(-L, L), rnd(-.7, .7));
      this.olha = null;
    }
    this.rotas = r; this.estado = 'anda';
    this.rig.faz('repouso'); this.rig.caminha(true, 1);
  }

  brinca(pose, seg){
    this.estado = 'brinca'; this.tempo = seg; this.pose = pose;
    this.rig.caminha(false); this.rig.faz(pose);
  }

  toque(){
    if(this.estado === 'anda'){ this.rotas = []; }
    this.brinca(pick(['festejar', 'saltar', 'acenar']), 2.6);
    this.olha = null;
  }

  atualiza(dt, t){
    if(this.pop < 1){
      this.pop = Math.min(1, this.pop + dt / .9);
      const k = this.pop, s = k < .6 ? k / .6 * 1.15 : 1.15 - (k - .6) / .4 * .15;
      this.g.scale.setScalar(Math.max(.001, s * TAM));
    }
    const p = this.g.position;
    if(this.estado === 'espera'){
      this.tempo -= dt; this.rig.atualiza(dt, t);
      if(this.tempo <= 0) this.decide();
      return;
    }
    if(this.estado === 'anda'){
      const w = this.rotas[0];
      if(!w){
        /* chegou: brinca virado para o outro, se foi ter com ele */
        const [pose, seg] = pick(BRINCADEIRAS);
        this.brinca(pose, seg);
      }else{
        const dx = w.x - p.x, dz = w.z - p.z, dist = Math.hypot(dx, dz);
        if(dist < .15){ this.rotas.shift(); if(!this.rotas.length) this.fila = this.filaFinal; }
        else{
          this.vira(Math.atan2(dx, dz), dt, 8);
          const passo = Math.min(dist, VEL * dt);
          p.x += dx / dist * passo; p.z += dz / dist * passo;
        }
      }
    }else if(this.estado === 'brinca'){
      if(this.olha){
        const o = this.olha.g.position;
        this.vira(Math.atan2(o.x - p.x, o.z - p.z), dt, 5);
      }
      this.tempo -= dt;
      if(this.tempo <= 0){
        this.rig.faz('repouso'); this.estado = 'espera'; this.tempo = rnd(.4, 2.2); this.olha = null;
      }
    }
    this.rig.atualiza(dt, t);
  }
}

export class Amigos {
  constructor(q){
    this.q = q; this.lista = {}; this.carregando = {};
    this.loader = new GLTFLoader();
  }

  /* ---- geometria dos caminhos (lida da própria quinta) ---- */
  filas(){ return Math.max(1, this.q.caminhos.children.length); }
  zFila(i){ const f = this.q.caminhos.children[Math.min(i, this.filas() - 1)]; return f ? f.position.z : 0; }
  larguraCaminho(){ return Math.max(6, this.q.extX || 20); }
  pontoNoCaminho(){
    const fila = Math.floor(Math.random() * this.filas()), L = this.larguraCaminho() - 2;
    return { x: rnd(-L, L), z: this.zFila(fila) + rnd(-.6, .6), fila };
  }
  /* de onde está até (x, fila): volta pela berma lateral se mudar de fila */
  rota(amigo, fila, x, dz){
    const z1 = this.zFila(fila) + dz, p = amigo.g.position, ws = [];
    if(fila !== amigo.fila){
      const ex = (p.x >= 0 ? 1 : -1) * (this.q.extX + 2.4);
      ws.push(V(ex, 0, p.z), V(ex, 0, z1));
    }
    ws.push(V(x, 0, z1));
    amigo.filaFinal = fila;
    return ws;
  }
  outroDe(a){ return Object.values(this.lista).find(o => o !== a) || null; }

  /* ---- que personagens há ---- */
  /* visitantes: [{ codigo, nome, modelo }] — os amigos do jogador, a passear pela quinta */
  sincronizaVisitantes(visitantes){
    const querem = new Set((visitantes || []).map(v => 'v:' + v.codigo));
    this.querem = querem;
    for(const [k, a] of Object.entries(this.lista)){
      if(k.startsWith('v:') && !querem.has(k)){ this.q.cena.remove(a.g); delete this.lista[k]; }
    }
    for(const v of visitantes || []){
      const k = 'v:' + v.codigo, a = this.lista[k];
      if(a){
        if(a.nome !== v.nome){ a.nome = v.nome; a.rotulo.userData.pinta(v.nome); }
        a.dono = true; continue;
      }
      if(this.carregando[k] || !FICHEIRO[v.modelo]) continue;
      this.carregando[k] = new Promise((ok, erro) => this.loader.load(FICHEIRO[v.modelo], ok, undefined, erro))
        .then(gltf => { if(this.querem && this.querem.has(k)) this.lista[k] = new Amigo(k, gltf, this, { nome: v.nome, codigo: v.codigo }); })
        .catch(e => console.warn('Amigo 3D indisponível', v.nome, e))
        .finally(() => { this.carregando[k] = null; });
    }
  }

  sincroniza(itens, novo, visitantes){
    this.sincronizaVisitantes(visitantes);
    for(const id of Object.keys(FICHEIRO)){
      const tem = !!(itens && itens[id]);
      if(tem && !this.lista[id] && !this.carregando[id]){
        this.carregando[id] = new Promise((ok, erro) => this.loader.load(FICHEIRO[id], ok, undefined, erro))
          .then(gltf => { this.lista[id] = new Amigo(id, gltf, this); })
          .catch(e => { console.warn('Personagem 3D indisponível', id, e); })
          .finally(() => { this.carregando[id] = null; });
      }
      if(this.lista[id]) this.lista[id].dono = tem;
    }
  }

  passo(dt, t){
    const fora = this.q.estado === 'fora';
    for(const a of Object.values(this.lista)){
      a.g.visible = !!a.dono && fora;          /* dentro de um edifício não se vêem */
      if(a.g.visible) a.atualiza(dt, t);
    }
  }

  alvos(){ return Object.values(this.lista).filter(a => a.g.visible).map(a => a.g); }
}
