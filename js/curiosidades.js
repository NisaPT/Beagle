/* Mini-filme animado de cada animal, mostrado na primeira compra.
   3 cenas com voz: quem é, o que come, uma curiosidade. */
export const FILMES = {
  galo:      { fundo:['#FFD9A0','#FFB36B'], comida:'🌾', som:'Cócórócó!',
    cenas:['Olá! Eu sou o galo. Canto de manhã cedo para dizer bom dia a toda a quinta!',
           'Eu como milho e bagos de trigo. Bico, bico, bico!',
           'Curiosidade: a crista vermelha que tenho na cabeça ajuda-me a ficar fresquinho.'] },
  coelho:    { fundo:['#CFEFFF','#B7E39C'], comida:'🥕', som:'',
    cenas:['Olá! Eu sou o coelho. Dou saltinhos muito rápidos!',
           'Eu como erva e feno. As cenouras são só um miminho!',
           'Curiosidade: os meus dentes da frente nunca param de crescer!'] },
  cao:       { fundo:['#D6EEFF','#A9DB8F'], comida:'🦴', som:'Au au!',
    cenas:['Olá! Eu sou o cão. Sou o melhor amigo das crianças!',
           'Eu gosto de comer a minha ração e de roer ossinhos.',
           'Curiosidade: o focinho de cada cão é diferente, como a tua impressão digital!'] },
  gato:      { fundo:['#FFE3F0','#C9E8A8'], comida:'🐟', som:'Miau!',
    cenas:['Olá! Eu sou o gato. Ando de mansinho, sem fazer barulho!',
           'Eu gosto de peixe e de leitinho.',
           'Curiosidade: os meus bigodes ajudam-me a sentir tudo o que está perto de mim!'] },
  pato:      { fundo:['#BFE8FF','#7FC7E8'], comida:'🌿', som:'Quá quá!',
    cenas:['Olá! Eu sou o pato. Adoro nadar no lago!',
           'Eu como ervinhas, sementes e pequenos bichinhos da água.',
           'Curiosidade: as minhas penas não deixam a água entrar, por isso nunca fico encharcado!'] },
  ra:        { fundo:['#C9F0D4','#7FC7E8'], comida:'🪰', som:'Croac croac!',
    cenas:['Olá! Eu sou a rã. Salto muito alto com as minhas pernas compridas!',
           'Eu como moscas e mosquitos.',
           'Curiosidade: eu comecei a vida como girino, só com cauda, e depois ganhei pernas!'] },
  tartaruga: { fundo:['#D9F2C8','#8CCFE8'], comida:'🥬', som:'',
    cenas:['Olá! Eu sou a tartaruga. Ando devagarinho, sem pressa nenhuma!',
           'Eu como folhas, alface e frutinhos.',
           'Curiosidade: levo a minha casa às costas, e há tartarugas que vivem mais de cem anos!'] },
  ovelha:    { fundo:['#D4ECFF','#B5E09A'], comida:'🌿', som:'Méé!',
    cenas:['Olá! Eu sou a ovelha. Tenho um casaco fofinho de lã!',
           'Eu como erva fresquinha o dia todo.',
           'Curiosidade: com a minha lã fazem-se camisolas e gorros quentinhos!'] },
  porco:     { fundo:['#FFE6D0','#B9DE95'], comida:'🍎', som:'Oinc oinc!',
    cenas:['Olá! Eu sou o porco. Sou muito esperto e muito simpático!',
           'Eu como frutas, legumes e cereais.',
           'Curiosidade: eu gosto de me rebolar na lama para ficar fresquinho!'] },
  vaca:      { fundo:['#D8EEFF','#A8D98A'], comida:'🌾', som:'Muuu!',
    cenas:['Olá! Eu sou a vaca. Dou o leite que bebes ao pequeno-almoço!',
           'Eu como erva e feno.',
           'Curiosidade: o meu estômago tem quatro partes para digerir bem a erva!'] },
  cavalo:    { fundo:['#CFE9FF','#B3DD8C'], comida:'🥕', som:'Rrrinchar!',
    cenas:['Olá! Eu sou o cavalo. Corro muito depressa pelo campo!',
           'Eu como erva, feno e gosto de cenouras.',
           'Curiosidade: eu consigo dormir de pé!'] },
};

const EL = ['fala','come','curio'];
let atual = null;

/* mostra o filme; chama aoFim quando acaba ou é saltado */
export function miniFilme(b, Som, aoFim){
  const f = FILMES[b.id];
  if(!f){ if(aoFim) aoFim(); return; }
  fecha();
  const raiz = document.createElement('div');
  raiz.className = 'mini-filme';
  raiz.style.setProperty('--c1', f.fundo[0]); raiz.style.setProperty('--c2', f.fundo[1]);
  raiz.innerHTML = `
    <div class="mf-nuvens"><i></i><i></i><i></i></div><div class="mf-sol"></div>
    <div class="mf-relva"></div>
    <div class="mf-titulo">${b.nome}</div>
    <div class="mf-palco"><img class="mf-bicho" src="./media/img/${b.id}.webp" alt="" draggable="false"><div class="mf-fx"></div></div>
    <div class="mf-legenda"><span class="mf-selo"></span><p></p></div>
    <div class="mf-ponto"><i></i><i></i><i></i></div>
    <button class="botao pequeno mf-saltar" type="button">Saltar ▶</button>`;
  document.body.appendChild(raiz);
  const legenda = raiz.querySelector('.mf-legenda p'), selo = raiz.querySelector('.mf-selo');
  const fx = raiz.querySelector('.mf-fx'), bicho = raiz.querySelector('.mf-bicho');
  const pontos = [...raiz.querySelectorAll('.mf-ponto i')];
  let i = -1, morto = false, timer = null, geracao = 0;
  const estado = { falou:false, passou:false };
  const termina = () => {
    if(morto) return; morto = true;
    clearTimeout(timer); try{ Som.paraVoz(); }catch(e){}
    raiz.classList.add('sai'); setTimeout(() => { raiz.remove(); if(atual === raiz) atual = null; }, 350);
    if(aoFim) aoFim();
  };
  const cena = () => {
    if(morto) return;
    i++;
    if(i >= f.cenas.length) return termina();
    const g = ++geracao;
    estado.falou = false; estado.passou = false;
    raiz.dataset.cena = EL[i];
    selo.textContent = ['👋', f.comida, '💡'][i];
    legenda.textContent = f.cenas[i];
    pontos.forEach((p, k) => p.classList.toggle('on', k <= i));
    bicho.classList.remove('pop'); void bicho.offsetWidth; bicho.classList.add('pop');
    fx.innerHTML = i === 1
      ? Array.from({length:6}, (_, k) => `<span style="--k:${k}">${f.comida}</span>`).join('')
      : i === 2 ? Array.from({length:8}, (_, k) => `<span class="est" style="--k:${k}">✨</span>`).join('') : '';
    const seguir = () => { if(g === geracao && estado.falou && estado.passou) cena(); };
    timer = setTimeout(() => { estado.passou = true; seguir(); }, Math.max(4200, f.cenas[i].length * 75));
    Som.fala(f.cenas[i], () => { estado.falou = true; seguir(); });
  };
  raiz.querySelector('.mf-saltar').onclick = termina;
  atual = raiz;
  Som.efeito && Som.efeito('nivel');
  setTimeout(cena, 450);
}
export function fecha(){ if(atual){ atual.remove(); atual = null; } }
