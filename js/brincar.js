/* Brincar livre: sem perguntas, sem certo nem errado, sem falas.
   Desenhar com carimbos de animais, tocar xilofone e estoirar bolhas.
   Só usa imagens que já existem; os sons são notas geradas no momento. */
import { ITENS, util } from './natureza.js';

const { imgSrc } = util;
const CORES = ['#D93A32', '#F3822B', '#F5C344', '#5BAF6A', '#4A90D9', '#8E6BC8', '#8a5a2b', '#222222'];
const NOTAS = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];   /* dó ré mi fá sol lá si dó */

export function abreBrincar(Som){
  if(document.querySelector('.brincar-fundo')) return;
  const f = document.createElement('div');
  f.className = 'brincar-fundo'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', 'Brincar livre');
  document.body.append(f);
  let limpar = () => {};
  const fecha = () => { limpar(); f.remove(); };

  const menu = () => {
    limpar(); limpar = () => {};
    f.innerHTML = `<h2>🎈 Vamos brincar!</h2>
      <div class="brincar-menu">
        <button class="botao" data-a="desenho" type="button">🎨 Desenhar</button>
        <button class="botao" data-a="xilofone" type="button">🎵 Xilofone</button>
        <button class="botao" data-a="bolhas" type="button">🫧 Bolhas</button>
      </div>
      <button class="botao calma" data-a="fechar" type="button">Voltar</button>`;
    f.querySelectorAll('button').forEach(b => b.onclick = () => ({ desenho, xilofone, bolhas, fechar: fecha })[b.dataset.a]());
  };
  const cabeca = titulo => {
    f.innerHTML = `<div class="brincar-topo"><button class="botao calma pequeno" data-a="menu" type="button">◀ Brincar</button><strong>${titulo}</strong></div><div class="brincar-palco"></div>`;
    f.querySelector('[data-a=menu]').onclick = menu;
    return f.querySelector('.brincar-palco');
  };

  /* ------------------------------------------------------------ desenho */
  function desenho(){
    const palco = cabeca('🎨 Desenhar');
    const carimbos = ITENS.animais.filter(x => x.nivel <= 1).slice(0, 8);
    palco.innerHTML = `<canvas class="brincar-tela"></canvas>
      <div class="brincar-ferr">
        ${CORES.map((c, i) => `<button class="cor${i === 0 ? ' on' : ''}" type="button" data-c="${c}" style="background:${c}" aria-label="cor"></button>`).join('')}
        <button class="botao pequeno" data-q="" type="button">🖌</button>
        ${carimbos.map(x => `<button class="carimbo" type="button" data-q="${x.id}" aria-label="${x.nome}"><img src="${imgSrc(x.id)}" alt="" draggable="false"></button>`).join('')}
        <button class="botao calma pequeno" data-l="1" type="button">🗑</button>
      </div>`;
    const cv = palco.querySelector('canvas'), cx = cv.getContext('2d');
    const ajusta = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.fillStyle = '#fff'; cx.fillRect(0, 0, r.width, r.height);
      cx.lineCap = 'round'; cx.lineJoin = 'round';
    };
    ajusta();
    let cor = CORES[0], carimbo = '', desenhando = false, ult = null;
    const imgs = {};
    carimbos.forEach(x => { const im = new Image(); im.src = imgSrc(x.id); imgs[x.id] = im; });
    palco.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
      cor = b.dataset.c; carimbo = '';
      palco.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b));
    });
    palco.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { carimbo = b.dataset.q; });
    palco.querySelector('[data-l]').onclick = ajusta;
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.onpointerdown = e => {
      const p = pos(e);
      if(carimbo && imgs[carimbo]){ const s = 96; try{ cx.drawImage(imgs[carimbo], p.x - s / 2, p.y - s / 2, s, s); }catch(err){} return; }
      desenhando = true; ult = p; cx.strokeStyle = cor; cx.lineWidth = 14;
      cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(p.x + .1, p.y + .1); cx.stroke();
      try{ cv.setPointerCapture(e.pointerId); }catch(err){}
    };
    cv.onpointermove = e => {
      if(!desenhando) return; e.preventDefault();
      const p = pos(e); cx.beginPath(); cx.moveTo(ult.x, ult.y); cx.lineTo(p.x, p.y); cx.stroke(); ult = p;
    };
    cv.onpointerup = cv.onpointercancel = () => { desenhando = false; };
  }

  /* ----------------------------------------------------------- xilofone */
  function xilofone(){
    const palco = cabeca('🎵 Xilofone');
    palco.innerHTML = `<div class="xilofone">${NOTAS.map((n, i) =>
      `<button class="barra-xilo" type="button" data-n="${i}" style="background:${CORES[i % CORES.length]};height:${100 - i * 5}%" aria-label="nota ${i + 1}"></button>`).join('')}</div>`;
    let ac = null;
    limpar = () => { try{ ac && ac.close(); }catch(e){} };
    palco.querySelectorAll('.barra-xilo').forEach(b => {
      b.onpointerdown = () => {
        b.classList.add('toca'); setTimeout(() => b.classList.remove('toca'), 180);
        if(Som && Som.ligado === false) return;
        try{
          ac = ac || new (window.AudioContext || window.webkitAudioContext)();
          if(ac.state === 'suspended') ac.resume();
          const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
          o.type = 'triangle'; o.frequency.value = NOTAS[+b.dataset.n];
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.35, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + 1.1);
          o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 1.15);
        }catch(e){}
      };
    });
  }

  /* -------------------------------------------------------------- bolhas */
  function bolhas(){
    const palco = cabeca('🫧 Bolhas');
    palco.innerHTML = '<div class="bolhas-campo"></div>';
    const campo = palco.querySelector('.bolhas-campo');
    const nova = () => {
      if(document.hidden || campo.childElementCount > 14) return;
      const b = document.createElement('button');
      const d = 5 + Math.random() * 4, t = 48 + Math.random() * 56;
      b.className = 'bolha'; b.type = 'button'; b.setAttribute('aria-label', 'bolha');
      b.style.cssText = `left:${6 + Math.random() * 82}%;width:${t}px;height:${t}px;animation-duration:${d}s`;
      b.onpointerdown = () => { if(Som && Som.efeito) Som.efeito('pop'); b.classList.add('estoira'); setTimeout(() => b.remove(), 220); };
      b.onanimationend = e => { if(e.animationName === 'bolha-sobe') b.remove(); };
      campo.append(b);
    };
    for(let i = 0; i < 5; i++) nova();
    const id = setInterval(nova, 650);
    limpar = () => clearInterval(id);
  }

  menu();
}
