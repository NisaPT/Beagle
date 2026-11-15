/* A Minha Quinta: catálogo (edifícios e animais), arte dos edifícios e
   desenho do ecrã da quinta e da loja. A lógica de compra fica no app.js.

   Os edifícios são desenhados em SVG simples (gradientes, sem filtros, para
   correr bem em telemóveis fracos). Os animais usam os mesmos desenhos dos jogos. */
import { tom } from './arte.js';

/* ------------------------------------------------------------- catálogo */
/* preço em estrelas; 'bichos' = animais que vivem neste edifício */
export const EDIFICIOS = [
  { id:'casa',       nome:'Casa de Campo', art:'a', preco:5,  bichos:['cao','gato'] },
  { id:'horta',      nome:'Horta',         art:'a', preco:10, bichos:['coelho'] },
  { id:'galinheiro', nome:'Galinheiro',    art:'o', preco:12, bichos:['galo'] },
  { id:'pocilga',    nome:'Pocilga',       art:'a', preco:16, bichos:['porco'] },
  { id:'redil',      nome:'Redil',         art:'o', preco:16, bichos:['ovelha'] },
  { id:'vacaria',    nome:'Vacaria',       art:'a', preco:20, bichos:['vaca'] },
  { id:'lago',       nome:'Lago',          art:'o', preco:20, bichos:['pato','ra','tartaruga'] },
  { id:'pomar',      nome:'Pomar',         art:'o', preco:25, bichos:[] },
  { id:'estabulo',   nome:'Estábulo',      art:'o', preco:25, bichos:['cavalo'] },
  { id:'celeiro',    nome:'Celeiro',       art:'o', preco:30, bichos:[] },
  { id:'estufa',     nome:'Estufa',        art:'a', preco:30, bichos:[] },
  { id:'moinho',     nome:'Moinho',        art:'o', preco:40, bichos:[] },
];

/* som: o que o avô diz quando se toca no animal */
export const BICHOS = [
  { id:'galo',      nome:'Galo',      art:'o', preco:4,  max:4, casa:'galinheiro', som:'Cocorocó!' },
  { id:'coelho',    nome:'Coelho',    art:'o', preco:4,  max:4, casa:'horta',      som:'Que fofinho!' },
  { id:'cao',       nome:'Cão',       art:'o', preco:6,  max:2, casa:'casa',       som:'Au au!' },
  { id:'gato',      nome:'Gato',      art:'o', preco:6,  max:2, casa:'casa',       som:'Miau!' },
  { id:'pato',      nome:'Pato',      art:'o', preco:6,  max:4, casa:'lago',       som:'Quá quá!' },
  { id:'ra',        nome:'Rã',        art:'a', preco:4,  max:3, casa:'lago',       som:'Croac croac!' },
  { id:'tartaruga', nome:'Tartaruga', art:'a', preco:6,  max:2, casa:'lago',       som:'Devagarinho!' },
  { id:'ovelha',    nome:'Ovelha',    art:'a', preco:8,  max:4, casa:'redil',      som:'Mé mé!' },
  { id:'porco',     nome:'Porco',     art:'o', preco:10, max:3, casa:'pocilga',    som:'Oinc oinc!' },
  { id:'vaca',      nome:'Vaca',      art:'a', preco:12, max:3, casa:'vacaria',    som:'Muuu!' },
  { id:'cavalo',    nome:'Cavalo',    art:'o', preco:16, max:2, casa:'estabulo',   som:'Iiii-i-i!' },
];

/* personagens que se compram na loja: aparecem a festejar de 10 em 10 níveis.
   O ficheiro 3D (com esqueleto) fica em ./modelos/<id>.glb */
export const PERSONAGENS = [
  { id:'menino', nome:'Menino Beagle', art:'o', preco:150 },
  { id:'menina', nome:'Menina Beagle', art:'a', preco:150 },
];

export const achaEdificio = id => EDIFICIOS.find(e => e.id === id);
export const achaBicho = id => BICHOS.find(b => b.id === id);
export const achaPersonagem = id => PERSONAGENS.find(p => p.id === id);
export const achaItem = id => achaEdificio(id) || achaBicho(id) || achaPersonagem(id);
export const precoDe = id => (achaItem(id) || { preco:0 }).preco;

/* quanto já se gastou: vem sempre do catálogo, por isso a fusão entre
   aparelhos (máximo de cada item) nunca estraga as contas */
export function gastoTotal(itens){
  let t = 0;
  for(const [id, n] of Object.entries(itens || {})) t += precoDe(id) * (n || 0);
  return t;
}
export const contaEdificios = itens => EDIFICIOS.filter(e => (itens || {})[e.id]).length;
export const contaBichos = itens => BICHOS.reduce((a, b) => a + ((itens || {})[b.id] || 0), 0);

/* ----------------------------------------------------------------- arte */
let n = 0;
const U = () => 'q' + (++n);
const G = (id, c, k1 = .2, k2 = -.2) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tom(c, k1)}"/><stop offset="1" stop-color="${tom(c, k2)}"/></linearGradient>`;
const sombra = (cx = 100, cy = 130, rx = 72) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="9" fill="#3a2410" opacity=".18"/>`;
const tel = (id, cor, d, extra = '') => `<path d="${d}" fill="url(#${id})" stroke="${cor}" stroke-width="7" stroke-linejoin="round" ${extra}/>`;
const img = (nome, x, y, w) => `<image href="./media/img/${nome}.webp" x="${x}" y="${y}" width="${w}" height="${w}" preserveAspectRatio="xMidYMid meet"/>`;

const ARTE = {
  casa(p){ return `<defs>${G(p+'p','#FFF1DC',.1,-.08)}${G(p+'t','#D9503C')}${G(p+'d','#C98F55')}</defs>
    ${sombra()}
    <rect x="124" y="26" width="18" height="34" rx="3" fill="#B5543A"/><rect x="121" y="22" width="24" height="8" rx="3" fill="#8A3E2A"/>
    <g class="fumo"><circle cx="133" cy="14" r="6" fill="#fff" opacity=".7"/><circle cx="139" cy="5" r="5" fill="#fff" opacity=".5"/></g>
    <rect x="38" y="68" width="124" height="60" rx="7" fill="url(#${p}p)"/>
    ${tel(p+'t','#C0402C','M30 74 L100 22 L170 74 Z')}
    <rect x="87" y="92" width="27" height="36" rx="13" fill="url(#${p}d)"/><circle cx="108" cy="111" r="2.4" fill="#F5C344"/>
    <rect x="48" y="86" width="26" height="22" rx="5" fill="#BFE3F2"/><path d="M61 86v22M48 97h26" stroke="#fff" stroke-width="3"/>
    <rect x="128" y="86" width="26" height="22" rx="5" fill="#BFE3F2"/><path d="M141 86v22M128 97h26" stroke="#fff" stroke-width="3"/>
    <rect x="46" y="108" width="30" height="8" rx="3" fill="#8A5A28"/><circle cx="53" cy="106" r="3.2" fill="#F26B8A"/><circle cx="61" cy="105" r="3.2" fill="#F5C344"/><circle cx="69" cy="106" r="3.2" fill="#F26B8A"/>
    <rect x="126" y="108" width="30" height="8" rx="3" fill="#8A5A28"/><circle cx="133" cy="106" r="3.2" fill="#fff"/><circle cx="141" cy="105" r="3.2" fill="#F26B8A"/><circle cx="149" cy="106" r="3.2" fill="#F5C344"/>`; },

  horta(p){ return `<defs>${G(p+'s','#8A5A32')}</defs>
    ${sombra(100,132,80)}
    <rect x="20" y="74" width="160" height="56" rx="10" fill="#B88555"/>
    <rect x="26" y="80" width="148" height="44" rx="8" fill="url(#${p}s)"/>
    <path d="M26 96h148M26 110h148" stroke="#6F4624" stroke-width="2" opacity=".5"/>
    ${img('cenoura',34,62,32)}${img('alface',74,60,34)}${img('couve',118,60,34)}${img('tomate',150,64,26)}
    ${img('alface',38,90,30)}${img('cenoura',80,88,30)}${img('tomate',116,90,28)}${img('couve',146,88,30)}
    <rect x="96" y="22" width="8" height="52" rx="3" fill="#8A5A28"/><rect x="78" y="34" width="44" height="7" rx="3" fill="#8A5A28"/>
    <circle cx="100" cy="24" r="10" fill="#F2D49B"/><path d="M86 20 L100 6 L114 20 Z" fill="#D9503C"/><circle cx="96" cy="24" r="1.6" fill="#5A3C20"/><circle cx="104" cy="24" r="1.6" fill="#5A3C20"/>`; },

  galinheiro(p){ return `<defs>${G(p+'w','#D9503C')}${G(p+'r','#C98F55')}</defs>
    ${sombra(100,130,66)}
    <path d="M150 124 L178 124 L170 108 Z" fill="#E8C196"/>
    <rect x="46" y="76" width="108" height="52" rx="7" fill="url(#${p}w)"/>
    ${tel(p+'r','#A8672F','M38 82 L100 42 L162 82 Z')}
    <circle cx="100" cy="104" r="13" fill="#4A2E14"/><circle cx="100" cy="104" r="13" fill="none" stroke="#F5C344" stroke-width="3"/>
    <rect x="56" y="92" width="22" height="16" rx="4" fill="#FFF1DC"/><path d="M67 92v16" stroke="#C98F55" stroke-width="2"/>
    <path d="M130 128 L152 110" stroke="#8A5A28" stroke-width="9" stroke-linecap="round"/>
    <path d="M44 126 q8 -10 16 0 q8 -10 16 0" stroke="#F5C344" stroke-width="5" fill="none" stroke-linecap="round"/>`; },

  pocilga(p){ return `<defs>${G(p+'w','#C98F55')}${G(p+'r','#8A5A28')}</defs>
    ${sombra(100,130,72)}
    <rect x="42" y="78" width="116" height="50" rx="7" fill="url(#${p}w)"/>
    <path d="M62 78v50M84 78v50M116 78v50M138 78v50" stroke="#8A5A28" stroke-width="2" opacity=".4"/>
    ${tel(p+'r','#7A4E22','M32 84 L100 50 L168 84 Z')}
    <path d="M78 128v-26a22 22 0 0 1 44 0v26z" fill="#4A2E14"/>
    <ellipse cx="100" cy="136" rx="44" ry="8" fill="#8A6038"/><ellipse cx="94" cy="134" rx="22" ry="4" fill="#A67A4A"/>`; },

  redil(p){ return `<defs>${G(p+'g','#8FCB85',.1,-.12)}${G(p+'r','#C98F55')}</defs>
    <ellipse cx="100" cy="106" rx="88" ry="38" fill="url(#${p}g)"/>
    <rect x="132" y="50" width="42" height="34" rx="5" fill="#E8C196"/>${tel(p+'r','#8A5A28','M126 54 L153 34 L180 54 Z')}
    <path d="M20 100 h156" stroke="#8A5A28" stroke-width="5" stroke-linecap="round"/><path d="M20 114 h156" stroke="#8A5A28" stroke-width="5" stroke-linecap="round"/>
    <g fill="#A8672F"><rect x="18" y="90" width="7" height="34" rx="3"/><rect x="52" y="90" width="7" height="34" rx="3"/><rect x="86" y="90" width="7" height="34" rx="3"/><rect x="120" y="90" width="7" height="34" rx="3"/><rect x="154" y="90" width="7" height="34" rx="3"/><rect x="172" y="90" width="7" height="34" rx="3"/></g>`; },

  vacaria(p){ return `<defs>${G(p+'w','#FFF1DC',.1,-.1)}${G(p+'r','#5BAF6A')}</defs>
    ${sombra(100,130,80)}
    <rect x="28" y="70" width="144" height="58" rx="7" fill="url(#${p}w)"/>
    ${tel(p+'r','#3F8C50','M20 76 L100 28 L180 76 Z')}
    <rect x="72" y="90" width="56" height="38" rx="12" fill="#4A2E14"/><path d="M100 90v38" stroke="#C98F55" stroke-width="4"/>
    <circle cx="100" cy="58" r="12" fill="#fff"/><circle cx="95" cy="55" r="3.5" fill="#2b2b2b"/><circle cx="105" cy="62" r="3" fill="#2b2b2b"/>
    <rect x="38" y="88" width="24" height="18" rx="4" fill="#BFE3F2"/><rect x="138" y="88" width="24" height="18" rx="4" fill="#BFE3F2"/>`; },

  lago(p){ return `<defs><radialGradient id="${p}a" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#BFE9F5"/><stop offset="1" stop-color="#5DA9CC"/></radialGradient></defs>
    <ellipse cx="100" cy="106" rx="92" ry="42" fill="#B58A58"/>
    <ellipse cx="100" cy="102" rx="86" ry="38" fill="url(#${p}a)"/>
    <ellipse cx="100" cy="102" rx="60" ry="24" fill="none" stroke="#fff" stroke-width="2" opacity=".55" class="onda"/>
    <ellipse cx="62" cy="96" rx="12" ry="5" fill="#5BAF6A"/><circle cx="62" cy="93" r="3.4" fill="#F26B8A"/>
    <ellipse cx="146" cy="112" rx="11" ry="4.5" fill="#5BAF6A"/><circle cx="146" cy="110" r="3" fill="#fff"/>
    <path d="M22 96 q-3 -26 4 -36 M30 98 q2 -22 8 -30" stroke="#6FA34A" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="26" cy="60" r="4" fill="#8A5A28"/><circle cx="38" cy="68" r="3.4" fill="#8A5A28"/>`; },

  pomar(p){ return `<defs>${G(p+'f','#5BAF6A',.25,-.15)}${G(p+'t','#8A5A28')}</defs>
    ${sombra(100,132,84)}
    <rect x="48" y="78" width="12" height="52" rx="4" fill="url(#${p}t)"/><circle cx="54" cy="64" r="30" fill="url(#${p}f)"/><circle cx="36" cy="78" r="20" fill="url(#${p}f)"/><circle cx="74" cy="76" r="20" fill="url(#${p}f)"/>
    <rect x="140" y="82" width="12" height="48" rx="4" fill="url(#${p}t)"/><circle cx="146" cy="68" r="28" fill="url(#${p}f)"/><circle cx="130" cy="82" r="18" fill="url(#${p}f)"/><circle cx="164" cy="80" r="18" fill="url(#${p}f)"/>
    ${[[44,56],[62,70],[34,82],[76,80],[56,48]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5.4" fill="#E0162B"/><circle cx="${x-1.5}" cy="${y-1.8}" r="1.6" fill="#fff" opacity=".7"/>`).join('')}
    ${[[140,60],[156,74],[128,84],[166,86],[148,52]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5.4" fill="#F3822B"/><circle cx="${x-1.5}" cy="${y-1.8}" r="1.6" fill="#fff" opacity=".7"/>`).join('')}
    <ellipse cx="100" cy="124" rx="16" ry="5" fill="#E8C196"/>${img('maca',92,112,16)}`; },

  estabulo(p){ return `<defs>${G(p+'w','#A8672F')}${G(p+'r','#7A2E22')}</defs>
    ${sombra(100,130,74)}
    <rect x="36" y="70" width="128" height="58" rx="7" fill="url(#${p}w)"/>
    ${tel(p+'r','#6A261C','M26 76 L100 30 L174 76 Z')}
    <rect x="58" y="88" width="38" height="40" rx="5" fill="#E8C196"/><path d="M58 88l38 40M96 88l-38 40" stroke="#8A5A28" stroke-width="4"/>
    <rect x="104" y="88" width="38" height="40" rx="5" fill="#E8C196"/><path d="M104 88l38 40M142 88l-38 40" stroke="#8A5A28" stroke-width="4"/>
    <path d="M90 62 a10 10 0 1 1 20 0" fill="none" stroke="#F5C344" stroke-width="5" stroke-linecap="round"/>`; },

  celeiro(p){ return `<defs>${G(p+'w','#D9503C')}${G(p+'r','#9C2F26')}</defs>
    ${sombra(100,131,82)}
    <rect x="30" y="62" width="140" height="66" rx="7" fill="url(#${p}w)"/>
    ${tel(p+'r','#8A2820','M22 66 L46 30 L154 30 L178 66 Z')}
    <rect x="76" y="82" width="48" height="46" rx="4" fill="#FFF1DC"/><path d="M76 82l48 46M124 82l-48 46M100 82v46" stroke="#D9503C" stroke-width="4"/>
    <rect x="88" y="42" width="24" height="16" rx="3" fill="#F2D49B"/>
    <rect x="132" y="108" width="26" height="20" rx="4" fill="#F5C344"/><path d="M132 118h26" stroke="#C99A1E" stroke-width="2"/>
    <rect x="42" y="110" width="22" height="18" rx="4" fill="#F5C344"/><path d="M42 119h22" stroke="#C99A1E" stroke-width="2"/>`; },

  estufa(p){ return `<defs>${G(p+'b','#FFFFFF',0,-.12)}</defs>
    ${sombra(100,131,78)}
    <path d="M36 128 V80 Q100 8 164 80 V128 Z" fill="#CBEFF7" opacity=".85"/>
    <path d="M36 128 V80 Q100 8 164 80 V128 Z" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>
    <path d="M68 128 V54 M100 128 V20 M132 128 V54 M36 104 H164" stroke="#fff" stroke-width="3.5" opacity=".9"/>
    <rect x="30" y="122" width="140" height="10" rx="4" fill="url(#${p}b)"/>
    ${img('tomate',46,92,28)}${img('pepino',84,96,28)}${img('tomate',122,92,28)}${img('alface',88,66,26)}`; },

  moinho(p){ return `<defs>${G(p+'t','#F2D49B',.1,-.14)}${G(p+'r','#D9503C')}</defs>
    ${sombra(100,131,56)}
    <path d="M70 128 L82 56 L118 56 L130 128 Z" fill="url(#${p}t)"/>
    ${tel(p+'r','#B5392E','M76 58 L100 30 L124 58 Z')}
    <rect x="90" y="98" width="20" height="30" rx="9" fill="#8A5A28"/><rect x="92" y="70" width="16" height="14" rx="4" fill="#BFE3F2"/>
    <g class="pas"><g stroke="#8A5A28" stroke-width="5" stroke-linecap="round"><path d="M100 56 L100 6M100 56 L100 106M100 56 L50 56M100 56 L150 56"/></g>
      <g fill="#FFF1DC" stroke="#C98F55" stroke-width="2"><rect x="94" y="8" width="12" height="24" rx="2"/><rect x="94" y="80" width="12" height="24" rx="2"/><rect x="52" y="50" width="24" height="12" rx="2"/><rect x="124" y="50" width="24" height="12" rx="2"/></g>
      <circle cx="100" cy="56" r="6" fill="#8A5A28"/></g>`; },
};

export function arteEdificio(id){
  const p = U();
  const f = ARTE[id];
  if(!f) return '';
  return `<svg class="edificio-svg" viewBox="0 0 200 150" aria-hidden="true">${f(p)}</svg>`;
}

/* ----------------------------------------------------- posições (lote) */
/* cada animal tem um sítio certo no lote, em % da largura/altura */
const CHAO = {
  lago:      [[24,60],[52,72],[72,58],[38,78],[60,50],[84,74]],
  default:   [[15,86],[37,92],[59,87],[81,93],[26,95],[70,96],[48,84],[90,86]],
};
const tamanhoBicho = id => ({ cavalo:.30, vaca:.30, porco:.26, ovelha:.26, tartaruga:.2, ra:.17, galo:.2, coelho:.19, gato:.2, cao:.22, pato:.2 }[id] || .22);

/* ------------------------------------------------------------ o ecrã */
export function desenhaQuinta(raiz, itens, novo){
  raiz.innerHTML = EDIFICIOS.map(e => {
    const tem = !!itens[e.id];
    if(!tem){
      return `<button class="lote vazio" data-ed="${e.id}" aria-label="${e.nome}: ${e.preco} estrelas. Abrir a loja">
        <span class="lote-arte fantasma">${arteEdificio(e.id)}</span>
        <span class="placa"><span class="placa-nome">${e.nome}</span><span class="placa-preco">⭐ ${e.preco}</span></span>
      </button>`;
    }
    const bichos = [];
    for(const b of BICHOS.filter(b => b.casa === e.id)){
      for(let i = 0; i < (itens[b.id] || 0); i++) bichos.push(b);
    }
    const pos = CHAO[e.id] || CHAO.default;
    const animais = bichos.map((b, i) => {
      const [x, y] = pos[i % pos.length];
      const w = tamanhoBicho(b.id) * 100;
      return `<button class="bicho" data-b="${b.id}" style="--x:${x}%;--y:${y}%;--w:${w}%;--d:${(2.4 + (i * 0.7) % 2).toFixed(1)}s;--a:${(i * -.8).toFixed(1)}s;--z:${Math.round(y)}" aria-label="${b.nome}">
        <img src="./media/img/${b.id}.webp" alt="" draggable="false"></button>`;
    }).join('');
    return `<div class="lote ${novo === e.id ? 'novo' : ''}" data-ed="${e.id}">
      <button class="lote-arte" data-edificio="${e.id}" aria-label="${e.nome}">${arteEdificio(e.id)}</button>
      ${animais}
      <span class="lote-nome">${e.nome}</span>
    </div>`;
  }).join('');
}

/* ------------------------------------------------------------- a loja */
export function desenhaLoja(raiz, itens, saldo, aba){
  const lista = aba === 'bichos' ? BICHOS : aba === 'amigos' ? PERSONAGENS : EDIFICIOS;
  const cartas = lista.map(x => {
    const tem = itens[x.id] || 0;
    let estado = '', desligado = false, rotulo = '';
    if(aba === 'bichos'){
      const casa = achaEdificio(x.casa);
      if(!itens[x.casa]){ rotulo = `Precisa d${casa.art === 'a' ? 'a' : 'o'} ${casa.nome}`; desligado = true; estado = 'sem-casa'; }
      else if(tem >= x.max){ rotulo = 'Já tens todos'; desligado = true; estado = 'cheio'; }
      else if(saldo < x.preco){ rotulo = `Faltam ${x.preco - saldo} ⭐`; desligado = true; estado = 'pobre'; }
      else rotulo = 'Comprar';
    }else{
      if(tem){ rotulo = '✔ Já tens'; desligado = true; estado = 'tem'; }
      else if(saldo < x.preco){ rotulo = `Faltam ${x.preco - saldo} ⭐`; desligado = true; estado = 'pobre'; }
      else rotulo = 'Comprar';
    }
    const miniatura = (aba === 'bichos' || aba === 'amigos')
      ? `<img src="./media/img/${x.id}.webp" alt="" draggable="false">`
      : arteEdificio(x.id);
    return `<div class="item-loja ${estado}" data-id="${x.id}">
      <div class="item-arte">${miniatura}</div>
      <div class="item-nome">${x.nome}${aba === 'bichos' ? `<small>${tem}/${x.max}</small>` : ''}</div>
      <div class="item-preco">⭐ ${x.preco}</div>
      <button class="botao pequeno comprar" data-comprar="${x.id}" ${desligado ? 'disabled' : ''}>${rotulo}</button>
    </div>`;
  }).join('');
  raiz.innerHTML = cartas;
}
