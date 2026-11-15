import { balao, flor, biscoito, peca, buraco, FORMAS, confete } from './arte.js';
import { rondaNatureza } from './natureza.js';

const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
export function baralha(a){
  for(let i = a.length - 1; i > 0; i--){ const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* cada cor tem as duas formas: "o balão vermelho" mas "a flor vermelha" */
const CORES = [
  { id:'vermelho', m:'vermelho', f:'vermelha', hex:'#E0162B' },
  { id:'azul',     m:'azul',     f:'azul',     hex:'#2C6FD6' },
  { id:'amarelo',  m:'amarelo',  f:'amarela',  hex:'#F7C21B' },
  { id:'verde',    m:'verde',    f:'verde',    hex:'#3DA35D' },
  { id:'roxo',     m:'roxo',     f:'roxa',     hex:'#8E6BC8' },
  { id:'laranja',  m:'laranja',  f:'laranja',  hex:'#F3822B' },
];

const NUM = ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
const NUM_M = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
/* ao acertar diz-se só um elogio curto, sem repetir o nome do objeto */
const BEM   = ['Muito bem!', 'Boa!', 'Isso mesmo!', 'Parabéns!'];
let ultimoElogio = '';
function elogio(){
  let e; do{ e = pick(BEM); }while(e === ultimoElogio);
  return (ultimoElogio = e);
}
const RONDAS = 5;

export class Jogo {
  /* ctx = { raiz, voz, mascote, aoAcabar(nivel, estrelas), aoSair } */
  constructor(ctx){
    this.ctx = ctx;
    this.aDecorrer = false;
    this.limpezas = [];
  }

  comeca(nivel, info){
    this.nivel = nivel;
    this.tipo = info.tipo;
    this.dif = info.dificuldade;
    this.info = info;
    this.ronda = 0;
    this.erros = 0;
    this.aDecorrer = true;
    this.aEsperar = false;
    document.body.dataset.jogo = this.tipo;
    this.proxima();
  }

  para(){
    this.aDecorrer = false;
    this.aEsperar = false;
    this.desliga();
    delete document.body.dataset.jogo;
  }

  desliga(){ this.limpezas.forEach(f => f()); this.limpezas = []; }

  proxima(){
    if(!this.aDecorrer) return;
    this.desliga();
    if(this.ronda >= RONDAS) return this.acaba();
    this.ronda++;
    this.aEsperar = false;
    if(this.tipo === 'letras' && !(this.info.letraOpcoes > 0)) this.tipo = 'cores';   /* 3 e 4 anos: sem letras */
    if(this.tipo === 'cores')  this.rondaCores();
    if(this.tipo === 'contar') this.rondaContar();
    if(this.tipo === 'formas') this.rondaFormas();
    if(this.tipo === 'letras') this.rondaLetras();
    if(this.tipo === 'memoria') this.rondaMemoria();
    if(this.tipo === 'logica') this.rondaLogica();
    if(this.tipo === 'somas')  this.rondaSomas();
    if(['animais','frutas','legumes'].includes(this.tipo)) rondaNatureza(this, this.tipo);
    if(!['cores','contar','formas','letras','memoria','logica','somas','animais','frutas','legumes'].includes(this.tipo)) this.rondaCores();
  }

  diz(texto, aoFim, pista){ this.ctx.voz.diz(texto, aoFim, pista); }
  som(nome, n){ if(this.ctx.som) this.ctx.som.efeito(nome, n); }
  pose(p){ this.ctx.mascote.faz(p); }

  /* ================================================== CORES ================ */
  rondaCores(){
    const i = this.info;
    const paleta = CORES.slice(0, i.paleta);
    const opcoes = baralha(paleta.slice()).slice(0, Math.min(i.opcoes, paleta.length));
    const certa = pick(opcoes);
    const usaFlor = i.dificuldade >= 2 && Math.random() < .5;
    const objeto = usaFlor ? flor : balao;
    const nomeDe = c => usaFlor ? `a flor ${c.f}` : `o balão ${c.m}`;

    this.ctx.raiz.innerHTML = `<div class="alvos flutua">${opcoes.map((c, i) =>
      `<button class="alvo" data-id="${c.id}" aria-label="${usaFlor ? c.f : c.m}"
         style="--atraso:${i * 120}ms">${objeto(c.hex)}</button>`).join('')}</div>`;

    this.pose('apontar');
    this.diz(usaFlor ? `Toca na flor ${certa.f}.` : `Toca no balão ${certa.m}.`,
             () => { if(this.aDecorrer) this.pose('repouso'); },
             `<i class="pista-cor" style="background:${certa.hex}"></i>`);

    this.ctx.raiz.querySelectorAll('.alvo').forEach(b => {
      const aoClicar = () => {
        const c = CORES.find(x => x.id === b.dataset.id);
        const certo = c.id === certa.id;
        this.responde(b, certo, certo
          ? [pick(BEM), `É ${nomeDe(certa)}.`]
          : `Essa não é. Procura ${nomeDe(certa)}.`,
          c.hex);
      };
      b.addEventListener('click', aoClicar);
      this.limpezas.push(() => b.removeEventListener('click', aoClicar));
    });
  }

  /* ================================================= CONTAR ================ */
  /* a criança toca em cada biscoito; a contagem é dita em voz alta */
  rondaContar(){
    const max = this.info.maxConta;
    const n = 1 + rnd(max);
    let contados = 0;

    const espalhados = Array.from({length:n}, (_, i) => {
      const porLinha = n > 6 ? 4 : 3;
      const col = i % porLinha, lin = Math.floor(i / porLinha);
      return `<button class="biscoito-alvo" data-i="${i}"
        style="--x:${col * (96 / porLinha) + 4 + (lin % 2) * 5}%;--y:${lin * 44}px;--giro:${rnd(40) - 20}deg;--atraso:${i * 80}ms;--larg:${porLinha === 4 ? 13 : 17}vw"
        aria-label="biscoito">${biscoito()}</button>`;
    }).join('');

    this.ctx.raiz.innerHTML = `
      <div class="cesta" id="cesta"><span class="cesta-conta" id="cesta-conta">0</span></div>
      <div class="espalhados" id="espalhados">${espalhados}</div>
      <div class="numeros" id="numeros" hidden></div>`;

    this.pose('apontar');
    this.diz('Toca em cada biscoito para contar.', () => { if(this.aDecorrer) this.pose('pensar'); });

    const conta = this.ctx.raiz.querySelector('#cesta-conta');
    this.ctx.raiz.querySelectorAll('.biscoito-alvo').forEach(b => {
      const aoClicar = () => {
        if(b.classList.contains('contado')) return;
        b.classList.add('contado');
        contados++;
        conta.textContent = contados;
        conta.classList.remove('bate'); void conta.offsetWidth; conta.classList.add('bate');
        this.som('conta', contados);
        this.ctx.voz.diz(NUM[contados] || String(contados));
        if(contados === n) setTimeout(() => this.perguntaQuantos(n), 700);
      };
      b.addEventListener('click', aoClicar);
      this.limpezas.push(() => b.removeEventListener('click', aoClicar));
    });
  }

  perguntaQuantos(n){
    if(!this.aDecorrer) return;
    const caixa = this.ctx.raiz.querySelector('#numeros');
    if(!caixa) return;
    const max = Math.min(10, Math.max(5, n + 2));
    caixa.innerHTML = Array.from({length:max}, (_, i) =>
      `<button class="num" data-n="${i + 1}">${i + 1}</button>`).join('');
    caixa.hidden = false;
    this.pose('apontar');
    this.diz('Então, quantos biscoitos eram?');
    caixa.querySelectorAll('.num').forEach(b => {
      const aoClicar = () => {
        const v = +b.dataset.n;
        this.responde(b, v === n, v === n
          ? [pick(BEM), n === 1 ? 'Era um biscoito.' : `Eram ${NUM_M[n]} biscoitos.`]
          : 'Conta outra vez comigo.', '#F5B921');
      };
      b.addEventListener('click', aoClicar);
      this.limpezas.push(() => b.removeEventListener('click', aoClicar));
    });
  }

  /* ================================================= FORMAS ================ */
  /* caixa de encaixe: arrastar a peça até ao buraco certo */
  rondaFormas(){
    const todas = Object.keys(FORMAS);
    const quantos = Math.min(this.info.formas, todas.length);
    const buracos = baralha(todas.slice()).slice(0, quantos);
    const certa = pick(buracos);
    const cor = pick(CORES.slice(0, this.info.paleta)).hex;

    this.ctx.raiz.innerHTML = `
      <div class="caixa-encaixe">
        <div class="caixa-tampo">
          ${buracos.map(f => `<div class="buraco" data-forma="${f}">${buraco(f)}</div>`).join('')}
        </div>
        <div class="caixa-frente"></div>
      </div>
      <div class="bandeja">
        <div class="peca" id="peca" data-forma="${certa}" role="button" tabindex="0"
             aria-label="${FORMAS[certa].nome}, arrasta para o buraco certo">${peca(certa, cor)}</div>
      </div>`;

    this.pose('apontar');
    this.diz(`Põe ${FORMAS[certa].artigo} ${FORMAS[certa].nome} no buraco certo.`,
             () => { if(this.aDecorrer) this.pose('repouso'); },
             `<svg class="pista-forma" viewBox="-6 -6 112 112"><path d="${FORMAS[certa].d}"
                fill="none" stroke="#1B4D8F" stroke-width="9" stroke-linejoin="round"/></svg>`);

    this.ligaArrasto(this.ctx.raiz.querySelector('#peca'), certa, cor);
  }

  ligaArrasto(peca, formaCerta, cor){
    if(!peca) return;
    const buracos = [...this.ctx.raiz.querySelectorAll('.buraco')];
    let a_arrastar = false, dx = 0, dy = 0, idPonteiro = null;

    const centro = el => {
      const r = el.getBoundingClientRect();
      return { x:r.left + r.width / 2, y:r.top + r.height / 2 };
    };

    const baixo = e => {
      if(this.aEsperar || a_arrastar) return;
      a_arrastar = true; idPonteiro = e.pointerId;
      const c = centro(peca);
      dx = e.clientX - c.x; dy = e.clientY - c.y;
      peca.classList.add('a-arrastar');
      try{ peca.setPointerCapture(e.pointerId); }catch(err){}
    };
    const move = e => {
      if(!a_arrastar || e.pointerId !== idPonteiro) return;
      e.preventDefault();
      const base = peca.dataset.base ? JSON.parse(peca.dataset.base) : null;
      if(!base){
        const c = centro(peca);
        peca.dataset.base = JSON.stringify({ x:c.x, y:c.y });
      }
      const b = JSON.parse(peca.dataset.base);
      peca.style.transform =
        `translate(${e.clientX - dx - b.x}px, ${e.clientY - dy - b.y}px) scale(1.08) rotate(0deg)`;
    };
    const cima = e => {
      if(!a_arrastar || e.pointerId !== idPonteiro) return;
      a_arrastar = false;
      peca.classList.remove('a-arrastar');
      try{ peca.releasePointerCapture(e.pointerId); }catch(err){}

      const c = centro(peca);
      let maisPerto = null, menor = 1e9;
      for(const b of buracos){
        const cb = centro(b);
        const d = Math.hypot(cb.x - c.x, cb.y - c.y);
        if(d < menor){ menor = d; maisPerto = b; }
      }
      const limite = Math.max(70, peca.getBoundingClientRect().width * .75);
      if(maisPerto && menor < limite && maisPerto.dataset.forma === formaCerta){
        const cb = centro(maisPerto);
        const b = JSON.parse(peca.dataset.base || '{"x":0,"y":0}');
        peca.style.transition = 'transform .22s cubic-bezier(.34,1.4,.64,1)';
        peca.style.transform = `translate(${cb.x - b.x}px, ${cb.y - b.y}px) scale(.82)`;
        this.som('encaixe');
        setTimeout(() => { peca.classList.add('encaixada'); maisPerto.classList.add('cheio'); }, 180);
        this.responde(maisPerto, true,
          [pick(BEM), `É ${FORMAS[formaCerta].artigo} ${FORMAS[formaCerta].nome}.`], cor);
      }else{
        peca.style.transition = 'transform .3s cubic-bezier(.34,1.5,.64,1)';
        peca.style.transform = '';
        setTimeout(() => peca.style.transition = '', 320);
        if(maisPerto && menor < limite){
          this.responde(maisPerto, false,
            `Esse buraco não é. Procura ${FORMAS[formaCerta].artigo} ${FORMAS[formaCerta].nome}.`, cor);
        }
      }
    };

    peca.addEventListener('pointerdown', baixo);
    peca.addEventListener('pointermove', move, { passive:false });
    peca.addEventListener('pointerup', cima);
    peca.addEventListener('pointercancel', cima);
    this.limpezas.push(() => {
      peca.removeEventListener('pointerdown', baixo);
      peca.removeEventListener('pointermove', move);
      peca.removeEventListener('pointerup', cima);
      peca.removeEventListener('pointercancel', cima);
    });
  }


  /* Jogos novos: letras, memória e raciocínio lógico, com instruções PT-PT. */
  rondaLetras(){
    const pares=[['A','ABELHA','🐝'],['B','BOLA','⚽'],['C','CASA','🏠'],['D','DADO','🎲'],['F','FLOR','🌸'],['G','GATO','🐱'],['L','LUA','🌙'],['M','MACACO','🐵'],['P','PATO','🦆'],['S','SOL','☀️']];
    const n=Math.max(2,Math.min(4,this.info.letraOpcoes||4));
    const certo=pick(pares), letra=certo[0], palavra=certo[1];
    const lista=baralha([certo,...baralha(pares.filter(x=>x[0]!==letra)).slice(0,n-1)]);
    const img=this.info.imagens;
    this.ctx.raiz.innerHTML=`<div class="desafio-texto"><strong class="letra-grande">${letra}</strong><p>Qual destas palavras começa pela letra ${letra}?</p><div class="opcoes-palavra">${lista.map(x=>`<button class="botao opcao-palavra" data-v="${x[1]}">${img?`<span class="emoji-palavra">${x[2]}</span>`:''}${x[1]}</button>`).join('')}</div></div>`;
    this.pose('apontar'); this.diz(`Escolhe a palavra que começa pela letra ${letra}.`);
    this.ctx.raiz.querySelectorAll('[data-v]').forEach(b=>{const f=()=>this.responde(b,b.dataset.v===palavra,b.dataset.v===palavra?[pick(BEM),`${palavra} começa por ${letra}.`]:`Experimenta outra vez. Procura ${palavra}.`,'#3DA35D');b.addEventListener('click',f);this.limpezas.push(()=>b.removeEventListener('click',f));});
  }

  rondaMemoria(){
    const icons=baralha(['🍎','🐝','🌻','🚲','🐟','⭐']).slice(0,Math.max(2,Math.min(this.info.paresMax||6,this.info.pares||4))), seq=baralha([...icons,...icons]);
    this.ctx.raiz.innerHTML=`<div class="memoria-grelha">${seq.map((v,i)=>`<button class="carta-memoria" data-i="${i}" data-v="${v}" aria-label="Carta ${i+1}">❔</button>`).join('')}</div><p class="instrucao-memoria">Encontra os pares iguais.</p>`;
    let aberto=null, bloqueado=false, paresFeitos=0, falhas=0;
    /* margem justa: cada par pode falhar uma vez (e mais uma de folga) sem perder estrelas */
    const margem=icons.length+1;
    const cartas=[...this.ctx.raiz.querySelectorAll('.carta-memoria')]; this.pose('apontar');this.diz('Descobre os pares iguais.');
    cartas.forEach(b=>{const f=()=>{if(bloqueado||b.classList.contains('virada')||b.classList.contains('par'))return;b.textContent=b.dataset.v;b.classList.add('virada');if(!aberto){aberto=b;return;}if(aberto.dataset.v===b.dataset.v){aberto.classList.add('par');b.classList.add('par');aberto=null;paresFeitos++;this.som('certo');if(paresFeitos===icons.length){this.responde(b,true,'Encontraste todos os pares!','#8E6BC8');}}else{falhas++;if(falhas>margem){if(this.ctx.aoErro)this.ctx.aoErro(this.tipo);this.erros++;}bloqueado=true;const anterior=aberto;aberto=null;setTimeout(()=>{anterior.textContent='❔';b.textContent='❔';anterior.classList.remove('virada');b.classList.remove('virada');bloqueado=false;},850);}};b.addEventListener('click',f);this.limpezas.push(()=>b.removeEventListener('click',f));});
  }

  rondaLogica(){
    const cores=baralha(['🔴','🔵','🟡','🟢']), [A,B,C]=cores;
    /* do mais simples (ABAB) ao mais difícil; a idade decide quantos entram */
    const padroes=[
      { seq:[A,B,A,B,A], certa:B },
      { seq:[A,A,B,A,A], certa:B },
      { seq:[A,B,C,A,B], certa:C },
      { seq:[A,B,B,A,B], certa:B },
    ];
    const p=pick(padroes.slice(0,Math.max(1,Math.min(4,this.info.padroes||2))));
    const resposta=p.certa;
    const nOp=(this.info.padroes||2)>=3?4:3;
    const op=baralha([resposta,...baralha(cores.filter(c=>c!==resposta))].slice(0,nOp));
    this.ctx.raiz.innerHTML=`<div class="desafio-texto"><p>Que peça completa a sequência?</p><div class="sequencia-logica">${p.seq.join('　')}　<strong>?</strong></div><div class="opcoes-logica">${op.map(v=>`<button class="botao opcao-logica" data-v="${v}">${v}</button>`).join('')}</div></div>`;
    this.pose('pensar');this.diz('Observa a sequência. O que vem a seguir?');
    this.ctx.raiz.querySelectorAll('[data-v]').forEach(b=>{const f=()=>this.responde(b,b.dataset.v===resposta,b.dataset.v===resposta?'Isso mesmo! A sequência repete-se.':'Observa as cores e tenta descobrir o padrão.','#2C6FD6');b.addEventListener('click',f);this.limpezas.push(()=>b.removeEventListener('click',f));});
  }

  /* ================================================== SOMAS ================ */
  rondaSomas(){
    const max=Math.max(4,this.info.somaMax||5);
    const a=1+rnd(max-1), b=1+rnd(max-a), total=a+b;
    const fruta=pick(['🍎','🍪','⭐','🐟']);
    const por=n=>NUM_M[n]||String(n);
    const cand=[total-2,total-1,total+1,total+2,total+3].filter(x=>x>=1);
    const op=baralha([total,...baralha(cand).slice(0,3)]);
    const objetos=total<=10?`<div class="soma-objetos"><span>${fruta.repeat(a)}</span><b>+</b><span>${fruta.repeat(b)}</span></div>`:'';
    this.ctx.raiz.innerHTML=`<div class="desafio-texto">${objetos}<p class="soma-conta">${a} + ${b} = ?</p><div class="opcoes-logica">${op.map(v=>`<button class="botao opcao-logica" data-v="${v}">${v}</button>`).join('')}</div></div>`;
    this.pose('pensar');this.diz(`Quanto é ${por(a)} mais ${por(b)}?`);
    this.ctx.raiz.querySelectorAll('[data-v]').forEach(bt=>{const f=()=>this.responde(bt,+bt.dataset.v===total,+bt.dataset.v===total?[pick(BEM),`${por(a)} mais ${por(b)} é ${por(total)}.`]:'Quase! Conta outra vez.','#C98F55');bt.addEventListener('click',f);this.limpezas.push(()=>bt.removeEventListener('click',f));});
  }

  /* ================================================ RESPOSTA =============== */
  /* nunca há castigo: o erro só traz encorajamento e outra tentativa */
  responde(elemento, acertou, texto, cor){
    if(this.aEsperar) return;
    if(acertou){
      this.aEsperar = true;
      if(this.tipo === 'cores') this.som('pop');
      this.som('certo');
      elemento.classList.add('certo');
      const r = elemento.getBoundingClientRect();
      confete(document.body, r.left + r.width / 2, r.top + r.height / 2,
              [cor || '#F5B921', '#F7C21B', '#fff', '#2C6FD6']);
      this.pose('festejar');
      this.ctx.aoAcertar(this.tipo);
      this.diz(elogio(), () => {
        if(!this.aDecorrer) return;
        this.pose('repouso');
        setTimeout(() => this.proxima(), 300);
      });
    }else{
      this.erros++;
      if(this.ctx.aoErro) this.ctx.aoErro(this.tipo);
      this.som('errado');
      elemento.classList.add('errado');
      setTimeout(() => elemento.classList.remove('errado'), 420);
      this.pose('encorajar');
      this.diz(texto, () => { if(this.aDecorrer) this.pose('apontar'); });
    }
  }

  acaba(){
    this.aDecorrer = false;
    this.desliga();
    delete document.body.dataset.jogo;
    const estrelas = this.erros <= 1 ? 3 : this.erros <= 3 ? 2 : 1;
    this.ctx.raiz.innerHTML = '';
    this.pose('festejar');
    this.ctx.aoAcabar(this.nivel, estrelas);
  }
}
