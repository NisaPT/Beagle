/* Ilustrações em barro.
   O que distingue barro de desenho plano não é a cor — é a ausência de
   contorno. Uma forma plana tem um traço escuro à volta. Uma de barro tem
   luz em cima à esquerda, sombra por dentro em baixo, um aro quase
   invisível a definir o limite, e uma sombra macia pousada no chão. */

let contaId = 0;
const uid = () => 'g' + (++contaId);

export function tom(hex, k){
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if(k > 0){ r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  else { r *= (1 + k); g *= (1 + k); b *= (1 + k); }
  const h = v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

/* gradiente + os dois filtros que fazem a massa */
function massa(id, cor){
  return `
  <radialGradient id="${id}g" cx="35%" cy="27%" r="76%">
    <stop offset="0%"   stop-color="${tom(cor, .3)}"/>
    <stop offset="40%"  stop-color="${cor}"/>
    <stop offset="100%" stop-color="${tom(cor, -.44)}"/>
  </radialGradient>
  <filter id="${id}d" x="-45%" y="-45%" width="190%" height="190%">
    <feOffset dy="8"/><feGaussianBlur stdDeviation="7" result="o"/>
    <feComposite operator="out" in="SourceGraphic" in2="o" result="inv"/>
    <feFlood flood-color="#2e1703" flood-opacity=".38"/>
    <feComposite operator="in" in2="inv"/><feComposite operator="over" in2="SourceGraphic"/>
  </filter>
  <filter id="${id}c" x="-45%" y="-45%" width="190%" height="190%">
    <feOffset dy="-4"/><feGaussianBlur stdDeviation="4" result="o"/>
    <feComposite operator="out" in="SourceGraphic" in2="o" result="inv"/>
    <feFlood flood-color="#ffffff" flood-opacity=".3"/>
    <feComposite operator="in" in2="inv"/><feComposite operator="over" in2="SourceGraphic"/>
  </filter>
  <filter id="${id}b" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="5"/>
  </filter>`;
}

function pecaBarro(id, cor, d, brilho){
  return `
    <g filter="url(#${id}c)"><g filter="url(#${id}d)">
      <path d="${d}" fill="url(#${id}g)"/>
    </g></g>
    <path d="${d}" fill="none" stroke="${tom(cor, -.5)}" stroke-width="1.6" opacity=".4"/>
    ${brilho ? `<ellipse ${brilho} fill="#fff" opacity=".34" filter="url(#${id}b)"/>` : ''}`;
}

const chao = (cy, rx) =>
  `<ellipse cx="60" cy="${cy}" rx="${rx}" ry="${rx * .2}" fill="#2F4A1F" opacity=".18"/>`;

/* ---------------------------------------------------------------- balão */
export function balao(cor){
  const id = uid();
  return `<svg viewBox="0 0 120 150" class="arte arte-balao">
    <defs>${massa(id, cor)}</defs>
    <path d="M60 128c7 7-7 16 0 22" stroke="${tom(cor, -.5)}" stroke-width="2.6"
          fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M60 116c0 0-6-6-6-9s6-5 6-5 6 2 6 5-6 9-6 9z" fill="${tom(cor, -.38)}"/>
    ${pecaBarro(id, cor, 'M60 8c25 0 44 22 44 50s-19 54-44 54-44-26-44-54 19-50 44-50z',
      'cx="42" cy="36" rx="14" ry="11" transform="rotate(-28 42 36)"')}
  </svg>`;
}

/* ----------------------------------------------------------------- flor */
export function flor(cor){
  const id = uid();
  const petalas = Array.from({length:6}, (_, i) =>
    `<ellipse cx="60" cy="27" rx="15" ry="22" transform="rotate(${i * 60} 60 57)"/>`).join('');
  return `<svg viewBox="0 0 120 126" class="arte arte-flor">
    <defs>${massa(id, cor)}
      <radialGradient id="${id}m" cx="36%" cy="28%" r="75%">
        <stop offset="0%" stop-color="#FFE9A8"/><stop offset="55%" stop-color="#F5C344"/>
        <stop offset="100%" stop-color="#B5820A"/>
      </radialGradient>
    </defs>
    ${chao(116, 32)}
    <g filter="url(#${id}c)"><g filter="url(#${id}d)">
      <g fill="url(#${id}g)">${petalas}</g>
    </g></g>
    <g filter="url(#${id}d)"><circle cx="60" cy="57" r="16" fill="url(#${id}m)"/></g>
    <ellipse cx="54" cy="50" rx="6" ry="4.5" fill="#fff" opacity=".45" filter="url(#${id}b)"/>
  </svg>`;
}

/* -------------------------------------------------------------- biscoito */
/* o osso é 4 bolas e uma barra; desenha-se a silhueta primeiro com traço
   grosso para as unir, e só depois se preenche com a massa */
export function biscoito(){
  const id = uid(), cor = '#E8B873';
  const pecas = `
    <circle cx="26" cy="22" r="15"/><circle cx="26" cy="46" r="15"/>
    <circle cx="94" cy="22" r="15"/><circle cx="94" cy="46" r="15"/>
    <rect x="24" y="20" width="72" height="28" rx="14"/>`;
  return `<svg viewBox="0 0 120 72" class="arte arte-biscoito">
    <defs>
      <radialGradient id="${id}g" gradientUnits="userSpaceOnUse" cx="38" cy="16" r="92">
        <stop offset="0%" stop-color="${tom(cor, .4)}"/>
        <stop offset="42%" stop-color="${cor}"/>
        <stop offset="100%" stop-color="${tom(cor, -.42)}"/>
      </radialGradient>
      <filter id="${id}d" x="-30%" y="-30%" width="160%" height="160%">
        <feOffset dy="6"/><feGaussianBlur stdDeviation="6" result="o"/>
        <feComposite operator="out" in="SourceGraphic" in2="o" result="inv"/>
        <feFlood flood-color="#4A2A08" flood-opacity=".34"/>
        <feComposite operator="in" in2="inv"/><feComposite operator="over" in2="SourceGraphic"/>
      </filter>
    </defs>
    <ellipse cx="60" cy="66" rx="40" ry="5" fill="#2F4A1F" opacity=".16"/>
    <g fill="${tom(cor, -.5)}" stroke="${tom(cor, -.5)}" stroke-width="5" stroke-linejoin="round" opacity=".45">${pecas}</g>
    <g filter="url(#${id}d)"><g fill="url(#${id}g)">${pecas}</g></g>
    <g fill="${tom(cor, -.45)}" opacity=".38">
      <circle cx="48" cy="29" r="3"/><circle cx="66" cy="39" r="2.6"/><circle cx="76" cy="27" r="2.2"/>
    </g>
  </svg>`;
}

/* ------------------------------------------------- peças de encaixe */
export const FORMAS = {
  circulo:   { nome:'círculo',   artigo:'o', d:'M50 6a44 44 0 1 1 0 88 44 44 0 0 1 0-88z' },
  quadrado:  { nome:'quadrado',  artigo:'o', d:'M14 8h72a8 8 0 0 1 8 8v68a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8z' },
  triangulo: { nome:'triângulo', artigo:'o', d:'M50 8c3 0 6 2 7 4l36 68c3 5-1 11-7 11H14c-6 0-10-6-7-11L43 12c1-2 4-4 7-4z' },
  estrela:   { nome:'estrela',   artigo:'a', d:'M50 6c2 0 4 1 5 3l9 19 21 3c5 1 7 7 3 10l-15 15 4 21c1 5-5 9-9 6l-18-10-18 10c-4 3-10-1-9-6l4-21-15-15c-4-3-2-9 3-10l21-3 9-19c1-2 3-3 5-3z' },
  coracao:   { nome:'coração',   artigo:'o', d:'M50 92C22 72 8 58 8 40A24 24 0 0 1 50 24 24 24 0 0 1 92 40c0 18-14 32-42 52z' },
  losango:   { nome:'losango',   artigo:'o', d:'M50 4c2 0 4 1 6 3l37 37c3 3 3 9 0 12L56 93c-3 3-9 3-12 0L7 56c-3-3-3-9 0-12L44 7c2-2 4-3 6-3z' },
};

export function peca(forma, cor){
  const id = uid(), f = FORMAS[forma];
  return `<svg viewBox="-8 -8 136 136" class="arte arte-peca">
    <defs>${massa(id, cor)}</defs>
    <ellipse cx="50" cy="104" rx="36" ry="7" fill="#2F4A1F" opacity=".16"/>
    ${pecaBarro(id, cor, f.d, 'cx="34" cy="30" rx="13" ry="9" transform="rotate(-28 34 30)"')}
  </svg>`;
}

/* buraco: a mesma forma, mas afundada na madeira */
export function buraco(forma){
  const id = uid(), f = FORMAS[forma];
  return `<svg viewBox="-8 -8 136 136" class="arte arte-buraco">
    <defs>
      <filter id="${id}h" x="-40%" y="-40%" width="180%" height="180%">
        <feOffset dy="5"/><feGaussianBlur stdDeviation="4" result="o"/>
        <feComposite operator="out" in="SourceGraphic" in2="o" result="inv"/>
        <feFlood flood-color="#ffffff" flood-opacity=".4"/>
        <feComposite operator="in" in2="inv"/><feComposite operator="over" in2="SourceGraphic"/>
      </filter>
      <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3A2208"/><stop offset="100%" stop-color="#6B4420"/>
      </linearGradient>
    </defs>
    <g filter="url(#${id}h)"><path d="${f.d}" fill="url(#${id}f)"/></g>
    <path d="${f.d}" fill="none" stroke="#2A1805" stroke-width="2" opacity=".5"/>
  </svg>`;
}

/* --------------------------------------------------- medalha do mapa */
export function azulejoNivel(numero, estado, estrelas){
  const id = uid();
  const cor = estado === 'feito' ? '#F5C344' : estado === 'atual' ? '#FFF6E6' : '#D6C3A8';
  const risco = estado === 'feito' ? '#8A5E08' : estado === 'atual' ? '#8A6A3A' : '#7D6A52';
  const d = 'M60 6a52 52 0 1 1 0 104 52 52 0 0 1 0-104z';
  const estrela = ganha => `<path d="M0-13l3.6 7.6 8.4 1.2-6 5.8 1.4 8.2L0 5.8l-7.4 3.9 1.4-8.2-6-5.8 8.4-1.2z"
      fill="${ganha ? '#FFD95E' : 'rgba(255,255,255,.45)'}"
      stroke="${ganha ? '#8A5E08' : 'rgba(125,106,82,.4)'}" stroke-width="2.4" stroke-linejoin="round"/>`;
  return `<svg viewBox="0 0 120 126" class="arte arte-azulejo">
    <defs>${massa(id, cor)}</defs>
    ${chao(118, 34)}
    ${pecaBarro(id, cor, d, 'cx="42" cy="32" rx="16" ry="11" transform="rotate(-28 42 32)"')}
    ${estado === 'bloqueado'
      ? `<path d="M60 36a11 11 0 0 1 11 11v6h2a4 4 0 0 1 4 4v15a4 4 0 0 1-4 4H47a4 4 0 0 1-4-4V57a4 4 0 0 1 4-4h2v-6a11 11 0 0 1 11-11zm0 7a4 4 0 0 0-4 4v6h8v-6a4 4 0 0 0-4-4z"
           fill="${risco}" opacity=".65"/>`
      : `<text x="60" y="${estado === 'feito' ? 50 : 57}" text-anchor="middle" dominant-baseline="central"
              font-family="'Baloo 2',Fredoka,sans-serif" font-weight="800" font-size="40"
              fill="${risco}" opacity=".9">${numero}</text>`}
    ${estado === 'feito'
      ? `<g transform="translate(60,84) scale(.55)">${[-26, 0, 26].map(x =>
          `<g transform="translate(${x},0)">${estrela(x / 26 + 1 < (estrelas || 0))}</g>`).join('')}</g>`
      : ''}
  </svg>`;
}

/* ---------------------------------------------------------------- avatares */
const SILHUETAS = {
  beagle:  'M33 30c-9 0-16 8-16 20 0 13 6 24 13 24 5 0 8-5 7-12-2-9-2-18 1-26 1-4-1-6-5-6z'
         + 'M67 30c9 0 16 8 16 20 0 13-6 24-13 24-5 0-8-5-7-12 2-9 2-18-1-26-1-4 1-6 5-6z'
         + 'M50 22c12 0 21 10 21 23 0 15-9 25-21 25s-21-10-21-25c0-13 9-23 21-23z'
         + 'M42 41a3.4 3.4 0 1 0 0 7 3.4 3.4 0 0 0 0-7z'
         + 'M58 41a3.4 3.4 0 1 0 0 7 3.4 3.4 0 0 0 0-7z'
         + 'M50 52c-6 0-9 3-9 6s4 6 9 6 9-3 9-6-3-6-9-6z',
  gato:    'M50 74c-14 0-24-9-24-20 0-6 3-12 7-16l-5-14c-1-3 2-5 4-3l12 8a26 26 0 0 1 12 0l12-8c2-2 5 0 4 3l-5 14c4 4 7 10 7 16 0 11-10 20-24 20zm-8-24a3.4 3.4 0 1 0 0-7 3.4 3.4 0 0 0 0 7zm16 0a3.4 3.4 0 1 0 0-7 3.4 3.4 0 0 0 0 7zm-8 6l-4 4h8z',
  coelho:  'M50 78c-12 0-21-8-21-17 0-7 5-13 12-16-4-7-7-16-7-22 0-5 6-6 8-1l6 15a22 22 0 0 1 4 0l6-15c2-5 8-4 8 1 0 6-3 15-7 22 7 3 12 9 12 16 0 9-9 17-21 17zm-7-20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-7 8c3 0 5-2 5-4h-10c0 2 2 4 5 4z',
  urso:    'M50 76c-15 0-25-9-25-20 0-5 2-9 5-13a11 11 0 1 1 13-13 27 27 0 0 1 14 0 11 11 0 1 1 13 13c3 4 5 8 5 13 0 11-10 20-25 20zm-9-23a3.4 3.4 0 1 0 0-7 3.4 3.4 0 0 0 0 7zm18 0a3.4 3.4 0 1 0 0-7 3.4 3.4 0 0 0 0 7zm-9 9a7 7 0 0 0 7-6H41a7 7 0 0 0 9 6z',
  passaro: 'M50 78c-13 0-23-9-23-20 0-12 10-22 23-22 4 0 8 1 11 3l12-7c3-2 6 1 4 4l-6 10c2 3 3 8 3 12 0 11-10 20-24 20zm-6-26a3.4 3.4 0 1 0 0-7 3.4 3.4 0 0 0 0 7zm-9 8l-9 3c-3 1-3 5 0 5l9-2z',
  raposa:  'M50 76c-14 0-24-9-24-19 0-6 3-11 7-15l-7-15c-1-3 2-5 5-3l13 8a25 25 0 0 1 12 0l13-8c3-2 6 0 5 3l-7 15c4 4 7 9 7 15 0 10-10 19-24 19zm-8-22a3.2 3.2 0 1 0 0-7 3.2 3.2 0 0 0 0 7zm16 0a3.2 3.2 0 1 0 0-7 3.2 3.2 0 0 0 0 7zm-8 8l-5 5h10z',
};
export const ANIMAIS = Object.keys(SILHUETAS).filter(a => a !== 'beagle');

export function avatar(animal, cor, tamanho){
  const id = uid();
  const d = SILHUETAS[animal] || SILHUETAS.gato;
  return `<svg viewBox="0 0 100 106" class="arte arte-avatar" style="width:${tamanho}px;height:${tamanho * 1.06}px">
    <defs>${massa(id, cor)}</defs>
    <g filter="url(#${id}c)"><g filter="url(#${id}d)">
      <circle cx="50" cy="50" r="47" fill="url(#${id}g)"/>
    </g></g>
    <circle cx="50" cy="50" r="47" fill="none" stroke="${tom(cor, -.5)}" stroke-width="1.6" opacity=".4"/>
    <ellipse cx="34" cy="28" rx="13" ry="9" fill="#fff" opacity=".3" filter="url(#${id}b)" transform="rotate(-28 34 28)"/>
    <path d="${d}" fill="#fff" opacity=".95"/>
  </svg>`;
}

/* ------------------------------------------------------------ confetes */
export function confete(palco, x, y, cores){
  const n = 16;
  for(let i = 0; i < n; i++){
    const p = document.createElement('i');
    p.className = 'confete';
    const ang = (i / n) * Math.PI * 2 + Math.random() * .5;
    const dist = 60 + Math.random() * 90;
    p.style.cssText =
      `left:${x}px;top:${y}px;background:${cores[i % cores.length]};` +
      `--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist - 40}px;` +
      `--rot:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * 60}ms;` +
      (i % 3 === 0 ? 'border-radius:50%;' : '');
    palco.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}
