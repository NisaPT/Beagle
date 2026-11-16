/* Som gerado em código — sem ficheiros de áudio, funciona offline.
   Há três camadas:
     1. música de fundo em loop
     2. efeitos curtos para cada ação
     3. voz: síntese de fala quando existe, senão "voz de bicho"

   A síntese de fala falha em vários sítios (interruptor de silêncio do
   iPhone, iframes, falta de voz portuguesa), por isso nunca é a única
   fonte de som nem a única forma de perceber o que fazer: há sempre
   balão de texto e pista visual. */

/* Uma oitava acima do que seria natural: os altifalantes de telemóvel não
   reproduzem graves. Abaixo de ~150 Hz não se ouve nada e só distorce. */
const ACORDES = [
  [261.63, 329.63, 392.00],   // Dó
  [220.00, 261.63, 329.63],   // Lá menor
  [174.61, 220.00, 261.63],   // Fá
  [196.00, 246.94, 293.66],   // Sol
];
const D4=293.66, E4=329.63, G4=392.00, A4=440.00, C5=523.25, D5=587.33, E5=659.25, G5=783.99;
/* Oito compassos, para o ciclo demorar ~20 s a repetir-se. Um tema curto
   demais dá por si nas orelhas ao fim de pouco tempo. */
const MELODIA = [
  C5,  null, A4,  null, G4,  null, A4,  C5,     /* Dó        */
  A4,  null, G4,  null, E4,  null, G4,  null,   /* Lá menor  */
  A4,  null, C5,  null, D5,  null, C5,  A4,     /* Fá        */
  G4,  null, A4,  null, G4,  null, null, null,  /* Sol       */
  E5,  null, D5,  null, C5,  null, A4,  null,   /* Dó        */
  C5,  null, A4,  null, G4,  A4,   C5,  null,   /* Lá menor  */
  D5,  null, C5,  null, A4,  null, G4,  null,   /* Fá        */
  E4,  null, G4,  null, A4,  null, null, null,  /* Sol       */
];
const PASSO = .32;   /* segundos por passo; 8 passos por compasso */

export const Som = {
  ctx:null, mestre:null, gMusica:null, gEfeitos:null,
  ligado:true, aTocar:false, passo:0, proximo:0, timer:null,
  ttsFunciona:null,          /* null = ainda não se sabe */
  tom:1,                     /* 1 = avô (grave), 1.18 = avó (agudo) */

  /* --------------------------------------------------- arranque ------- */
  /* tem de ser chamado de dentro de um toque do utilizador */
  arranca(){
    if(this.ctx) { this.retoma(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    try{
      this.ctx = new AC();
      this.mestre = this.ctx.createGain();
      this.mestre.gain.value = this.ligado ? 1 : 0;
      this.mestre.connect(this.ctx.destination);

      this.gMusica = this.ctx.createGain();
      this.gMusica.gain.value = .085;
      const filtro = this.ctx.createBiquadFilter();
      filtro.type = 'lowpass'; filtro.frequency.value = 2600;
      this.gMusica.connect(filtro).connect(this.mestre);

      this.gEfeitos = this.ctx.createGain();
      this.gEfeitos.gain.value = .32;
      this.gEfeitos.connect(this.mestre);

      this.destravaFala();
      this.carregaVozes();
      this.carregaVozes(this.personagem === 'm' ? 'f' : 'm');
      this.tocaMusica();
    }catch(e){ console.warn('sem áudio:', e); }
  },

  retoma(){ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); },

  silencia(v){
    this.ligado = !v;
    if(this.mestre) this.mestre.gain.setTargetAtTime(v ? 0 : 1, this.ctx.currentTime, .05);
    if(v) try{ speechSynthesis.cancel(); }catch(e){}
    try{ localStorage.setItem('eab-som', v ? '0' : '1'); }catch(e){}
  },

  carregaPreferencia(){
    try{
      this.ligado = localStorage.getItem('eab-som') !== '0';
      /* chave nova: a antiga ficou guardada como 'aparelho' em todos os telemóveis */
      this.modo = localStorage.getItem('eab-voz-v2') === 'aparelho' ? 'aparelho' : 'embutida';
    }catch(e){}
    return this.ligado;
  },
  defineModo(m){
    this.modo = m === 'aparelho' ? 'aparelho' : 'embutida';
    try{ localStorage.setItem('eab-voz-v2', this.modo); }catch(e){}
  },


  /* Gateway TTS do projeto. O navegador nunca recebe chaves do fornecedor.
     O endpoint deve ser um backend próprio que devolve áudio (audio/mpeg ou audio/wav). */
  endpointNeural: '',
  async falaNeural(texto, aoFim, geracao){
    try{
      const r=await fetch(this.endpointNeural,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text: texto, language:'pt-PT', voice:this.personagem==='f'?'female':'male'}),
        signal:AbortSignal.timeout(12000)});
      if(!r.ok) return false;
      const blob=await r.blob(); if(!blob.type.startsWith('audio/')) return false;
      const url=URL.createObjectURL(blob), audio=new Audio(url);
      this.audioNeural=audio;
      await new Promise((resolve,reject)=>{
        audio.onended=resolve; audio.onerror=reject;
        if(geracao!==this.geracaoVoz){resolve();return;}
        audio.play().catch(reject);
      });
      URL.revokeObjectURL(url);
      if(geracao===this.geracaoVoz && aoFim) aoFim();
      return true;
    }catch(e){return false;}
  },

  /* --------------------------------------------------- notas ---------- */
  nota(freq, quando, dur, tipo, vol, destino, freqFim){
    if(!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = tipo || 'sine';
    o.frequency.setValueAtTime(freq, quando);
    if(freqFim) o.frequency.exponentialRampToValueAtTime(Math.max(20, freqFim), quando + dur);
    g.gain.setValueAtTime(.0001, quando);
    g.gain.exponentialRampToValueAtTime(Math.max(.001, vol), quando + Math.min(.02, dur * .25));
    g.gain.exponentialRampToValueAtTime(.0001, quando + dur);
    o.connect(g); g.connect(destino || this.gEfeitos);
    o.start(quando); o.stop(quando + dur + .03);
  },

  ruido(quando, dur, vol){
    if(!this.ctx) return;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = vol;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400;
    s.connect(f); f.connect(g); g.connect(this.gEfeitos);
    s.start(quando);
  },

  /* --------------------------------------------------- música --------- */
  tocaMusica(){
    if(!this.ctx || this.aTocar) return;
    this.aTocar = true;
    this.passo = 0;
    this.proximo = this.ctx.currentTime + .15;
    this.timer = setInterval(() => this.agenda(), 60);
  },
  paraMusica(){
    this.aTocar = false;
    clearInterval(this.timer); this.timer = null;
  },
  agenda(){
    if(!this.ctx || !this.aTocar) return;
    while(this.proximo < this.ctx.currentTime + .5){
      const p = this.passo % MELODIA.length;
      if(p % 8 === 0){                                   /* acorde novo */
        const ac = ACORDES[(p / 8 | 0) % ACORDES.length];
        ac.forEach(f => this.nota(f, this.proximo, 2.5, 'sine', .2, this.gMusica));
        this.nota(ac[0], this.proximo, 1.0, 'triangle', .17, this.gMusica);   /* baixo */
      }
      if(p % 8 === 4) this.nota(ACORDES[(p / 8 | 0) % ACORDES.length][0],
                                this.proximo, .6, 'triangle', .1, this.gMusica);
      const m = MELODIA[p];
      if(m) this.nota(m, this.proximo, .7, 'triangle', .16, this.gMusica);
      this.proximo += PASSO;
      this.passo++;
    }
  },
  /* baixa a música enquanto alguém fala */
  abafa(v){
    if(!this.gMusica || !this.ctx) return;
    this.gMusica.gain.setTargetAtTime(v ? .025 : .085, this.ctx.currentTime, .12);
  },

  /* --------------------------------------------------- efeitos -------- */
  efeito(nome, n){
    if(!this.ctx || !this.ligado) return;
    this.retoma();
    const t = this.ctx.currentTime;
    switch(nome){
      case 'toque':
        this.nota(680 * this.tom, t, .1, 'triangle', .22); break;
      case 'certo':
        [C5, E5, G5, C5 * 2].forEach((f, i) =>
          this.nota(f * this.tom, t + i * .075, .3, 'triangle', .22)); break;
      case 'errado':                       /* suave, nunca um "errou" seco */
        this.nota(420, t, .16, 'sine', .18, null, 360);
        this.nota(330, t + .14, .26, 'sine', .16, null, 300); break;
      case 'pop':
        this.nota(900, t, .09, 'sine', .3, null, 180);
        this.ruido(t, .09, .22); break;
      case 'encaixe':                      /* madeira a assentar */
        this.nota(190, t, .16, 'triangle', .3, null, 120);
        this.ruido(t, .05, .14); break;
      case 'conta':                        /* sobe a cada biscoito */
        this.nota(392 * Math.pow(2, ((n || 1) - 1) / 12) * this.tom, t, .18, 'triangle', .26); break;
      case 'estrela':
        [G5, C5 * 2, E5 * 2].forEach((f, i) =>
          this.nota(f, t + i * .09, .4, 'sine', .2)); break;
      case 'nivel':
        [G4, C5, E5, G5, C5 * 2].forEach((f, i) =>
          this.nota(f, t + i * .11, .45, 'triangle', .24)); break;
    }
  },

  /* --------------------------------------------------- voz ------------ */
  /* Por omissão fala com clips embutidos na app: robóticos, mas dizem as
     palavras em qualquer aparelho, offline e sem depender de haver voz
     portuguesa instalada. A voz do sistema soa muito melhor onde existe,
     por isso fica como opção, ligável na área dos pais. */
  ritmoVoz: 1.05,            /* clips um pouco mais rápidos (1 = normal); sobe o tom ligeiramente */
  modo: 'embutida',          /* 'embutida' = vozes dos avós (clips ElevenLabs); 'aparelho' = voz instalada PT-PT */
  personagem: 'm',           /* 'm' = avô, 'f' = avó */
  vozesPreferidas: { m:'', f:'' },
  pacotes: { m:null, f:null }, aCarregar: { m:null, f:null },
  buffers: {},

  defineVoz(p){ this.personagem = p === 'f' ? 'f' : 'm'; this.carregaVozes(); },

  carregaPreferenciasVoz(){
    try{ this.vozesPreferidas = JSON.parse(localStorage.getItem('eab-vozes-pt') || '{"m":"","f":""}'); }catch(e){}
  },
  defineVozPreferida(genero, nome){
    const g = genero === 'f' ? 'f' : 'm';
    this.vozesPreferidas[g] = nome || '';
    try{ localStorage.setItem('eab-vozes-pt', JSON.stringify(this.vozesPreferidas)); }catch(e){}
  },

  async carregaVozes(qual){
    const p = qual || this.personagem;
    if(this.pacotes[p]) return this.pacotes[p];
    if(!this.aCarregar[p]){
      this.aCarregar[p] = (p === 'f' ? import('./voz_f.js') : import('./voz_m.js'))
        .then(m => { this.pacotes[p] = p === 'f' ? m.VOZ_F : m.VOZ_M; return this.pacotes[p]; })
        .catch(e => { console.warn('sem voz embutida', p, e); return null; });
    }
    return this.aCarregar[p];
  },

  get vozPronta(){ return !!this.pacotes[this.personagem]; },

  /* todas as frases existem gravadas na voz dos avós? (com voz do aparelho ou neural, qualquer frase serve) */
  temClips(lista){
    if(this.modo === 'aparelho' || this.endpointNeural) return true;
    const v = this.pacotes[this.personagem];
    return !!v && lista.every(t => v[t]);
  },

  async buffer(texto){
    const p = this.personagem;
    const chave = p + '|' + texto;
    if(this.buffers[chave]) return this.buffers[chave];
    const v = this.pacotes[p] || await this.carregaVozes(p);
    if(!v || !v[texto] || !this.ctx) return null;
    const bin = atob(v[texto]);
    const u8 = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    try{
      const buf = await new Promise((ok, erro) => {
        const r = this.ctx.decodeAudioData(u8.buffer, ok, erro);
        if(r && r.then) r.then(ok, erro);
      });
      this.buffers[chave] = buf;
      /* no maximo ~80 frases descodificadas em memoria; as mais antigas saem primeiro */
      const chaves = Object.keys(this.buffers);
      if(chaves.length > 80) delete this.buffers[chaves[0]];
      return buf;
    }catch(e){ return null; }
  },

  /* Uma única locução de cada vez. Cada nova fala invalida callbacks
     anteriores, evitando que clips atrasados se sobreponham. */
  geracaoVoz: 0,
  fala(texto, aoFim){
    const lista = Array.isArray(texto) ? texto : [texto];
    this.paraVoz();
    const geracao = this.geracaoVoz;
    if(!this.ligado){
      if(aoFim) setTimeout(() => { if(geracao === this.geracaoVoz) aoFim(); }, 400);
      return;
    }
    this.retoma();
    this.abafa(true);
    const fim = () => {
      if(geracao !== this.geracaoVoz) return;
      this.abafa(false);
      if(aoFim) aoFim();
    };
    const endpoint = this.endpointNeural || '';
    if(endpoint) this.falaNeural(lista.join(' '), fim, geracao).then(ok=>{
      if(!ok && geracao===this.geracaoVoz) this.falaAparelho(lista.join(' '), fim, geracao);
    });
    else if(this.modo === 'aparelho') this.falaAparelho(lista.join(' '), fim, geracao);
    else this.falaEmbutida(lista, fim, geracao);
  },

  async falaEmbutida(lista, aoFim, geracao){
    const bufs = [];
    for(const t of lista){
      if(geracao !== this.geracaoVoz) return;
      bufs.push(await this.buffer(t));
    }
    if(geracao !== this.geracaoVoz || !this.ctx || !this.ligado) return;
    /* falta algum clip (frase nova, ficheiro ainda não carregado): diz a frase toda com a voz do aparelho */
    if(bufs.some(b => !b)){ this.falaAparelho(lista.join(' '), aoFim, geracao); return; }
    let t = this.ctx.currentTime + .04, total = 0;
    this.fontes = [];
    bufs.forEach((b, i) => {
      if(!b) return;
      const f = this.ctx.createBufferSource();
      f.buffer = b;
      f.playbackRate.value = this.ritmoVoz || 1;
      const g = this.ctx.createGain();
      g.gain.value = 1.0;
      f.connect(g); g.connect(this.mestre);
      f.start(t);
      this.fontes.push(f);
      const dur = b.duration / (this.ritmoVoz || 1) + .09;
      t += dur;
      total += dur;
    });
    this.tempoVoz = setTimeout(() => { if(geracao === this.geracaoVoz && aoFim) aoFim(); }, (total + .18) * 1000);
  },

  falaAparelho(texto, aoFim, geracao){
    if(!('speechSynthesis' in window)){ if(aoFim) aoFim(); return; }
    const vs = this.vozesDoAparelho(); // exclusivamente pt-PT
    const preferida = this.vozesPreferidas[this.personagem];
    const escolhida = preferida ? vs.find(x => x.name === preferida) : null;
    const v = escolhida || this.escolheVoz(this.personagem);
    if(!v){
      console.warn('Não existe uma voz PT-PT instalada. A locução foi omitida para não usar português do Brasil.');
      if(aoFim) aoFim();
      return;
    }
    let acabou = false;
    const terminar = () => {
      if(acabou || geracao !== this.geracaoVoz) return;
      acabou = true;
      if(aoFim) aoFim();
    };
    try{
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-PT';
      u.voice = v;
      /* avô: voz grave e pausada de pessoa idosa; avó: um pouco mais suave */
      const avo = this.personagem !== 'f';
      const masc = this.eMasculina(v), fem = this.eFeminina(v);
      u.rate = avo ? .80 : .90;
      u.pitch = avo ? (masc ? .85 : .5) : (fem ? 1.0 : 1.35);
      u.onend = terminar;
      u.onerror = terminar;
      this.timerInicioVoz = setTimeout(() => {
        if(geracao !== this.geracaoVoz || acabou) return;
        try{ speechSynthesis.speak(u); }catch(e){ terminar(); }
      }, 80);
      this.timerSegurancaVoz = setTimeout(terminar, Math.max(5000, texto.length * 180));
    }catch(e){ terminar(); }
  },

  vozesDoAparelho(){
    if(!('speechSynthesis' in window)) return [];
    return (speechSynthesis.getVoices() || [])
      .filter(v => v.lang && v.lang.replace('_', '-').toLowerCase() === 'pt-pt');
  },
  eMasculina(v){ return /duarte|cristiano|ricardo|miguel|jo[aã]o|diogo|male|masculin|homem/i.test(v.name) && !/female/i.test(v.name); },
  eFeminina(v){ return /raquel|joana|catarina|h[eé]lia|fernanda|maria|ines|inês|female|feminin|mulher/i.test(v.name); },
  /* escolhe, entre as vozes PT-PT, uma do género da personagem (se existir) */
  escolheVoz(p){
    const vs = this.vozesDoAparelho();
    if(!vs.length) return null;
    if(p === 'f') return vs.find(v => this.eFeminina(v)) || vs.find(v => !this.eMasculina(v)) || vs[0];
    return vs.find(v => this.eMasculina(v)) || vs.find(v => !this.eFeminina(v)) || vs[0];
  },

  diagnostico(){
    const temApi = 'speechSynthesis' in window;
    const vs = temApi ? (speechSynthesis.getVoices() || []) : [];
    const pt = vs.filter(v => v.lang && v.lang.replace('_', '-').toLowerCase() === 'pt-pt');
    const pac = this.pacotes[this.personagem];
    return {
      modo: this.modo, personagem: this.personagem,
      embutidaPronta: !!pac, clips: pac ? Object.keys(pac).length : 0,
      temApi, vozesPt: pt.map(v => `${v.name} (${v.lang})`),
    };
  },

  paraVoz(){
    this.geracaoVoz = (this.geracaoVoz || 0) + 1;
    clearTimeout(this.tempoVoz);
    clearTimeout(this.timerInicioVoz);
    clearTimeout(this.timerSegurancaVoz);
    try{ if('speechSynthesis' in window) speechSynthesis.cancel(); }catch(e){}
    (this.fontes || []).forEach(f => { try{ f.stop(); }catch(e){} });
    this.fontes = [];
  },

  destravaFala(){
    if(!('speechSynthesis' in window)) return;
    try{ speechSynthesis.getVoices(); }catch(e){}
  },

  /* voz de bicho: só se faltar mesmo o clip */
  balbucia(texto, aoFim){
    if(!this.ctx || !this.ligado){ if(aoFim) setTimeout(aoFim, 400); return; }
    const silabas = (texto.toLowerCase().match(/[aeiouáéíóúâêôãõàü]+/g) || ['a']).length;
    const n = Math.max(2, Math.min(14, silabas));
    const base = 300 * this.tom, t0 = this.ctx.currentTime + .04, espaco = .115;
    for(let i = 0; i < n; i++){
      const salto = [0, 2, 4, 5, 7, 4, 2][i % 7] + (i === n - 1 ? -3 : 0);
      const f = base * Math.pow(2, salto / 12);
      this.nota(f, t0 + i * espaco, .1, 'square', .07, this.gEfeitos, f * .88);
    }
    if(aoFim) setTimeout(aoFim, (n * espaco + .25) * 1000);
  },

  cala(){
    this.paraVoz();
    try{ speechSynthesis.cancel(); }catch(e){}
    this.abafa(false);
  },
};
