/* Poses da mascote — fonte única, lida também pelos testes.
   Ângulos de MUNDO em graus, somados à pose de repouso.
   A personagem fica virada para +Z (a câmara), +X à esquerda de quem vê.
     X negativo = braço para a FRENTE   (positivo = para trás)
     X positivo = baixa a cabeça
     Z negativo = levanta o braço direito (lado -X)
     Z positivo = levanta o braço esquerdo (lado +X)
   Espelhar um braço: X igual, Y e Z com o sinal trocado.
   Valores obtidos por otimização numérica contra alvos para a mão e o
   cotovelo: os braços só alcançam 0,198 da altura, o que limita as poses. */

export const OSSOS = [
  'Hips','Spine','Spine1','Spine2','Neck','Head',
  'LeftShoulder','LeftArm','LeftForeArm','LeftHand',
  'RightShoulder','RightArm','RightForeArm','RightHand',
  'LeftUpLeg','LeftLeg','RightUpLeg','RightLeg'
];

export const POSES = {
  repouso: {},

  acenar: {                                     /* mão à altura da cabeça */
    RightArm:     {X:30,  Y:7,  Z:-105},
    RightForeArm: {X:-75, Y:32, Z:29},
    RightHand:    {Z:-10},
    Head:         {X:-3, Y:-7},
    Spine1:       {Y:-5},
  },

  festejar: {                                   /* os dois braços no ar */
    RightArm:     {X:15,  Y:7,   Z:-102},  LeftArm:     {X:15,  Y:-7,  Z:102},
    RightForeArm: {X:-20, Y:18,  Z:-49},   LeftForeArm: {X:-20, Y:-18, Z:49},
    Head:         {X:-13},
    Neck:         {X:-5},
    Spine1:       {X:-7},
  },

  pensar: {                                     /* mão junto ao focinho */
    RightArm:     {X:-82, Y:45, Z:6},
    RightForeArm: {X:-42, Y:23, Z:3},
    RightHand:    {X:-10},
    Head:         {X:6, Z:10},                  /* inclina para o lado da mão */
    Neck:         {Z:5},
  },

  palmas: {                                     /* mãos à frente do peito */
    RightArm:     {X:-46, Y:39,  Z:13},    LeftArm:     {X:-46, Y:-39, Z:-13},
    RightForeArm: {X:-23, Y:5,   Z:18},    LeftForeArm: {X:-23, Y:-5,  Z:-18},
    Head:         {X:-5},
    Spine1:       {X:-3},
  },

  apontar: {                                    /* aponta para o jogo, em baixo */
    RightArm:     {X:-59, Y:28,  Z:3},
    RightForeArm: {X:17,  Y:-10, Z:3},
    Head:         {X:8},
    Spine1:       {X:3},
  },

  encorajar: {                 /* nunca "triste": braços abertos a convidar */
    RightArm:     {X:-34, Y:1,   Z:3},     LeftArm:     {X:-34, Y:-1,  Z:-3},
    RightForeArm: {X:8,   Y:-17, Z:14},    LeftForeArm: {X:8,   Y:17,  Z:-14},
    Head:         {X:9, Z:-12},
    Neck:         {X:4},
    Spine1:       {X:5},
  },
};

/* Oscilações procedurais verificadas:
   acenar  -> antebraço direito oscila em Y (a mão descreve um arco)
   palmas  -> Y POSITIVO no antebraço direito aproxima as mãos            */
export const OSCILACOES = {
  acenar: { osso:'RightForeArm', eixo:'Y', amplitude:20, ritmo:9.5 },
  palmas: { osso:'RightForeArm', eixo:'Y', amplitude:22, ritmo:7.5 },
};
