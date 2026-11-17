/* Gera SÓ as falas novas (ferramentas/falas-extra.json) com as mesmas vozes aprovadas (avó e avô, eleven_v4)
   e escreve js/voz_extra_f.js e js/voz_extra_m.js. NÃO mexe em voz_f.js nem voz_m.js.
   Uso (na pasta do projeto, Node 18 ou superior):
     set ELEVENLABS_API_KEY=a_tua_chave          (Windows, cmd)
     $env:ELEVENLABS_API_KEY="a_tua_chave"        (Windows, PowerShell)
     node ferramentas/gerar-extras.mjs             gera avó e avô
     node ferramentas/gerar-extras.mjs f           só a avó
     node ferramentas/gerar-extras.mjs m --teste   só 3 frases, para ouvir e ajustar
   Os mp3 ficam em ferramentas/vozes-geradas/. Se correr outra vez, não repete os já feitos
   (não gasta caracteres de novo). Apaga a pasta para regenerar. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHAVE = process.env.ELEVENLABS_API_KEY;
const BASE = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io';
const VELOCIDADE = Number(process.env.VELOCIDADE || 1.08);   /* ligeiramente mais rápida (0.7 a 1.2) */
const MODELO = process.env.MODELO || 'eleven_v4';          /* o modelo com que ouviste e aprovaste a voz */
const NOVO = /^eleven_v[34]/.test(MODELO);                    /* v3 e v4 não aceitam velocidade e levam o sotaque da própria voz */
const FORMATO = 'mp3_22050_32';                               /* pequeno: a app embute o áudio em base64 */

const VOZES = {
  f: { id: 'BhwsffyMmXNvWoWYimV3', ficheiro: 'voz_extra_f.js', constante: 'VOZ_EXTRA_F', nome: 'feminina (avó)' },
  m: { id: 's8o1GUu40n4zwyQUqhCk', ficheiro: 'voz_extra_m.js', constante: 'VOZ_EXTRA_M', nome: 'masculina (avô)' },
};

const args = process.argv.slice(2);
const teste = args.includes('--teste');
const escolhidas = args.filter(a => VOZES[a]);
const quais = escolhidas.length ? escolhidas : ['f', 'm'];

if (!CHAVE) { console.error('Falta a variável ELEVENLABS_API_KEY.'); process.exit(1); }

async function frases() {
  return JSON.parse(fs.readFileSync(path.join(RAIZ, 'ferramentas', 'falas-extra.json'), 'utf8'));
}

const espera = ms => new Promise(r => setTimeout(r, ms));

async function sintetiza(texto, voz) {
  for (let tentativa = 1; tentativa <= 5; tentativa++) {
    const r = await fetch(`${BASE}/v1/text-to-speech/${voz}?output_format=${FORMATO}`, {
      method: 'POST',
      headers: { 'xi-api-key': CHAVE, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(NOVO
        ? { text: texto, model_id: MODELO }                     /* sem language_code: forçar "pt" dá sotaque do Brasil */
        : { text: texto, model_id: MODELO, language_code: 'pt',
            voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0, use_speaker_boost: true, speed: VELOCIDADE } }),
    });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    const corpo = await r.text();
    if (r.status === 429 || r.status >= 500) { await espera(1500 * tentativa); continue; }
    throw new Error(`ElevenLabs ${r.status}: ${corpo.slice(0, 300)}`);
  }
  throw new Error('Demasiadas tentativas falhadas para: ' + texto);
}

for (const p of quais) {
  const v = VOZES[p];
  const todas = await frases();
  const lista = teste ? todas.slice(0, 3) : todas;
  const pasta = path.join(RAIZ, 'ferramentas', 'vozes-geradas', 'extra-' + p);
  fs.mkdirSync(pasta, { recursive: true });
  const chars = lista.reduce((n, t) => n + t.length, 0);
  console.log(`Voz ${v.nome}: ${lista.length} frases, ${chars} caracteres, modelo ${MODELO}`);

  const dados = {};
  for (let i = 0; i < lista.length; i++) {
    const texto = lista[i];
    const mp3 = path.join(pasta, String(i).padStart(3, '0') + '.mp3');
    const meta = mp3 + '.txt';
    const feito = fs.existsSync(mp3) && fs.existsSync(meta) && fs.readFileSync(meta, 'utf8') === texto + '|' + MODELO + '|' + VELOCIDADE;
    if (!feito) {
      fs.writeFileSync(mp3, await sintetiza(texto, v.id));
      fs.writeFileSync(meta, texto + '|' + MODELO + '|' + VELOCIDADE);
      process.stdout.write('.');
    }
    dados[texto] = fs.readFileSync(mp3).toString('base64');
  }
  console.log('');

  if (teste) { console.log(`Teste: ouve os ficheiros em ${pasta}. Nada foi alterado em js/.`); continue; }

  const destino = path.join(RAIZ, 'js', v.ficheiro);
  const cab = `/* Falas extra da voz ${v.nome} em português europeu.\n   Gerada com ElevenLabs (voz desenhada, pt-PT), modelo ${MODELO}. */\n`;
  fs.writeFileSync(destino, cab + `export const ${v.constante} = ${JSON.stringify(dados)};\n`);
  console.log(`Escrito ${v.ficheiro} `);
}
console.log('Pronto. Aumenta a VERSAO em sw.js antes de publicar.');
