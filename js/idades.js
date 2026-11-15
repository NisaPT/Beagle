/* Perfis por idade. Os pequenos não leem: sem letras nem contas, poucas opções.
   Os maiores ganham letras, sequências e somas. A dificuldade adaptativa
   (app.js) continua a mexer dentro destes limites. */
export const IDADES = [3, 4, 5, 6, 7];

const PERFIS = {
  3: { tipos:['cores','contar','formas','memoria'],
       opcoes:3, maxConta:3,  formas:2, paleta:4, pares:2, padroes:0, letraOpcoes:0, somaMax:0,  imagens:true },
  4: { tipos:['cores','contar','formas','memoria','logica'],
       opcoes:3, maxConta:5,  formas:3, paleta:5, pares:3, padroes:1, letraOpcoes:0, somaMax:0,  imagens:true },
  5: { tipos:['cores','contar','formas','letras','memoria','logica'],
       opcoes:4, maxConta:6,  formas:4, paleta:6, pares:4, padroes:2, letraOpcoes:2, somaMax:0,  imagens:true },
  6: { tipos:['cores','contar','formas','letras','memoria','logica','somas'],
       opcoes:5, maxConta:8,  formas:5, paleta:6, pares:4, padroes:3, letraOpcoes:3, somaMax:5,  imagens:true },
  7: { tipos:['cores','contar','formas','letras','memoria','logica','somas'],
       opcoes:6, maxConta:10, formas:6, paleta:8, pares:6, padroes:4, letraOpcoes:4, somaMax:10, imagens:false },
};

/* sem idade escolhida: comporta-se como aos 5 anos (a versão anterior) */
export const perfilIdade = idade => PERFIS[idade] || PERFIS[5];
export const rotuloIdade = i => i >= 7 ? '7 anos ou mais' : i + ' anos';
