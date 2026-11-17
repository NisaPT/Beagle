/* Histórias dos avós Beagle. Dados puros (sem imports): v = quem fala ('f' avó, 'm' avô).
   Cada passo é uma cena ilustrada com imagens que já existem na app e as falas dessa cena.
   As falas novas gravam-se com: node ferramentas/gerar-historias.mjs */
export const HISTORIAS = [
  { id: 'quinta', titulo: 'Os avós Beagle e a sua quinta', emoji: '🏡', duracao: 'Cerca de 3 minutos', passos: [
    { cena: { fundo: 'ceu', titulo: 'Bem-vindos à quinta!', itens: [
        { e: '☀️', x: 84, y: 16, t: 3.4 }, { e: '🏡', x: 50, y: 46, t: 8 }, { e: '🌻', x: 16, y: 66, t: 3.4 }, { e: '🌻', x: 84, y: 66, t: 3.4 }, { e: '🐦', x: 20, y: 18, t: 2.4 } ] },
      falas: [
        { v: 'f', t: 'Olá, meninos! Eu sou a Avó Beagle.', pose: 'acenar' },
        { v: 'm', t: 'E eu sou o Avô Beagle. Estamos muito contentes por vos ver!', pose: 'acenar' },
        { v: 'f', t: 'Esta é a nossa quinta. Vivemos aqui há muitos e muitos anos.' },
        { v: 'm', t: 'Hoje vamos mostrar-vos tudo. Querem vir connosco?', pose: 'apontar' },
        { v: 'f', t: 'Então vamos! Primeiro, um passeio pela horta.', pose: 'festejar' } ] },
    { cena: { fundo: 'horta', titulo: 'A horta', itens: [
        { id: 'cenoura', x: 18, y: 70, t: 5 }, { id: 'tomate', x: 40, y: 56, t: 5 }, { id: 'alface', x: 62, y: 70, t: 5 }, { id: 'abobora', x: 82, y: 56, t: 5.4 }, { id: 'milho', x: 50, y: 30, t: 5 } ] },
      falas: [
        { v: 'm', t: 'Esta é a nossa horta. Aqui crescem legumes muito saborosos.', pose: 'apontar' },
        { v: 'f', t: 'Olhem as cenouras cor de laranja, os tomates bem vermelhos e as alfaces verdinhas.' },
        { v: 'm', t: 'As plantas precisam de água, de sol e de muito carinho para crescerem.' },
        { v: 'f', t: 'Quando estão prontas, colhemos e levamos para a cozinha.', pose: 'palmas' } ] },
    { cena: { fundo: 'pomar', titulo: 'O pomar', itens: [
        { id: 'maca', x: 20, y: 60, t: 5 }, { id: 'pera', x: 40, y: 40, t: 5 }, { id: 'laranja', x: 60, y: 62, t: 5 }, { id: 'cerejas', x: 80, y: 42, t: 5 }, { e: '🌳', x: 50, y: 20, t: 4.4 } ] },
      falas: [
        { v: 'f', t: 'Ao lado da horta fica o pomar. As árvores dão fruta muito doce.', pose: 'apontar' },
        { v: 'm', t: 'Maçãs, peras, laranjas e cerejas. Qual é a tua fruta preferida?', pose: 'pensar' } ] },
    { cena: { fundo: 'galinheiro', titulo: 'O galinheiro', itens: [
        { id: 'galo', x: 30, y: 52, t: 8 }, { e: '🥚', x: 62, y: 68, t: 3.4 }, { e: '🥚', x: 76, y: 74, t: 3.4 }, { e: '🥚', x: 86, y: 64, t: 3.4 }, { e: '🌾', x: 18, y: 78, t: 3.2 } ] },
      falas: [
        { v: 'f', t: 'Agora vamos ao galinheiro! De manhã cedo, quem nos acorda?', pose: 'pensar' },
        { v: 'm', t: 'É o galo! Ele canta bem alto para dizer bom dia a toda a quinta.' },
        { v: 'f', t: 'As galinhas põem ovos. Todos os dias vamos apanhá-los com muito cuidado.', pose: 'palmas' } ] },
    { cena: { fundo: 'curral', titulo: 'O curral', itens: [
        { id: 'vaca', x: 24, y: 58, t: 10, d3: 1 }, { id: 'ovelha', x: 54, y: 64, t: 7 }, { id: 'porco', x: 80, y: 62, t: 7 } ] },
      falas: [
        { v: 'm', t: 'No curral vivem muitos amigos. Esta é a vaca. Ela faz muuu, e dá-nos leite fresquinho.', pose: 'apontar' },
        { v: 'f', t: 'Esta é a ovelha. Faz mé mé, e tem uma lã macia e fofa.' },
        { v: 'm', t: 'E o porquinho faz oinc oinc. Gosta muito de brincar na lama!', pose: 'festejar' } ] },
    { cena: { fundo: 'campo', titulo: 'O cavalo', itens: [
        { id: 'cavalo', x: 40, y: 56, t: 10 }, { id: 'cenoura', x: 74, y: 72, t: 4 }, { id: 'maca', x: 86, y: 60, t: 4 } ] },
      falas: [
        { v: 'f', t: 'E este é o cavalo, grande e forte. Adora cenouras e maçãs.', pose: 'apontar' },
        { v: 'm', t: 'Todas as manhãs damos de comer aos nossos animais.' } ] },
    { cena: { fundo: 'lago', titulo: 'O lago', itens: [
        { id: 'pato', x: 32, y: 56, t: 10, d3: 1 }, { id: 'ra', x: 72, y: 70, t: 6 }, { e: '💧', x: 18, y: 76, t: 3 }, { e: '🪷', x: 86, y: 46, t: 3.4 } ] },
      falas: [
        { v: 'm', t: 'No lago vivem os patos. Quá, quá, quá! Gostam de nadar e de mergulhar.', pose: 'apontar' },
        { v: 'f', t: 'E aquela rã saltitona também mora aqui perto.' } ] },
    { cena: { fundo: 'casa', titulo: 'Os companheiros', itens: [
        { id: 'cao', x: 30, y: 52, t: 10, d3: 1 }, { id: 'gato', x: 70, y: 56, t: 10, d3: 1 }, { e: '🦴', x: 14, y: 80, t: 3 }, { e: '🐟', x: 86, y: 80, t: 3 } ] },
      falas: [
        { v: 'f', t: 'E os nossos companheiros de todos os dias: o cão e o gato.' },
        { v: 'm', t: 'O cão guarda a quinta e faz au au.', pose: 'festejar' },
        { v: 'f', t: 'O gato anda de mansinho e faz miau.', pose: 'palmas' } ] },
    { cena: { fundo: 'ceu', titulo: 'Até já!', itens: [
        { e: '🏡', x: 50, y: 44, t: 8 }, { e: '🌈', x: 50, y: 14, t: 6 }, { e: '⭐', x: 16, y: 30, t: 3 }, { e: '⭐', x: 84, y: 30, t: 3 }, { e: '💛', x: 50, y: 78, t: 3.6 } ] },
      falas: [
        { v: 'm', t: 'Que passeio tão bonito! Conheceram a nossa quinta e os nossos animais.', pose: 'festejar' },
        { v: 'f', t: 'Agora é a vossa vez de cuidar da quinta. Vamos brincar e aprender juntos!', pose: 'festejar' },
        { v: 'm', t: 'Até já, meninos!', pose: 'acenar' },
        { v: 'f', t: 'Um beijinho grande da Avó Beagle!', pose: 'acenar' } ] },
  ] },
];
