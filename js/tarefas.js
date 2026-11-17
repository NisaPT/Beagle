/* Tarefas da quinta: apanhar ovos, tirar a lã às ovelhas e dar de comer aos animais.
   Só usam imagens que já existem. As frases novas estão em ferramentas/falas-extra.json:
   se o clip ainda não existir, a tarefa fica em silêncio (nunca usa a voz do aparelho). */
import { util } from './natureza.js';

const { imgSrc, BEM, pick, baralha } = util;

const COMIDA = {
  cavalo: { emoji: '🥕', frase: 'Dá de comer ao cavalo.' },
  pato:   { emoji: '🌽', frase: 'Dá de comer ao pato.' },
  porco:  { emoji: '🍎', frase: 'Dá de comer ao porco.' },
  vaca:   { emoji: '🌾', frase: 'Dá de comer à vaca.' },
  galo:   { emoji: '🌽', frase: 'Dá de comer ao galo.' },
  ovelha: { emoji: '🌿', frase: 'Dá de comer à ovelha.' },
};
export const FRASES_TAREFAS = ['Apanha os ovos.', 'Tira a lã da ovelha.', ...Object.values(COMIDA).map(c => c.frase)];

/* aoGanhar(n): chamado quando uma tarefa fica concluída (dá estrelas ao jogador) */
export function abreTarefas(Som, aoGanhar){
  if(document.querySelector('.brincar-fundo')) return;
  const f = document.createElement('div');
  f.className = 'brincar-fundo tarefas-fundo'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', 'Tarefas da quinta');
  document.body.append(f);
  let limpar = () => {};
  const timers = new Set();
  const espera = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const fecha = () => { limpar(); timers.forEach(clearTimeout); try{ Som.paraVoz && Som.paraVoz(); }catch(e){} f.remove(); };
  const diz = t => { try{ if(Som.temClips([t])) Som.fala(t); }catch(e){} };
  const elogia = () => { const t = pick(BEM); diz(t); };
  const toast = txt => { const e = document.createElement('div'); e.className = 'toast-cromo'; e.textContent = txt; document.body.append(e); setTimeout(() => e.remove(), 2200); };
  const conclui = () => { try{ aoGanhar(1); }catch(e){} toast('⭐ +1 estrela!'); };

  const menu = () => {
    limpar(); limpar = () => {}; timers.forEach(clearTimeout); timers.clear();
    f.innerHTML = `<h2>🧺 Tarefas da quinta</h2>
      <div class="brincar-menu">
        <button class="botao" data-a="ovos" type="button">🥚 Apanhar ovos</button>
        <button class="botao" data-a="la" type="button">🐑 Lã das ovelhas</button>
        <button class="botao" data-a="comer" type="button">🥕 Dar de comer</button>
      </div>
      <button class="botao calma" data-a="fechar" type="button">Voltar</button>`;
    f.querySelectorAll('button').forEach(b => b.onclick = () => ({ ovos, la, comer, fechar: fecha })[b.dataset.a]());
  };
  const cabeca = titulo => {
    f.innerHTML = `<div class="brincar-topo"><button class="botao calma pequeno" data-a="menu" type="button">◀ Tarefas</button><strong>${titulo}</strong></div><div class="brincar-palco tarefa-palco"></div>`;
    f.querySelector('[data-a=menu]').onclick = menu;
    return f.querySelector('.tarefa-palco');
  };
  const fim = (palco, msg) => {
    elogia(); conclui();
    palco.insertAdjacentHTML('beforeend', `<div class="tarefa-fim"><p>${msg}</p><button class="botao" data-a="outra" type="button">Outra tarefa</button></div>`);
    palco.querySelector('[data-a=outra]').onclick = menu;
  };

  /* -------------------------------------------------------------- ovos */
  function ovos(){
    const palco = cabeca('🥚 Apanhar ovos');
    const N = 5;
    palco.innerHTML = `<div class="ovos-quinta"><div class="ovos-ninhos">${[0, 1, 2, 3, 4, 5].map(i => `<div class="ninho" data-i="${i}"><span class="palha"></span></div>`).join('')}</div>
      <div class="ovos-cesto" id="ovos-cesto">🧺 <b>0</b>/${N}</div></div>`;
    diz('Apanha os ovos.');
    const ninhos = [...palco.querySelectorAll('.ninho')], conta = palco.querySelector('.ovos-cesto b');
    let apanhados = 0, soltos = 0;
    const poe = () => {
      if(soltos + apanhados >= N) return;
      const livres = ninhos.filter(n => !n.querySelector('.ovo'));
      if(!livres.length){ espera(poe, 700); return; }
      const n = pick(livres), ovo = document.createElement('button');
      ovo.type = 'button'; ovo.className = 'ovo'; ovo.textContent = '🥚'; ovo.setAttribute('aria-label', 'ovo');
      n.append(ovo); soltos++;
      ovo.onclick = () => {
        if(ovo.classList.contains('vai')) return;
        const cesto = palco.querySelector('#ovos-cesto').getBoundingClientRect(), r = ovo.getBoundingClientRect();
        ovo.style.setProperty('--dx', (cesto.left + cesto.width / 2 - r.left - r.width / 2) + 'px');
        ovo.style.setProperty('--dy', (cesto.top + cesto.height / 2 - r.top - r.height / 2) + 'px');
        ovo.classList.add('vai');
        try{ Som.efeito('pop'); }catch(e){}
        espera(() => { ovo.remove(); apanhados++; soltos--; conta.textContent = apanhados;
          if(apanhados >= N) fim(palco, 'Apanhaste todos os ovos!'); else espera(poe, 400); }, 650);
      };
      if(soltos + apanhados < N && soltos < 2) espera(poe, 900);
    };
    poe();
  }

  /* ---------------------------------------------------------------- lã */
  function la(){
    const palco = cabeca('🐑 Lã das ovelhas');
    const pos = [[12, 22], [38, 8], [66, 14], [84, 38], [8, 52], [30, 66], [60, 70], [84, 66]];
    palco.innerHTML = `<div class="la-quinta"><div class="la-ovelha"><img src="${imgSrc('ovelha')}" alt="ovelha" draggable="false">
      ${pos.map(p => `<button class="la-tufo" type="button" aria-label="lã" style="left:${p[0]}%;top:${p[1]}%"></button>`).join('')}</div>
      <div class="la-conta">🧶 <b>0</b>/${pos.length}</div></div>`;
    diz('Tira a lã da ovelha.');
    const tufos = [...palco.querySelectorAll('.la-tufo')], conta = palco.querySelector('.la-conta b');
    let n = 0;
    const tira = t => {
      if(!t || t.classList.contains('voa')) return;
      t.classList.add('voa'); n++; conta.textContent = n;
      try{ Som.efeito('pop'); }catch(e){}
      if(n >= tufos.length) espera(() => fim(palco, 'Que ovelha tão fofa!'), 500);
    };
    tufos.forEach(t => t.addEventListener('click', () => tira(t)));
    /* passar o dedo por cima também tira a lã (como uma tosquia) */
    const area = palco.querySelector('.la-ovelha');
    const arrasta = e => { if(e.buttons || e.pointerType === 'touch'){ const el = document.elementFromPoint(e.clientX, e.clientY); if(el && el.classList.contains('la-tufo')) tira(el); } };
    area.addEventListener('pointermove', arrasta);
    area.addEventListener('pointerdown', arrasta);
    area.style.touchAction = 'none';
  }

  /* --------------------------------------------------------- dar de comer */
  function comer(){
    const palco = cabeca('🥕 Dar de comer');
    const todos = Object.keys(COMIDA);
    const ordem = baralha(todos.slice()).slice(0, 3);
    let k = 0;
    const ronda = () => {
      const alvo = ordem[k];
      const opcoes = baralha([alvo, ...baralha(todos.filter(x => x !== alvo)).slice(0, 2)]);
      palco.innerHTML = `<div class="comer-quinta"><div class="comer-bichos">${opcoes.map(id => `<div class="comer-bicho" data-id="${id}"><img src="${imgSrc(id)}" alt="" draggable="false"></div>`).join('')}</div>
        <div class="comer-comida"><div class="comida" id="comida">${COMIDA[alvo].emoji}</div></div></div>`;
      diz(COMIDA[alvo].frase);
      const comida = palco.querySelector('#comida'), bichos = [...palco.querySelectorAll('.comer-bicho')];
      let em = false, dx = 0, dy = 0, base = null, pid = null;
      const centro = e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
      comida.style.touchAction = 'none';
      comida.onpointerdown = e => { em = true; pid = e.pointerId; base = centro(comida); dx = e.clientX - base.x; dy = e.clientY - base.y; comida.classList.add('a-arrastar'); comida.style.transition = ''; try{ comida.setPointerCapture(pid); }catch(err){} };
      comida.onpointermove = e => { if(!em || e.pointerId !== pid) return; e.preventDefault(); comida.style.transform = `translate(${e.clientX - dx - base.x}px, ${e.clientY - dy - base.y}px) scale(1.1)`; };
      comida.onpointerup = comida.onpointercancel = e => {
        if(!em) return; em = false; comida.classList.remove('a-arrastar');
        try{ comida.releasePointerCapture(pid); }catch(err){}
        const c = centro(comida);
        const alvoEl = bichos.find(b => { const r = b.getBoundingClientRect(); return c.x >= r.left && c.x <= r.right && c.y >= r.top && c.y <= r.bottom; });
        if(alvoEl && alvoEl.dataset.id === alvo){
          comida.classList.add('comida-comida'); alvoEl.classList.add('feliz');
          try{ Som.efeito('certo'); }catch(err){}
          elogia();
          espera(() => { if(++k >= ordem.length) fim(palco, 'Já todos comeram!'); else ronda(); }, 1100);
        }else{
          if(alvoEl){ alvoEl.classList.add('treme'); espera(() => alvoEl.classList.remove('treme'), 450); }
          comida.style.transition = 'transform .3s cubic-bezier(.34,1.5,.64,1)'; comida.style.transform = '';
        }
      };
    };
    ronda();
  }

  menu();
}
