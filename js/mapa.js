import { BICHOS } from './bichos.js';

/* Cinco cantos da quinta, cem níveis cada. A dificuldade sobe ao longo dos
   500, não reinicia em cada mundo.

   Nota de desempenho: as medalhas são feitas em CSS, não em SVG. Cem
   medalhas com filtros SVG (sombra interior, luz, desfoque) seriam
   quatrocentos filtros numa página só, e isso engasga qualquer telemóvel.
   Um gradiente com box-shadow dá o mesmo barro e é acelerado pelo GPU. */

export const MUNDOS = [
  { id:'horta',      nome:'A Horta',       relva:['#B5DCA6','#7FBE78'], terra:'#C9A882',
    bichos:['coelho','borboleta'],  enfeites:['couve','flor'] },
  { id:'galinheiro', nome:'O Galinheiro',  relva:['#DCCFA8','#B9A878'], terra:'#B59A6A',
    bichos:['galinha','pato'],      enfeites:['milho','flor'] },
  { id:'pomar',      nome:'O Pomar',       relva:['#A8D9A0','#6FAE6C'], terra:'#B8824A',
    bichos:['passaro','abelha'],    enfeites:['arvore','flor'] },
  { id:'curral',     nome:'O Curral',      relva:['#CFDCA8','#9DB876'], terra:'#AD8A5A',
    bichos:['ovelha','coelho'],     enfeites:['feno','cerca'] },
  { id:'lago',       nome:'O Lago',        relva:['#A6D8CE','#6CB4A8'], terra:'#9AB0A8',
    bichos:['ra','pato'],           enfeites:['junco','nenufar'] },
];

export const POR_MUNDO = 100;
export const TOTAL_NIVEIS = MUNDOS.length * POR_MUNDO;

let TIPOS = ['cores', 'contar', 'formas', 'letras', 'memoria', 'logica'];
/* a idade da criança decide que jogos entram na rotação */
export function defineTipos(lista){ if(lista && lista.length) TIPOS = lista.slice(); }
export const COR_TIPO = { cores:'#D93A32', contar:'#4A90D9', formas:'#5BAF6A',
  letras:'#F3822B', memoria:'#8E6BC8', logica:'#2AA6A0', somas:'#C98F55' };

/* ---------------------------------------------------- curva de dificuldade */
/* dez degraus ao longo dos 500 níveis; cada um acrescenta alguma coisa */
const DEGRAUS = [
  /* 0 */ { opcoes:3, maxConta:3,  formas:2, paleta:4 },
  /* 1 */ { opcoes:3, maxConta:4,  formas:2, paleta:4 },
  /* 2 */ { opcoes:4, maxConta:5,  formas:3, paleta:4 },
  /* 3 */ { opcoes:4, maxConta:5,  formas:3, paleta:5 },
  /* 4 */ { opcoes:4, maxConta:6,  formas:4, paleta:5 },
  /* 5 */ { opcoes:5, maxConta:7,  formas:4, paleta:6 },
  /* 6 */ { opcoes:5, maxConta:8,  formas:5, paleta:6 },
  /* 7 */ { opcoes:5, maxConta:9,  formas:5, paleta:7 },
  /* 8 */ { opcoes:6, maxConta:10, formas:6, paleta:7 },
  /* 9 */ { opcoes:6, maxConta:10, formas:6, paleta:8 },
];

export function infoNivel(g){
  const degrau = Math.min(DEGRAUS.length - 1, Math.floor((g - 1) / 55));
  return {
    n: g,
    tipo: TIPOS[(g - 1) % TIPOS.length],
    mundo: Math.floor((g - 1) / POR_MUNDO),
    noMundo: ((g - 1) % POR_MUNDO) + 1,
    dificuldade: degrau,
    ...DEGRAUS[degrau],
  };
}

export const primeiroDoMundo = m => m * POR_MUNDO + 1;
export const ultimoDoMundo   = m => (m + 1) * POR_MUNDO;

/* ------------------------------------------------------------- geometria */
const ESPACO = 112;
const MARGEM = 140;

function posicao(noMundo){
  const i = noMundo - 1;
  return {
    x: 50 + Math.sin(i * .78) * 26 + Math.sin(i * .31) * 6,
    y: MARGEM + i * ESPACO,
  };
}
export const alturaMapa = () => MARGEM * 2 + (POR_MUNDO - 1) * ESPACO;

/* ----------------------------------------------------------- enfeites */
const ENFEITES = {
  couve:   c => `<svg viewBox="0 0 60 50"><ellipse cx="30" cy="44" rx="16" ry="4" fill="#2F4A1F" opacity=".2"/><g fill="${c}"><circle cx="30" cy="26" r="15"/><circle cx="18" cy="30" r="10"/><circle cx="42" cy="30" r="10"/></g><circle cx="26" cy="22" r="6" fill="#fff" opacity=".3"/></svg>`,
  flor:    c => `<svg viewBox="0 0 60 50"><g fill="${c}">${[0,72,144,216,288].map(a=>`<ellipse cx="30" cy="16" rx="6" ry="10" transform="rotate(${a} 30 26)"/>`).join('')}</g><circle cx="30" cy="26" r="5.5" fill="#F5C344"/><path d="M30 32v14" stroke="#5BAF6A" stroke-width="3" stroke-linecap="round"/></svg>`,
  milho:   () => `<svg viewBox="0 0 60 50"><ellipse cx="30" cy="46" rx="12" ry="3" fill="#2F4A1F" opacity=".2"/><path d="M30 46V14" stroke="#7FBE78" stroke-width="4" stroke-linecap="round"/><ellipse cx="30" cy="18" rx="8" ry="14" fill="#F5C344"/><path d="M22 20q8-10 16 0" stroke="#A8750C" stroke-width="1.6" fill="none" opacity=".5"/><path d="M30 28q-12-4-14-14 10 0 14 10z" fill="#7FBE78"/></svg>`,
  arvore:  c => `<svg viewBox="0 0 70 70"><ellipse cx="35" cy="64" rx="20" ry="5" fill="#2F4A1F" opacity=".2"/><path d="M31 64V38h8v26z" fill="#8A5A28"/><circle cx="35" cy="28" r="20" fill="${c}"/><circle cx="20" cy="36" r="13" fill="${c}"/><circle cx="50" cy="36" r="13" fill="${c}"/><circle cx="28" cy="20" r="8" fill="#fff" opacity=".22"/><circle cx="26" cy="32" r="4" fill="#D93A32"/><circle cx="46" cy="28" r="4" fill="#D93A32"/></svg>`,
  feno:    () => `<svg viewBox="0 0 70 50"><ellipse cx="35" cy="46" rx="22" ry="4" fill="#2F4A1F" opacity=".2"/><circle cx="35" cy="28" r="18" fill="#E8C57A"/><circle cx="35" cy="28" r="18" fill="none" stroke="#C49A4A" stroke-width="2" opacity=".6"/><path d="M20 22q15 6 30 0M19 32q16 6 32 0" stroke="#C49A4A" stroke-width="2" fill="none" opacity=".7"/></svg>`,
  cerca:   () => `<svg viewBox="0 0 80 50"><g fill="#C98F55">${[8,30,52].map(x=>`<rect x="${x}" y="12" width="9" height="34" rx="4"/>`).join('')}<rect x="4" y="20" width="62" height="6" rx="3"/><rect x="4" y="32" width="62" height="6" rx="3"/></g></svg>`,
  junco:   () => `<svg viewBox="0 0 50 60"><path d="M18 58V22M30 58V14M24 58V30" stroke="#6FAE6C" stroke-width="3.5" stroke-linecap="round" fill="none"/><rect x="27" y="8" width="6" height="14" rx="3" fill="#8A5A28"/><rect x="15" y="16" width="6" height="12" rx="3" fill="#8A5A28"/></svg>`,
  nenufar: c => `<svg viewBox="0 0 60 40"><ellipse cx="30" cy="24" rx="22" ry="12" fill="#5BAF6A"/><path d="M30 24 42 16" stroke="#3E8A4C" stroke-width="2.4"/><circle cx="26" cy="20" r="6" fill="${c}"/><circle cx="26" cy="20" r="2.5" fill="#F5C344"/></svg>`,
};

/* ---------------------------------------------------------------- desenho */
export function desenhaMapa(raiz, estado, amigos, mundo){
  const m = MUNDOS[mundo];
  const base = primeiroDoMundo(mundo);
  const partes = [];

  /* caminho: pedrinhas, duas por intervalo, para não encher o ecrã de nós */
  for(let i = 1; i < POR_MUNDO; i++){
    const a = posicao(i), b = posicao(i + 1);
    const aceso = base + i - 1 < estado.nivel;
    for(let k = 1; k <= 2; k++){
      const t = k / 3;
      partes.push(`<i class="pedra${aceso ? ' acesa' : ''}" style="left:${
        a.x + (b.x - a.x) * t}%;bottom:${a.y + (b.y - a.y) * t}px"></i>`);
    }
  }

  /* enfeites ao longo do caminho, sempre do lado contrário à curva */
  for(let i = 3; i <= POR_MUNDO; i += 4){
    const p = posicao(i);
    const nome = m.enfeites[(i / 4 | 0) % m.enfeites.length];
    const cor = ['#D93A32', '#F5C344', '#9B7FD4', '#fff', '#E8873C'][i % 5];
    const lado = p.x > 50 ? p.x - 32 : p.x + 32;
    partes.push(`<i class="enfeite" style="left:${lado}%;bottom:${p.y + 22}px;
      transform:translate(-50%,50%) rotate(${(i * 29) % 16 - 8}deg)">${
      (ENFEITES[nome] || ENFEITES.flor)(cor)}</i>`);
  }

  /* animais a passear: poucos, mas vivos */
  for(let i = 6; i <= POR_MUNDO; i += 11){
    const p = posicao(i);
    const bicho = m.bichos[(i / 11 | 0) % m.bichos.length];
    const voa = bicho === 'borboleta' || bicho === 'abelha' || bicho === 'passaro';
    partes.push(`<i class="bicho-anda ${voa ? 'voa' : ''}" style="
      bottom:${p.y + (voa ? 70 : 10)}px;
      animation-duration:${18 + (i % 7) * 3}s;animation-delay:${-(i % 11) * 2}s">
      <i class="bicho-corpo">${BICHOS[bicho]()}</i></i>`);
  }

  /* níveis */
  for(let i = 1; i <= POR_MUNDO; i++){
    const g = base + i - 1;
    const p = posicao(i);
    const info = infoNivel(g);
    const est = g < estado.nivel ? 'feito' : g === estado.nivel ? 'atual' : 'fechado';
    const estrelas = estado.estrelas[g] || 0;
    partes.push(
      `<button class="nivel ${est}" style="left:${p.x}%;bottom:${p.y}px"
          data-nivel="${g}" ${est === 'fechado' ? 'disabled' : ''}
          aria-label="Nível ${i}${est === 'fechado' ? ', fechado' : ''}">
        <span class="disco">${est === 'fechado'
          ? '<span class="cadeado"></span>'
          : `<span class="numero">${i}</span>`}</span>
        ${est === 'feito' ? `<span class="estrelinhas">${
          [0,1,2].map(k => `<i class="${k < estrelas ? 'cheia' : ''}"></i>`).join('')}</span>` : ''}
        <span class="marca" style="background:${COR_TIPO[info.tipo]}"></span>
      </button>`);
  }

  /* amigos: só avatar e nível, nunca nome */
  const porNivel = {};
  for(const a of amigos){
    if(a.nivel < base || a.nivel > ultimoDoMundo(mundo)) continue;
    (porNivel[a.nivel] = porNivel[a.nivel] || []).push(a);
  }
  for(const [g, lista] of Object.entries(porNivel)){
    const p = posicao(+g - base + 1);
    lista.forEach((a, k) => {
      const lado = p.x > 50 ? -1 : 1;
      partes.push(`<i class="amigo" style="left:${p.x + lado * (16 + k * 9)}%;bottom:${p.y + 6 + k * 14}px"
        title="Um amigo está neste nível"><span class="disco-amigo" style="--c:${a.cor}"></span></i>`);
    });
  }

  /* a criança */
  if(estado.nivel >= base && estado.nivel <= ultimoDoMundo(mundo)){
    const p = posicao(estado.nivel - base + 1);
    partes.push(`<i class="eu" style="left:${p.x}%;bottom:${p.y + 52}px">
      <span class="disco-eu"></span><span class="eu-seta"></span></i>`);
  }

  raiz.style.setProperty('--relva-a', m.relva[0]);
  raiz.style.setProperty('--relva-b', m.relva[1]);
  raiz.style.setProperty('--terra', m.terra);
  raiz.style.height = alturaMapa() + 'px';
  raiz.innerHTML = partes.join('');
}

export function scrollParaNivel(caixa, raiz, g, mundo, suave){
  const i = g - primeiroDoMundo(mundo) + 1;
  const p = posicao(Math.max(1, Math.min(POR_MUNDO, i)));
  const alvo = alturaMapa() - p.y - caixa.clientHeight * .55;
  caixa.scrollTo({ top:Math.max(0, alvo), behavior:suave ? 'smooth' : 'auto' });
}

export const mundoDoNivel = g => Math.floor((g - 1) / POR_MUNDO);
