/* Os animais da quinta, de perfil, para passearem pelo mapa.
   Formas simples e cheias, sem contorno duro, para condizerem com o barro.
   Cada um tem a sua maneira de andar: o coelho salta, a galinha bate as
   patas, a borboleta esvoaça, a ovelha baloiça. */

import { tom } from './arte.js';

const pata = (x, y, w, h, cor) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${cor}"/>`;

export const BICHOS = {
  coelho: (c = '#E8D7C3') => `
    <svg viewBox="0 0 100 80" class="bicho bicho-coelho">
      <ellipse cx="50" cy="74" rx="26" ry="4" fill="#2F4A1F" opacity=".18"/>
      <g class="patas">${pata(34, 56, 9, 16, tom(c, -.18))}${pata(58, 56, 9, 16, tom(c, -.18))}</g>
      <ellipse cx="48" cy="48" rx="26" ry="19" fill="${c}"/>
      <ellipse cx="42" cy="43" rx="18" ry="12" fill="${tom(c, .22)}"/>
      <circle cx="24" cy="54" r="7" fill="${tom(c, .3)}"/>
      <circle cx="72" cy="34" r="14" fill="${c}"/>
      <ellipse cx="68" cy="14" rx="4.5" ry="14" fill="${c}" transform="rotate(-10 68 14)"/>
      <ellipse cx="78" cy="15" rx="4.5" ry="14" fill="${tom(c, -.1)}" transform="rotate(8 78 15)"/>
      <ellipse cx="68" cy="15" rx="2" ry="9" fill="${tom(c, -.22)}" transform="rotate(-10 68 15)"/>
      <circle cx="79" cy="31" r="2.6" fill="#4A3524"/>
      <circle cx="85" cy="36" r="2.2" fill="#C98FA0"/>
    </svg>`,

  galinha: (c = '#FFFBF2') => `
    <svg viewBox="0 0 100 80" class="bicho bicho-galinha">
      <ellipse cx="50" cy="74" rx="24" ry="4" fill="#2F4A1F" opacity=".18"/>
      <g class="patas">${pata(42, 58, 6, 14, '#E8A33C')}${pata(56, 58, 6, 14, '#E8A33C')}</g>
      <path d="M22 44q-8-12 2-16 6 10 12 10z" fill="${tom(c, -.12)}"/>
      <ellipse cx="48" cy="46" rx="25" ry="18" fill="${c}"/>
      <ellipse cx="44" cy="42" rx="16" ry="11" fill="#fff"/>
      <circle cx="70" cy="31" r="12" fill="${c}"/>
      <path d="M66 17q3-7 6 0 3-7 6 1-2 4-6 3z" fill="#D94A3C"/>
      <path d="M81 32 92 35 81 38z" fill="#F0A93C"/>
      <path d="M72 41q4 5 0 7-4-2 0-7z" fill="#D94A3C"/>
      <circle cx="74" cy="29" r="2.4" fill="#4A3524"/>
    </svg>`,

  borboleta: (c = '#E8873C') => `
    <svg viewBox="0 0 100 80" class="bicho bicho-borboleta">
      <g class="asas-cima">
        <ellipse cx="34" cy="30" rx="19" ry="15" fill="${c}" transform="rotate(-22 34 30)"/>
        <ellipse cx="66" cy="30" rx="19" ry="15" fill="${tom(c, -.1)}" transform="rotate(22 66 30)"/>
      </g>
      <g class="asas-baixo">
        <ellipse cx="38" cy="52" rx="14" ry="12" fill="${tom(c, .2)}" transform="rotate(-14 38 52)"/>
        <ellipse cx="62" cy="52" rx="14" ry="12" fill="${tom(c, .1)}" transform="rotate(14 62 52)"/>
      </g>
      <circle cx="31" cy="28" r="5" fill="#fff" opacity=".6"/>
      <circle cx="69" cy="28" r="5" fill="#fff" opacity=".5"/>
      <rect x="47" y="24" width="6" height="34" rx="3" fill="#5A3C20"/>
      <circle cx="50" cy="22" r="5" fill="#5A3C20"/>
      <path d="M48 18q-5-7-10-8M52 18q5-7 10-8" stroke="#5A3C20" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`,

  passaro: (c = '#5B9BD9') => `
    <svg viewBox="0 0 100 80" class="bicho bicho-passaro">
      <ellipse cx="50" cy="74" rx="20" ry="3.5" fill="#2F4A1F" opacity=".16"/>
      <g class="patas">${pata(45, 60, 5, 11, '#E8A33C')}${pata(55, 60, 5, 11, '#E8A33C')}</g>
      <path d="M20 42q-6-10 2-13 5 8 10 8z" fill="${tom(c, -.18)}"/>
      <ellipse cx="50" cy="46" rx="23" ry="17" fill="${c}"/>
      <ellipse cx="52" cy="50" rx="14" ry="9" fill="${tom(c, .3)}"/>
      <circle cx="70" cy="33" r="12" fill="${c}"/>
      <path d="M81 33 93 37 81 40z" fill="#F0A93C"/>
      <circle cx="74" cy="31" r="2.4" fill="#2A2018"/>
      <path d="M46 40q10-6 18 2-9 7-18-2z" fill="${tom(c, -.22)}" class="asa"/>
    </svg>`,

  ovelha: (c = '#FFFBF2') => `
    <svg viewBox="0 0 100 80" class="bicho bicho-ovelha">
      <ellipse cx="50" cy="74" rx="26" ry="4" fill="#2F4A1F" opacity=".18"/>
      <g class="patas">${pata(34, 56, 7, 16, '#6B5544')}${pata(46, 58, 7, 14, '#6B5544')}${pata(60, 56, 7, 16, '#6B5544')}</g>
      <g fill="${c}">
        <circle cx="36" cy="44" r="15"/><circle cx="50" cy="38" r="16"/>
        <circle cx="62" cy="45" r="14"/><circle cx="48" cy="50" r="14"/>
      </g>
      <circle cx="43" cy="36" r="7" fill="#fff" opacity=".7"/>
      <ellipse cx="76" cy="40" rx="11" ry="12" fill="#6B5544"/>
      <ellipse cx="66" cy="33" rx="7" ry="6" fill="${c}"/>
      <ellipse cx="86" cy="36" rx="5" ry="3.5" fill="#55402F" transform="rotate(20 86 36)"/>
      <circle cx="80" cy="37" r="2.2" fill="#2A2018"/>
    </svg>`,

  /* o pato é agora o pato 3D (imagem tirada do modelo); como os outros bichos olha para a direita */
  pato: () => `<img class="bicho-img bicho-pato" src="./media/img/3d-pato.webp" alt="" draggable="false" style="width:100%;height:100%;display:block;object-fit:contain;transform:scaleX(-1)">`,

  abelha: (c = '#F5C344') => `
    <svg viewBox="0 0 100 80" class="bicho bicho-abelha">
      <g class="asas-cima">
        <ellipse cx="42" cy="26" rx="15" ry="9" fill="#EAF4FA" opacity=".85" transform="rotate(-24 42 26)"/>
        <ellipse cx="60" cy="25" rx="14" ry="8" fill="#EAF4FA" opacity=".75" transform="rotate(20 60 25)"/>
      </g>
      <ellipse cx="52" cy="46" rx="24" ry="16" fill="${c}"/>
      <path d="M44 32q4 28 0 28-6-2-7-14t3-14zM58 31q5 29 0 29-6-1-7-14t3-15z" fill="#4A3524" opacity=".85"/>
      <circle cx="76" cy="42" r="11" fill="#4A3524"/>
      <circle cx="80" cy="39" r="2.3" fill="#fff"/>
      <path d="M74 32q-3-8-9-9M80 31q3-8 9-8" stroke="#4A3524" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M28 46 20 42v8z" fill="#4A3524"/>
    </svg>`,

  ra: (c = '#6FBA6C') => `
    <svg viewBox="0 0 100 80" class="bicho bicho-ra">
      <ellipse cx="50" cy="74" rx="24" ry="4" fill="#2F4A1F" opacity=".18"/>
      <g class="patas">
        <path d="M26 58q-8 2-8 8 0 4 6 4t10-6z" fill="${tom(c, -.14)}"/>
        <path d="M74 58q8 2 8 8 0 4-6 4t-10-6z" fill="${tom(c, -.14)}"/>
      </g>
      <ellipse cx="50" cy="50" rx="28" ry="20" fill="${c}"/>
      <ellipse cx="50" cy="56" rx="20" ry="12" fill="${tom(c, .28)}"/>
      <circle cx="36" cy="30" r="10" fill="${c}"/>
      <circle cx="64" cy="30" r="10" fill="${c}"/>
      <circle cx="36" cy="29" r="5.5" fill="#fff"/><circle cx="64" cy="29" r="5.5" fill="#fff"/>
      <circle cx="37" cy="30" r="3" fill="#2A2018"/><circle cx="65" cy="30" r="3" fill="#2A2018"/>
      <path d="M40 54q10 7 20 0" stroke="${tom(c, -.4)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </svg>`,
};

export const NOMES_BICHOS = Object.keys(BICHOS);
