/* Alvos em movimento: balões que sobem e coisas que caem.
   É uma dinâmica diferente das cartas paradas: a criança tem de apanhar o alvo a mexer.
   Nada falha por demorar (os alvos voltam sempre a passar) e só se usam frases já gravadas. */

const rnd = n => Math.floor(Math.random() * n);
const baralha = a => { for(let i = a.length - 1; i > 0; i--){ const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* elementos: [{ html, certo, rotulo }]
   modo: 'sobe' | 'cai'
   alvos: quantos certos é preciso apanhar (o último dá a resposta certa ao jogo)
   aoErrar(botao), aoAcertarFinal(botao): chamados pelo jogo */
export function campoMovel(jogo, { elementos, modo, alvos, aoErrar, aoAcertarFinal }){
  const raiz = jogo.ctx.raiz;
  raiz.classList.remove('parado');
  const n = elementos.length;
  const faixa = 100 / n;
  const ordem = baralha(elementos.map((e, i) => i));            /* posições horizontais baralhadas */
  raiz.innerHTML = `<div class="campo-movel ${modo}">${elementos.map((e, i) => {
    const x = ordem[i] * faixa + faixa / 2;
    const dur = 7 + rnd(30) / 10;                               /* 7 a 10 s por passagem */
    const atraso = -(dur * (i / n));                            /* já espalhados no ecrã desde o início */
    return `<button class="mov" type="button" data-i="${i}" aria-label="${e.rotulo || ''}"
      style="--x:${x.toFixed(1)}%;--d:${dur.toFixed(1)}s;--atraso:${atraso.toFixed(1)}s">${e.html}</button>`;
  }).join('')}</div>`;
  let feitos = 0;
  raiz.querySelectorAll('.mov').forEach(b => {
    const f = () => {
      if(jogo.aEsperar || b.classList.contains('apanhado')) return;
      const e = elementos[+b.dataset.i];
      if(!e.certo){ aoErrar(b); return; }
      feitos++;
      if(feitos >= alvos){ raiz.classList.add('parado'); aoAcertarFinal(b); return; }
      /* apanhado mas ainda faltam: estoira e desaparece */
      b.classList.add('apanhado');
      jogo.som('pop');
    };
    b.addEventListener('click', f);
    jogo.limpezas.push(() => b.removeEventListener('click', f));
  });
}
