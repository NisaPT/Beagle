/* Histórias dos avós Beagle. Dados puros (sem imports): v = quem fala ('f' avó, 'm' avô).
   'mundo' descreve a quinta por onde os avós caminham (x em larguras de ecrã); cada passo leva-os a uma
   estação: 'andando' são as falas durante a caminhada e 'falas' as de quando chegam e param.
   'som' (opcional) é o som do animal, dito logo a seguir à fala (clip que já existe na voz).
   As falas novas gravam-se com: node ferramentas/gerar-historias.mjs */
export const HISTORIAS = [
  { id: 'quinta', titulo: 'Os avós Beagle e a sua quinta', emoji: '🏡', duracao: 'Cerca de 4 minutos', filme: './media/video/historia-quinta.mp4', poster: './media/video/historia-quinta.jpg',
    mundo: { estacoes: [
      { id: 'casa', x: 0, edificio: 'casa', itens: [
        { e: '🌻', dx: -34, fila: 'frente', t: 3.4 }, { e: '🌻', dx: 36, fila: 'frente', t: 3.4 }, { e: '🌷', dx: -24, fila: 'frente', t: 2.4 } ] },
      { id: 'horta', x: 100, edificio: 'horta', itens: [
        { id: 'cenoura', dx: -34, fila: 'frente', t: 4.2, modo: 'bob' }, { id: 'tomate', dx: -17, fila: 'frente', t: 4.2, modo: 'bob' },
        { id: 'alface', dx: 0, fila: 'frente', t: 4.2, modo: 'bob' }, { id: 'abobora', dx: 17, fila: 'frente', t: 4.4, modo: 'bob' }, { id: 'milho', dx: 34, fila: 'frente', t: 4.2, modo: 'bob' } ] },
      { id: 'pomar', x: 200, edificio: 'pomar', itens: [
        { e: '🌳', dx: -36, fila: 'tras', t: 6.7 }, { e: '🌳', dx: 38, fila: 'tras', t: 5.9 },
        { id: 'maca', dx: -26, fila: 'frente', t: 4.0, modo: 'bob' }, { id: 'pera', dx: -9, fila: 'frente', t: 4.0, modo: 'bob' },
        { id: 'laranja', dx: 9, fila: 'frente', t: 4.0, modo: 'bob' }, { id: 'cerejas', dx: 26, fila: 'frente', t: 4.0, modo: 'bob' } ] },
      { id: 'galinheiro', x: 300, edificio: 'galinheiro', itens: [
        { id: 'galo', dx: -26, fila: 'frente', t: 4.7, modo: 'anda', passeio: 14 },
        { e: '🥚', dx: 18, fila: 'frente', t: 2.6 }, { e: '🥚', dx: 26, fila: 'frente', t: 2.6 }, { e: '🥚', dx: 34, fila: 'frente', t: 2.6 }, { e: '🌾', dx: -40, fila: 'frente', t: 3.0 } ] },
      { id: 'curral', x: 400, edificio: 'vacaria', itens: [
        { id: 'vaca', dx: -30, fila: 'frente', t: 8.8, d3: 1 }, { id: 'ovelha', dx: 2, fila: 'frente', t: 4.7, modo: 'anda', passeio: 10 },
        { id: 'porco', dx: 32, fila: 'frente', t: 4.7, modo: 'anda', passeio: 8 } ] },
      { id: 'estabulo', x: 500, edificio: 'estabulo', itens: [
        { id: 'cavalo', dx: -6, fila: 'frente', t: 6.7, modo: 'anda', passeio: 10 }, { id: 'cenoura', dx: 28, fila: 'frente', t: 3.4, modo: 'bob' }, { id: 'maca', dx: 38, fila: 'frente', t: 3.4, modo: 'bob' } ] },
      { id: 'lago', x: 600, edificio: 'lago', itens: [
        { id: 'pato', dx: -22, fila: 'frente', t: 8.2, d3: 1 }, { id: 'ra', dx: 24, fila: 'frente', t: 5.0, modo: 'salta' }, { e: '🪷', dx: 40, fila: 'frente', t: 3.0 } ] },
      { id: 'casa2', x: 700, edificio: 'casa', itens: [
        { id: 'cao', dx: -26, fila: 'frente', t: 8.4, d3: 1 }, { id: 'gato', dx: 26, fila: 'frente', t: 8.4, d3: 1 }, { e: '🦴', dx: -40, fila: 'frente', t: 2.8 }, { e: '🐟', dx: 40, fila: 'frente', t: 2.8 } ] },
    ] },
    passos: [
      { para: 'casa', falas: [
        { v: 'f', t: 'Olá, meninos! Eu sou a Avó Beagle.', pose: 'acenar' },
        { v: 'm', t: 'E eu sou o Avô Beagle. Estamos muito contentes por vos ver!', pose: 'acenar' },
        { v: 'f', t: 'Esta é a nossa quinta. Vivemos aqui há muitos e muitos anos.' },
        { v: 'm', t: 'Hoje vamos mostrar-vos tudo. Querem vir connosco?', pose: 'apontar' },
        { v: 'f', t: 'Então vamos! Primeiro, um passeio pela horta.', pose: 'festejar' } ] },
      { para: 'horta', andando: [ { v: 'm', t: 'Venham connosco, meninos! O caminho é por aqui.' } ], falas: [
        { v: 'm', t: 'Esta é a nossa horta. Aqui crescem legumes muito saborosos.', pose: 'apontar' },
        { v: 'f', t: 'Olhem as cenouras cor de laranja, os tomates bem vermelhos e as alfaces verdinhas.' },
        { v: 'm', t: 'As plantas precisam de água, de sol e de muito carinho para crescerem.' },
        { v: 'f', t: 'Quando estão prontas, colhemos e levamos para a cozinha.', pose: 'palmas' } ] },
      { para: 'pomar', andando: [ { v: 'f', t: 'Ouvem os passarinhos a cantar?' } ], falas: [
        { v: 'f', t: 'Ao lado da horta fica o pomar. As árvores dão fruta muito doce.', pose: 'apontar' },
        { v: 'm', t: 'Maçãs, peras, laranjas e cerejas. Qual é a tua fruta preferida?', pose: 'pensar' } ] },
      { para: 'galinheiro', andando: [ { v: 'm', t: 'Sigam-nos, que ainda há muito para ver!' } ], falas: [
        { v: 'f', t: 'Agora vamos ao galinheiro! De manhã cedo, quem nos acorda?', pose: 'pensar' },
        { v: 'm', t: 'É o galo! Ele canta bem alto para dizer bom dia a toda a quinta.', som: 'Cócórócó!' },
        { v: 'f', t: 'As galinhas põem ovos. Todos os dias vamos apanhá-los com muito cuidado.', pose: 'palmas' } ] },
      { para: 'curral', andando: [ { v: 'f', t: 'Vamos ver os amigos do curral!' } ], falas: [
        { v: 'm', t: 'No curral vivem muitos amigos. Esta é a vaca. Ela faz muuu, e dá-nos leite fresquinho.', pose: 'apontar', som: 'Muuu!' },
        { v: 'f', t: 'Esta é a ovelha. Faz mé mé, e tem uma lã macia e fofa.', som: 'Méé!' },
        { v: 'm', t: 'E o porquinho faz oinc oinc. Gosta muito de brincar na lama!', pose: 'festejar', som: 'Oinc oinc!' } ] },
      { para: 'estabulo', andando: [ { v: 'm', t: 'Mais um bocadinho e chegamos ao estábulo.' } ], falas: [
        { v: 'f', t: 'E este é o cavalo, grande e forte. Adora cenouras e maçãs.', pose: 'apontar' },
        { v: 'm', t: 'Todas as manhãs damos de comer aos nossos animais.' } ] },
      { para: 'lago', andando: [ { v: 'f', t: 'Estão a ouvir a água a correr? Vamos ao lago!' } ], falas: [
        { v: 'm', t: 'No lago vivem os patos. Quá, quá, quá! Gostam de nadar e de mergulhar.', pose: 'apontar', som: 'Quá quá!' },
        { v: 'f', t: 'E aquela rã saltitona também mora aqui perto.', som: 'Croac croac!' } ] },
      { para: 'casa2', andando: [ { v: 'm', t: 'Vamos voltar para casa, que alguém nos espera.' } ], falas: [
        { v: 'f', t: 'E os nossos companheiros de todos os dias: o cão e o gato.' },
        { v: 'm', t: 'O cão guarda a quinta e faz au au.', pose: 'festejar', som: 'Au au!' },
        { v: 'f', t: 'O gato anda de mansinho e faz miau.', pose: 'palmas', som: 'Miau!' } ] },
      { para: 'casa2', falas: [
        { v: 'm', t: 'Que passeio tão bonito! Conheceram a nossa quinta e os nossos animais.', pose: 'festejar' },
        { v: 'f', t: 'Agora é a vossa vez de cuidar da quinta. Vamos brincar e aprender juntos!', pose: 'festejar' },
        { v: 'm', t: 'Até já, meninos!', pose: 'acenar' },
        { v: 'f', t: 'Um beijinho grande da Avó Beagle!', pose: 'acenar' } ] },
    ] },
];
