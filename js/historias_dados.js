/* Histórias dos avós Beagle. Dados puros (sem imports): v = quem fala ('f' avó, 'm' avô).
   'mundo' descreve a quinta por onde os avós caminham (x em larguras de ecrã); cada passo leva-os a uma
   estação: 'andando' são as falas durante a caminhada e 'falas' as de quando chegam e param.
   'som' (opcional) é o som do animal, dito logo a seguir à fala (clip que já existe na voz).
   As falas novas gravam-se com: node ferramentas/gerar-historias.mjs */
export const HISTORIAS = [
  { id: 'quinta', titulo: 'Os avós Beagle e a sua quinta', emoji: '🏡', duracao: 'Cerca de 4 minutos', soFilme: true, tituloFilme: 'Como é a quinta dos avós Beagle', filme: './media/video/historia-quinta.mp4', poster: './media/video/historia-quinta.jpg',
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
  { id: 'cavalo', titulo: 'O Faísca e a pedra', emoji: '🐴', duracao: 'Cerca de 4 minutos', soFilme: true, tituloFilme: 'Episódio 2: O cavalo Faísca e a pedra', filme: './media/video/historia-cavalo.mp4', poster: './media/video/historia-cavalo.jpg',
    mundo: { estacoes: [
      { id: 'casa', x: 0, edificio: 'casa', itens: [
        { id: 'cao', dx: -30, fila: 'frente', t: 6.6, d3: 1 }, { id: 'gato', dx: 30, fila: 'frente', t: 6.6, d3: 1 },
        { e: '🌻', dx: -42, fila: 'frente', t: 3.2 }, { e: '🌷', dx: 44, fila: 'frente', t: 2.4 },
        { k: 'c_caixa', e: '🧰', dx: 0, fila: 'frente', t: 3.2, oculto: true }, { k: 'c_balde', e: '🪣', dx: -14, fila: 'frente', t: 3, oculto: true },
        { k: 'c_gelo', e: '🧊', dx: 14, fila: 'frente', t: 3, oculto: true }, { k: 'c_ervas', e: '🌿', dx: -26, fila: 'frente', t: 3, oculto: true },
        { k: 'c_lig', e: '🩹', dx: 26, fila: 'frente', t: 3, oculto: true } ] },
      { id: 'estabulo', x: 100, edificio: 'estabulo', itens: [
        { k: 'palha', e: '🌾', dx: -6, fila: 'frente', t: 5.6, oculto: true },
        { k: 'pedra', e: '🪨', dx: -27, fila: 'frente', t: 3.6 },
        { k: 'flores', e: '🌼', dx: -34, fila: 'frente', t: 3, oculto: true }, { k: 'flores2', e: '🌷', dx: -26, fila: 'frente', t: 2.6, oculto: true },
        { k: 'cavalo', id: 'cavalo', dx: 8, fila: 'frente', t: 10.5, modo: 'longe', d3: 1, passeio: 40, q: -21 },
        { k: 'ligadura', anexa: 'cavalo', e: '🩹', ax: 27, ay: 10, t: 2.4, oculto: true },
        { k: 'dor', anexa: 'cavalo', e: '💢', ax: 25, ay: 24, t: 2.2, oculto: true },
        { k: 'lagrima', anexa: 'cavalo', e: '💧', ax: 14, ay: 66, t: 1.8, oculto: true },
        { k: 'gelo', anexa: 'cavalo', e: '🧊', ax: 27, ay: 12, t: 2.4, oculto: true },
        { k: 'ervas', anexa: 'cavalo', e: '🌿', ax: 29, ay: 12, t: 2.4, oculto: true },
        { k: 'coracao', anexa: 'cavalo', e: '💕', ax: 62, ay: 92, t: 2.4, oculto: true },
        { k: 'balde', e: '🪣', dx: 34, fila: 'frente', t: 3.2, oculto: true },
        { k: 'cenoura', id: 'cenoura', dx: 38, fila: 'frente', t: 3.4, modo: 'bob', oculto: true }, { k: 'maca', id: 'maca', dx: 28, fila: 'frente', t: 3.2, modo: 'bob', oculto: true },
        { k: 'am_vaca', id: 'vaca', dx: -40, fila: 'frente', t: 6, modo: 'bob', oculto: true }, { k: 'am_ovelha', id: 'ovelha', dx: 36, fila: 'frente', t: 5, modo: 'bob', oculto: true },
        { k: 'am_galinha', id: 'galinha', dx: -20, fila: 'frente', t: 3.4, modo: 'bob', oculto: true }, { k: 'am_cao', id: 'cao', dx: 22, fila: 'frente', t: 4.4, modo: 'bob', oculto: true } ] },
    ] },
    passos: [
      { para: 'casa', falas: [
        { v: 'f', t: 'Bom dia, meninos! Que bom ver-vos outra vez!', pose: 'acenar' },
        { v: 'f', t: 'Vamos visitar o nosso amigo Faísca. É o cavalo mais veloz da quinta!' },
        { v: 'm', t: 'Ele adora correr no prado. Querem ver? Então vamos!', pose: 'festejar' } ] },
      { para: 'estabulo', andando: [ { v: 'f', t: 'Ouvem os passarinhos a cantar? Hoje é um dia perfeito!' } ], falas: [
        { v: 'm', t: 'Bom dia, Faísca!', pose: 'acenar', acao: { modo: { cavalo: 'chega' } }, som: 'Iiih iiih!' },
        { v: 'f', t: 'Olhem como ele salta de contente!', pose: 'palmas', acao: { modo: { cavalo: 'feliz' } } },
        { v: 'm', t: 'Mas atenção! Naquele sítio há uma pedra grande no caminho.', pose: 'apontar' },
        { v: 'f', t: 'Meninos, estão a ver a pedra? Se o Faísca não a vir, pode tropeçar!', pose: 'pensar' },
        { v: 'm', t: 'Cuidado, Faísca! Olha onde pões as patas!', pose: 'encorajar', acao: { modo: { cavalo: 'correndo' }, classe: { cavalo: 'corre' } } },
        { v: 'f', t: 'Oh, não! Ele vai tão depressa que não nos ouve!', pose: 'apontar', pausa: 900 },
        { v: 'm', t: 'Aaaai!', acao: { modo: { cavalo: 'tropeca' }, treme: true, mostra: ['dor', 'lagrima'] }, som: 'Iiiiih!', pausa: 700 },
        { v: 'f', t: 'O Faísca tropeçou na pedra e caiu!', pose: 'pensar', acao: { modo: { cavalo: 'caido' } } },
        { v: 'f', t: 'Ai, a patinha está inchada e muito dorida.', pose: 'pensar' },
        { v: 'm', t: 'O que será que devemos fazer, meninos? Pensem bem!', pose: 'pensar', pausa: 1400 },
        { v: 'f', t: 'Precisamos de água, de gelo, de ervas boas e de uma ligadura. Vamos a casa buscar tudo!', pose: 'apontar' } ] },
      { para: 'casa', vel: 1.5, ms: 3600, andando: [ { v: 'm', t: 'Depressa, depressa! O Faísca precisa de nós!' } ], falas: [
        { v: 'f', t: 'Aqui está a nossa caixa de primeiros socorros.', pose: 'apontar', acao: { mostra: ['c_caixa'] } },
        { v: 'm', t: 'Água fresquinha para limpar a ferida.', acao: { mostra: ['c_balde'] } },
        { v: 'f', t: 'Gelo, para a patinha não inchar mais.', acao: { mostra: ['c_gelo'] } },
        { v: 'f', t: 'E uma ligadura macia para a proteger!', pose: 'festejar', acao: { mostra: ['c_ervas', 'c_lig'] } } ] },
      { para: 'estabulo', vel: 1.5, ms: 3600, andando: [ { v: 'f', t: 'Já vamos, Faísca! Aguenta só mais um bocadinho!' } ], falas: [
        { v: 'm', t: 'Faísca, vai custar só um bocadinho. Os cavalos corajosos aguentam, não é?', pose: 'encorajar' },
        { v: 'f', t: 'Primeiro, lavamos a patinha com água fresquinha.', pose: 'apontar', acao: { mostra: ['balde'] } },
        { v: 'm', t: 'Agora o gelo, para a dor passar.', pose: 'apontar', acao: { mostra: ['gelo'], esconde: ['dor'] } },
        { v: 'f', t: 'E as ervas do jardim. Cura, cura, dorzinha, vai-te embora devagarinha!', pose: 'palmas', acao: { esconde: ['gelo'], mostra: ['ervas'] } },
        { v: 'm', t: 'Por fim, a ligadura. Uma volta, duas voltas, e pronto!', pose: 'festejar', acao: { esconde: ['ervas', 'balde'], mostra: ['ligadura'] } },
        { v: 'f', t: 'Muito bem, Faísca! Foste muito corajoso!', pose: 'palmas', acao: { modo: { cavalo: 'coxo' }, esconde: ['lagrima'] }, som: 'Iiih!' },
        { v: 'f', t: 'Vamos fazer-lhe uma caminha de palha fofinha.', pose: 'apontar', acao: { mostra: ['palha'], modo: { cavalo: 'descansa' } } } ] },
      { para: 'estabulo', falas: [
        { v: 'm', t: 'Boa noite, Faísca. Dorme bem.', pose: 'acenar', acao: { ceu: 'noite', cartaz: '🌙\nPassou a noite…', cartazMs: 3200 } },
        { v: 'f', t: 'Shhh. Silêncio, meninos. O Faísca está a dormir.', pose: 'repouso', pausa: 1200 },
        { v: 'f', t: 'Vejam quem veio visitar o Faísca! Os nossos amigos da quinta!', pose: 'apontar', acao: { ceu: 'dia', cartaz: '☀️\nUm novo dia!', cartazMs: 2600, esconde: ['palha'], modo: { cavalo: 'coxo2' }, mostra: ['am_vaca', 'am_ovelha', 'am_galinha', 'am_cao'] } },
        { v: 'm', t: 'A vaca trouxe leite fresquinho. Muuu!', som: 'Muuu!' },
        { v: 'f', t: 'A ovelha trouxe uma lã quentinha. Mé, mé!', som: 'Méé!' },
        { v: 'f', t: 'E o cão fez companhia ao Faísca. Au, au!', pose: 'palmas', som: 'Au au!', acao: { mostra: ['coracao'] } },
        { v: 'm', t: 'Quando temos amigos ao pé de nós, até a dor passa mais depressa.', pose: 'encorajar' } ] },
      { para: 'estabulo', falas: [
        { v: 'f', t: 'Passaram alguns dias. Todos os dias demos cenouras e maçãs ao Faísca.', pose: 'apontar', acao: { cartaz: '🥕🍎\nAlguns dias depois…', cartazMs: 3000, esconde: ['am_vaca', 'am_ovelha', 'am_galinha', 'am_cao', 'coracao'], mostra: ['cenoura', 'maca'] } },
        { v: 'm', t: 'A patinha já está menos inchada. Ele já a consegue apoiar!', pose: 'festejar' },
        { v: 'f', t: 'Mas ainda não pode correr. Tem de ter paciência, meninos.', pose: 'pensar' },
        { v: 'f', t: 'Está curada! Vai, Faísca, dá um passinho!', pose: 'palmas', acao: { esconde: ['cenoura', 'maca', 'ligadura'], modo: { cavalo: 'vaivem pa' } }, som: 'Iiih iiih!' },
        { v: 'm', t: 'Devagarinho, depois mais depressa. Trote, trote, trote!', pose: 'palmas' },
        { v: 'f', t: 'E agora galopa! O Faísca está curado!', pose: 'festejar', acao: { modo: { cavalo: 'vaivem ga' }, mostra: ['coracao'] } },
        { v: 'm', t: 'Desta vez vamos tirar a pedra do caminho, para ninguém mais tropeçar.', pose: 'apontar', acao: { esconde: ['pedra'], mostra: ['flores', 'flores2'] } },
        { v: 'f', t: 'No lugar da pedra plantámos flores. A quinta ficou ainda mais bonita!', pose: 'palmas' },
        { v: 'f', t: 'Com carinho, paciência e bons amigos, tudo melhora!', pose: 'festejar' } ] },
      { para: 'estabulo', falas: [
        { v: 'm', t: 'Até ao próximo episódio, meninos!', pose: 'acenar' },
        { v: 'f', t: 'Um beijinho grande da Avó Beagle!', pose: 'acenar' } ] },
    ] },
];
