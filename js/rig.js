import * as THREE from 'three';
import { OSSOS, POSES, OSCILACOES } from './poses.js';

const grau = Math.PI / 180;
export const calmo = matchMedia('(prefers-reduced-motion:reduce)').matches;

const EIXO = { X:new THREE.Vector3(1,0,0), Y:new THREE.Vector3(0,1,0), Z:new THREE.Vector3(0,0,1) };
const _qPai = new THREE.Quaternion(), _qPaiInv = new THREE.Quaternion();
const _qDelta = new THREE.Quaternion(), _qTmp = new THREE.Quaternion();
const _pos = new THREE.Vector3(), _esc = new THREE.Vector3();
const _a = new THREE.Vector3(), _b = new THREE.Vector3();

const profundidade = o => { let d = 0, p = o; while(p){ d++; p = p.parent; } return d; };

/* Sombra de contacto falsa: mais barata do que um shadow map no telemóvel. */
function fazSombra(){
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(18,49,79,.5)');
  grad.addColorStop(.55, 'rgba(18,49,79,.2)');
  grad.addColorStop(1, 'rgba(18,49,79,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(.95, .95),
    new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(c), transparent:true, depthWrite:false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = .004;
  m.scale.set(1, .62, 1);
  return m;
}

export class Rig {
  constructor(cena, gltf){
    this.raiz = gltf.scene;
    this.grupo = new THREE.Group();
    this.grupo.add(this.raiz);
    cena.add(this.grupo);

    this.ossos = {};     /* os que animamos */
    this.todos = {};     /* todos, incluindo pés e dedos */
    this.repouso = {};
    this.malha = null;

    this.raiz.traverse(o => {
      if(o.isSkinnedMesh){
        this.malha = o;
        o.frustumCulled = false;
        if(o.material) o.material.metalness = 0;
      }
      if(o.isBone){
        const nome = o.name.replace('mixamorig:', '');
        this.todos[nome] = o;
        if(OSSOS.includes(nome)){
          this.ossos[nome] = o;
          this.repouso[nome] = o.quaternion.clone();
        }
      }
    });
    this.ordem = Object.keys(this.ossos)
      .sort((a, b) => profundidade(this.ossos[a]) - profundidade(this.ossos[b]));

    this.atual = {}; this.alvo = {};
    for(const n of this.ordem){ this.atual[n] = {X:0,Y:0,Z:0}; this.alvo[n] = {X:0,Y:0,Z:0}; }

    this.acao = 'repouso';
    this.olhar = {x:0, y:0};
    this.olharAlvo = {x:0, y:0};
    this.fase = Math.random() * 10;
    this.salto = 0;

    this.enquadra();
    this.sombra = fazSombra();
    this.grupo.add(this.sombra);
  }

  /* Roda e centra: de pé, virado para a câmara, 1 unidade de altura.
     A frente vem da direção do calcanhar para os dedos — a largura da
     caixa envolvente não serve, porque não distingue a frente das costas. */
  enquadra(){
    this.grupo.updateMatrixWorld(true);
    const frente = new THREE.Vector3();
    let n = 0;
    for(const [pe, dedo] of [['LeftFoot','LeftToeBase'], ['RightFoot','RightToeBase']]){
      const o1 = this.todos[pe], o2 = this.todos[dedo];
      if(!o1 || !o2) continue;
      _a.setFromMatrixPosition(o1.matrixWorld);
      _b.setFromMatrixPosition(o2.matrixWorld);
      frente.add(_b.sub(_a)); n++;
    }
    frente.y = 0;
    if(n && frente.lengthSq() > 1e-10){
      frente.normalize();
      this.grupo.rotation.y -= Math.atan2(frente.x, frente.z);
    }
    this.grupo.updateMatrixWorld(true);

    const c1 = new THREE.Box3().setFromObject(this.raiz);
    this.altura = c1.max.y - c1.min.y;
    this.grupo.scale.setScalar(1 / (this.altura || 1));
    this.grupo.updateMatrixWorld(true);

    const c2 = new THREE.Box3().setFromObject(this.raiz);
    this.grupo.position.x -= (c2.max.x + c2.min.x) / 2;
    this.grupo.position.z -= (c2.max.z + c2.min.z) / 2;
    this.grupo.position.y -= c2.min.y;
    this.baseY = this.grupo.position.y;
    this.rotBase = this.grupo.rotation.y;
  }

  faz(acao){
    if(!POSES[acao]) acao = 'repouso';
    this.acao = acao;
    const p = POSES[acao];
    for(const n of this.ordem){
      const s = p[n] || {};
      this.alvo[n].X = s.X || 0;
      this.alvo[n].Y = s.Y || 0;
      this.alvo[n].Z = s.Z || 0;
    }
  }

  olhaPara(nx, ny){                 /* nx, ny em -1..1 no ecrã */
    this.olharAlvo.x = THREE.MathUtils.clamp(nx, -1, 1) * 26;
    this.olharAlvo.y = THREE.MathUtils.clamp(ny, -1, 1) * 15;
  }

  atualiza(dt, t){
    const k = 1 - Math.exp(-9 * dt);
    const ko = 1 - Math.exp(-5 * dt);
    this.olhar.x += (this.olharAlvo.x - this.olhar.x) * ko;
    this.olhar.y += (this.olharAlvo.y - this.olhar.y) * ko;

    const amp = calmo ? .3 : 1;
    const f = t + this.fase;

    /* camadas procedurais somadas por cima da pose */
    const extra = {
      Hips:   {X:0, Y:Math.sin(f * .50) * 2.4 * amp, Z:Math.sin(f * .37) * 1.1 * amp},
      Spine:  {X:0, Y:0, Z:Math.sin(f * .42) * 1.2 * amp},
      Spine1: {X:Math.sin(f * 1.55) * 1.7 * amp, Y:0, Z:0},
      Spine2: {X:Math.sin(f * 1.55 + .5) * 1.1 * amp, Y:0, Z:0},
      Head:   {X:this.olhar.y + Math.sin(f * .83) * 1.6 * amp,
               Y:this.olhar.x + Math.sin(f * .61) * 2.5 * amp, Z:0},
      Neck:   {X:this.olhar.y * .3, Y:this.olhar.x * .35, Z:0},
    };

    const osc = OSCILACOES[this.acao];
    if(osc && this.acao === 'acenar'){
      const o = Math.sin(f * osc.ritmo) * osc.amplitude * (calmo ? .4 : 1);
      extra.RightForeArm = {X:0, Y:o, Z:o * .35};
      extra.RightHand    = {X:0, Y:0, Z:Math.sin(f * osc.ritmo + .4) * 12};
    }
    if(osc && this.acao === 'palmas'){
      const o = (Math.sin(f * osc.ritmo) * .5 + .5) * osc.amplitude;
      extra.RightForeArm = {X:0, Y:  o, Z:0};
      extra.LeftForeArm  = {X:0, Y: -o, Z:0};
    }
    if(this.acao === 'festejar'){
      const o = Math.sin(f * 7) * 9;
      extra.RightForeArm = {X:0, Y:0, Z:  o};
      extra.LeftForeArm  = {X:0, Y:0, Z: -o};
      this.salto = calmo ? 0 : Math.abs(Math.sin(f * 6)) * .055;
    }else{
      this.salto += (0 - this.salto) * (1 - Math.exp(-8 * dt));
    }
    this.grupo.position.y = this.baseY + this.salto;

    for(const n of this.ordem){
      const osso = this.ossos[n];
      const a = this.atual[n], al = this.alvo[n];
      a.X += (al.X - a.X) * k;
      a.Y += (al.Y - a.Y) * k;
      a.Z += (al.Z - a.Z) * k;

      const e = extra[n];
      const gx = (a.X + (e ? e.X : 0)) * grau;
      const gy = (a.Y + (e ? e.Y : 0)) * grau;
      const gz = (a.Z + (e ? e.Z : 0)) * grau;

      if(!gx && !gy && !gz){
        osso.quaternion.copy(this.repouso[n]);
      }else{
        /* local = qPai⁻¹ · qMundo · qPai · qRepouso  — os ossos são
           percorridos de pai para filho, por isso qPai já está certo. */
        _qDelta.identity();
        if(gz) _qDelta.premultiply(_qTmp.setFromAxisAngle(EIXO.Z, gz));
        if(gx) _qDelta.premultiply(_qTmp.setFromAxisAngle(EIXO.X, gx));
        if(gy) _qDelta.premultiply(_qTmp.setFromAxisAngle(EIXO.Y, gy));
        osso.parent.matrixWorld.decompose(_pos, _qPai, _esc);
        _qPaiInv.copy(_qPai).invert();
        osso.quaternion.copy(_qPaiInv).multiply(_qDelta).multiply(_qPai).multiply(this.repouso[n]);
      }
      osso.updateWorldMatrix(false, false);
    }
  }

  visivel(v){ this.grupo.visible = v; }
}

/* ---------- cena partilhada ---------- */
export function criaCena(lona){
  const renderizador = new THREE.WebGLRenderer({ canvas:lona, antialias:true, alpha:true });
  renderizador.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderizador.outputColorSpace = THREE.SRGBColorSpace;
  renderizador.toneMapping = THREE.ACESFilmicToneMapping;
  renderizador.toneMappingExposure = 1.12;

  const cena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(28, 1, .1, 50);
  cena.add(new THREE.HemisphereLight(0xdceaf7, 0xa8793f, 1.5));
  const luz = new THREE.DirectionalLight(0xfff6e2, 2.1);
  luz.position.set(1.4, 2.6, 2.4); cena.add(luz);
  const contra = new THREE.DirectionalLight(0x9fc4e8, .8);
  contra.position.set(-1.8, 1.2, -1.6); cena.add(contra);

  return { renderizador, cena, camara };
}

export const VISTAS = {
  um:   { pos:new THREE.Vector3(0, .62, 2.45), alvo:new THREE.Vector3(0, .50, 0) },
  dois: { pos:new THREE.Vector3(0, .62, 3.35), alvo:new THREE.Vector3(0, .48, 0) },
  /* escolher o avô ou a avó: o cenário ocupa o ecrã todo e os botões ficam à frente em baixo */
  escolher: { pos:new THREE.Vector3(0, .70, 3.55), alvo:new THREE.Vector3(0, .12, 0) },
};

export { THREE };
