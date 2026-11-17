/* Jogos novos: ligar pontos, procurar na imagem e pintar.
   Só usam imagens que já existem (os desenhos são traços em SVG) e frases gravadas na voz dos avós.
   As frases novas estão em ferramentas/falas-extra.json; enquanto o clip não existir, a ronda
   troca para outro jogo (nunca fala com a voz do aparelho). */
import { ITENS, util } from './natureza.js';

const { imgSrc, EM, plural, com, esse, BEM, pick, baralha } = util;
const jovem = jogo => jogo.info.estrelasMin >= 2;          /* 3 e 4 anos */
const temClips = (jogo, lista) => !jogo.ctx.som || !jogo.ctx.som.temClips || jogo.ctx.som.temClips(lista);
const SVGNS = 'http://www.w3.org/2000/svg';

/* ============================================================ LIGAR PONTOS */
const FIGURAS = [
  { nome: 'casa', art: 'uma', jovem: true,  pts: [[20,90],[20,50],[50,18],[80,50],[80,90]] },
  { nome: 'peixe', art: 'um', jovem: true,  pts: [[8,50],[34,30],[62,40],[80,26],[80,74],[62,60],[34,70]] },
  { nome: 'coração', art: 'um', jovem: true, pts: [[50,30],[30,14],[12,30],[22,62],[50,90],[78,62],[88,30],[70,14]] },
  { nome: 'barco', art: 'um', pts: [[8,64],[46,64],[46,14],[84,56],[56,56],[56,64],[92,64],[78,90],[22,90]] },
  { nome: 'estrela', art: 'uma', pts: (() => { const p = []; for(let i = 0; i < 10; i++){ const r = i % 2 ? 19 : 44, a = -Math.PI / 2 + i * Math.PI / 5; p.push([Math.round(50 + r * Math.cos(a)), Math.round(54 + r * Math.sin(a))]); } return p; })() },
  { nome: 'árvore', art: 'uma', pts: [[44,92],[44,68],[18,68],[36,48],[24,48],[42,28],[50,8],[58,28],[76,48],[64,48],[82,68],[56,68],[56,92]] },
];
export const FRASES_PONTOS = ['Liga os pontos pela ordem.', ...FIGURAS.map(f => `É ${f.art} ${f.nome}!`)];

export function rondaPontos(jogo){
  const lista = FIGURAS.filter(f => !jovem(jogo) || f.jovem);
  const fig = pick(lista);
  const nome = `É ${fig.art} ${fig.nome}!`;
  if(!temClips(jogo, [FRASES_PONTOS[0], nome])) return false;
  const pts = fig.pts, N = pts.length;
  jogo.ctx.raiz.innerHTML = `<div class="pontos-cena"><svg viewBox="0 0 100 100" role="img" aria-label="Liga os pontos">
      <polygon class="pontos-forma" points="${pts.map(p => p.join(',')).join(' ')}"></polygon>
      <g class="pontos-linhas"></g>
      ${pts.map((p, i) => `<g class="ponto" data-i="${i}" transform="translate(${p[0]} ${p[1]})"><circle r="5.2"></circle><text y="1.9" text-anchor="middle">${i + 1}</text></g>`).join('')}
    </svg></div>`;
  const svg = jogo.ctx.raiz.querySelector('svg'), linhas = svg.querySelector('.pontos-linhas');
  const bolas = [...svg.querySelectorAll('.ponto')];
  let prox = 0, falhas = 0;
  const marca = () => bolas.forEach((b, i) => b.classList.toggle('proximo', i === prox));
  marca();
  jogo.pose('apontar');
  jogo.diz(FRASES_PONTOS[0], () => { if(jogo.aDecorrer) jogo.pose('repouso'); });
  const linha = (a, b) => {
    const l = document.createElementNS(SVGNS, 'line');
    l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]);
    linhas.append(l);
  };
  const aoTocar = e => {
    if(jogo.aEsperar || prox >= N) return;
    const r = svg.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100;
    let melhor = -1, d = 1e9;
    pts.forEach((p, i) => { const m = Math.hypot(p[0] - x, p[1] - y); if(m < d){ d = m; melhor = i; } });
    if(d > 9) return;
    if(melhor !== prox){
      if(melhor > prox && melhor !== prox - 1){ bolas[melhor].classList.add('treme'); jogo.espera(() => bolas[melhor].classList.remove('treme'), 400); }
      if(++falhas >= 2) bolas[prox].classList.add('dica');
      return;
    }
    bolas[prox].classList.add('ligado'); bolas[prox].classList.remove('dica');
    if(prox > 0) linha(pts[prox - 1], pts[prox]);
    jogo.som('conta', prox + 1);
    prox++; falhas = 0;
    if(prox >= N){
      linha(pts[N - 1], pts[0]);
      bolas.forEach(b => b.classList.remove('proximo'));
      svg.classList.add('completo');
      jogo.responde(svg, true, [pick(BEM), nome], '#F5B921');
    }else marca();
  };
  svg.addEventListener('pointerdown', aoTocar);
  jogo.limpezas.push(() => svg.removeEventListener('pointerdown', aoTocar));
}

/* ============================================================ PROCURAR */
/* uma imagem cheia de bichos ou frutos: encontra todos os que foram pedidos */
export function rondaProcurar(jogo){
  const info = jogo.info;
  const nivel = (info.nat && info.nat.nivel) || 2;
  const cat = info.mundo === 0 ? pick(['frutas', 'legumes']) : pick(['animais', 'animais', 'frutas']);
  const todos = ITENS[cat].filter(x => x.nivel <= nivel);
  if(todos.length < 5) return false;
  const certa = pick(todos);
  const alvos = jovem(jogo) ? 2 : 3;
  const outros = baralha(todos.filter(x => x.id !== certa.id)).slice(0, jovem(jogo) ? 3 : 6);
  const pecas = baralha([...Array(alvos).fill(certa), ...outros]);
  const celulas = baralha(Array.from({ length: 12 }, (_, i) => i)).slice(0, pecas.length);
  const fundo = cat === 'animais' ? 'pasto' : 'horta';
  jogo.ctx.raiz.innerHTML = `<div class="procura-cena ${fundo}">${pecas.map((it, k) => {
    const c = celulas[k], x = (c % 4) * 25 + 12.5 + (Math.random() * 6 - 3), y = Math.floor(c / 4) * 33.3 + 16.6 + (Math.random() * 6 - 3);
    return `<button class="procura-item" type="button" data-id="${it.id}" aria-label="${it.nome}" style="left:${x}%;top:${y}%;--giro:${Math.round(Math.random() * 20 - 10)}deg"><img src="${imgSrc(it.id)}" alt="" draggable="false"></button>`;
  }).join('')}<div class="procura-conta">🔎 <b>0</b>/${alvos}</div></div>`;
  const conta = jogo.ctx.raiz.querySelector('.procura-conta b');
  let achados = 0;
  jogo.pose('apontar');
  jogo.diz(`Procura ${com(certa)}.`, () => { if(jogo.aDecorrer) jogo.pose('repouso'); });
  jogo.ctx.raiz.querySelectorAll('.procura-item').forEach(b => {
    const f = () => {
      if(jogo.aEsperar || b.classList.contains('achado')) return;
      const it = pecas.find(x => x.id === b.dataset.id);
      if(it.id !== certa.id){ jogo.responde(b, false, [`${esse(it)} ${com(it)}.`, `Procura ${com(certa)}.`]); return; }
      b.classList.add('achado'); achados++; conta.textContent = achados;
      if(achados >= alvos){ jogo.responde(b, true, [pick(BEM), `${plural(certa) ? 'São' : 'É'} ${com(certa)}.`], '#F5B921'); return; }
      jogo.som('pop');
    };
    b.addEventListener('click', f);
    jogo.limpezas.push(() => b.removeEventListener('click', f));
  });
}

/* ============================================================ PINTAR */
const TINTAS = [
  { id: 'vermelho', hex: '#D93A32' }, { id: 'azul', hex: '#2C6FD6' }, { id: 'amarelo', hex: '#F5C344' },
  { id: 'verde', hex: '#3DA35D' }, { id: 'laranja', hex: '#F3822B' }, { id: 'roxo', hex: '#8E6BC8' },
];
const CONTORNO = 'stroke="#2b3a55" stroke-width="2" stroke-linejoin="round"';
const CENAS = [
  { id: 'balao', jovem: true, partes: [{ id: 'balao', art: 'o', nome: 'balão' }],
    svg: `<line x1="50" y1="76" x2="50" y2="96" stroke="#2b3a55" stroke-width="1.6"/><polygon points="46,72 54,72 50,78" fill="#2b3a55"/><ellipse class="parte" data-p="balao" cx="50" cy="40" rx="27" ry="33" fill="#fff" ${CONTORNO}/>` },
  { id: 'flor', jovem: true, partes: [{ id: 'flor', art: 'a', nome: 'flor' }],
    svg: `<line x1="50" y1="52" x2="50" y2="96" stroke="#3DA35D" stroke-width="4"/><ellipse cx="38" cy="78" rx="11" ry="5" fill="#5BAF6A" transform="rotate(-25 38 78)"/><g class="parte" data-p="flor" fill="#fff" ${CONTORNO}>${[0, 72, 144, 216, 288].map(a => `<circle cx="${50 + 17 * Math.cos((a - 90) * Math.PI / 180)}" cy="${38 + 17 * Math.sin((a - 90) * Math.PI / 180)}" r="14"/>`).join('')}</g><circle cx="50" cy="38" r="9" fill="#8a5a2b" ${CONTORNO}/>` },
  { id: 'sol', jovem: true, partes: [{ id: 'sol', art: 'o', nome: 'sol' }],
    svg: `${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="${50 + 30 * Math.cos(a * Math.PI / 180)}" y1="${50 + 30 * Math.sin(a * Math.PI / 180)}" x2="${50 + 44 * Math.cos(a * Math.PI / 180)}" y2="${50 + 44 * Math.sin(a * Math.PI / 180)}" stroke="#F3A52B" stroke-width="4" stroke-linecap="round"/>`).join('')}<circle class="parte" data-p="sol" cx="50" cy="50" r="24" fill="#fff" ${CONTORNO}/>` },
  { id: 'casa', partes: [{ id: 'telhado', art: 'o', nome: 'telhado' }, { id: 'parede', art: 'a', nome: 'parede' }, { id: 'porta', art: 'a', nome: 'porta' }],
    svg: `<rect class="parte" data-p="parede" x="20" y="48" width="60" height="42" fill="#fff" ${CONTORNO}/><polygon class="parte" data-p="telhado" points="12,50 50,16 88,50" fill="#fff" ${CONTORNO}/><rect class="parte" data-p="porta" x="43" y="64" width="16" height="26" fill="#fff" ${CONTORNO}/>` },
  { id: 'arvore', partes: [{ id: 'copa', art: 'a', nome: 'copa' }, { id: 'tronco', art: 'o', nome: 'tronco' }],
    svg: `<rect class="parte" data-p="tronco" x="43" y="58" width="14" height="36" fill="#fff" ${CONTORNO}/><circle class="parte" data-p="copa" cx="50" cy="38" r="27" fill="#fff" ${CONTORNO}/>` },
  { id: 'peixe', partes: [{ id: 'peixe', art: 'o', nome: 'peixe' }, { id: 'cauda', art: 'a', nome: 'cauda' }],
    svg: `<polygon class="parte" data-p="cauda" points="68,50 94,28 94,72" fill="#fff" ${CONTORNO}/><ellipse class="parte" data-p="peixe" cx="42" cy="50" rx="33" ry="22" fill="#fff" ${CONTORNO}/><circle cx="26" cy="44" r="3.4" fill="#2b3a55"/>` },
];
export const FRASES_PINTAR = CENAS.flatMap(c => c.partes).flatMap(p => TINTAS.map(t => `Pinta ${p.art} ${p.nome} de ${t.id}.`));

export function rondaPintar(jogo){
  const novo = jovem(jogo);
  const cena = pick(CENAS.filter(c => !!c.jovem === novo));
  const tintas = baralha(TINTAS.slice()).slice(0, novo ? 3 : 6);
  const nTarefas = Math.min(cena.partes.length, novo ? 1 : 2);
  const partes = baralha(cena.partes.slice()).slice(0, nTarefas);
  const tarefas = partes.map(p => ({ parte: p, tinta: pick(tintas) }));
  const frase = t => `Pinta ${t.parte.art} ${t.parte.nome} de ${t.tinta.id}.`;
  if(!temClips(jogo, tarefas.map(frase))) return false;
  jogo.ctx.raiz.innerHTML = `<div class="pintar-cena"><svg viewBox="0 0 100 100" role="img" aria-label="Desenho para pintar">${cena.svg}</svg>
    <div class="pintar-tintas">${tintas.map(t => `<button class="tinta" type="button" data-c="${t.id}" style="--c:${t.hex}" aria-label="${t.id}"></button>`).join('')}</div></div>`;
  const raiz = jogo.ctx.raiz, svg = raiz.querySelector('svg');
  const botoes = [...raiz.querySelectorAll('.tinta')];
  let escolhida = null, ti = 0;
  botoes.forEach(b => {
    const f = () => { if(jogo.aEsperar) return; escolhida = tintas.find(t => t.id === b.dataset.c); botoes.forEach(x => x.classList.toggle('on', x === b)); jogo.som('toque'); };
    b.addEventListener('click', f);
    jogo.limpezas.push(() => b.removeEventListener('click', f));
  });
  const diz = fim => { jogo.pose('apontar'); jogo.diz(frase(tarefas[ti]), () => { if(jogo.aDecorrer) jogo.pose('repouso'); if(fim) fim(); }); };
  diz();
  const pinta = (el, hex) => el.querySelectorAll ? [el, ...el.querySelectorAll('*')].forEach(x => x.setAttribute('fill', hex)) : el.setAttribute('fill', hex);
  svg.querySelectorAll('.parte').forEach(p => {
    const f = () => {
      if(jogo.aEsperar) return;
      if(!escolhida){ raiz.querySelector('.pintar-tintas').classList.add('chama'); jogo.espera(() => raiz.querySelector('.pintar-tintas').classList.remove('chama'), 900); return; }
      const t = tarefas[ti];
      const certo = p.dataset.p === t.parte.id && escolhida.id === t.tinta.id;
      pinta(p, escolhida.hex);
      if(!certo){
        jogo.espera(() => { if(!p.dataset.feito) pinta(p, '#ffffff'); }, 700);
        jogo.responde(p, false, 'Pensa outra vez. Olha bem para a imagem.');
        return;
      }
      p.dataset.feito = '1';
      if(++ti >= tarefas.length) jogo.responde(p, true, [pick(BEM)], '#F5B921');
      else { jogo.som('pop'); jogo.espera(() => diz(), 500); }
    };
    p.addEventListener('click', f);
    jogo.limpezas.push(() => p.removeEventListener('click', f));
  });
}
