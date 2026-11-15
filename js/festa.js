/* Festa dos meninos Beagle: um popup com a personagem 3D (com esqueleto) a
   festejar. Aparece de 10 em 10 níveis de cada mapa e quando se compra uma
   personagem. Tem o seu próprio canvas e só renderiza enquanto está aberto.
   Os modelos só são descarregados quando é preciso. */

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Rig, criaCena, THREE } from './rig.js';

const CAMINHO = id => `./modelos/${id}.glb`;

export class Festa {
  constructor({ confete, som } = {}){
    this.confete = confete; this.som = som;
    this.rigs = {}; this.carregando = {};
    this.aberta = false; this.fim = null; this.ultimo = null;
    this.loader = new GLTFLoader();
  }

  /* cria o DOM e o renderizador à primeira utilização */
  _prepara(){
    if(this.raiz) return;
    const r = document.createElement('div');
    r.className = 'festa'; r.hidden = true; r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', 'Festa');
    r.innerHTML = `<div class="festa-cartao">
        <canvas class="festa-gl" aria-hidden="true"></canvas>
        <h2 class="festa-titulo"></h2>
        <p class="festa-sub"></p>
        <button class="botao quente festa-ok" type="button">Continuar</button>
      </div>`;
    document.body.append(r);
    this.raiz = r;
    this.canvas = r.querySelector('canvas');
    this.titulo = r.querySelector('.festa-titulo');
    this.sub = r.querySelector('.festa-sub');
    r.querySelector('.festa-ok').onclick = () => this.fecha();
    r.addEventListener('click', e => { if(e.target === r) this.fecha(); });
    const { renderizador, cena, camara } = criaCena(this.canvas);
    this.r = renderizador; this.cena = cena; this.cam = camara;
    this.cam.fov = 30;
    this.cam.position.set(0, .56, 2.9); this.cam.lookAt(0, .5, 0);
    this.relogio = new THREE.Clock();
  }

  _modelo(id){
    if(this.rigs[id]) return Promise.resolve(this.rigs[id]);
    if(!this.carregando[id]){
      this.carregando[id] = new Promise((ok, erro) => this.loader.load(CAMINHO(id), ok, undefined, erro))
        .then(gltf => {
          const rig = new Rig(this.cena, gltf, { esqueleto: true, limpaPesos: true });
          rig.visivel(false);
          this.rigs[id] = rig;
          return rig;
        })
        .catch(e => { console.warn('Personagem 3D indisponível', id, e); this.carregando[id] = null; return null; });
    }
    return this.carregando[id];
  }

  /* pré-carrega em segundo plano (por exemplo, ao abrir a loja) */
  prepara(ids){ this._prepara(); for(const id of ids) this._modelo(id); }

  /* mostra a festa; devolve false se a personagem não puder ser mostrada */
  async mostra(id, { titulo = 'Muito bem!', sub = '', aoFechar } = {}){
    this._prepara();
    const rig = await this._modelo(id);
    if(!rig){ if(aoFechar) aoFechar(); return false; }
    if(this.aberta) this.fecha(true);
    for(const k in this.rigs) this.rigs[k].visivel(k === id);
    this.titulo.textContent = titulo; this.sub.textContent = sub;
    this.aoFechar = aoFechar || null;
    this.raiz.hidden = false; this.aberta = true; this.ultimo = id;
    requestAnimationFrame(() => {
      this._tamanho();
      rig.faz('festa');
      this.relogio.getDelta();
      this._loop();
      const b = this.canvas.getBoundingClientRect();
      if(this.confete){
        const cores = ['#F7C21B', '#E0162B', '#2C6FD6', '#3DA35D', '#fff'];
        for(const [dx, dy, t] of [[.5, .25, 150], [.2, .4, 450], [.8, .4, 450], [.5, .15, 900]])
          setTimeout(() => this.aberta && this.confete(document.body, b.left + b.width * dx, b.top + b.height * dy, cores), t);
      }
    });
    if(this.som){
      try{ this.som.efeito('nivel'); setTimeout(() => this.aberta && this.som.fala('Muito bem!'), 500); }catch(e){}
    }
    clearTimeout(this.fim);
    this.fim = setTimeout(() => this.fecha(), 9000);
    return true;
  }

  _tamanho(){
    const b = this.canvas.getBoundingClientRect();
    const w = Math.max(1, b.width), h = Math.max(1, b.height);
    this.r.setSize(w, h, false);
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
  }

  _loop = () => {
    if(!this.aberta) return;
    requestAnimationFrame(this._loop);
    const dt = Math.min(this.relogio.getDelta(), .05), t = this.relogio.elapsedTime;
    const rig = this.rigs[this.ultimo];
    if(rig) rig.atualiza(dt, t);
    this.r.render(this.cena, this.cam);
  };

  fecha(semCallback){
    if(!this.aberta) return;
    clearTimeout(this.fim);
    this.aberta = false; this.raiz.hidden = true;
    if(this.som) try{ this.som.cala && this.som.cala(); }catch(e){}
    const cb = this.aoFechar; this.aoFechar = null;
    if(!semCallback && cb) cb();
  }
}
