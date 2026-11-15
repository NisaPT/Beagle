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
    this.falaAte = 0;                 /* enquanto fala, gesticula */
    this.pe = { ate:0, inicio:0, lado:1 };   /* bater o pé */
    this.proxPe = 3 + Math.random() * 3;
    this.proxOlhar = 2;
    this.ultimoToque = -99;

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

  /* a mascote fala: gesticula durante 'ms' milissegundos (0 = parou) */
  fala(ms){ this.falaAte = ms > 0 ? performance.now() + ms : 0; }

  olhaPara(nx, ny){                 /* nx, ny em -1..1 no ecrã */
    this.ultimoToque = this.tempo || 0;
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
    const extra = {};
    const soma = (n, x, y, z) => {
      const e = extra[n] || (extra[n] = {X:0, Y:0, Z:0});
      e.X += x || 0; e.Y += y || 0; e.Z += z || 0;
    };
    this.tempo = t;
    const parado = this.acao === 'repouso';
    const gesto = performance.now() < this.falaAte;     /* a falar */
    const solto = parado ? 1 : .3;                      /* braços livres só em repouso */
    const viva = amp * (gesto ? 1.7 : 1);

    /* olhar: a meio do silêncio passeia os olhos, a não ser que o dedo esteja no ecrã */
    if(t > this.proxOlhar){
      this.proxOlhar = t + 2.2 + Math.random() * 3.2;
      if(t - this.ultimoToque > 3.5){
        this.olharAlvo.x = (Math.random() * 2 - 1) * 15;
        this.olharAlvo.y = (Math.random() * 2 - 1) * 7;
      }
    }

    /* respirar + peso que passa de um pé para o outro */
    const peso = Math.sin(f * .85);                      /* -1 (esq.) .. 1 (dir.) */
    const respira = Math.sin(f * 1.9);
    soma('Hips',   0, Math.sin(f * .50) * 3 * amp, peso * 3.4 * amp);
    soma('Spine',  0, 0, Math.sin(f * .42) * 1.4 * amp - peso * 1.6 * amp);
    soma('Spine1', respira * 2.2 * amp, 0, 0);
    soma('Spine2', Math.sin(f * 1.9 + .5) * 1.6 * amp, 0, peso * -.8 * amp);
    soma('LeftShoulder',  0, 0,  respira * 1.8 * amp);
    soma('RightShoulder', 0, 0, -respira * 1.8 * amp);
    /* as pernas contrariam a inclinação da anca: os pés ficam assentes */
    soma('LeftUpLeg',  0, 0, -peso * 3.4 * amp);
    soma('RightUpLeg', 0, 0, -peso * 3.4 * amp);
    /* a perna descarregada dobra um pouco o joelho */
    const livreE = Math.max(0, -peso), livreD = Math.max(0, peso);
    soma('LeftUpLeg',  -livreE * 5 * amp, 0, 0);  soma('LeftLeg',  livreE * 9 * amp, 0, 0);  soma('LeftFoot',  livreE * -4 * amp, 0, 0);
    soma('RightUpLeg', -livreD * 5 * amp, 0, 0);  soma('RightLeg', livreD * 9 * amp, 0, 0);  soma('RightFoot', livreD * -4 * amp, 0, 0);

    /* bater o pé de vez em quando (ritmo de quem espera, a sorrir) */
    if(!calmo && t > this.proxPe){
      this.pe = { inicio:t, ate:t + 2.1, lado:Math.random() < .5 ? 1 : -1 };
      this.proxPe = t + 6 + Math.random() * 6;
    }
    if(t < this.pe.ate){
      const u = (t - this.pe.inicio) / 2.1;                         /* 0..1 */
      const bate = Math.pow(Math.max(0, Math.sin(u * Math.PI * 4)), 1.3) * Math.sin(u * Math.PI);
      const L = this.pe.lado > 0 ? 'Right' : 'Left';
      soma(L + 'Foot', bate * 20, 0, 0);
      soma(L + 'ToeBase', bate * 8, 0, 0);
      soma(L + 'Leg', bate * 4, 0, 0);
    }

    /* braços e mãos nunca estão parados: baloiçam, o pulso roda */
    const nb = parado ? 1 : .35;
    soma('LeftArm',  Math.sin(f * 1.05) * 8 * viva * solto,  0, 2.4 * viva * solto + Math.sin(f * .7) * 2 * viva * solto);
    soma('RightArm', Math.sin(f * 1.05 + 2.4) * 8 * viva * solto, 0, -2.4 * viva * solto - Math.sin(f * .7 + 1) * 2 * viva * solto);
    soma('LeftForeArm',  Math.sin(f * 1.3 + 1) * 9 * viva * solto, 0, 0);
    soma('RightForeArm', Math.sin(f * 1.3 + 3) * 9 * viva * solto, 0, 0);
    soma('LeftHand',  Math.sin(f * 2.1) * 9 * viva * nb, 0, Math.sin(f * 1.6 + .5) * 12 * viva * nb);
    soma('RightHand', Math.sin(f * 2.1 + 1.7) * 9 * viva * nb, 0, Math.sin(f * 1.6 + 2) * 12 * viva * nb);

    /* a falar: acena com a cabeça e abre as mãos ao ritmo da fala */
    if(gesto){
      const r = Math.sin(f * 5.2), r2 = Math.sin(f * 3.1 + 1);
      soma('Head', r * 3.2 * amp + 2, r2 * 3 * amp, r2 * 2 * amp);
      soma('Spine2', r * 1.4 * amp, 0, 0);
      if(parado){
        soma('LeftArm',  -10 - Math.max(0, r2) * 8, 0, 3);   soma('RightArm', -10 - Math.max(0, -r2) * 8, 0, -3);
        soma('LeftForeArm', -12 - r * 6, 0, 0);               soma('RightForeArm', -12 + r * 6, 0, 0);
      }
    }

    soma('Head', this.olhar.y + Math.sin(f * .83) * 1.8 * amp, this.olhar.x + Math.sin(f * .61) * 2.8 * amp, Math.sin(f * .47) * 1.6 * amp);
    soma('Neck', this.olhar.y * .3, this.olhar.x * .35, 0);

    const osc = OSCILACOES[this.acao];
    if(osc && this.acao === 'acenar'){
      const o = Math.sin(f * osc.ritmo) * osc.amplitude * (calmo ? .4 : 1);
      soma('RightForeArm', 0, o, o * .35);
      soma('RightHand', 0, 0, Math.sin(f * osc.ritmo + .4) * 12);
    }
    if(osc && this.acao === 'palmas'){
      const o = (Math.sin(f * osc.ritmo) * .5 + .5) * osc.amplitude;
      soma('RightForeArm', 0, o, 0);
      soma('LeftForeArm', 0, -o, 0);
    }
    if(this.acao === 'festejar'){
      const o = Math.sin(f * 7) * 9;
      soma('RightForeArm', 0, 0, o);
      soma('LeftForeArm', 0, 0, -o);
      this.salto = calmo ? 0 : Math.abs(Math.sin(f * 6)) * .055;
    }else{
      this.salto += (0 - this.salto) * (1 - Math.exp(-8 * dt));
    }
    this.grupo.position.y = this.baseY + this.salto + (calmo ? 0 : Math.sin(f * 3.8) * .0035);

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
