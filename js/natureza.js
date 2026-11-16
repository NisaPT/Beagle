/* Jogos de Animais, Frutas e Legumes.
   Cada item: [ficheiro, nome, artigo, nível (1 = mais conhecido), extras].
   O nível e os modos de jogo dependem da idade (ver idades.js). */

const imgSrc = id => ['cao', 'gato', 'vaca', 'pato'].includes(id) ? `./media/img/3d-${id}.webp` : `./media/img/${id}.webp`;   /* os 4 animais 3D têm nome novo: ignora imagens antigas na cache */
const rnd = n => Math.floor(Math.random() * n);
/* animais com modelo 3D (animais3d.js): nas cartas ganham vida — andam no lugar e saltam ao toque */
const A3D = new Set(['cao', 'gato', 'vaca', 'pato']);
const atr3d = id => A3D.has(id) ? ` data-a3d="${id}"` : '';
const vida3d = raiz => { if(raiz.querySelector('img[data-a3d]')) import('./animais3d.js').then(m => m.ativaCartas(raiz)).catch(e => console.warn('Animais 3D indisponíveis', e)); };
const pick = a => a[rnd(a.length)];
function baralha(a){
  for(let i = a.length - 1; i > 0; i--){ const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const Cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const semAcentos = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

const BEM = ['Muito bem!', 'Boa!', 'Isso mesmo!', 'Parabéns!'];
const EM = { o:'no', a:'na', os:'nos', as:'nas' };
const NUM_F = ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
const NUM_M = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];

/* cor: [masculino, feminino, masc. plural, fem. plural] + cor do confete */
const COR = {
  vermelho:['vermelho', 'vermelha', 'vermelhos', 'vermelhas', '#E0162B'],
  amarelo: ['amarelo',  'amarela',  'amarelos',  'amarelas',  '#F7C21B'],
  laranja: ['laranja',  'laranja',  'laranja',   'laranja',   '#F3822B'],
  verde:   ['verde',    'verde',    'verdes',    'verdes',    '#3DA35D'],
  roxo:    ['roxo',     'roxa',     'roxos',     'roxas',     '#8E6BC8'],
  azul:    ['azul',     'azul',     'azuis',     'azuis',     '#2C6FD6'],
};

/* ficheiro, nome, artigo, nível, extras { cor, som, grupo, pl, tipo } */
const ANIMAIS = [
  ['cao','cão','o',1,{som:'au au'}],            ['gato','gato','o',1,{som:'miau'}],
  ['vaca','vaca','a',1,{som:'muuu',grupo:'quinta'}], ['porco','porco','o',1,{som:'oinc oinc',grupo:'quinta'}],
  ['ovelha','ovelha','a',1,{som:'mé mé',grupo:'quinta'}], ['pato','pato','o',1,{som:'quá quá',grupo:'quinta'}],
  ['galo','galo','o',1,{som:'cocorocó',grupo:'quinta'}], ['cavalo','cavalo','o',1,{grupo:'quinta'}],
  ['leao','leão','o',1], ['elefante','elefante','o',1], ['coelho','coelho','o',1], ['macaco','macaco','o',1],
  ['girafa','girafa','a',2], ['tigre','tigre','o',2], ['urso','urso','o',2], ['zebra','zebra','a',2],
  ['panda','panda','o',2], ['ra','rã','a',2,{som:'croac croac'}], ['tartaruga','tartaruga','a',2],
  ['baleia','baleia','a',2,{grupo:'mar'}], ['golfinho','golfinho','o',2,{grupo:'mar'}],
  ['pinguim','pinguim','o',2], ['esquilo','esquilo','o',2], ['raposa','raposa','a',2],
  ['canguru','canguru','o',3], ['coala','coala','o',3], ['lobo','lobo','o',3],
  ['foca','foca','a',3,{grupo:'mar'}], ['crocodilo','crocodilo','o',3], ['ourico','ouriço','o',3],
];

const FRUTAS = [
  ['maca','maçã','a',1,{cor:'vermelho',pl:'maçãs',tipo:'fruta'}], ['banana','banana','a',1,{cor:'amarelo',pl:'bananas',tipo:'fruta'}],
  ['laranja','laranja','a',1,{cor:'laranja',pl:'laranjas',tipo:'fruta'}], ['morango','morango','o',1,{cor:'vermelho',pl:'morangos',tipo:'fruta'}],
  ['uvas','uvas','as',1,{cor:'roxo',tipo:'fruta'}], ['cerejas','cerejas','as',1,{cor:'vermelho',tipo:'fruta'}],
  ['melancia','melancia','a',1,{tipo:'fruta'}], ['limao','limão','o',1,{cor:'amarelo',pl:'limões',tipo:'fruta'}],
  ['pera','pera','a',1,{cor:'verde',pl:'peras',tipo:'fruta'}],
  ['ananas','ananás','o',2,{cor:'amarelo',tipo:'fruta'}], ['pessego','pêssego','o',2,{tipo:'fruta'}],
  ['kiwi','quivi','o',2,{cor:'verde',tipo:'fruta'}], ['coco','coco','o',2], ['manga','manga','a',2,{tipo:'fruta'}],
  ['abacate','abacate','o',2,{cor:'verde'}], ['melao','melão','o',2,{cor:'amarelo'}],
  ['mirtilos','mirtilos','os',3,{cor:'azul'}], ['framboesa','framboesa','a',3], ['amora','amora','a',3],
  ['roma','romã','a',3,{cor:'vermelho'}], ['figo','figo','o',3,{cor:'roxo'}], ['papaia','papaia','a',3],
  ['carambola','carambola','a',3,{cor:'amarelo'}], ['pitaia','pitaia','a',3], ['lichia','lichia','a',3],
  ['diospiro','dióspiro','o',3,{cor:'laranja'}], ['goiaba','goiaba','a',3,{cor:'verde'}], ['caju','caju','o',3],
  ['damasco','damasco','o',3,{cor:'laranja'}],
];

const LEGUMES = [
  ['cenoura','cenoura','a',1,{cor:'laranja',pl:'cenouras',tipo:'legume'}], ['batata','batata','a',1,{pl:'batatas',tipo:'legume'}],
  ['tomate','tomate','o',1,{cor:'vermelho',pl:'tomates'}], ['brocolos','brócolos','os',1,{cor:'verde',tipo:'legume'}],
  ['alface','alface','a',1,{cor:'verde',tipo:'legume'}], ['abobora','abóbora','a',1,{cor:'laranja',pl:'abóboras'}],
  ['pepino','pepino','o',1,{cor:'verde',pl:'pepinos'}], ['milho','milho','o',1,{cor:'amarelo'}],
  ['couveflor','couve-flor','a',2,{tipo:'legume'}], ['beringela','beringela','a',2,{cor:'roxo',pl:'beringelas'}],
  ['courgette','curgete','a',2,{cor:'verde',pl:'curgetes'}], ['pimento','pimento','o',2,{cor:'vermelho',pl:'pimentos'}],
  ['cebola','cebola','a',2,{tipo:'legume'}], ['alho','alho','o',2,{tipo:'legume'}],
  ['espinafres','espinafres','os',2,{cor:'verde',tipo:'legume'}], ['ervilhas','ervilhas','as',2,{cor:'verde'}],
  ['cogumelo','cogumelo','o',2], ['beterraba','beterraba','a',2,{cor:'roxo',tipo:'legume'}], ['couve','couve','a',2,{cor:'verde',tipo:'legume'}],
  ['rabanete','rabanete','o',3,{tipo:'legume'}], ['espargos','espargos','os',3,{cor:'verde',tipo:'legume'}],
  ['alhoporro','alho-francês','o',3,{tipo:'legume'}], ['aipo','aipo','o',3,{tipo:'legume'}],
  ['alcachofra','alcachofra','a',3], ['batatadoce','batata-doce','a',3], ['feijaoverde','feijão-verde','o',3,{cor:'verde'}],
  ['gengibre','gengibre','o',3], ['nabo','nabo','o',3,{tipo:'legume'}], ['funcho','funcho','o',3], ['quiabo','quiabo','o',3],
];

const fazItens = lista => lista.map(([id, nome, art, nivel, x]) => ({ id, nome, art, nivel, ...(x || {}) }));
export const ITENS = { animais:fazItens(ANIMAIS), frutas:fazItens(FRUTAS), legumes:fazItens(LEGUMES) };
export const TODAS_AS_IMAGENS = [...ANIMAIS, ...FRUTAS, ...LEGUMES].map(x => imgSrc(x[0]));

const plural = it => it.art === 'os' || it.art === 'as';
const masc = it => it.art === 'o' || it.art === 'os';
const com = it => `${it.art} ${it.nome}`;
const adj = (it, c) => COR[c][(masc(it) ? 0 : 1) + (plural(it) ? 2 : 0)];
const verbo = it => plural(it) ? 'são' : 'é';
const esse = it => plural(it) ? 'Esses são' : masc(it) ? 'Esse é' : 'Essa é';
const letraInicial = it => semAcentos(it.nome).charAt(0).toUpperCase();


export const CATEGORIAS_ALBUM = ['animais', 'frutas', 'legumes'];
export const imagemItem = imgSrc;
export const rotuloTipo = { animais:'Animais', frutas:'Frutas', legumes:'Legumes' };

/* ------------------------------------------------------------------ jogo */
export function rondaNatureza(jogo, cat){
  const info = jogo.info, nat = info.nat || {};
  const nivelMax = nat.nivel || 2;
  const modos = (nat.modos && nat.modos[cat]) || ['nome'];
  const todos = ITENS[cat];
  let pool = todos.filter(x => x.nivel <= nivelMax);
  const nOpc = Math.max(2, Math.min(6, info.opcoes || 3));
  const evita = jogo._natUltimo;                       /* não repetir já a mesma resposta */

  const escolheResposta = lista => {
    const l = lista.filter(x => !evita || x.id !== evita);
    return pick(l.length ? l : lista);
  };
  const opcoesCom = (certa, outros, n) =>
    baralha([certa, ...baralha(outros.filter(x => x.id !== certa.id)).slice(0, n - 1)]);

  /* escolhe o modo possível (alguns precisam de dados que o conjunto não tem) */
  const tenta = {
    nome:   () => modoNome(),
    som:    () => modoSom(),
    grupo:  () => modoGrupo(),
    inicial:() => modoInicial(),
    cor:    () => modoCor(),
    contagem:() => modoContagem(),
    tipo:   () => modoTipo(),
    escondidos: () => modoEscondidos(),
  };

  /* ----------------------------------------------------- desenho comum */
  function desenha(opcoes, textoPergunta, pista, aoEscolher, legenda){
    const cols = opcoes.length <= 3 ? opcoes.length : opcoes.length === 4 ? 2 : 3;
    jogo.ctx.raiz.innerHTML = `<div class="cartas-nat" style="--cols:${cols}" data-n="${opcoes.length}">${opcoes.map((it, i) =>
      `<button class="carta-nat" data-id="${it.id}" aria-label="${it.nome}" style="--atraso:${i * 90}ms">
         <img src="${imgSrc(it.id)}" alt="" draggable="false" decoding="async"${atr3d(it.id)}>
         ${legenda ? `<span class="legenda-nat">${it.nome}</span>` : ''}
       </button>`).join('')}</div>`;
    vida3d(jogo.ctx.raiz);
    jogo.pose('apontar');
    jogo.diz(textoPergunta, () => { if(jogo.aDecorrer) jogo.pose('repouso'); }, pista);
    jogo.ctx.raiz.querySelectorAll('.carta-nat').forEach(b => {
      const f = () => aoEscolher(todos.find(x => x.id === b.dataset.id), b);
      b.addEventListener('click', f);
      jogo.limpezas.push(() => b.removeEventListener('click', f));
    });
  }
  const certo = (b, it, texto, cor) => {
    jogo._natUltimo = it.id;
    if(jogo.ctx.aoColecionar && !jogo.emBonus) jogo.ctx.aoColecionar(it.id, cat);   /* cromo para o álbum */
    jogo.responde(b, true, texto, cor);
  };
  const errado = (b, texto) => jogo.responde(b, false, texto);
  const legendaSempre = !!nat.nomes;

  /* --------------------------------------------------------- 1. nome */
  function modoNome(){
    const certa = escolheResposta(pool);
    const op = opcoesCom(certa, pool, nOpc);
    desenha(op, `Toca ${EM[certa.art]} ${certa.nome}.`, '', (it, b) => {
      if(it.id === certa.id) certo(b, it, [pick(BEM), `${plural(certa) ? 'São' : 'É'} ${com(certa)}.`], '#F5B921');
      else errado(b, [`${esse(it)} ${com(it)}.`, `Procura ${com(certa)}.`]);
    }, legendaSempre);
  }

  /* ------------------------------------------------ 1b. escondidos */
  /* as cartas estão tapadas por arbustos: ao tocar descobre-se o que está lá debaixo.
     As perguntas e as respostas são as mesmas do modo "nome" (frases já gravadas). */
  function modoEscondidos(){
    const certa = escolheResposta(pool);
    const op = opcoesCom(certa, pool, Math.min(nOpc, 4));
    desenha(op, `Toca ${EM[certa.art]} ${certa.nome}.`, '', (it, b) => {
      b.classList.remove('tapada');
      if(it.id === certa.id) certo(b, it, [pick(BEM), `${plural(certa) ? 'São' : 'É'} ${com(certa)}.`], '#F5B921');
      else errado(b, [`${esse(it)} ${com(it)}.`, `Procura ${com(certa)}.`]);
    }, true);
    jogo.ctx.raiz.querySelectorAll('.carta-nat').forEach(b => b.classList.add('tapada'));
  }

  /* ---------------------------------------------------------- 2. som */
  function modoSom(){
    const com_som = pool.filter(x => x.som);
    if(com_som.length < 2) return false;
    const certa = escolheResposta(com_som);
    const op = opcoesCom(certa, pool, Math.min(nOpc, 4));
    desenha(op, `Quem faz ${certa.som}?`, '', (it, b) => {
      if(it.id === certa.id) certo(b, it, [pick(BEM), `${Cap(com(certa))} faz ${certa.som}.`], '#F5B921');
      else errado(b, [`${esse(it)} ${com(it)}.`, `Quem faz ${certa.som}?`]);
    }, legendaSempre);
  }

  /* ------------------------------------------------------- 3. grupo */
  function modoGrupo(){
    const g = Math.random() < .6 ? 'quinta' : 'mar';
    const certos = pool.filter(x => x.grupo === g);
    if(!certos.length) return false;
    const ambiguos = ['cao','gato','coelho','ra','tartaruga','crocodilo','pinguim'];
    const foraOk = pool.filter(x => x.grupo !== g && !ambiguos.includes(x.id));
    if(foraOk.length < 2) return false;
    const certa = escolheResposta(certos);
    const op = opcoesCom(certa, foraOk, Math.min(nOpc, 4));
    const q = g === 'quinta' ? 'Qual destes animais vive na quinta?' : 'Qual destes animais vive na água do mar?';
    const onde = g === 'quinta' ? 'vive na quinta' : 'vive no mar';
    desenha(op, q, g === 'quinta' ? '🏡' : '🌊', (it, b) => {
      if(it.id === certa.id) certo(b, it, [pick(BEM), `${Cap(com(certa))} ${onde}.`], '#F5B921');
      else errado(b, g === 'quinta' ? `Esse não vive na quinta. Tenta outra vez.` : `Esse não vive no mar. Tenta outra vez.`);
    }, legendaSempre);
  }

  /* ----------------------------------------------------- 4. inicial */
  function modoInicial(){
    const certa = escolheResposta(pool);
    const L = letraInicial(certa);
    const outros = pool.filter(x => letraInicial(x) !== L);
    if(outros.length < 2) return false;
    /* uma só por letra, para não haver duas respostas certas */
    const vistas = new Set([L]), distra = [];
    for(const x of baralha(outros)){ const l = letraInicial(x); if(!vistas.has(l)){ vistas.add(l); distra.push(x); } }
    const op = baralha([certa, ...distra.slice(0, Math.min(nOpc, 4) - 1)]);
    if(op.length < 2) return false;
    desenha(op, `Qual ${cat === 'animais' ? 'animal' : cat === 'frutas' ? 'fruta' : 'legume'} começa pela letra ${L}?`, `<b class="pista-letra">${L}</b>`, (it, b) => {
      if(it.id === certa.id) certo(b, it, [pick(BEM), `${Cap(com(certa))} começa pela letra ${L}.`], '#F5B921');
      else errado(b, [`Esse começa por ${letraInicial(it)}.`, `Procura a letra ${L}.`]);
    }, true);
  }

  /* ---------------------------------------------------------- 5. cor */
  function modoCor(){
    const comCor = pool.filter(x => x.cor);
    const cores = [...new Set(comCor.map(x => x.cor))];
    if(cores.length < 3) return false;
    const c = pick(cores);
    const certa = escolheResposta(comCor.filter(x => x.cor === c));
    /* distratores de cores todas diferentes */
    const vistas = new Set([c]), distra = [];
    for(const x of baralha(comCor.filter(x => x.cor !== c))){ if(!vistas.has(x.cor)){ vistas.add(x.cor); distra.push(x); } }
    const op = baralha([certa, ...distra.slice(0, Math.min(nOpc, 4) - 1)]);
    const nomeCat = cat === 'frutas' ? 'a fruta' : 'o legume';
    const adjCat = COR[c][cat === 'frutas' ? 1 : 0];
    desenha(op, `Qual é ${nomeCat} ${adjCat}?`, `<i class="pista-cor" style="background:${COR[c][4]}"></i>`, (it, b) => {
      if(it.id === certa.id) certo(b, it, [pick(BEM), `${Cap(com(certa))} ${verbo(certa)} ${adj(certa, c)}.`], COR[c][4]);
      else errado(b, [`${Cap(com(it))} ${verbo(it)} ${adj(it, it.cor || c)}.`, `Procura ${nomeCat} ${adjCat}.`]);
    }, legendaSempre);
  }

  /* ----------------------------------------------------- 6. contagem */
  function modoContagem(){
    const lista = todos.filter(x => x.pl && x.nivel <= Math.min(nivelMax, 2));
    if(!lista.length) return false;
    const it = escolheResposta(lista);
    const max = Math.max(3, Math.min(10, info.maxConta || 5));
    const n = 1 + rnd(max);
    const num = masc(it) ? NUM_M : NUM_F;
    const nomes = n === 1 ? it.nome : it.pl;
    const cand = new Set([n]);
    for(const d of baralha([-2, -1, 1, 2, 3])){ const v = n + d; if(v >= 1 && v <= max + 2 && cand.size < 4) cand.add(v); }
    const op = baralha([...cand]);
    const porLinha = n <= 3 ? n : n <= 6 ? 3 : 5;
    jogo.ctx.raiz.innerHTML = `<div class="contagem-nat">
        <div class="grupo-nat" style="--por:${porLinha}">${Array.from({length:n}, (_, i) =>
          `<img src="${imgSrc(it.id)}" alt="" draggable="false"${n <= 4 ? atr3d(it.id) : ''} style="--giro:${rnd(30) - 15}deg;--atraso:${i * 70}ms">`).join('')}</div>
        <div class="opcoes-logica opcoes-num" style="--cols:${op.length > 3 ? 4 : op.length}">${op.map(v =>
          `<button class="botao opcao-logica" data-v="${v}">${v}</button>`).join('')}</div></div>`;
    vida3d(jogo.ctx.raiz);
    jogo.pose('pensar');
    const pergunta = `Quantas ${it.pl} há?`.replace('Quantas', masc(it) ? 'Quantos' : 'Quantas');
    jogo.diz(pergunta, () => { if(jogo.aDecorrer) jogo.pose('repouso'); });
    jogo.ctx.raiz.querySelectorAll('[data-v]').forEach(b => {
      const f = () => {
        if(+b.dataset.v === n) certo(b, it, [pick(BEM), `Há ${num[n] || n} ${nomes}.`], '#F5B921');
        else errado(b, 'Quase! Conta outra vez, um a um.');
      };
      b.addEventListener('click', f);
      jogo.limpezas.push(() => b.removeEventListener('click', f));
    });
  }

  /* ----------------------------------------------------- 7. fruta ou legume */
  function modoTipo(){
    const pot = [...ITENS.frutas, ...ITENS.legumes].filter(x => x.tipo && x.nivel <= nivelMax);
    if(pot.length < 4) return false;
    const it = escolheResposta(pot);
    jogo.ctx.raiz.innerHTML = `<div class="contagem-nat tipo-nat">
        <div class="grupo-nat um"><img src="${imgSrc(it.id)}" alt="" draggable="false"></div>
        <div class="opcoes-logica opcoes-tipo">
          <button class="botao opcao-logica" data-v="fruta">🍎 Fruta</button>
          <button class="botao opcao-logica" data-v="legume">🥕 Legume</button>
        </div></div>`;
    jogo.pose('pensar');
    jogo.diz(plural(it) ? `${Cap(com(it))} são frutas ou legumes?` : `${Cap(com(it))} é fruta ou legume?`,
             () => { if(jogo.aDecorrer) jogo.pose('repouso'); });
    jogo.ctx.raiz.querySelectorAll('[data-v]').forEach(b => {
      const f = () => {
        const nome = it.tipo === 'fruta' ? (plural(it) ? 'frutas' : 'uma fruta') : (plural(it) ? 'legumes' : 'um legume');
        if(b.dataset.v === it.tipo) certo(b, it, [pick(BEM), `${Cap(com(it))} ${verbo(it)} ${nome}.`], '#F5B921');
        else errado(b, 'Pensa outra vez. Olha bem para a imagem.');
      };
      b.addEventListener('click', f);
      jogo.limpezas.push(() => b.removeEventListener('click', f));
    });
  }

  /* arranca: só depois de tudo estar definido */
  const ordem = baralha(modos.slice());
  for(const m of ordem){ if(tenta[m]() !== false) return; }
  modoNome();
}
