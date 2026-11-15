/* Lista TODAS as falas que a app pode dizer e grava ferramentas/falas.json.
   Uso: node ferramentas/listar-falas.mjs
   Lê os dados reais do código (animais, frutas, legumes, quinta, curiosidades), por isso
   se acrescentares um animal ou uma cena, basta voltar a correr. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = f => import(pathToFileURL(path.join(RAIZ, 'js', f)).href);
const { ITENS } = await imp('natureza.js');
const { EDIFICIOS, BICHOS } = await imp('minhaquinta.js');
const { FILMES } = await imp('curiosidades.js');
const base = Object.keys((await imp('voz_f.js')).VOZ_F);

const grupos = new Map();            /* grupo -> Set de frases */
const add = (g, t) => { if (!grupos.has(g)) grupos.set(g, new Set()); grupos.get(g).add(t); };
const Cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const semAc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/* 0. o que já existe hoje nos ficheiros de voz (jogos de cores, formas, contar, menus) */
base.forEach(t => add('0 Já existentes (cores, formas, contar, menus)', t));

/* 1. animais, frutas e legumes */
const EM = { o:'no', a:'na', os:'nos', as:'nas' };
const plural = it => it.art === 'os' || it.art === 'as';
const masc = it => it.art === 'o' || it.art === 'os';
const com = it => `${it.art} ${it.nome}`;
const verbo = it => plural(it) ? 'são' : 'é';
const esse = it => plural(it) ? 'Esses são' : masc(it) ? 'Esse é' : 'Essa é';
const COR = { vermelho:['vermelho','vermelha','vermelhos','vermelhas'], amarelo:['amarelo','amarela','amarelos','amarelas'],
  laranja:['laranja','laranja','laranja','laranja'], verde:['verde','verde','verdes','verdes'],
  roxo:['roxo','roxa','roxos','roxas'], azul:['azul','azul','azuis','azuis'] };
const adj = (it, c) => COR[c][(masc(it) ? 0 : 1) + (plural(it) ? 2 : 0)];
const letra = it => semAc(it.nome).charAt(0).toUpperCase();
const nomeCat = { animais:'animal', frutas:'fruta', legumes:'legume' };

for (const [cat, lista] of Object.entries(ITENS)) {
  const G = n => `1 ${Cap(cat)}: ${n}`;
  for (const it of lista) {
    add(G('Toca no… (pergunta)'), `Toca ${EM[it.art]} ${it.nome}.`);
    add(G('Esse é… (quando erra)'), `${esse(it)} ${com(it)}.`);
    add(G('Procura… (quando erra)'), `Procura ${com(it)}.`);
    add(G('Letra inicial'), `Esse começa por ${letra(it)}.`);
    if (it.pl && it.nivel <= 2) add(G('Quantos há?'), `${masc(it) ? 'Quantos' : 'Quantas'} ${it.pl} há?`);
    if (it.tipo) add(G('Fruta ou legume?'), plural(it) ? `${Cap(com(it))} são frutas ou legumes?` : `${Cap(com(it))} é fruta ou legume?`);
    if (it.cor) add(G('Cor'), `${Cap(com(it))} ${verbo(it)} ${adj(it, it.cor)}.`);
  }
  for (const L of new Set(lista.map(letra))) {
    add(G('Letra inicial'), `Qual ${nomeCat[cat]} começa pela letra ${L}?`);
    add(G('Letra inicial'), `Procura a letra ${L}.`);
  }
  for (const c of new Set(lista.filter(x => x.cor).map(x => x.cor))) {
    const artigo = cat === 'frutas' ? 'a fruta' : 'o legume';
    const a = COR[c][cat === 'frutas' ? 1 : 0];
    add(G('Cor'), `Qual é ${artigo} ${a}?`);
    add(G('Cor'), `Procura ${artigo} ${a}.`);
  }
  if (cat === 'animais') {
    for (const s of new Set(lista.filter(x => x.som).map(x => x.som))) add(G('Quem faz…?'), `Quem faz ${s}?`);
    ['Qual destes animais vive na quinta?', 'Qual destes animais vive na água do mar?',
     'Esse não vive na quinta. Tenta outra vez.', 'Esse não vive no mar. Tenta outra vez.'].forEach(t => add(G('Quinta ou mar'), t));
  }
  if (cat === 'frutas') add(G('Quantos há?'), 'Quase! Conta outra vez, um a um.');
  if (cat === 'legumes') add(G('Fruta ou legume?'), 'Pensa outra vez. Olha bem para a imagem.');
}

/* 2. letras, somas, lógica */
const PALAVRAS = [['A','abelha'],['B','bola'],['C','casa'],['D','dado'],['F','flor'],['G','gato'],['L','lua'],['M','macaco'],['P','pato'],['S','sol']];
for (const [l, p] of PALAVRAS) {
  add('2 Letras', `Escolhe a palavra que começa pela letra ${l}.`);
  add('2 Letras', `Experimenta outra vez. Procura ${p}.`);
}
const NUMS = ['','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','catorze','quinze'];
const MAX = 15;                                       /* somaMax 10 + 5 quando vai bem */
for (let a = 1; a < MAX; a++) for (let b = 1; b <= MAX - a; b++) add('2 Somas', `Quanto é ${NUMS[a]} mais ${NUMS[b]}?`);
add('2 Somas', 'Quase! Conta outra vez.');
add('2 Lógica', 'Observa as cores e tenta descobrir o padrão.');
add('2 Lógica', 'Quantos anos tens?');
/* jogos mais recentes (memória e lógica) e o elogio que faltava */
add('2 Memória e lógica', 'Descobre os pares iguais.');
add('2 Memória e lógica', 'Observa a sequência. O que vem a seguir?');
add('2 Memória e lógica', 'Parabéns!');

/* 3. quinta */
for (const e of EDIFICIOS) { add('3 Quinta: edifícios', `Já tens ${e.art} ${e.nome}!`); add('3 Quinta: edifícios', `${Cap(e.art)} ${e.nome}.`); }
for (const b of BICHOS) { add('3 Quinta: animais', `${b.nome}! Bem-vind${b.art}!`); add('3 Quinta: animais', b.som); }

/* 4. mini-filmes (cenas) e sons dos animais */
for (const f of Object.values(FILMES)) { f.cenas.forEach(c => add('4 Mini-filmes (curiosidades)', c)); if (f.som) add('4 Sons dos animais', f.som); }

/* limpa duplicados entre grupos (a frase fica no primeiro grupo) e grava */
const vistos = new Set(), saida = [];
for (const [g, set] of [...grupos].sort((a, b) => a[0].localeCompare(b[0]))) {
  for (const t of set) if (!vistos.has(t) && t.trim()) { vistos.add(t); saida.push({ g, t }); }
}
fs.writeFileSync(path.join(RAIZ, 'ferramentas', 'falas.json'), JSON.stringify(saida, null, 1));
const resumo = {};
for (const { g, t } of saida) { resumo[g] ??= { frases: 0, caracteres: 0 }; resumo[g].frases++; resumo[g].caracteres += t.length; }
console.table(resumo);
const total = saida.reduce((n, x) => n + x.t.length, 0);
console.log(`TOTAL por voz: ${saida.length} frases, ${total} caracteres (as duas vozes: ${total * 2})`);
