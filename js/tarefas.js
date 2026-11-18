/* Jogos de cada casa da quinta (v4.28).
   Cada espaço tem as suas tarefas: ovos, milho, água e pintainhos no galinheiro;
   lã e erva no redil; ordenhar na vacaria; colher na horta e no pomar; etc.
   Quanto mais animais a criança compra para a casa, mais animais (e mais ovos,
   mais pintainhos, mais voltas) aparecem nos jogos.
   Só usa imagens que já existem. Frases novas: ferramentas/falas-extra.json;
   se o clip ainda não existir, o jogo mostra o texto e fica em silêncio
   (nunca usa a voz do aparelho). */
import { util } from './natureza.js';
import { BICHOS, achaEdificio } from './minhaquinta.js';

const { imgSrc, BEM, pick, baralha } = util;
const rnd = n => Math.floor(Math.random() * n);

/* o que cada animal come (emoji) e a frase que já existe em voz */
const COMIDA = { galo:'🌽', galinha:'🌽', pato:'🌽', ra:'🪰', tartaruga:'🥬', ovelha:'🌿', porco:'🍎', vaca:'🌾', cavalo:'🥕', coelho:'🥕', cao:'🦴', gato:'🐟' };
const FRASE_COMER = {
  cavalo:'Dá de comer ao cavalo.', pato:'Dá de comer ao pato.', porco:'Dá de comer ao porco.',
  vaca:'Dá de comer à vaca.', galo:'Dá de comer ao galo.', ovelha:'Dá de comer à ovelha.',
};

/* os jogos de cada casa.
   apanhar: coisas que aparecem nos sítios e voam para o cesto (base + por × animais)
   servir:  arrastar a comida (ou a água) a cada animal que a pede (um cartão por animal comprado)
   contar:  contar pintainhos/animais (o número cresce com os animais comprados)
   esfregar: uma volta por animal comprado; tocar/passar o dedo nos pontos (lã, lama, escovar, leite…) */
const OVOS   = { id:'ovos', emoji:'🥚', nome:'Apanhar ovos', tipo:'apanhar', item:'🥚', local:'ninho', base:3, por:2, max:12, frase:'Apanha os ovos.', fim:'Apanhaste todos os ovos!' };
const COMER  = { id:'comer', emoji:'🥕', nome:'Dar de comer', tipo:'servir', precisa:true, frase:'Dá de comer aos animais.', fim:'Já todos comeram!' };
const AGUA   = { id:'agua', emoji:'💧', nome:'Dar água', tipo:'servir', agua:true, precisa:true, frase:'Dá água aos animais.', fim:'Já ninguém tem sede!' };
const CONTAR = (item, nome, emoji, extra = {}) => ({ id:'contar', emoji, nome, tipo:'contar', item, precisa:true, base:1, por:1, max:9, ...extra });

const CASAS = {
  galinheiro: [OVOS, { ...COMER, emoji:'🌽', nome:'Dar milho', frase:'Dá milho às galinhas.' }, CONTAR('🐥', 'Contar pintainhos', '🐥', { base:1, por:2, frase:'Quantos pintainhos há?' }), AGUA],
  redil: [
    { id:'la', emoji:'🐑', nome:'Lã das ovelhas', tipo:'esfregar', precisa:true, spot:'la', pos:[[12,22],[38,8],[66,14],[84,38],[8,52],[30,66],[60,70],[84,66]], frase:'Tira a lã da ovelha.', fim:'Que ovelhas tão fofas!' },
    COMER, CONTAR(null, 'Contar ovelhas', '🔢', { bichos:true, frase:'Quantas ovelhas há?' }), AGUA,
  ],
  pocilga: [
    COMER,
    { id:'lavar', emoji:'🛁', nome:'Lavar o porco', tipo:'esfregar', precisa:true, spot:'lama', pos:[[18,30],[44,18],[70,28],[82,52],[16,60],[40,68],[64,70]], frase:'Lava o porco.', fim:'Está limpinho!' },
    CONTAR(null, 'Contar porcos', '🔢', { bichos:true, frase:'Quantos porcos há?' }), AGUA,
  ],
  vacaria: [
    { id:'leite', emoji:'🥛', nome:'Tirar o leite', tipo:'esfregar', precisa:true, spot:'leite', pos:[[34,74],[46,80],[58,80],[70,74]], frase:'Tira o leite.', fim:'Que leite fresquinho!' },
    COMER, AGUA, CONTAR(null, 'Contar vacas', '🔢', { bichos:true, frase:'Quantas vacas há?' }),
  ],
  lago: [
    { ...COMER, nome:'Dar de comer', emoji:'🍞' },
    { id:'nenufares', emoji:'🪷', nome:'Apanhar nenúfares', tipo:'apanhar', item:'🪷', local:'agua', base:3, por:1, max:10, frase:'Apanha os nenúfares.', fim:'Que lago tão bonito!' },
    CONTAR(null, 'Contar os bichinhos', '🔢', { bichos:true, frase:'Quantos bichinhos há?' }),
  ],
  estabulo: [
    COMER,
    { id:'escovar', emoji:'✨', nome:'Escovar o cavalo', tipo:'esfregar', precisa:true, spot:'brilho', pos:[[20,30],[46,20],[72,30],[84,56],[24,60],[50,66],[70,70]], frase:'Escova o cavalo.', fim:'Está a brilhar!' },
    AGUA,
  ],
  casa: [
    COMER, AGUA,
    { id:'festas', emoji:'❤️', nome:'Fazer festas', tipo:'esfregar', precisa:true, spot:'amor', pos:[[24,28],[50,16],[76,28],[30,58],[62,60],[50,40]], frase:'Faz festas.', fim:'Que amigos felizes!' },
  ],
  horta: [
    { id:'colher', emoji:'🥕', nome:'Colher cenouras', tipo:'apanhar', item:'🥕', local:'canteiro', base:4, por:2, max:12, frase:'Colhe as cenouras.', fim:'Que horta tão cheia!' },
    { ...COMER, nome:'Dar de comer ao coelho', emoji:'🥕' },
    CONTAR('🥕', 'Contar cenouras', '🥕', { base:2, por:2, frase:'Quantas cenouras há?' }),
  ],
  pomar: [
    { id:'macas', emoji:'🍎', nome:'Apanhar maçãs', tipo:'apanhar', item:'🍎', local:'arvore', base:5, por:0, max:5, frase:'Apanha as maçãs.', fim:'Que pomar tão doce!' },
    CONTAR('🍎', 'Contar maçãs', '🍎', { base:3, por:0, max:7, frase:'Quantas maçãs há?' }),
  ],
  estufa: [
    { id:'tomates', emoji:'🍅', nome:'Apanhar tomates', tipo:'apanhar', item:'🍅', local:'canteiro', base:5, por:0, max:5, frase:'Apanha os tomates.', fim:'Que tomates tão vermelhos!' },
    CONTAR('🍅', 'Contar tomates', '🍅', { base:3, por:0, max:7, frase:'Quantos tomates há?' }),
  ],
  celeiro: [
    { id:'milho', emoji:'🌽', nome:'Apanhar milho', tipo:'apanhar', item:'🌽', local:'canteiro', base:5, por:0, max:5, frase:'Apanha o milho.', fim:'Que celeiro tão cheio!' },
    CONTAR('🌽', 'Contar espigas', '🌽', { base:3, por:0, max:7, frase:'Quantas espigas há?' }),
  ],
  moinho: [
    { id:'trigo', emoji:'🌾', nome:'Apanhar trigo', tipo:'apanhar', item:'🌾', local:'canteiro', base:5, por:0, max:5, frase:'Apanha o trigo.', fim:'Que farinha vai sair!' },
    CONTAR('🌾', 'Contar espigas', '🌾', { base:3, por:0, max:7, frase:'Quantas espigas há?' }),
  ],
};

export const FRASES_TAREFAS = [...new Set([
  ...Object.values(FRASE_COMER),
  ...Object.values(CASAS).flat().map(j => j.frase).filter(Boolean),
  ...Object.values(CASAS).flat().map(j => j.fim).filter(Boolean),
])];

/* animais que a criança já comprou para esta casa: ['galo','galo','galo'] */
function animaisDe(casaId, itens){
  const lista = [];
  for(const b of BICHOS.filter(b => b.casa === casaId)) for(let i = 0; i < (itens[b.id] || 0); i++) lista.push(b.id);
  return lista;
}

/* abreJogosCasa(Som, aoGanhar, casaId, itens, aoComprar)
   aoGanhar(n): chamado quando um jogo fica concluído (dá estrelas)
   aoComprar(casaId): abre a loja de animais desta casa */
export function abreJogosCasa(Som, aoGanhar, casaId, itens, aoComprar){
  if(document.querySelector('.brincar-fundo')) return;
  const casa = achaEdificio(casaId), jogos = CASAS[casaId];
  if(!casa || !jogos) return;
  const f = document.createElement('div');
  f.className = 'brincar-fundo tarefas-fundo'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', `Jogos: ${casa.nome}`);
  document.body.append(f);
  let limpar = () => {};
  const timers = new Set();
  const espera = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const fecha = () => { limpar(); timers.forEach(clearTimeout); try{ Som.paraVoz && Som.paraVoz(); }catch(e){} f.remove(); };
  const diz = t => { try{ if(t && Som.temClips([t])) Som.fala(t); }catch(e){} };
  const elogia = () => diz(pick(BEM));
  const toast = txt => { const e = document.createElement('div'); e.className = 'toast-cromo'; e.textContent = txt; document.body.append(e); setTimeout(() => e.remove(), 2200); };
  const conclui = () => { try{ aoGanhar(1); }catch(e){} toast('⭐ +1 estrela!'); };

  const lista = animaisDe(casaId, itens || {});
  const temBichos = BICHOS.some(b => b.casa === casaId);
  const img = id => `<img src="${imgSrc(id)}" alt="" draggable="false">`;

  const menu = () => {
    limpar(); limpar = () => {}; timers.forEach(clearTimeout); timers.clear();
    try{ Som.paraVoz && Som.paraVoz(); }catch(e){}
    const moradores = lista.length
      ? `<div class="cj-moradores" aria-label="Animais desta casa">${lista.map(id => img(id)).join('')}</div>`
      : (temBichos ? '<p class="cj-aviso">Ainda não tens animais aqui. Compra um para brincar com ele!</p>' : '');
    f.innerHTML = `<h2>${casa.nome}</h2>${moradores}
      <div class="brincar-menu">${jogos.map((j, i) => {
        const bloq = j.precisa && !lista.length;
        return `<button class="botao" data-j="${i}" type="button" ${bloq ? 'disabled' : ''}>${j.emoji} ${j.nome}</button>`;
      }).join('')}</div>
      ${temBichos && aoComprar ? '<button class="botao quente" data-a="comprar" type="button">➕ Mais animais</button>' : ''}
      <button class="botao calma" data-a="fechar" type="button">Voltar à quinta</button>`;
    f.querySelectorAll('[data-j]').forEach(b => b.onclick = () => joga(+b.dataset.j));
    const c = f.querySelector('[data-a=comprar]');
    if(c) c.onclick = () => { fecha(); try{ aoComprar(casaId); }catch(e){} };
    f.querySelector('[data-a=fechar]').onclick = fecha;
  };

  const cabeca = j => {
    f.innerHTML = `<div class="brincar-topo"><button class="botao calma pequeno" data-a="menu" type="button">◀ ${casa.nome}</button><strong>${j.emoji} ${j.nome}</strong></div>
      <p class="cj-instr">${j.frase || ''}</p><div class="brincar-palco tarefa-palco"></div>`;
    f.querySelector('[data-a=menu]').onclick = menu;
    return f.querySelector('.tarefa-palco');
  };
  const fim = (palco, j) => {
    elogia(); conclui();
    palco.insertAdjacentHTML('beforeend', `<div class="tarefa-fim"><p>${j.fim || 'Muito bem!'}</p>
      <button class="botao" data-a="outra" type="button">Outra vez</button>
      <button class="botao calma" data-a="menu2" type="button">Outro jogo</button></div>`);
    palco.querySelector('[data-a=outra]').onclick = () => joga(jogos.indexOf(j));
    palco.querySelector('[data-a=menu2]').onclick = menu;
  };

  const joga = i => {
    limpar(); limpar = () => {}; timers.forEach(clearTimeout); timers.clear();
    const j = jogos[i];
    const palco = cabeca(j);
    if(j.tipo !== 'servir') diz(j.frase);
    ({ apanhar, servir, contar, esfregar })[j.tipo](palco, j);
  };

  /* ---------------------------------------------------------- apanhar */
  function apanhar(palco, j){
    const N = Math.min(j.max, j.base + j.por * lista.length);
    palco.innerHTML = `<div class="cj-apanhar"><div class="cj-spots">${[0, 1, 2, 3, 4, 5].map(() => `<div class="cj-spot l-${j.local}"></div>`).join('')}</div>
      <div class="cj-cesto">🧺 <b>0</b>/${N}</div></div>`;
    const spots = [...palco.querySelectorAll('.cj-spot')], conta = palco.querySelector('.cj-cesto b'), cesto = palco.querySelector('.cj-cesto');
    let apanhados = 0, soltos = 0;
    const poe = () => {
      if(soltos + apanhados >= N) return;
      const livres = spots.filter(s => !s.querySelector('.cj-item'));
      if(!livres.length){ espera(poe, 700); return; }
      const s = pick(livres), it = document.createElement('button');
      it.type = 'button'; it.className = 'cj-item'; it.textContent = j.item; it.setAttribute('aria-label', j.nome);
      s.append(it); soltos++;
      it.onclick = () => {
        if(it.classList.contains('vai')) return;
        const c = cesto.getBoundingClientRect(), r = it.getBoundingClientRect();
        it.style.setProperty('--dx', (c.left + c.width / 2 - r.left - r.width / 2) + 'px');
        it.style.setProperty('--dy', (c.top + c.height / 2 - r.top - r.height / 2) + 'px');
        it.classList.add('vai');
        try{ Som.efeito('pop'); }catch(e){}
        espera(() => { it.remove(); apanhados++; soltos--; conta.textContent = apanhados;
          if(apanhados >= N) fim(palco, j); else espera(poe, 350); }, 650);
      };
      if(soltos + apanhados < N && soltos < 2) espera(poe, 800);
    };
    poe();
  }

  /* ----------------------------------------------------------- servir */
  /* um cartão por animal comprado (até 6); arrasta a comida ao animal que a pede */
  function servir(palco, j){
    const bichos = lista.slice(0, 6).map((id, k) => ({ id, k, quer: j.agua ? '💧' : (COMIDA[id] || '🥕'), feito: false }));
    const col = Math.min(bichos.length, 3);
    palco.innerHTML = `<div class="cj-servir"><div class="cj-bichos" style="--col:${col}">${bichos.map(b =>
      `<div class="cj-bicho" data-k="${b.k}">${img(b.id)}<span class="cj-pedido">${b.quer}</span></div>`).join('')}</div>
      <div class="cj-bandeja"></div><div class="cj-cesto">${j.agua ? '💧' : '🍽️'} <b>0</b>/${bichos.length}</div></div>`;
    const cartoes = [...palco.querySelectorAll('.cj-bicho')], bandeja = palco.querySelector('.cj-bandeja'), conta = palco.querySelector('.cj-cesto b');
    let dados = 0;
    const especies = [...new Set(bichos.map(b => b.id))];
    diz(!j.agua && especies.length === 1 && FRASE_COMER[especies[0]] ? FRASE_COMER[especies[0]] : j.frase);

    const monta = () => {
      const faltam = [...new Set(bichos.filter(b => !b.feito).map(b => b.quer))];
      bandeja.innerHTML = faltam.map(q => `<div class="cj-comida" data-q="${q}">${q}</div>`).join('');
      bandeja.querySelectorAll('.cj-comida').forEach(arrasta);
    };
    const arrasta = comida => {
      let em = false, dx = 0, dy = 0, base = null, pid = null;
      const centro = e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
      comida.style.touchAction = 'none';
      comida.onpointerdown = e => { em = true; pid = e.pointerId; base = centro(comida); dx = e.clientX - base.x; dy = e.clientY - base.y; comida.classList.add('cj-arrasta'); comida.style.transition = ''; try{ comida.setPointerCapture(pid); }catch(err){} };
      comida.onpointermove = e => { if(!em || e.pointerId !== pid) return; e.preventDefault(); comida.style.transform = `translate(${e.clientX - dx - base.x}px, ${e.clientY - dy - base.y}px) scale(1.1)`; };
      comida.onpointerup = comida.onpointercancel = () => {
        if(!em) return; em = false; comida.classList.remove('cj-arrasta');
        try{ comida.releasePointerCapture(pid); }catch(err){}
        const c = centro(comida), q = comida.dataset.q;
        const alvo = cartoes.find(el => { const r = el.getBoundingClientRect(); return c.x >= r.left && c.x <= r.right && c.y >= r.top && c.y <= r.bottom; });
        const b = alvo && bichos[+alvo.dataset.k];
        if(b && !b.feito && b.quer === q){
          b.feito = true; dados++; conta.textContent = dados;
          comida.classList.add('cj-comida-comida'); alvo.classList.add('feliz');
          alvo.querySelector('.cj-pedido').textContent = '❤️';
          try{ Som.efeito('certo'); }catch(err){}
          if(dados >= bichos.length) espera(() => fim(palco, j), 700);
          else{ if(dados % 2 === 1) elogia(); espera(monta, 600); }
        }else{
          if(alvo){ alvo.classList.add('treme'); espera(() => alvo.classList.remove('treme'), 450); }
          comida.style.transition = 'transform .3s cubic-bezier(.34,1.5,.64,1)'; comida.style.transform = '';
        }
      };
    };
    monta();
  }

  /* ----------------------------------------------------------- contar */
  function contar(palco, j){
    const topo = Math.min(j.max, j.base + j.por * lista.length);
    const VOLTAS = 3;
    let v = 0;
    const volta = () => {
      const n = j.bichos ? Math.max(1, Math.min(lista.length, topo) - (v === 0 ? 0 : rnd(2))) : Math.max(1, topo - (v === 0 ? 0 : rnd(3)));
      const itens3 = j.bichos
        ? Array.from({ length: n }, (_, k) => `<span class="cj-conta-item img">${img(lista[k % lista.length])}</span>`).join('')
        : Array.from({ length: n }, () => `<span class="cj-conta-item">${j.item}</span>`).join('');
      let opcoes = new Set([n]);
      while(opcoes.size < 3){ const x = Math.max(1, n + rnd(5) - 2); opcoes.add(x); }
      opcoes = baralha([...opcoes]);
      palco.innerHTML = `<div class="cj-contar"><div class="cj-conta-cena">${itens3}</div>
        <div class="cj-opcoes">${opcoes.map(o => `<button class="botao cj-num" data-n="${o}" type="button">${o}</button>`).join('')}</div></div>`;
      palco.querySelectorAll('.cj-num').forEach(b => b.onclick = () => {
        if(+b.dataset.n === n){
          try{ Som.efeito('certo'); }catch(e){}
          b.classList.add('certo'); elogia();
          espera(() => { if(++v >= VOLTAS) fim(palco, j); else volta(); }, 900);
        }else{
          b.classList.add('treme'); espera(() => b.classList.remove('treme'), 450);
        }
      });
    };
    volta();
  }

  /* --------------------------------------------------------- esfregar */
  /* uma volta por animal comprado (até 4); tocar ou passar o dedo pelos pontos */
  function esfregar(palco, j){
    const bichos = lista.slice(0, 4);
    let k = 0;
    const volta = () => {
      const id = bichos[k];
      palco.innerHTML = `<div class="cj-esfregar"><div class="cj-corpo">${img(id)}
        ${j.pos.map(p => `<button class="cj-tufo t-${j.spot}" type="button" aria-label="${j.nome}" style="left:${p[0]}%;top:${p[1]}%"></button>`).join('')}</div>
        <div class="cj-cesto">${j.emoji} <b>${k + 1}</b>/${bichos.length}</div></div>`;
      const tufos = [...palco.querySelectorAll('.cj-tufo')];
      let n = 0;
      const tira = t => {
        if(!t || t.classList.contains('voa')) return;
        t.classList.add('voa'); n++;
        try{ Som.efeito('pop'); }catch(e){}
        if(n >= tufos.length){
          elogia();
          espera(() => { if(++k >= bichos.length) fim(palco, j); else volta(); }, 800);
        }
      };
      tufos.forEach(t => t.addEventListener('click', () => tira(t)));
      const area = palco.querySelector('.cj-corpo');
      const arr = e => { if(e.buttons || e.pointerType === 'touch'){ const el = document.elementFromPoint(e.clientX, e.clientY); if(el && el.classList.contains('cj-tufo')) tira(el); } };
      area.addEventListener('pointermove', arr);
      area.addEventListener('pointerdown', arr);
      area.style.touchAction = 'none';
    };
    volta();
  }

  menu();
}
