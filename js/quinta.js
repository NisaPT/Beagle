/* A quinta dos avós. Tudo em formas moles, sem contorno, construído em
   camadas com profundidade: céu, montes, casa e árvores, cerca, e o chão
   onde a mascote fica de pé. A faixa do meio em baixo fica propositadamente
   desimpedida — é ali que a personagem assenta os pés. */

import { tom } from './arte.js';

/* nuvem feita de círculos sobrepostos, como as de desenho */
function nuvem(x, y, e){
  const c = (dx, dy, r) => `<circle cx="${x + dx * e}" cy="${y + dy * e}" r="${r * e}"/>`;
  return `<g fill="#fff" opacity=".92">
    ${c(0, 0, 16)}${c(14, -5, 12)}${c(26, 2, 10)}${c(-13, 3, 11)}
    <rect x="${x - 24 * e}" y="${y - 1 * e}" width="${50 * e}" height="${10 * e}" rx="${5 * e}"/>
  </g>`;
}

/* árvore: tronco + copa em três bolhas */
function arvore(x, y, e, copa, tronco){
  return `<g transform="translate(${x} ${y}) scale(${e})">
    <ellipse cx="0" cy="4" rx="22" ry="5" fill="#2F6B35" opacity=".22"/>
    <path d="M-5 2 L-4-26 Q0-30 4-26 L5 2Z" fill="${tronco}"/>
    <circle cx="0"   cy="-38" r="21" fill="${copa}"/>
    <circle cx="-16" cy="-28" r="15" fill="${copa}"/>
    <circle cx="16"  cy="-28" r="15" fill="${tom(copa, -.1)}"/>
    <circle cx="-6"  cy="-44" r="11" fill="${tom(copa, .16)}"/>
  </g>`;
}

/* casa portuguesa: paredes caiadas, telha de barro, e um painel de azulejo */
function casa(x, y, e){
  return `<g transform="translate(${x} ${y}) scale(${e})">
    <ellipse cx="0" cy="2" rx="52" ry="7" fill="#2F6B35" opacity=".2"/>
    <rect x="-44" y="-56" width="88" height="58" rx="5" fill="#FFFBF2"/>
    <rect x="-44" y="-56" width="88" height="58" rx="5" fill="url(#sombraCasa)"/>
    <path d="M-54-54 L0-82 L54-54 Q56-50 50-50 L-50-50 Q-56-50-54-54Z" fill="#C6613C"/>
    <path d="M-54-54 L0-82 L54-54 Q56-50 50-50 L-50-50 Q-56-50-54-54Z" fill="url(#telha)"/>
    <rect x="-13" y="-32" width="26" height="34" rx="4" fill="#7B4A2A"/>
    <rect x="-9" y="-28" width="18" height="27" rx="3" fill="#955C35"/>
    <circle cx="6" cy="-15" r="2" fill="#F5C344"/>
    <rect x="-37" y="-42" width="19" height="17" rx="3" fill="#8FB8CE"/>
    <rect x="-37" y="-42" width="19" height="17" rx="3" fill="url(#vidro)"/>
    <rect x="20" y="-44" width="18" height="18" rx="2" fill="#EAF2F7"/>
    <g stroke="#3E7FA8" stroke-width="1.6" fill="none" opacity=".8">
      <rect x="21.5" y="-42.5" width="15" height="15" rx="1"/>
      <path d="M29-41 33-35 29-29 25-35Z"/>
    </g>
  </g>`;
}

/* cerca de madeira, repetida */
function cerca(y, e){
  const postes = Array.from({length:14}, (_, i) =>
    `<rect x="${i * 32 - 10}" y="${-26}" width="11" height="34" rx="5" fill="#C98F55"/>
     <rect x="${i * 32 - 10}" y="${-26}" width="11" height="34" rx="5" fill="url(#sombraPoste)"/>`).join('');
  return `<g transform="translate(0 ${y}) scale(${e})">
    ${postes}
    <rect x="-14" y="-19" width="460" height="7" rx="3.5" fill="#D99C5E"/>
    <rect x="-14" y="-6"  width="460" height="7" rx="3.5" fill="#CE8F50"/>
  </g>`;
}

export function quinta(){
  return `
<svg class="cenario" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#9FD8EF"/>
      <stop offset="55%" stop-color="#CDEBF6"/>
      <stop offset="100%" stop-color="#FDF3DC"/>
    </linearGradient>
    <radialGradient id="brilhoSol" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFE9A0" stop-opacity=".95"/>
      <stop offset="100%" stop-color="#FFE9A0" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="monteLonge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8FC98C"/><stop offset="100%" stop-color="#6FB174"/>
    </linearGradient>
    <linearGradient id="montePerto" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7CC077"/><stop offset="100%" stop-color="#58A162"/>
    </linearGradient>
    <linearGradient id="relva" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6FBA6C"/><stop offset="100%" stop-color="#4E9A58"/>
    </linearGradient>
    <linearGradient id="sombraCasa" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#C9A882" stop-opacity=".45"/>
    </linearGradient>
    <linearGradient id="telha" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity=".3"/>
      <stop offset="100%" stop-color="#7E3418" stop-opacity=".4"/>
    </linearGradient>
    <linearGradient id="vidro" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity=".7"/>
      <stop offset="60%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="sombraPoste" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fff" stop-opacity=".35"/>
      <stop offset="100%" stop-color="#8A5A28" stop-opacity=".4"/>
    </linearGradient>
  </defs>

  <rect width="400" height="300" fill="url(#ceu)"/>

  <circle cx="338" cy="44" r="56" fill="url(#brilhoSol)"/>
  <circle cx="338" cy="44" r="23" fill="#FFD95E"/>
  <circle cx="332" cy="38" r="9"  fill="#FFF0B8" opacity=".75"/>

  <g class="nuvens">${nuvem(70, 52, 1)}${nuvem(230, 38, .75)}${nuvem(160, 86, .55)}</g>

  <path d="M0 196 Q60 150 130 180 Q190 206 250 172 Q320 134 400 178 L400 300 L0 300Z" fill="url(#monteLonge)"/>
  <path d="M0 224 Q70 190 150 214 Q230 238 300 206 Q350 184 400 206 L400 300 L0 300Z" fill="url(#montePerto)"/>

  ${casa(300, 226, .82)}
  ${arvore(58, 232, 1.05, '#4E9A4E', '#8A5A28')}
  ${arvore(146, 220, .62, '#5FAE58', '#95663A')}
  ${arvore(238, 224, .5,  '#53A352', '#8A5A28')}

  ${cerca(252, 1)}

  <path d="M0 250 Q100 240 200 250 Q300 260 400 248 L400 300 L0 300Z" fill="url(#relva)"/>
  <g fill="#3F8A4C" opacity=".5">
    <path d="M24 272q3-9 6 0zM52 282q3-10 6 0zM112 276q3-9 6 0zM250 280q3-10 6 0zM300 270q3-9 6 0zM352 284q3-10 6 0z"/>
  </g>
</svg>`;
}
