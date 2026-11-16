/* Jogos novos, todos com dinâmicas diferentes das cartas paradas:
   toupeiras (apanhar quando aparece), cesto (arrastar fruta/legume), puzzle (arrastar peças).
   Só usam imagens que já existem e frases que já estão gravadas na voz dos avós. */
import { ITENS, util } from './natureza.js';
import { confete } from './arte.js';

const { imgSrc, EM, plural, com, esse, verbo, BEM, Cap, pick, baralha } = util;
const CATS = ['animais', 'frutas', 'legumes'];

function pool(jogo, cat){
  const nivel = (jogo.info.nat && jogo.info.nat.nivel) || 2;
  return ITENS[cat].filter(x => x.nivel <= nivel);
}

/* arrasto de uma peça: devolve a peça ao sítio se não cair num destino.
   aoSoltar(destino|null) devolve true se a peça deve ficar onde foi largada. */
function arrasta(jogo, el, destinos, aoSoltar){
  let em = false, dx = 0, dy = 0, id = null, base = null;
  const centro = e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const baixo = e => {
    if(jogo.aEsperar || em) return;
    em = true; id = e.pointerId;
    base = centro(el); dx = e.clientX - base.x; dy = e.clientY - base.y;
    el.classList.add('a-arrastar'); el.style.transition = '';
    try{ el.setPointerCapture(id); }catch(err){}
  };
  const move = e => {
    if(!em || e.pointerId !== id) return;
    e.preventDefault();
    el.style.transform = `translate(${e.clientX - dx - base.x}px, ${e.clientY - dy - base.y}px) scale(1.08)`;
  };
  const cima = e => {
    if(!em || e.pointerId !== id) return;
    em = false; el.classList.remove('a-arrastar');
    try{ el.releasePointerCapture(id); }catch(err){}
    const c = centro(el);
    let perto = null, menor = 1e9;
    for(const d of destinos()){ const cd = centro(d); const m = Math.hypot(cd.x - c.x, cd.y - c.y); if(m < menor){ menor = m; perto = d; } }
    const limite = Math.max(60, el.getBoundingClientRect().width * .8);
    const fica = aoSoltar(perto && menor < limite ? perto : null, base, centro);
    if(!fica){
      el.style.transition = 'transform .3s cubic-bezier(.34,1.5,.64,1)'; el.style.transform = '';
      jogo.espera(() => { el.style.transition = ''; }, 320);
    }
  };
  el.addEventListener('pointerdown', baixo);
  el.addEventListener('pointermove', move, { passive: false });
  el.addEventListener('pointerup', cima);
  el.addEventListener('pointercancel', cima);
  jogo.limpezas.push(() => {
    el.removeEventListener('pointerdown', baixo); el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', cima); el.removeEventListener('pointercancel', cima);
  });
}

/* ============================================================ TOUPEIRAS */
/* os bichos espreitam dos buracos: toca no que foi pedido quando aparecer. Nunca falha por demorar. */
export function rondaToupeiras(jogo){
  const info = jogo.info;
  const cat = pick(CATS);
  const todos = pool(jogo, cat);
  const certa = pick(todos);
  const outros = baralha(todos.filter(x => x.id !== certa.id)).slice(0, 3);
  const buracos = info.estrelasMin >= 2 ? 4 : 6;
  const alvos = info.estrelasMin >= 2 ? 2 : 3;
  const lista = [certa, ...outros];
  jogo.ctx.raiz.innerHTML = `<div class="toupeiras" style="--cols:${buracos === 4 ? 2 : 3}">${Array.from({ length: buracos }, (_, i) =>
    `<button class="toupeira" type="button" data-i="${i}" aria-label="buraco"><span class="bicho-caixa"><img class="bicho" alt="" draggable="false"></span><span class="terra"></span></button>`).join('')}</div>`;
  const bs = [...jogo.ctx.raiz.querySelectorAll('.toupeira')];
  jogo.pose('apontar');
  jogo.diz(`Toca ${EM[certa.art]} ${certa.nome}.`, () => { if(jogo.aDecorrer) jogo.pose('repouso'); });
  let feitos = 0, ciclo = 0;
  const esconde = b => { b.classList.remove('sobe'); b.dataset.id = ''; };
  const sobe = () => {
    if(!jogo.aDecorrer || jogo.aEsperar) return;
    ciclo++;
    const livres = bs.filter(b => !b.classList.contains('sobe'));
    if(livres.length){
      const b = pick(livres);
      const it = (ciclo % 3 === 1 || Math.random() < .35) ? certa : pick(lista);
      b.querySelector('img').src = imgSrc(it.id);
      b.dataset.id = it.id; b.classList.add('sobe');
      jogo.espera(() => esconde(b), 2200);
    }
    jogo.espera(sobe, 1100);
  };
  jogo.espera(sobe, 1200);
  bs.forEach(b => {
    const f = () => {
      if(jogo.aEsperar || !b.classList.contains('sobe')) return;
      const it = lista.find(x => x.id === b.dataset.id);
      if(!it) return;
      if(it.id !== certa.id){ jogo.responde(b, false, [`${esse(it)} ${com(it)}.`, `Procura ${com(certa)}.`]); return; }
      feitos++;
      if(feitos >= alvos){ jogo.responde(b, true, [pick(BEM), `${plural(certa) ? 'São' : 'É'} ${com(certa)}.`], '#F5B921'); return; }
      jogo.som('pop'); esconde(b);
    };
    b.addEventListener('click', f);
    jogo.limpezas.push(() => b.removeEventListener('click', f));
  });
}

/* =============================================================== CESTO */
/* arrasta cada fruta ou legume para o cesto certo (ou toca no cesto) */
export function rondaCesto(jogo){
  const info = jogo.info;
  const nivel = (info.nat && info.nat.nivel) || 2;
  const pot = [...ITENS.frutas, ...ITENS.legumes].filter(x => x.tipo && x.nivel <= nivel);
  if(pot.length < 4) return false;
  const quantos = info.estrelasMin >= 2 ? 2 : 3;
  const frutas = baralha(pot.filter(x => x.tipo === 'fruta')), legumes = baralha(pot.filter(x => x.tipo === 'legume'));
  const fila = baralha([frutas[0], legumes[0], ...baralha([...frutas.slice(1), ...legumes.slice(1)]).slice(0, Math.max(0, quantos - 2))]).slice(0, quantos);
  let i = 0;
  jogo.ctx.raiz.innerHTML = `<div class="cesto-cena">
    <div class="cesto-peca-area"><div class="cesto-peca" id="cesto-peca"><img alt="" draggable="false"></div></div>
    <div class="cestos">
      <button class="cesto" type="button" data-v="fruta">🍎<span>Fruta</span></button>
      <button class="cesto" type="button" data-v="legume">🥕<span>Legume</span></button>
    </div></div>`;
  const raiz = jogo.ctx.raiz, peca = raiz.querySelector('#cesto-peca'), img = peca.querySelector('img');
  const cestos = [...raiz.querySelectorAll('.cesto')];
  const pergunta = it => plural(it) ? `${Cap(com(it))} são frutas ou legumes?` : `${Cap(com(it))} é fruta ou legume?`;
  const mostra = (prefixo) => {
    const it = fila[i];
    peca.style.transition = ''; peca.style.transform = ''; peca.classList.remove('some');
    img.src = imgSrc(it.id);
    jogo.pose('pensar');
    jogo.diz(prefixo ? [prefixo, pergunta(it)] : pergunta(it), () => { if(jogo.aDecorrer) jogo.pose('repouso'); });
  };
  const escolhe = cesto => {
    if(jogo.aEsperar) return;
    const it = fila[i];
    if(cesto.dataset.v !== it.tipo){ jogo.responde(cesto, false, 'Pensa outra vez. Olha bem para a imagem.'); return false; }
    if(i === fila.length - 1){
      const nome = it.tipo === 'fruta' ? (plural(it) ? 'frutas' : 'uma fruta') : (plural(it) ? 'legumes' : 'um legume');
      peca.classList.add('some');
      jogo.responde(cesto, true, [pick(BEM), `${Cap(com(it))} ${verbo(it)} ${nome}.`], '#F5B921');
      return true;
    }
    jogo.som('certo'); peca.classList.add('some');
    const r = cesto.getBoundingClientRect();
    confete(document.body, r.left + r.width / 2, r.top, ['#F5B921', '#fff', '#5BAF6A']);
    i++;
    jogo.espera(() => mostra(pick(BEM)), 450);
    return true;
  };
  cestos.forEach(c => { const f = () => escolhe(c); c.addEventListener('click', f); jogo.limpezas.push(() => c.removeEventListener('click', f)); });
  arrasta(jogo, peca, () => cestos, destino => destino ? escolhe(destino) : false);
  mostra(null);
}

/* ============================================================== PUZZLE */
/* a imagem partida em pedaços: arrasta cada pedaço para o sítio certo */
export function rondaPuzzle(jogo){
  const info = jogo.info;
  const cat = pick(CATS);
  const it = pick(pool(jogo, cat));
  const [cols, rows] = info.estrelasMin >= 2 ? [2, 1] : info.opcoes >= 5 ? [3, 2] : [2, 2];
  const n = cols * rows, src = imgSrc(it.id);
  const estilo = i => {
    const c = i % cols, r = Math.floor(i / cols);
    return `background-image:url('${src}');background-size:${cols * 100}% ${rows * 100}%;background-position:${cols > 1 ? c * 100 / (cols - 1) : 0}% ${rows > 1 ? r * 100 / (rows - 1) : 0}%`;
  };
  jogo.ctx.raiz.innerHTML = `<div class="puzzle-cena">
    <div class="puzzle-quadro" style="--cols:${cols};--rows:${rows}">${Array.from({ length: n }, (_, i) =>
      `<div class="puzzle-slot" data-i="${i}"></div>`).join('')}</div>
    <div class="puzzle-bandeja">${baralha(Array.from({ length: n }, (_, i) => i)).map(i =>
      `<div class="puzzle-peca" data-i="${i}" style="${estilo(i)};--cols:${cols};--rows:${rows}" role="button" aria-label="peça"></div>`).join('')}</div></div>`;
  const slots = [...jogo.ctx.raiz.querySelectorAll('.puzzle-slot')];
  let postas = 0;
  jogo.pose('apontar');
  jogo.diz(`${esse(it)} ${com(it)}.`, () => { if(jogo.aDecorrer) jogo.pose('repouso'); });
  jogo.ctx.raiz.querySelectorAll('.puzzle-peca').forEach(p => {
    arrasta(jogo, p, () => slots.filter(s => !s.classList.contains('cheio')), (destino, base, centro) => {
      if(!destino) return false;
      if(destino.dataset.i !== p.dataset.i){ jogo.responde(destino, false, 'Pensa outra vez. Olha bem para a imagem.'); return false; }
      const cd = centro(destino);
      p.style.transition = 'transform .22s cubic-bezier(.34,1.4,.64,1)';
      p.style.transform = `translate(${cd.x - base.x}px, ${cd.y - base.y}px)`;
      p.style.pointerEvents = 'none'; destino.classList.add('cheio'); jogo.som('encaixe');
      postas++;
      if(postas >= n) jogo.responde(destino, true, [pick(BEM), `${esse(it)} ${com(it)}.`], '#F5B921');
      return true;
    });
  });
}
