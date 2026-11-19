/* Renderiza uma história do app em vídeo: Chrome com tempo virtual (40 ms por passo) + um JPEG por passo -> ffmpeg.
   Uso: node render.mjs <id> <durs.json> <saida.mp4> [--de s] [--ate s] [--dsf 1.5] [--max s] [--log falas.json] */
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const [id, dursFile, saida, ...resto] = process.argv.slice(2);
const opt = k => { const i = resto.indexOf('--' + k); return i >= 0 ? resto[i + 1] : null; };
const DE = Number(opt('de') || 0), ATE = Number(opt('ate') || 1e9), DSF = Number(opt('dsf') || 1.5), MAX = Number(opt('max') || 600), PORTA = opt('porta') || '8123';
const FOTOS = (opt('fotos') || '').split(',').filter(Boolean).map(Number);
const FPS = 25, PASSO = 1000 / FPS, W = 480, H = 853;
const DURS = JSON.parse(fs.readFileSync(dursFile, 'utf8'));

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('ERRO', e.message.slice(0, 300)));
const USARAF = !resto.includes('--semraf');
await p.addInitScript(usaraf => {
  try { localStorage.setItem('eab-som', '1'); } catch (e) {}
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!C) continue;
    for (const f of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced', 'clear']) {
      const o = C.prototype[f]; if (!o) continue;
      C.prototype[f] = function (...a) { if (window.__semGL) return; return o.apply(this, a); };
    }
  }
  if (!usaraf) return;
  /* um só quadro de animação por passo de 40 ms (25 fps): o Chrome faria ~2,4 por passo, e cada um redesenha o 3D sem GPU */
  const rafs = new Map(); let id = 0;
  window.requestAnimationFrame = cb => { const k = ++id; const espera = 40; /* relógio falso: uma chamada por passo */ rafs.set(k, setTimeout(() => { rafs.delete(k); cb(performance.now()); }, espera)); return k; };
  window.cancelAnimationFrame = k => { clearTimeout(rafs.get(k)); rafs.delete(k); };
}, USARAF);
await p.goto(`http://localhost:${PORTA}/index.html`);
console.log('goto ok'); await p.waitForFunction(() => window.__pronto && window.__pronto(), null, { timeout: 120000 });
/* a voz é simulada: cada fala dura o que dura o clip (registamos quando começa, para montar o áudio depois) */
await p.evaluate(durs => {
  const S = window.__Som;
  window.__falas = [];
  S.ligado = true;
  S.temClips = () => true;
  S.defineVoz = q => { S.personagem = q === 'f' ? 'f' : 'm'; };
  S.carregaVozes = async () => ({});
  S.paraVoz = () => { S.geracaoVoz++; clearTimeout(S.tempoVoz); };
  S.fala = (texto, aoFim) => {
    const lista = Array.isArray(texto) ? texto : [texto];
    S.paraVoz(); const g = S.geracaoVoz;
    const chave = S.personagem + '|' + lista.join(' ');
    const d = durs[chave];
    if (d == null) console.log('SEM DURACAO', chave);
    window.__falas.push({ t: performance.now(), v: S.personagem, texto: lista.join(' '), dur: d || 0 });
    S.tempoVoz = setTimeout(() => { if (g === S.geracaoVoz && aoFim) aoFim(); }, ((d || 2) + .09 + .18) * 1000);
  };
}, DURS);
console.log('pronto'); const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DSF, mobile: false });
await p.clock.install({ time: 0 });
await p.clock.pauseAt(1000);
let nPassos = 0;
const avanca = async ms => { await p.clock.runFor(ms); if (nPassos++ < 150) await p.waitForTimeout(30); };
console.log('comeca'); await p.addStyleTag({ content: '.hist-fim{display:none!important}' });
await p.evaluate(id => { window.__t0 = performance.now(); window.__comeca(id); }, id);

/* as animações CSS/Web Animations correm no relógio real: a cada passo ficam em pausa no tempo virtual certo */
const sincroniza = () => p.evaluate(() => {
  const agora = performance.now() - window.__t0;
  window.__vs = window.__vs || new WeakMap();
  for (const a of document.getAnimations()) {
    let v0 = window.__vs.get(a);
    if (v0 == null) { v0 = agora; window.__vs.set(a, v0); }
    try { a.pause(); a.currentTime = agora - v0; } catch (e) {}
  }
  return agora;
});

let ff = null, fim = Promise.resolve(), seg = 0; const fins = [];
const abreFF = () => {
  const nome = `${saida}.seg${String(seg++).padStart(3, '0')}.mp4`;
  const f = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0', '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-vf', 'scale=720:1280:flags=lanczos', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', '25', nome + '.tmp.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  const acabou = new Promise(r => f.on('close', () => { try { fs.renameSync(nome + '.tmp.mp4', nome); } catch (e) {} r(); }));
  fins.push(acabou); return f;
};
if (!FOTOS.length) ff = abreFF();
const T = { a: 0, s: 0, c: 0 }; let t = 0, n = 0, extra = null; const t0 = Date.now();
while (t < MAX * 1000 && t < ATE * 1000) {
  const quase = (t >= (DE - 1.2) * 1000) || FOTOS.some(f => Math.abs(f * 1000 - t) < 1500);
  await p.evaluate(v => { window.__semGL = v; }, !quase);
  const a0 = Date.now(); await avanca(PASSO);
  t += PASSO;
  const a1 = Date.now(); const agora = await sincroniza(); const a2 = Date.now();
  if (FOTOS.length) {
    const f = FOTOS.find(f => Math.abs(f * 1000 - t) < PASSO / 2 + 1);
    if (f != null) { const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 }); fs.writeFileSync(`foto-${f}.jpg`, Buffer.from(r.data, 'base64')); console.log('foto', f); }
    if (t > Math.max(...FOTOS) * 1000 + 100) break;
    continue;
  }
  if (t >= DE * 1000) {
    const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true });
    ff.stdin.write(Buffer.from(r.data, 'base64')); n++;
    if (n % 1500 === 0) { ff.stdin.end(); ff = abreFF(); } T.a += a1 - a0; T.s += a2 - a1; T.c += Date.now() - a2;
    if (n % 250 === 0) console.log(JSON.stringify(T), `t=${(t / 1000).toFixed(1)}s frames=${n} ${((Date.now() - t0) / 1000).toFixed(0)}s reais`);
  }
  if (extra == null && await p.evaluate(() => !!document.querySelector('.hist-fim'))) extra = t + 1500;
  if (extra != null && t >= extra) break;
}
if (ff) { ff.stdin.end(); await Promise.all(fins); }
const falas = await p.evaluate(() => window.__falas.map(f => ({ ...f, t: f.t - window.__t0 })));
if (opt('log')) fs.writeFileSync(opt('log'), JSON.stringify(falas, null, 1));
console.log('feito', n, 'frames', ((Date.now() - t0) / 1000).toFixed(0), 's reais; fim em', (t / 1000).toFixed(1), 's');
await b.close();
