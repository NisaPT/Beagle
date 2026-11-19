/* Gera as vozes do Episódio 2 (avó e avô) com o ElevenLabs, com as MESMAS vozes e modelo do Episódio 1.
   Uso (Node 18 ou superior), dentro desta pasta, no PowerShell:
     $env:ELEVENLABS_API_KEY="a_tua_chave"
     node gerar-vozes-ep2.mjs
   Cria a pasta "vozes" com um mp3 por frase e o ficheiro vozes/indice.json. Não repete o que já foi gerado. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CHAVE = process.env.ELEVENLABS_API_KEY;
const MODELO = 'eleven_v4', FORMATO = 'mp3_22050_32';
const VOZES = { f: 'BhwsffyMmXNvWoWYimV3', m: 's8o1GUu40n4zwyQUqhCk' };
if (!CHAVE) { console.error('Falta a variável ELEVENLABS_API_KEY.'); process.exit(1); }
const frases = JSON.parse(fs.readFileSync(path.join(AQUI, 'falas-ep2.json'), 'utf8'));
const pasta = path.join(AQUI, 'vozes'); fs.mkdirSync(pasta, { recursive: true });
const espera = ms => new Promise(r => setTimeout(r, ms));
async function sintetiza(texto, voz) {
  for (let i = 1; i <= 5; i++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}?output_format=${FORMATO}`, {
      method: 'POST', headers: { 'xi-api-key': CHAVE, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: texto, model_id: MODELO }) });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 429 || r.status >= 500) { await espera(1500 * i); continue; }
    throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }
  throw new Error('Demasiadas tentativas: ' + texto);
}
const indice = [];
for (let i = 0; i < frases.length; i++) {
  const { v, t } = frases[i];
  const nome = `${v}-${String(i).padStart(3, '0')}.mp3`, f = path.join(pasta, nome), meta = f + '.txt';
  if (!(fs.existsSync(f) && fs.existsSync(meta) && fs.readFileSync(meta, 'utf8') === t)) {
    fs.writeFileSync(f, await sintetiza(t, VOZES[v])); fs.writeFileSync(meta, t); process.stdout.write('.');
  }
  indice.push({ v, t, ficheiro: nome });
}
fs.writeFileSync(path.join(pasta, 'indice.json'), JSON.stringify(indice, null, 1));
console.log(`\nPronto: ${indice.length} frases em ${pasta}`);
