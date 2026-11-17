/* Leitor das histórias dos avós Beagle: os dois avós (os modelos originais da app) falam à vez,
   com a sua voz gravada, enquanto a cena ilustrada em baixo muda. Sem toques obrigatórios.
   Se faltar o clip de uma fala, mostra só a legenda e espera: nunca usa a voz do aparelho. */
import { util } from './natureza.js';

const { imgSrc } = util;
const A3D = ['cao', 'gato', 'pato', 'vaca'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function cenaHtml(c){
  const itens = c.itens.map((it, i) => {
    const est = `left:${it.x}%;top:${it.y}%;--t:${it.t}rem;--d:${300 + i * 260}ms`;
    if(it.e) return `<span class="hist-item emoji" style="${est}" aria-hidden="true">${it.e}</span>`;
    const a3 = it.d3 && A3D.includes(it.id) ? ` data-a3d="${it.id}"` : '';
    return `<img class="hist-item" src="${imgSrc(it.id)}" alt="" draggable="false" style="${est}"${a3}>`;
  }).join('');
  return `<div class="hist-cena" data-fundo="${c.fundo}"><div class="hist-titulo">${esc(c.titulo)}</div>${itens}<div class="hist-legenda"></div></div>`;
}

/* api: { Som, raiz, avo(), ava(), fim() } */
export function tocaHistoria(h, api){
  let parado = false;
  const timers = new Set();
  const espera = ms => new Promise(r => { const t = setTimeout(() => { timers.delete(t); r(); }, ms); timers.add(t); });
  const rig = v => (v === 'f' ? api.ava() : api.avo());

  async function fala(f, legenda){
    if(parado) return;
    const r = rig(f.v), outro = rig(f.v === 'f' ? 'm' : 'f');
    legenda.textContent = f.t; legenda.classList.add('on');
    outro.faz('repouso'); r.faz(f.pose || 'repouso');
    const S = api.Som;
    S.defineVoz(f.v);
    await S.carregaVozes(f.v);
    if(parado) return;
    const dur = 900 + f.t.length * 75;
    r.fala(dur);
    if(S.ligado && S.temClips([f.t])) await new Promise(res => { S.fala(f.t, res); timers.add(setTimeout(res, dur + 6000)); });
    else await espera(dur + 700);
    r.fala(0); r.faz('repouso');
    legenda.classList.remove('on');
    await espera(450);
  }

  (async () => {
    for(const p of h.passos){
      if(parado) return;
      api.raiz.innerHTML = cenaHtml(p.cena);
      const leg = api.raiz.querySelector('.hist-legenda');
      if(api.raiz.querySelector('img[data-a3d]')) import('./animais3d.js').then(m => m.ativaCartas(api.raiz)).catch(() => {});
      await espera(1300);
      for(const f of p.falas){ if(parado) return; await fala(f, leg); }
      await espera(900);
    }
    if(!parado) api.fim();
  })();

  return { para(){ parado = true; timers.forEach(clearTimeout); timers.clear(); try{ api.Som.paraVoz(); }catch(e){} api.avo().fala(0); api.ava().fala(0); } };
}
