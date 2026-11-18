/* Leitor das histórias dos avós Beagle: os dois avós (os modelos 3D originais da app) caminham pela quinta
   e vão apresentando cada sítio e cada animal, com a sua voz gravada. O cenário desliza atrás deles
   em várias camadas (parallax) e os animais mexem-se. Se faltar o clip de uma fala, mostra só a legenda
   e espera: nunca usa a voz do aparelho. */
import { util } from './natureza.js';
import { arteEdificio } from './minhaquinta.js';

const { imgSrc } = util;
const A3D = ['cao', 'gato', 'vaca', 'pato', 'galo', 'galinha', 'coelho', 'porco', 'ra', 'tartaruga', 'cavalo', 'ovelha'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rnd = (a, b) => a + Math.random() * (b - a);

/* camadas do cenário: f = quanto se mexem em relação à câmara (longe mexe-se menos) */
function colinas(largura, altura, cor, amp, passo, fase){
  let d = `M0,${altura}`;
  const n = Math.ceil(largura / passo) + 2;
  for(let i = 0; i <= n; i++){
    const x = i * passo, y = altura * .55 - amp * (Math.sin(i * .9 + fase) * .6 + Math.sin(i * .37 + fase * 2) * .4);
    d += i === 0 ? ` L${x},${y}` : ` T${x},${y}`;
  }
  d += ` L${n * passo},${altura} Z`;
  return `<svg width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="${cor}"/></svg>`;
}

function constroi(h, palco){
  const W = palco.clientWidth || 390, H = palco.clientHeight || 700, vw = W / 100;
  const est = h.mundo.estacoes;
  const total = Math.max(...est.map(e => e.x)) * vw;
  const mundo = document.createElement('div');
  mundo.className = 'hm';
  const camadas = [];
  const camada = (f, classe, html) => {
    const d = document.createElement('div');
    d.className = 'hm-camada ' + classe;
    d.style.width = (total * f + W * 2) + 'px';
    d.innerHTML = html;
    mundo.append(d); camadas.push({ el: d, f });
    return d;
  };
  const ceu = document.createElement('div');
  ceu.className = 'hm-ceu';
  ceu.innerHTML = '<span class="hm-sol">☀️</span>' + [8, 38, 66, 90].map((x, i) => `<span class="hm-nuvem" style="left:${x}%;top:${5 + i * 4}%;animation-delay:-${i * 11}s;font-size:${3 + i % 2}rem">☁️</span>`).join('')
    + '<span class="hm-passaro" style="top:12%;animation-delay:-3s">🐦</span><span class="hm-passaro" style="top:20%;animation-delay:-11s;animation-duration:19s">🐦</span>';
  mundo.append(ceu);
  const Lw = f => total * f + W * 2;
  camada(.10, 'hm-longe', colinas(Lw(.10), H * .5, '#a6d8a0', H * .08, 110, 0));
  camada(.28, 'hm-medio', colinas(Lw(.28), H * .42, '#82c872', H * .07, 90, 2));
  let arv = '';
  for(let x = 0; x < Lw(.55); x += rnd(70, 130)) arv += `<span class="hm-arvore" style="left:${x}px;font-size:${rnd(3.4, 5.6)}rem">${Math.random() < .6 ? '🌳' : '🌲'}</span>`;
  camada(.55, 'hm-arvores', arv);
  /* chão e estações (a camada principal, a que acompanha os avós) */
  let chao = `<div class="hm-relva"></div><div class="hm-caminho"></div><div class="hm-vedacao"></div>`;
  let flores = '';
  for(let x = 0; x < Lw(1); x += rnd(60, 140)) flores += `<span class="hm-flor" style="left:${x}px;bottom:${rnd(1, 9)}%;font-size:${rnd(1.2, 2)}rem">${['🌼', '🌷', '🌸', '🌿'][Math.floor(Math.random() * 4)]}</span>`;
  chao += flores;
  const main = camada(1, 'hm-chao', chao);
  const estEl = {};
  est.forEach(e => {
    const cx = e.x * vw + W / 2;
    const g = document.createElement('div');
    g.className = 'hm-estacao'; g.dataset.id = e.id;
    const ed = document.createElement('div');
    ed.className = 'hm-edif'; ed.style.left = cx + 'px'; ed.innerHTML = arteEdificio(e.edificio);
    g.append(ed);
    (e.itens || []).forEach((it, i) => {
      const w = document.createElement('div');
      w.className = 'hm-bicho ' + (it.fila === 'tras' ? 'tras ' : '') + (it.modo || 'parado') + (it.e ? ' emoji' : '');
      w.style.cssText = `left:${cx + it.dx * vw}px;--t:${it.t}rem;--p:${(it.passeio || 8) * vw}px;--atraso:-${(i * 1.3).toFixed(1)}s`;
      if(it.e) w.textContent = it.e;
      else w.innerHTML = `<img src="${imgSrc(it.id)}" alt="" draggable="false"${it.d3 && A3D.includes(it.id) ? ` data-a3d="${it.id}" data-quieto="1"` : ''}>`;
      g.append(w);
    });
    main.append(g); estEl[e.id] = g;
  });
  camada(1.35, 'hm-frente', Array.from({ length: Math.ceil(Lw(1.35) / 220) }, (_, i) => `<span class="hm-erva" style="left:${i * 220 + rnd(0, 90)}px">🌿</span>`).join('')
    + Array.from({ length: Math.ceil(Lw(1.35) / 700) }, (_, i) => `<span class="hm-borboleta" style="left:${i * 700 + rnd(0, 300)}px;animation-delay:-${i * 2.3}s">🦋</span>`).join(''));
  palco.prepend(mundo);
  const legenda = document.createElement('div');
  legenda.className = 'hm-legenda';
  palco.append(legenda);
  return { mundo, legenda, camadas, estEl, vw, W };
}

/* api: { Som, palco, avo(), ava(), fim() } */
export function tocaHistoria(h, api){
  let parado = false, cam = 0, andando = false;
  const timers = new Set();
  const espera = ms => new Promise(r => { const t = setTimeout(() => { timers.delete(t); r(); }, ms); timers.add(t); });
  const rig = v => (v === 'f' ? api.ava() : api.avo());
  const M = constroi(h, api.palco);
  if(M.mundo.querySelector('img[data-a3d]')) import('./animais3d.js').then(m => m.ativaCartas(M.mundo)).catch(() => {});
  const grau = Math.PI / 180;
  /* os gestos seguem a direção do corpo (senão, de lado, as pernas balançariam para a câmara) */
  const localAntes = [api.avo().opcoes.local, api.ava().opcoes.local];
  api.avo().opcoes.local = true; api.ava().opcoes.local = true;
  let raf = 0;

  const aplica = () => M.camadas.forEach(c => { c.el.style.transform = `translate3d(${-cam * c.f}px,0,0)`; });
  aplica();

  /* os avós viram-se para a direita ao andar e voltam-se para quem vê quando param */
  const gira = () => {
    if(parado) return;
    raf = requestAnimationFrame(gira);
    const a = api.avo(), b = api.ava();
    const alvoA = andando ? 90 * grau : a.rotBase + 14 * grau, alvoB = andando ? 90 * grau : b.rotBase - 14 * grau;
    a.grupo.rotation.y += (alvoA - a.grupo.rotation.y) * .09;
    b.grupo.rotation.y += (alvoB - b.grupo.rotation.y) * .09;
  };
  gira();
  /* primeiro viram-se de lado, só depois andam; ao parar, as pernas assentam e só depois se voltam para quem vê */
  const pernas = on => { [api.avo(), api.ava()].forEach(r => { r.passoAmp = on ? 1.2 : 1; r.caminha(on, .85); }); };
  const anda = async on => {
    if(on){ andando = true; await espera(1000); if(!parado) pernas(true); }
    else { pernas(false); await espera(650); andando = false; }
  };

  const vai = (alvo, ms) => new Promise(res => {
    const c0 = cam, t0 = performance.now();
    const passo = () => {
      if(parado) return res();
      const k = Math.min(1, (performance.now() - t0) / ms);
      const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      cam = c0 + (alvo - c0) * e; aplica();
      if(k < 1) requestAnimationFrame(passo); else res();
    };
    passo();
  });

  async function fala(f, estacao){
    if(parado) return;
    const r = rig(f.v), outro = rig(f.v === 'f' ? 'm' : 'f');
    M.legenda.textContent = f.t; M.legenda.classList.add('on');
    if(!andando){ outro.faz('repouso'); r.faz(f.pose || 'repouso'); }
    const S = api.Som;
    S.defineVoz(f.v);
    await S.carregaVozes(f.v);
    if(parado) return;
    const dur = 900 + f.t.length * 75;
    r.fala(dur);
    const diz = async t => {
      if(S.ligado && S.temClips([t])) await new Promise(res => { S.fala(t, res); timers.add(setTimeout(res, 7000)); });
      else await espera(Math.max(600, t.length * 75));
    };
    if(S.ligado && S.temClips([f.t])) await diz(f.t); else await espera(dur + 700);
    if(f.som && !parado){
      if(estacao) estacao.classList.add('alegre');
      await diz(f.som);
      if(estacao) setTimeout(() => estacao.classList.remove('alegre'), 600);
    }
    r.fala(0); if(!andando) r.faz('repouso');
    M.legenda.classList.remove('on');
    await espera(350);
  }

  (async () => {
    await espera(900);
    for(const p of h.passos){
      if(parado) return;
      const e = h.mundo.estacoes.find(x => x.id === p.para);
      const alvo = e.x * M.vw;
      if(Math.abs(alvo - cam) > 2){
        await anda(true);
        const dist = Math.abs(alvo - cam) / M.vw;
        const mov = vai(alvo, Math.max(5500, dist * 65));
        const dito = (async () => { await espera(500); for(const f of (p.andando || [])) await fala(f, null); })();
        await Promise.all([mov, dito]);
        await anda(false);
        await espera(900);
      }
      const g = M.estEl[e.id];
      for(const f of p.falas){ if(parado) return; await fala(f, g); }
      await espera(700);
    }
    if(!parado) api.fim();
  })();

  return { para(){
    parado = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers.clear();
    try{ api.Som.paraVoz(); }catch(e){}
    api.avo().fala(0); api.ava().fala(0); api.avo().caminha(false); api.ava().caminha(false); api.avo().passoAmp = 1; api.ava().passoAmp = 1; api.avo().opcoes.local = localAntes[0]; api.ava().opcoes.local = localAntes[1];
    M.mundo.remove(); M.legenda.remove();
  } };
}
