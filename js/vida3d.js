/* Dá vida aos animais 3D (cão, gato, vaca, pato) fora dos desafios de animais:
   nos jogos de cada casa, na quinta 2D, na loja e no "Procurar".
   Procura <img> destes animais nesses sítios e troca-as por um modelo 3D que anda no lugar
   e salta ao toque (animais3d.js). Se não houver WebGL, ficam as imagens. */
const RE = /\/(?:3d-)?(cao|gato|vaca|pato|galo|galinha|coelho|porco|ra|tartaruga|cavalo|ovelha)\.webp(?:\?.*)?$/;
const ONDE = '.tarefas-fundo, #quinta-grelha .bicho, .item-arte, .procura-item';
const MAX = 10;   /* no máximo 10 animais vivos ao mesmo tempo (poupa telemóveis fracos) */

let mod = null;
const carrega = () => mod || (mod = import('./animais3d.js').catch(e => { console.warn('Animais 3D indisponíveis', e); return null; }));

function limpa(img){
  const c = img.nextElementSibling;
  if(c && c.classList.contains('a3d')) c.remove();
  img.style.display = ''; delete img.dataset.viva; delete img.dataset.a3d; delete img.dataset.auto3d;
}

function trata(img){
  if(!img.isConnected || !img.closest(ONDE)) return;
  if(img.dataset.a3d && !img.dataset.auto3d) return;           /* já tratada pelo jogo (natureza.js) */
  const m = RE.exec(img.getAttribute('src') || '');
  if(img.dataset.auto3d && (!m || img.dataset.a3d !== m[1])) limpa(img);   /* a imagem mudou */
  if(!m || img.dataset.auto3d) return;
  if(document.querySelectorAll('canvas.a3d').length >= MAX) return;
  img.dataset.a3d = m[1]; img.dataset.auto3d = '1';
  carrega().then(a => { if(a && img.isConnected) a.ativaCartas(img.parentElement); });
}

export function iniciaVida3d(){
  const fila = new Set(); let agendado = false;
  const agenda = img => { fila.add(img); if(!agendado){ agendado = true; requestAnimationFrame(() => { agendado = false; const l = [...fila]; fila.clear(); l.forEach(trata); }); } };
  const varre = no => {
    if(no.nodeType !== 1) return;
    if(no.tagName === 'IMG') agenda(no);
    else no.querySelectorAll && no.querySelectorAll('img').forEach(agenda);
  };
  new MutationObserver(ms => {
    for(const m of ms){
      if(m.type === 'attributes') agenda(m.target);
      else m.addedNodes.forEach(varre);
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
}
