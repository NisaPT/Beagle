/* Perfis por idade. Os pequenos não leem: sem letras nem contas, poucas opções.
   Os maiores ganham letras, sequências e somas. A dificuldade adaptativa
   (app.js) continua a mexer dentro destes limites. */
export const IDADES = [3, 4, 5, 6, 7];

const PERFIS = {
  3: { tipos:['cores','animais','toupeiras','contar','frutas','puzzle','formas','legumes','memoria'],
       opcoes:3, maxConta:3,  formas:2, paleta:4, pares:0, memoriaIgual:2, numOpcoes:3, estrelasMin:2, padroes:0, letraOpcoes:0, somaMax:0,  imagens:true,
       nat:{ nivel:1, nomes:false, modos:{ animais:['nome','escondidos','chuva'], frutas:['nome','escondidos','chuva'], legumes:['nome','escondidos','chuva'] } } },
  4: { tipos:['cores','animais','toupeiras','contar','frutas','cesto','puzzle','formas','legumes','memoria','logica'],
       opcoes:3, maxConta:5,  formas:3, paleta:5, pares:0, memoriaIgual:3, numOpcoes:3, estrelasMin:2, padroes:1, letraOpcoes:0, somaMax:0,  imagens:true,
       nat:{ nivel:2, nomes:false, modos:{ animais:['nome','som','escondidos','chuva'], frutas:['nome','cor','escondidos','chuva'], legumes:['nome','cor','escondidos','chuva'] } } },
  5: { tipos:['cores','animais','toupeiras','contar','frutas','cesto','puzzle','formas','legumes','letras','memoria','logica'],
       opcoes:4, maxConta:6,  formas:4, paleta:6, pares:3, memoriaIgual:0, numOpcoes:4, padroes:2, letraOpcoes:2, somaMax:0,  imagens:true,
       nat:{ nivel:2, nomes:false, modos:{ animais:['nome','som','grupo','escondidos','chuva'], frutas:['nome','cor','contagem','escondidos','chuva'], legumes:['nome','cor','tipo','escondidos','chuva'] } } },
  6: { tipos:['cores','animais','toupeiras','frutas','cesto','contar','puzzle','formas','legumes','letras','memoria','logica','somas'],
       opcoes:5, maxConta:8,  formas:5, paleta:6, pares:4, memoriaIgual:0, numOpcoes:5, padroes:3, letraOpcoes:3, somaMax:5,  imagens:true,
       nat:{ nivel:3, nomes:true, modos:{ animais:['nome','som','grupo','inicial'], frutas:['nome','cor','contagem','inicial'], legumes:['nome','cor','tipo','contagem','inicial'] } } },
  7: { tipos:['cores','animais','toupeiras','frutas','cesto','contar','puzzle','formas','legumes','letras','memoria','logica','somas'],
       opcoes:6, maxConta:10, formas:6, paleta:8, pares:5, memoriaIgual:0, numOpcoes:6, padroes:4, letraOpcoes:4, somaMax:10, imagens:false,
       nat:{ nivel:3, nomes:true, modos:{ animais:['som','grupo','inicial','nome'], frutas:['cor','contagem','inicial','nome'], legumes:['cor','tipo','contagem','inicial','nome'] } } },
};

/* sem idade escolhida: comporta-se como aos 5 anos (a versão anterior) */
export const perfilIdade = idade => PERFIS[idade] || PERFIS[5];
export const rotuloIdade = i => i >= 7 ? '7 anos ou mais' : i + ' anos';
