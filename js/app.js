import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Rig, criaCena, VISTAS, THREE } from './rig.js';
import { desenhaMapa, scrollParaNivel, infoNivel, TOTAL_NIVEIS, MUNDOS, POR_MUNDO, defineTipos,
         primeiroDoMundo, ultimoDoMundo, mundoDoNivel } from './mapa.js';
import { BICHOS } from './bichos.js';
import { Jogo } from './jogos.js';
import { avatar, ANIMAIS, confete } from './arte.js';
import { Som } from './som.js';
import { quinta } from './quinta.js';
import { perfilIdade } from './idades.js';
import { Nuvem, CODIGO_RE } from './nuvem.js';
import { abreBrincar } from './brincar.js';
import { abreJogosCasa } from './tarefas.js';
import { iniciaVida3d } from './vida3d.js';
import { tocaHistoria } from './historias.js';
import { HISTORIAS } from './historias_dados.js';
import { ITENS, CATEGORIAS_ALBUM, imagemItem, rotuloTipo } from './natureza.js';
import { miniFilme } from './curiosidades.js';
import { Festa } from './festa.js';
import { EDIFICIOS, BICHOS as BICHOS_LOJA, PERSONAGENS, nivelQuinta, achaItem, gastoTotal, contaEdificios, contaBichos, desenhaQuinta, desenhaLoja, arteEdificio } from './minhaquinta.js';

const $ = s => document.querySelector(s);
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];

/* ======================================================= VOZ ============= */
const Fala = {
  el:null, t:0,
  /* a pista visual deixa o jogo perceber-se mesmo sem som nenhum */
  mostra(texto, pista){
    if(Array.isArray(texto)) texto = texto.join(' ');
    if(!this.el) this.el = $('#fala');
    this.el.innerHTML = `<span class="fala-texto"></span>` + (pista ? `<span class="fala-pista">${pista}</span>` : '');
    this.el.querySelector('.fala-texto').textContent = texto;
    this.el.classList.add('on');
    clearTimeout(this.t);
    this.t = setTimeout(() => this.el.classList.remove('on'), 1600 + texto.length * 95);
  },
  esconde(){ clearTimeout(this.t); if(this.el) this.el.classList.remove('on'); }
};

const Voz = {
  /* 'falado' permite escrever o nome da criança no balão sem o tentar dizer:
     não há clip de voz para cada nome do mundo */
  diz(texto, aoFim, pista, falado){
    Fala.mostra(texto, pista);
    const frase = Array.isArray(texto) ? texto.join(' ') : String(texto);
    const r = activo;                         /* o avô/avó gesticula enquanto fala */
    if(r) r.fala(700 + frase.length * 70);
    Som.fala(falado || texto, () => { if(r) r.fala(0); if(aoFim) aoFim(); });
  },
  cala(){ Som.cala(); }
};

/* ==================================================== ESTADO ============= */
const CORES_AMIGO = ['#E0162B', '#2C6FD6', '#3DA35D', '#8E6BC8', '#F3822B', '#1B4D8F'];

/* código de família: 12 caracteres (31^12 combinações), sem letras confundíveis (I, L, O, 0, 1).
   Usa o gerador criptográfico do navegador: não é adivinhável. */
function codigoNovo(){
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  const c = Array.from(b, x => alfabeto[x % alfabeto.length]).join('');
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`;
}

/* um código gera sempre o mesmo amigo: sem servidor, é o que dá para demonstrar */
function amigoDeCodigo(codigo){
  let h = 0;
  for(const c of codigo.toUpperCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return {
    codigo: codigo.toUpperCase(),
    animal: ANIMAIS[h % ANIMAIS.length],
    cor: CORES_AMIGO[(h >>> 3) % CORES_AMIGO.length],
    nivel: 1 + (h >>> 7) % TOTAL_NIVEIS,
  };
}

/* 'Criança 1' era um rótulo por defeito: não conta como nome escolhido */
const nomeReal = n => (n && n !== 'Criança 1' && n !== 'Criança') ? n : '';

const Estado = {
  nivel:1, estrelas:{}, extra:0, album:{}, quinta:{itens:{}}, companheiro:'avo', codigo:null, amigos:[], nome:'', perguntouNome:false, idade:null, perfilId:'principal',
  aprendizagem:{cores:{certas:0,erros:0},contar:{certas:0,erros:0},formas:{certas:0,erros:0},letras:{certas:0,erros:0},memoria:{certas:0,erros:0},logica:{certas:0,erros:0}},
  limiteMinutos:30, tempoHoje:0, diaUso:null, inicioSessao:Date.now(),

  listaPerfis(){
    try{ return JSON.parse(localStorage.getItem('eab-perfis') || '[]'); }catch(e){ return []; }
  },
  carrega(){
    try{
      let perfis = this.listaPerfis();
      const legado = JSON.parse(localStorage.getItem('eab') || '{}');
      if(!perfis.length){
        perfis = [{id:'principal', nome:legado.nome || 'Criança 1'}];
        localStorage.setItem('eab-perfis', JSON.stringify(perfis));
        localStorage.setItem('eab-perfil-principal', JSON.stringify(legado));
      }
      let ativo = localStorage.getItem('eab-perfil-ativo') || perfis[0].id;
      if(!perfis.some(p => p.id === ativo)) ativo = perfis[0].id;
      localStorage.setItem('eab-perfil-ativo', ativo);
      this.perfilId = ativo;
      const g = JSON.parse(localStorage.getItem('eab-perfil-' + ativo) || (ativo === 'principal' ? localStorage.getItem('eab') : '{}') || '{}');
      const perfil = perfis.find(p => p.id === ativo);
      Object.assign(this, {
        nivel: g.nivel || 1,
        estrelas: g.estrelas || {},
        extra: Number.isFinite(g.extra) ? g.extra : 0,
        album: (g.album && typeof g.album === 'object') ? g.album : {},
        quinta: (g.quinta && g.quinta.itens) ? g.quinta : {itens:{}},
        companheiro: g.companheiro || 'avo',
        nome: nomeReal(g.nome) || nomeReal(perfil && perfil.nome) || '',
        perguntouNome: !!g.perguntouNome || !!nomeReal(g.nome),
        codigo: CODIGO_RE.test(String(g.codigo || '')) ? g.codigo : null,
        idade: [3,4,5,6,7].includes(g.idade) ? g.idade : null,
        /* refaz os amigos a partir do código: corrige os que ficaram com cor/nível inválidos */
        amigos: Array.isArray(g.amigos) ? g.amigos.filter(x => x && typeof x.codigo === 'string' && CODIGO_RE.test(x.codigo))
                                       .slice(0, 12)
                                       .map(x => ({ ...amigoDeCodigo(x.codigo), uid: typeof x.uid === 'string' ? x.uid.slice(0, 128) : null,
                                                    estado: x.estado === 'amigo' ? 'amigo' : 'pendente', rv: Number(x.rv) || 0,
                                                    resumo: x.estado === 'amigo' && x.resumo && typeof x.resumo === 'object' ? x.resumo : null })) : null,
        removidos: Array.isArray(g.removidos) ? g.removidos : [],
        missaoDia: g.missaoDia || null,
        aprendizagem:g.aprendizagem || this.aprendizagem,
        limiteMinutos:Number.isFinite(g.limiteMinutos)?g.limiteMinutos:30,
        tempoHoje:g.diaUso===chaveDia()?(g.tempoHoje||0):0, diaUso:chaveDia(),
      });
    }catch(e){ console.warn('Não foi possível carregar os perfis', e); }
    if(!this.codigo) this.codigo = codigoNovo();
    if(!this.amigos) this.amigos = [];
    this.guarda();
  },
  guardaLogo(){                      /* agrupa gravacoes seguidas (cada resposta) numa so */
    if(this.apagando) return;
    clearTimeout(this._tg); this._tg = setTimeout(() => this.guarda(), 800);
  },
  guarda(){
    if(this.apagando) return;
    clearTimeout(this._tg); this._tg = 0;
    const dados = {
      nivel:this.nivel, estrelas:this.estrelas, extra:this.extra||0, album:this.album, quinta:this.quinta, companheiro:this.companheiro,
      codigo:this.codigo, amigos:this.amigos, removidos:this.removidos || [], nome:this.nome, perguntouNome:this.perguntouNome, idade:this.idade, missaoDia:this.missaoDia || null,
      aprendizagem:this.aprendizagem, limiteMinutos:this.limiteMinutos,
      tempoHoje:this.tempoHoje, diaUso:chaveDia(), t:Date.now(),
    };
    try{
      localStorage.setItem('eab', JSON.stringify(dados));
      localStorage.setItem('eab-perfil-' + this.perfilId, JSON.stringify(dados));
      const perfis = this.listaPerfis();
      const perfil = perfis.find(p => p.id === this.perfilId);
      if(perfil && this.nome) perfil.nome = this.nome;
      localStorage.setItem('eab-perfis', JSON.stringify(perfis));
    }catch(e){ console.warn('Não foi possível guardar neste aparelho', e); }
    Nuvem.agenda();
  },
  totalEstrelas(){ return Object.values(this.estrelas).reduce((a, b) => a + b, 0) + (this.extra || 0); },
  /* estrelas por gastar: as ganhas menos o que já foi comprado na quinta */
  saldo(){ return Math.max(0, this.totalEstrelas() - gastoTotal(this.quinta.itens)); },
  ganha(nivel, estrelas){
    this.estrelas[nivel] = Math.max(this.estrelas[nivel] || 0, estrelas);
    if(nivel >= this.nivel) this.nivel = Math.min(TOTAL_NIVEIS, nivel + 1);
    this.guarda();
    if(typeof atualizaQuinta==='function') atualizaQuinta();
  }
};

/* a idade decide que jogos entram e quão difíceis podem ficar */
function aplicaIdade(){ const P = perfilIdade(Estado.idade); defineTipos(P.tipos, P.tiposHorta ? { 0: P.tiposHorta } : {}); }

/* ====================================================== 3D =============== */
// Arranque resiliente: se o navegador não disponibilizar WebGL, a aplicação
// continua em modo 2D em vez de ficar presa no ecrã "A preparar a escola…".
let renderizador, cena, camara, modoSem3D = false;
try {
  ({ renderizador, cena, camara } = criaCena($('#gl')));
} catch (erroWebGL) {
  console.warn('WebGL indisponível; a Escola dos Avós vai arrancar em modo 2D.', erroWebGL);
  modoSem3D = true;
  cena = new THREE.Scene();
  camara = new THREE.PerspectiveCamera(28, 1, .1, 50);
  renderizador = { setSize(){}, render(){} };
  const aviso = document.createElement('div');
  aviso.id = 'aviso-sem-3d';
  aviso.textContent = 'Modo de compatibilidade: animações 3D indisponíveis neste navegador.';
  aviso.style.cssText = 'position:absolute;z-index:5;bottom:6px;left:8px;right:8px;text-align:center;font-size:12px;color:#76552f;pointer-events:none';
  $('#stage').append(aviso);
}
let vista = VISTAS.dois;
let mundoVisto = 0;
const vistaPos = VISTAS.dois.pos.clone(), vistaAlvo = VISTAS.dois.alvo.clone();
let avo = null, ava = null, activo = null, pausado = false;
const relogio = new THREE.Clock();

function redimensiona(){
  const r = $('#stage').getBoundingClientRect();
  const w = Math.max(1, r.width), h = Math.max(1, r.height);
  renderizador.setSize(w, h, false);
  camara.aspect = w / h;
  camara.fov = w / h < .78 ? 32 : 28;
  camara.updateProjectionMatrix();
}
/* ao sair da app, fechar o separador ou bloquear o ecrã: silêncio total */
const silencio = () => { try{ Som.paraVoz(); if(Som.ctx && Som.ctx.state === 'running') Som.ctx.suspend(); }catch(e){} };
document.addEventListener('visibilitychange', () => { if(document.hidden) silencio(); else Som.retoma(); });
addEventListener('pagehide', silencio);
document.addEventListener('freeze', silencio);
addEventListener('resize', redimensiona);
addEventListener('orientationchange', () => setTimeout(redimensiona, 160));

let acumulado = 0;
function anima(){
  requestAnimationFrame(anima);
  const bruto = relogio.getDelta();
  if(pausado) return;
  /* nos menus 30 imagens por segundo chegam; nos jogos mantém-se o ritmo total */
  const ecraAtual = document.body.dataset.ecra;
  if(ecraAtual && ecraAtual !== 'jogo' && ecraAtual !== 'escolher'){
    acumulado += bruto;
    if(acumulado < .030) return;
  }
  const dt = Math.min(acumulado || bruto, .05); acumulado = 0;
  const t = relogio.elapsedTime;
  const k = 1 - Math.exp(-3.4 * dt);
  /* ecrã estreito (telemóvel na vertical): afasta a câmara para os dois avós caberem */
  let posAlvo = vista.pos;
  if(vista === VISTAS.escolher){
    posAlvo = vista.pos.clone();
    posAlvo.z *= Math.max(1, .95 / Math.max(.3, camara.aspect));
  }
  /* durante os jogos o avô/avó fica à esquerda e o balão de fala à direita,
     para o texto nunca tapar a cara */
  let alvoOlhar = vista.alvo;
  if(vista === VISTAS.um && document.body.dataset.ecra === 'jogo'){
    const altura = 2 * posAlvo.z * Math.tan(camara.fov * Math.PI / 360);
    const dx = .2 * altura * camara.aspect;
    posAlvo = posAlvo.clone(); posAlvo.x += dx;
    alvoOlhar = vista.alvo.clone(); alvoOlhar.x += dx;
  }
  vistaPos.lerp(posAlvo, k); vistaAlvo.lerp(alvoOlhar, k);
  camara.position.copy(vistaPos); camara.lookAt(vistaAlvo);
  if(avo && avo.grupo.visible) avo.atualiza(dt, t);      /* o que está escondido não se anima */
  if(ava && ava.grupo.visible) ava.atualiza(dt, t);
  if(!modoSem3D) renderizador.render(cena, camara);
}

/* =================================================== ECRÃS =============== */
function mostra(id){
  const cs = $('#conta-estrelas'); if(cs) cs.textContent = Estado.saldo();
  document.querySelectorAll('.ecra').forEach(s => s.classList.remove('on'));
  if(id) $(id).classList.add('on');
  document.body.dataset.ecra = id ? id.replace('#ecra-', '') : 'jogo';
  pausado = id === '#ecra-carregar' || id === '#ecra-quinta' || id === '#ecra-porta' || id === '#ecra-pais';   /* nos outros menus o avô/avó faz companhia num canto */
  if(id === '#ecra-inicio' || id === '#ecra-nome' || id === '#ecra-idade') vista = VISTAS.dois;      /* os dois avós */
  else if(id === '#ecra-mundos' || id === '#ecra-historias' || id === '#ecra-mapa' || id === '#ecra-amigos') vista = VISTAS.um;                           /* o que foi escolhido */
  if(Q3D) Q3D.ativa(id === '#ecra-quinta');
  requestAnimationFrame(redimensiona);   /* o palco muda de altura entre ecrãs */
  setTimeout(aplicaPendentes, 0);
  const t = $('#texto-voltar');
  if(t) t.textContent = id === '#ecra-historias' ? 'Mundos'
                      : id === '#ecra-mundos' ? 'Avós'
                      : id === '#ecra-mapa'   ? 'Quinta'
                      : id === '#ecra-quinta' ? 'Brincar'
                      : id === '#ecra-amigos' ? 'Avós'
                      : 'Mapa';
}

function soUm(q){
  Estado.companheiro = q; Estado.guarda();
  activo = q === 'avo' ? avo : ava;
  const outro = q === 'avo' ? ava : avo;
  activo.visivel(true); outro.visivel(false);
  activo.grupo.position.x = 0;
  activo.grupo.rotation.y = activo.rotBase;
  vista = VISTAS.um;
}

/* ===================================================== MAPA ============== */
const caixaMapa = $('#mapa-scroll'), telaMapa = $('#mapa-tela');

function abreMundos(){
  Voz.cala(); Fala.esconde(); jogo.para();
  $('#tabuleiro').innerHTML = '';
  const maior = Estado.nivel;
  const cartaoQuinta = `<button class="mundo minha" data-quinta="1">
      <span class="selo" style="--c:#8FCB85">${arteEdificio('casa')}</span>
      <span class="texto"><span class="titulo">A Minha Quinta</span>
        <span class="sub">${contaEdificios(Estado.quinta.itens)} edifícios · ${contaBichos(Estado.quinta.itens)} animais · ⭐ ${Estado.saldo()}</span></span>
    </button>`;
  const nAmigos = Estado.amigos.filter(a => a.resumo && a.estado === 'amigo').length;
  const cartaoAmigos = `<button class="mundo ranking" data-amigos="1">
      <span class="selo" style="--c:#FBE29A"><span class="selo-emoji">👫</span></span>
      <span class="texto"><span class="titulo">Amigos</span>
        <span class="sub">${nAmigos ? `${nAmigos} ${nAmigos === 1 ? 'amigo' : 'amigos'} · ver as quintas` : 'Ver as quintas dos amigos'}</span></span>
    </button>`;
  const cartaoHistorias = `<button class="mundo historias" data-historias="1">
      <span class="selo" style="--c:#F4C9D6"><span class="selo-emoji">📖</span></span>
      <span class="texto"><span class="titulo">Histórias dos avós</span>
        <span class="sub">${HISTORIAS.length} ${HISTORIAS.length === 1 ? 'história' : 'histórias'} · para ver e ouvir</span></span>
    </button>`;
  $('#lista-mundos').innerHTML = cartaoHistorias + cartaoQuinta + cartaoAmigos + MUNDOS.map((m, i) => {
    const inicio = primeiroDoMundo(i);
    const aberto = maior >= inicio;
    const feitos = Math.max(0, Math.min(POR_MUNDO, maior - inicio));
    const estrelas = Object.entries(Estado.estrelas)
      .filter(([g]) => +g >= inicio && +g <= ultimoDoMundo(i))
      .reduce((a, [, v]) => a + v, 0);
    return `<button class="mundo" data-mundo="${i}" ${aberto ? '' : 'disabled'}>
      <span class="selo" style="--c:${m.relva[1]}">${BICHOS[m.bichos[0]]()}</span>
      <span class="texto">
        <span class="titulo">${m.nome}</span>
        <span class="sub">${aberto ? `${feitos} de ${POR_MUNDO} · ${estrelas} estrelas`
                                   : `Abre no nível ${inicio}`}</span>
      </span>
      ${aberto ? '' : '<span class="tranca">🔒</span>'}
    </button>`;
  }).join('');
  mostra('#ecra-mundos');
  $('#barra').hidden = false;
}

$('#lista-mundos').onclick = e => {
  const b = e.target.closest('.mundo');
  if(!b || b.disabled) return;
  Som.efeito('toque');
  if(b.dataset.quinta) return abreQuinta();
  if(b.dataset.historias) return abreHistorias();
  if(b.dataset.amigos) return abreAmigos();
  abreMapa(false, +b.dataset.mundo);
};

/* ================================================= AMIGOS (cloud) ========= */
/* códigos dos perfis deste aparelho: não contam como amigos (já aparecem como perfis) */
let _cacheLocais = null, _chaveLocais = '';
function codigosLocais(){
  const chave = (localStorage.getItem('eab-perfis') || '') + '|' + Estado.codigo + '|' + Estado.perfilId;
  if(_cacheLocais && chave === _chaveLocais) return _cacheLocais;
  const s = new Set([Estado.codigo]);
  for(const p of Estado.listaPerfis()){
    if(p.id === Estado.perfilId) continue;
    try{ const d = JSON.parse(localStorage.getItem('eab-perfil-' + p.id) || 'null'); if(d && d.codigo) s.add(d.codigo); }catch(e){}
  }
  _cacheLocais = s; _chaveLocais = chave;
  return s;
}
function limpaAmigosLocais(){
  const locais = codigosLocais();
  const fora = Estado.amigos.filter(a => locais.has(a.codigo));
  if(!fora.length) return false;
  Estado.amigos = Estado.amigos.filter(a => !locais.has(a.codigo));
  Estado.removidos = [...new Set([...(Estado.removidos || []), ...fora.map(a => a.codigo)])];
  Estado.guarda();
  return true;
}
function resumoMeu(){
  /* o que sai do aparelho: só o código, o nível do jogo e os itens da quinta (ids e quantidades).
     Nunca o nome da criança. */
  const itens = {};
  for(const [k, v] of Object.entries(Estado.quinta.itens || {})) if(IDS_ITENS.has(k) && Number.isInteger(v) && v > 0) itens[k] = Math.min(99, v);
  return { codigo: Estado.codigo, nivel: Math.max(1, Math.min(TOTAL_NIVEIS, Estado.nivel || 1)), itens };
}
Nuvem.resumo = resumoMeu;
Nuvem.aoPerderCodigo = () => {            /* o código já era de outra identidade: novo código, sem amigos antigos */
  Estado.codigo = codigoNovo(); Estado.amigos = []; Estado.guarda();
  Nuvem._ultimaPub = ''; Nuvem._codigoOk = ''; Nuvem.agenda(500);
};

/* dados que vêm da cloud NUNCA se usam como estão: só ids conhecidos e números dentro dos limites */
const IDS_ITENS = new Set([...EDIFICIOS, ...BICHOS_LOJA, ...PERSONAGENS].map(x => x.id));
const inteiro = (v, min, max) => Number.isFinite(+v) ? Math.max(min, Math.min(max, Math.trunc(+v))) : min;
const NOME_ANIMAL = { gato:'Gatinho', coelho:'Coelhinho', urso:'Ursinho', passaro:'Passarinho', raposa:'Raposinha' };
function alcunhaDe(codigo){                /* "Coelhinho 42": calculado, nunca escrito por ninguém */
  let h = 0;
  for(const c of String(codigo).toUpperCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `${NOME_ANIMAL[ANIMAIS[h % ANIMAIS.length]] || 'Amiguinho'} ${1 + (h >>> 5) % 99}`;
}
function sanitizaPerfil(codigo, d){
  if(!d || typeof d !== 'object' || !CODIGO_RE.test(codigo)) return null;
  const itens = {};
  if(d.itens && typeof d.itens === 'object') for(const [k, v] of Object.entries(d.itens)) if(IDS_ITENS.has(k) && Number.isInteger(v) && v > 0) itens[k] = Math.min(99, v);
  const nq = nivelQuinta(itens);
  return {
    codigo, nome: alcunhaDe(codigo), nivel: inteiro(d.nivel, 1, TOTAL_NIVEIS),
    nqNivel: nq.nivel, nqNome: nq.nome, pontos: nq.pontos,
    edificios: contaEdificios(itens), bichos: contaBichos(itens),
    personagens: PERSONAGENS.filter(p => itens[p.id]).map(p => p.id), itens,
  };
}

let amigosAtualizadoEm = 0, aAtualizarAmigos = false;
async function atualizaAmigos(forca){
  if(!Nuvem.ligada || !Nuvem.consentida || aAtualizarAmigos) return;
  if(!forca && Date.now() - amigosAtualizadoEm < 45000) return;
  aAtualizarAmigos = true; amigosAtualizadoEm = Date.now();
  try{
    limpaAmigosLocais();
    await Nuvem.publica();
    let mudou = false;
    for(const a of Estado.amigos){
      /* a permissão que eu dei renova-se de vez em quando (as permissões caducam sozinhas) */
      if(a.uid && Date.now() - (a.rv || 0) > 30 * 864e5){
        try{ await Nuvem.concede(Estado.codigo, a.codigo); a.rv = Date.now(); mudou = true; }catch(e){}
      }
      const r = await Nuvem.lerPerfil(a.codigo);
      if(r.estado === 'ok'){
        const res = sanitizaPerfil(a.codigo, r.dados);
        if(res){
          if(JSON.stringify(res) !== JSON.stringify(a.resumo)){ a.resumo = res; mudou = true; }
          if(a.estado !== 'amigo'){ a.estado = 'amigo'; mudou = true; }
        }
      }else if(r.estado === 'pendente' && (a.estado !== 'pendente' || a.resumo)){
        a.estado = 'pendente'; a.resumo = null; mudou = true;     /* o outro lado ainda não autorizou, ou retirou a autorização */
      }
    }
    if(mudou) Estado.guarda();
    const e = document.body.dataset.ecra;
    if(e === 'pais') desenhaPais();
    if(e === 'amigos') desenhaAmigos();
    else if(e === 'quinta') redesenhaQuinta();
  }catch(err){ console.warn('Amigos: não foi possível atualizar', err); }
  finally{ aAtualizarAmigos = false; }
}
Nuvem.aposSync = () => atualizaAmigos(true);
/* só os amigos de quem já se conhece o nível aparecem no mapa */
const amigosNoMapa = () => Estado.amigos.filter(a => a.resumo && a.estado === 'amigo' && !codigosLocais().has(a.codigo)).map(a => ({ ...a, nivel: Math.max(1, Math.min(TOTAL_NIVEIS, a.resumo.nivel || 1)) }));
/* os que passeiam pela quinta (no máximo 3, para não pesar) */
function visitantesQuinta(){
  const locais = codigosLocais();
  return Estado.amigos.filter(a => a.resumo && a.estado === 'amigo' && !locais.has(a.codigo)).slice(0, 3).map(a => ({
    codigo: a.codigo, nome: a.resumo.nome,
    modelo: (a.resumo.personagens || []).includes('menina') ? 'menina' : (a.resumo.personagens || []).includes('menino') ? 'menino'
            : (a.codigo.charCodeAt(0) % 2 ? 'menino' : 'menina'),
    resumo: a.resumo,
  }));
}

/* ============================================== AMIGOS (ver a quinta e o nível) ==== */
const esc = t => String(t).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function desenhaAmigos(){
  const locais = codigosLocais();
  const lista = Estado.amigos.filter(a => a.resumo && a.estado === 'amigo' && !locais.has(a.codigo));
  $('#am-lista').innerHTML = lista.map(a => `
    <li><button class="rk-linha am-amigo" data-am="${esc(a.codigo)}" type="button">
      <span aria-hidden="true">${avatar(a.animal, a.cor, 44)}</span>
      <span class="rk-txt"><b>${esc(a.resumo.nome)}</b>
        <small>Nível ${a.resumo.nivel} de ${TOTAL_NIVEIS} · 🌳 Quinta nível ${a.resumo.nqNivel}</small></span>
      <span class="rk-val" aria-hidden="true">👀</span>
    </button></li>`).join('');
  $('#am-nota').textContent = lista.length ? 'Toca num amigo para ver a quinta dele.'
    : !Nuvem.configurada ? 'Os amigos não estão disponíveis neste jogo.'
    : !Nuvem.consentida ? 'Para ver amigos, o pai ou a mãe tem de ligar a partilha na Área dos Pais.'
    : 'Ainda não há amigos. O pai ou a mãe pode juntar o código de um amigo na Área dos Pais.';
}
function abreAmigos(){
  atualizaAmigos();
  Voz.cala(); Fala.esconde(); jogo.para();
  $('#tabuleiro').innerHTML = '';
  $('#am-visita').hidden = true; $('#am-vista-lista').hidden = false;
  desenhaAmigos();
  mostra('#ecra-amigos');
  $('#barra').hidden = false;
}
function abreAmigo(cod){
  const a = Estado.amigos.find(x => x.codigo === cod);
  if(!a || !a.resumo) return;
  const r = a.resumo;
  $('#am-avatar').innerHTML = avatar(a.animal, a.cor, 72);
  $('#am-nome').textContent = r.nome;
  $('#am-info').textContent = `Nível ${r.nivel} de ${TOTAL_NIVEIS} · 🌳 Quinta nível ${r.nqNivel} · 🏠 ${r.edificios} · 🐾 ${r.bichos}`;
  desenhaQuinta($('#amigo-grelha'), r.itens || {}, null, true);
  $('#am-vazia').hidden = r.edificios > 0;
  $('#am-vista-lista').hidden = true; $('#am-visita').hidden = false;
  $('#ecra-amigos').scrollTop = 0;
  $('#texto-voltar').textContent = 'Amigos';
}
function fechaAmigo(){
  $('#am-visita').hidden = true; $('#am-vista-lista').hidden = false;
  $('#texto-voltar').textContent = 'Avós';
}
$('#am-lista').addEventListener('click', e => {
  const b = e.target.closest('[data-am]'); if(!b) return;
  Som.efeito('toque'); abreAmigo(b.dataset.am);
});

function chaveDia(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function atualizaMissao(){
  const feita = Estado.missaoDia === chaveDia();
  const el = $('#missao-dia');
  if(!el) return;
  el.classList.toggle('concluida', feita);
  el.innerHTML = feita
    ? '<strong>🏆 Missão concluída!</strong><span>Excelente trabalho. Amanhã há uma nova aventura.</span>'
    : '<strong>⭐ Missão de hoje</strong><span>Completa uma atividade educativa para aprender e ganhar estrelas.</span>';
}

function abreMapa(suave, mundo){
  if(limiteAtingido()) setTimeout(mostraAvisoLimite, 300);
  mundoVisto = mundo !== undefined ? mundo : mundoDoNivel(Estado.nivel);
  desenhaMapa(telaMapa, Estado, amigosNoMapa(), mundoVisto);
  $('#faixa-mundo').textContent = MUNDOS[mundoVisto].nome;
  atualizaMissao();
  mostra('#ecra-mapa');
  $('#conta-estrelas').textContent = Estado.saldo();
  requestAnimationFrame(() => scrollParaNivel(caixaMapa, telaMapa, Estado.nivel, mundoVisto, suave));
  if(festaPendente) setTimeout(festaDeNivel, 700);
}

telaMapa.addEventListener('click', e => {
  const b = e.target.closest('.nivel');
  if(!b || b.disabled) return;
  comecaNivel(+b.dataset.nivel);
});

/* Registo local e adaptativo: apenas contagens agregadas por competência. */
function atualizaTempoUso(){
  const agora=Date.now(), hoje=chaveDia();
  if(Estado.diaUso && Estado.diaUso !== hoje) Estado.tempoHoje = 0;          /* novo dia, contagem a zeros */
  const delta=Math.max(0,Math.min(300,Math.round((agora-(Estado.inicioSessao||agora))/1000)));
  Estado.tempoHoje=(Estado.tempoHoje||0)+delta; Estado.inicioSessao=agora; Estado.diaUso=hoje;
  if(delta) Estado.guardaLogo();
  /* o aviso nunca interrompe uma ronda: espera pelo mapa, pelos menus ou pela quinta */
  if(limiteAtingido() && ['mundos','mapa','amigos','quinta'].includes(document.body.dataset.ecra)) mostraAvisoLimite();
}
function limiteAtingido(){
  return Estado.limiteMinutos > 0 && (Estado.tempoHoje || 0) >= Estado.limiteMinutos * 60;
}
function abreAlbum(){
  if(document.querySelector('.album-fundo')) return;
  const todos = CATEGORIAS_ALBUM.flatMap(c => ITENS[c].map(x => ({ ...x, cat: c })));
  const tem = todos.filter(x => Estado.album[x.id]).length;
  const f = document.createElement('div'); f.className = 'album-fundo'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', 'Álbum de cromos');
  f.innerHTML = `<h2>📒 O meu álbum</h2><p>${tem} de ${todos.length} cromos</p>` +
    CATEGORIAS_ALBUM.map(c => `<h3>${rotuloTipo[c]}</h3><div class="album-grelha">${ITENS[c].map(x => {
      const n = Estado.album[x.id] || 0;
      return `<div class="cromo${n ? '' : ' falta'}"><img src="${imagemItem(x.id)}" alt="" loading="lazy" decoding="async">${n ? `<b>${n}</b><div>${x.nome}</div>` : '<div>?</div>'}</div>`;
    }).join('')}</div>`).join('') +
    '<button class="botao" type="button">Fechar</button>';
  document.body.append(f);
  f.querySelector('button').onclick = () => f.remove();
}
$('#btn-album')?.addEventListener('click', abreAlbum);
$('#btn-brincar')?.addEventListener('click', () => { if(limiteAtingido()){ mostraAvisoLimite(); return; } abreBrincar(Som); });
let niveisSeguidos = 0;
function mostraPausa(){
  if(document.querySelector('.aviso-limite')) return;
  niveisSeguidos = 0;
  const aviso=document.createElement('div'); aviso.className='aviso-limite'; aviso.setAttribute('role','dialog');
  aviso.innerHTML='<strong>🌿 Boa! Que tal uma pausa?</strong><p>Já jogaste três níveis. Podes ir ver a tua quinta ou continuar a jogar.</p><button class="botao" type="button" data-a="quinta">🏡 Ver a minha quinta</button> <button class="botao calma" type="button" data-a="seguir">▶ Continuar</button>';
  document.body.append(aviso);
  aviso.querySelector('[data-a=quinta]').onclick=()=>{aviso.remove();abreQuinta();};
  aviso.querySelector('[data-a=seguir]').onclick=()=>aviso.remove();
}
function mostraAvisoLimite(){
  if(document.querySelector('.aviso-limite')) return;
  Voz.cala(); Fala.esconde();
  const aviso=document.createElement('div'); aviso.className='aviso-limite'; aviso.setAttribute('role','alertdialog');
  aviso.innerHTML='<strong>🌿 Hora de descansar!</strong><p>O tempo de aprendizagem definido pelos adultos foi atingido. Amanhã há mais aventuras.</p><button class="botao" type="button" data-a="quinta">🏡 Ver a minha quinta</button> <button class="botao calma" type="button" data-a="pais">⚙ Área dos pais</button>';
  document.body.append(aviso);
  aviso.querySelector('[data-a=quinta]').onclick=()=>{aviso.remove();abreQuinta();};
  aviso.querySelector('[data-a=pais]').onclick=()=>{aviso.remove();$('#btn-pais').click();};
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){ atualizaTempoUso(); Estado.guarda(); }});
addEventListener('pagehide',()=>{ Estado.guarda(); });
setInterval(()=>{if(!document.hidden) atualizaTempoUso();},30000);

/* ===================================================== JOGO ============== */
/* ---- festa dos meninos Beagle: de 10 em 10 níveis de cada mapa ---- */
const festa = new Festa({ confete, som: Som });
let festaPendente = 0, ultimaFesta = null;
function festaDeNivel(){
  const n = festaPendente; festaPendente = 0;
  if(!n || document.body.dataset.ecra !== 'mapa') return;
  const donos = PERSONAGENS.filter(p => Estado.quinta.itens[p.id]);
  if(!donos.length) return;
  const outros = donos.filter(p => p.id !== ultimaFesta);
  const p = pick(outros.length ? outros : donos);
  ultimaFesta = p.id;
  const m = mundoDoNivel(n), no = n - primeiroDoMundo(m) + 1;
  festa.mostra(p.id, {
    titulo: `Nível ${no}!`,
    sub: `${MUNDOS[m].nome} · Muito bem${Estado.nome ? ', ' + Estado.nome : ''}!`,
  });
}

const jogo = new Jogo({
  raiz: $('#tabuleiro'),
  voz: Voz,
  som: Som,
  mascote: { faz: p => activo && activo.faz(p) },
  aoAcertar: (tipo, aPrimeira) => {
    const k=tipo||jogo.tipo; if(!Estado.aprendizagem[k]) Estado.aprendizagem[k]={certas:0,erros:0};
    const ap = Estado.aprendizagem[k];
    ap.certas++;
    /* ultimas 20 rondas: 1 = acertou logo, 0 = precisou de mais tentativas (a dificuldade reage a isto) */
    ap.rec = (ap.rec || []).concat(aPrimeira === false ? 0 : 1).slice(-20);
    Estado.guardaLogo();
    $('#conta-estrelas').textContent = Estado.saldo();
  },
  aoErro: tipo => {
    const k=tipo||jogo.tipo; if(!Estado.aprendizagem[k]) Estado.aprendizagem[k]={certas:0,erros:0};
    Estado.aprendizagem[k].erros++; Estado.guardaLogo();
  },
  aoColecionar: (id) => {
    const novo = !Estado.album[id];
    Estado.album[id] = Math.min(99, (Estado.album[id] || 0) + 1);
    Estado.guardaLogo();
    if(novo){ const t = document.createElement('div'); t.className = 'toast-cromo'; t.textContent = '⭐ Novo cromo no álbum!'; document.body.append(t); setTimeout(() => t.remove(), 2300); }
  },
  aoSair: () => voltaAoMapa(),
  aoAcabar: (nivel, estrelas) => {
    const antes = Estado.nivel;
    Estado.ganha(nivel, estrelas);
    if(Estado.nivel > antes && nivel % 10 === 0) festaPendente = nivel;   /* chegou a um múltiplo de 10 */
    Estado.missaoDia = chaveDia();
    Estado.guarda();
    mostraRecompensa(nivel, estrelas);
    if(++niveisSeguidos >= 3) setTimeout(() => { if(['mundos','mapa'].includes(document.body.dataset.ecra)) mostraPausa(); }, 6000);
  },
});

function comecaNivel(n){
  if(limiteAtingido()){ mostraAvisoLimite(); return; }
  const P = perfilIdade(Estado.idade);
  const info = {...infoNivel(n)};       /* o tipo vem da rotação da idade (mapa.js) */
  const chave = info.tipo;
  const m = Estado.aprendizagem[chave] || {certas:0,erros:0};
  const rec = Array.isArray(m.rec) ? m.rec : [];
  const taxa = rec.length ? rec.reduce((a, b) => a + b, 0) / rec.length : .7;
  const ajuste = rec.length >= 5 ? (taxa >= .85 ? 1 : taxa <= .5 ? -1 : 0) : 0;   /* janela das ultimas rondas, nao toda a vida */
  info.dificuldade = Math.max(1, Math.min(4, (info.dificuldade||1) + ajuste));
  info.opcoes   = Math.max(2, Math.min(P.opcoes,   (info.opcoes||3) + ajuste));
  info.maxConta = Math.max(3, Math.min(P.maxConta, (info.maxConta||5) + ajuste));
  info.formas   = Math.min(info.formas || 2, P.formas);
  info.paleta   = Math.min(info.paleta || 4, P.paleta);
  info.pares = P.pares; info.numOpcoes = P.numOpcoes; info.memoriaIgual = P.memoriaIgual; info.estrelasMin = P.estrelasMin || 1; info.padroes = P.padroes; info.letraOpcoes = P.letraOpcoes;
  info.somaMax = P.somaMax ? P.somaMax + (ajuste > 0 ? 5 : 0) : 0;
  info.imagens = P.imagens;
  info.nat = P.nat; info.mundo = Math.floor((n - 1) / POR_MUNDO);
  mostra(null);
  $('#tabuleiro').innerHTML = '';
  $('#barra').hidden = false;
  vista = VISTAS.um;
  Som.efeito('nivel');
  jogo.comeca(n, info);
}

function mostraRecompensa(nivel, estrelas){
  const est = Array.from({length:3}, (_, i) =>
    `<svg viewBox="0 0 24 24" class="estrela-grande ${i < estrelas ? 'ganha' : ''}"
       style="animation-delay:${i * 160}ms">
      <path d="M12 2l3 6.5 7 .9-5 4.9 1.2 7L12 18l-6.2 3.3L7 14.3l-5-4.9 7-.9z"
        fill="${i < estrelas ? '#FFD95E' : 'rgba(255,255,255,.25)'}" stroke="#1B4D8F" stroke-width="1.5"/>
    </svg>`).join('');
  $('#chuva').innerHTML = est;
  const n = Estado.nome ? ', ' + Estado.nome : '';
  $('#titulo-recompensa').textContent =
    (estrelas === 3 ? 'Perfeito' : pick(['Muito bem', 'Conseguiste'])) + n + '!';
  $('#btn-ir-quinta').textContent = `🏡 A minha quinta · ⭐ ${Estado.saldo()}`;
  mostra('#ecra-recompensa');
  for(let i = 0; i < estrelas; i++) setTimeout(() => Som.efeito('estrela'), 180 + i * 240);
  const r = $('#chuva').getBoundingClientRect();
  setTimeout(() => confete(document.body, r.left + r.width / 2, r.top + r.height / 2,
    ['#F7C21B', '#E0162B', '#2C6FD6', '#fff']), 250);
  const porExtenso = { 1:'uma estrela', 2:'duas estrelas', 3:'três estrelas' }[estrelas];
  Voz.diz(estrelas === 3 ? 'Perfeito! Três estrelas!' : `Boa! Ganhaste ${porExtenso}.`,
          () => activo && activo.faz('palmas'));
}

$('#btn-continuar').onclick = () => { Som.efeito('toque'); Voz.cala(); Fala.esconde(); abreMapa(true, mundoDoNivel(Estado.nivel)); };
$('#btn-repetir').onclick = () => { Som.efeito('toque'); comecaNivel(jogo.nivel); };

/* botão de silêncio */
$('#btn-som').onclick = () => {
  const calado = Som.ligado;
  Som.silencia(calado);
  pintaBotaoSom();
  if(!calado){ Som.retoma(); Som.efeito('toque'); }
};
function pintaBotaoSom(){
  const b = $('#btn-som');
  b.textContent = Som.ligado ? '🔊' : '🔇';
  b.setAttribute('aria-label', Som.ligado ? 'Desligar o som' : 'Ligar o som');
  b.classList.toggle('calado', !Som.ligado);
}

function voltaAoMapa(){
  Voz.cala(); Fala.esconde(); jogo.para();
  $('#tabuleiro').innerHTML = '';
  abreMapa(false, mundoVisto);
}
/* ============================================== HISTÓRIAS ============ */
let historiaAtiva = null;
function abreHistorias(){
  Voz.cala(); Fala.esconde(); jogo.para();
  $('#tabuleiro').innerHTML = '';
  $('#lista-historias').innerHTML = HISTORIAS.map(h => {
    const falas = h.passos.reduce((n, p) => n + p.falas.length, 0);
    /* só o filme: a versão animada ao vivo fica de reserva no código, mas não aparece no menu */
    const cartaoHist = h.soFilme ? '' : `<button class="mundo historia" data-h="${h.id}" type="button">
      <span class="selo" style="--c:#F4C9D6"><span class="selo-emoji">${h.emoji}</span></span>
      <span class="texto"><span class="titulo">${h.titulo}</span>
        <span class="sub">▶ ${h.duracao || 'Cerca de 3 minutos'} · com os dois avós</span></span>
    </button>`;
    return cartaoHist + (h.filme ? `<button class="mundo historia filme-cartao" data-filme="${h.id}" type="button">
      <span class="selo" style="--c:#C9DDF4"><span class="selo-emoji">🎬</span></span>
      <span class="texto"><span class="titulo">${h.tituloFilme || h.titulo}</span>
        <span class="sub">▶ ${h.duracao || 'Cerca de 4 minutos'} · com os dois avós</span></span>
    </button>` : '');
  }).join('') + `<div class="mundo breve" aria-disabled="true">
      <span class="selo" style="--c:#E6E2D8"><span class="selo-emoji">✨</span></span>
      <span class="texto"><span class="titulo">Mais histórias em breve</span>
        <span class="sub">Novas aventuras na quinta</span></span></div>`;
  mostra('#ecra-historias');
  $('#barra').hidden = false;
}
/* o filme da história (vídeo guardado em media/video; carrega só quando se abre, não fica no pré-carregamento) */
function abreFilme(h){
  if(!h || !h.filme) return;
  Voz.cala(); Som.paraVoz && Som.paraVoz();
  const d = document.createElement('div');
  d.className = 'filme';
  d.innerHTML = `<video controls playsinline autoplay preload="auto" poster="${h.poster || ''}" src="${h.filme}" aria-label="${h.tituloFilme || h.titulo}"></video>
    <div class="filme-t">${h.tituloFilme || h.titulo}</div>
    <button class="filme-x" type="button" aria-label="Fechar o filme">✕ Fechar</button>`;
  document.body.append(d);
  const v = d.querySelector('video');
  const fecha = () => { try{ v.pause(); }catch(e){} d.remove(); };
  d.querySelector('.filme-x').onclick = fecha;
  v.onended = fecha;
}
$('#lista-historias').onclick = e => {
  const b = e.target.closest('.historia');
  if(!b) return;
  Som.efeito('toque');
  if(b.dataset.filme){ abreFilme(HISTORIAS.find(x => x.id === b.dataset.filme)); return; }
  const h = HISTORIAS.find(x => x.id === b.dataset.h);
  if(h) comecaHistoria(h);
};
const VISTA_HIST = { pos: new THREE.Vector3(0, .9, 8.2), alvo: new THREE.Vector3(0, 1.25, 0) };   /* mais afastada: os dois avós cabem num ecrã estreito */
function comecaHistoria(h){
  if(limiteAtingido()){ mostraAvisoLimite(); return; }
  document.querySelectorAll('.hist-fim').forEach(e => e.remove());
  Voz.cala(); Fala.esconde(); jogo.para();
  Som.arranca && Som.arranca();
  mostra(null);
  document.body.dataset.historia = '1';
  $('#barra').hidden = false;
  $('#texto-voltar').textContent = 'Histórias';
  const raiz = $('#tabuleiro'); raiz.innerHTML = '';
  /* os dois avós, lado a lado, tal como na abertura */
  avo.visivel(true); ava.visivel(true);
  avo.grupo.position.x = -.52; ava.grupo.position.x = .52;
  avo.grupo.rotation.y = avo.rotBase + 14 * Math.PI / 180; ava.grupo.rotation.y = ava.rotBase - 14 * Math.PI / 180;
  avo.faz('repouso'); ava.faz('repouso');
  vista = VISTA_HIST;
  if(historiaAtiva) historiaAtiva.para();
  historiaAtiva = tocaHistoria(h, { Som, palco: $('#stage'), avo: () => avo, ava: () => ava, fim: () => fimHistoria(h) });
  requestAnimationFrame(redimensiona);
}
function fimHistoria(h){
  const raiz = $('#stage');
  raiz.insertAdjacentHTML('beforeend', `<div class="hist-fim"><p>⭐ Fim da história!</p>
    <button class="botao" id="hist-outra" type="button">Ver outra vez</button>
    <button class="botao calma" id="hist-sair" type="button">Voltar</button></div>`);
  $('#hist-outra').onclick = () => comecaHistoria(h);
  $('#hist-sair').onclick = saiDaHistoria;
}
function saiDaHistoria(){
  if(historiaAtiva){ historiaAtiva.para(); historiaAtiva = null; }
  delete document.body.dataset.historia;
  document.querySelectorAll('.hist-fim').forEach(e => e.remove());
  Voz.cala();
  soUm(Estado.companheiro);
  abreHistorias();
}
$('#btn-voltar').onclick = () => {
  Som.efeito('toque');
  if(document.body.dataset.historia){ saiDaHistoria(); return; }
  const onde = document.body.dataset.ecra;
  if(onde === 'quinta'){ if(!$('#loja').hidden) fechaLoja(); else if(Q3D && Q3D.dentro) Q3D.sai(); else abreMundos(); }   /* quinta -> mundos */
  else if(onde === 'amigos'){ if(!$('#am-visita').hidden) fechaAmigo(); else abreMundos(); }   /* amigo -> lista -> mundos */
  else if(onde === 'historias') abreMundos();     /* histórias -> mundos */
  else if(onde === 'mundos') abreEscolha();        /* mundos -> escolher avô */
  else if(onde === 'mapa') abreMundos();      /* mapa   -> mundos      */
  else voltaAoMapa();                         /* jogo   -> mapa        */
};

function abreEscolha(){
  Voz.cala(); Fala.esconde(); jogo.para();
  $('#tabuleiro').innerHTML = '';
  if(avo){ avo.visivel(true); avo.grupo.position.x = -.52; avo.grupo.rotation.y = avo.rotBase + 14 * Math.PI / 180; }
  if(ava){ ava.visivel(true); ava.grupo.position.x =  .52; ava.grupo.rotation.y = ava.rotBase - 14 * Math.PI / 180; }
  vista = VISTAS.dois;
  mostra('#ecra-escolher');
  Voz.diz('Quem te vai ajudar hoje?');
}

/* a mascote olha para onde se toca, e responde a quem lhe toca */
$('#app').addEventListener('pointerdown', e => {
  if(document.body.dataset.ecra === 'mapa') return;
  const r = $('#stage').getBoundingClientRect();
  if(!r.height) return;
  const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
  const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
  if(avo) avo.olhaPara(nx, ny);
  if(ava) ava.olhaPara(nx, ny);
}, { passive:true });

$('#stage').addEventListener('click', () => {
  if(!activo || jogo.aDecorrer) return;
  const pose = pick(calmoMov ? ['acenar', 'palmas'] : ['acenar', 'dancar', 'palmas', 'festejar', 'saltar']);
  activo.faz(pose);
  Voz.diz(pick(['Olá!', 'Estou aqui!', 'Vamos jogar?', 'Que giro!']), () => activo.faz('repouso'));
});

/* gestos sozinhos: o avô e a avó nunca ficam especados — nos menus e, de vez em quando, nos jogos */
const calmoMov = matchMedia('(prefers-reduced-motion:reduce)').matches;
const GESTOS_MENU = calmoMov ? ['acenar', 'palmas', 'pensar'] : ['acenar', 'dancar', 'palmas', 'pensar', 'festejar', 'saltar', 'apontar', 'encorajar'];
const GESTOS_JOGO = ['pensar', 'apontar', 'encorajar', 'acenar'];
const DURACAO = { dancar:4600, festejar:3000, saltar:3200, palmas:3000 };
function gesto(rig, pose){
  if(!rig || rig.acao !== 'repouso') return;
  rig.faz(pose);
  setTimeout(() => { if(rig.acao === pose) rig.faz('repouso'); }, DURACAO[pose] || 2600);
}
(function gestosSozinhos(){
  const ecra = document.body.dataset.ecra;
  if(!document.hidden){
    if(ecra === 'inicio' || ecra === 'nome' || ecra === 'idade'){
      gesto(avo, pick(GESTOS_MENU)); setTimeout(() => gesto(ava, pick(GESTOS_MENU)), 900);
    }else if(ecra === 'mundos' || ecra === 'mapa' || ecra === 'amigos') gesto(activo, pick(GESTOS_MENU));
    else if(ecra === 'jogo' && Math.random() < .5) gesto(activo, pick(GESTOS_JOGO));
  }
  setTimeout(gestosSozinhos, 4200 + Math.random() * 3200);
})();

/* ============================================== ÁREA DOS PAIS ============ */
let contaPorta = null, digitos = '', falhasPorta = 0, bloqueioPorta = 0;
function novaPergunta(){
  const a = 6 + rnd(9), b = 6 + rnd(9);        /* 6–14: uma criança de 7 anos não a resolve de cabeça */
  contaPorta = { r:a * b };
  digitos = '';
  $('#conta-porta').textContent = `${a} × ${b}`;
  $('#mostrador-porta').textContent = Date.now() < bloqueioPorta ? '⏳' : '';
}

$('#btn-pais').onclick = () => {
  atualizaAmigos(true);
  Voz.cala(); Fala.esconde();
  novaPergunta();
  mostra('#ecra-porta');
};

$('#teclado-porta').innerHTML = [1,2,3,4,5,6,7,8,9,'←',0,'✓']
  .map(v => `<button class="num" data-t="${v}">${v}</button>`).join('');

$('#teclado-porta').onclick = e => {
  const b = e.target.closest('.num'); if(!b) return;
  const v = b.dataset.t;
  if(v === '←') digitos = digitos.slice(0, -1);
  else if(v === '✓'){
    if(Date.now() < bloqueioPorta){ digitos = ''; $('#mostrador-porta').textContent = '⏳'; return; }   /* bloqueada: espera */
    if(+digitos === contaPorta.r){ falhasPorta = 0; desenhaPais(); mostra('#ecra-pais'); atualizaAmigos(true); return; }
    if(++falhasPorta >= 3){ bloqueioPorta = Date.now() + 60000; falhasPorta = 0; }       /* 3 erros: 1 minuto de espera */
    digitos = '';
    $('#mostrador-porta').textContent = '✗';
    setTimeout(novaPergunta, 700);                                                       /* pergunta nova */
    return;
  }
  else if(digitos.length < 3) digitos += v;
  $('#mostrador-porta').textContent = digitos;
};

function textoEstadoAmigo(a){
  if(!Nuvem.configurada) return 'A partilha não está disponível neste jogo.';
  if(!Nuvem.consentida) return 'A partilha está desligada.';
  if(a.estado === 'amigo' && a.resumo) return `Amigos · Nível ${a.resumo.nivel} · Quinta nível ${a.resumo.nqNivel}`;
  return 'À espera: o pai ou a mãe do amigo também tem de juntar o código desta família.';
}
/* tudo o que existe na cloud destes perfis (para os apagar): códigos e ligações a amigos */
function listaParaApagar(soAtivo){
  const out = [];
  for(const p of Estado.listaPerfis()){
    let d = null;
    if(p.id === Estado.perfilId) d = { codigo: Estado.codigo, amigos: Estado.amigos };
    else{ try{ d = JSON.parse(localStorage.getItem('eab-perfil-' + p.id) || 'null'); }catch(e){} }
    if(!d || !CODIGO_RE.test(String(d.codigo || '')) || (soAtivo && p.id !== Estado.perfilId)) continue;
    out.push({ codigo: d.codigo, amigos: (Array.isArray(d.amigos) ? d.amigos : [])
      .filter(a => a && CODIGO_RE.test(String(a.codigo)) && typeof a.uid === 'string').map(a => ({ codigo: a.codigo, uid: a.uid })) });
  }
  return out;
}

function desenhaPais(){
  limpaAmigosLocais();
  $('#meu-codigo').textContent = Estado.codigo;
  const lista = $('#lista-amigos');
  if(!Estado.amigos.length){
    lista.innerHTML = `<p class="vazio">Ainda não há amigos. Troque o código de família com outro pai ou mãe: cada um junta o código do outro.</p>`;
  }else{
    lista.innerHTML = Estado.amigos.map(a => `
      <div class="amigo-linha">
        ${avatar(a.animal, a.cor, 44)}
        <div class="amigo-dados">
          <strong>${esc(alcunhaDe(a.codigo))} · ${esc(a.codigo)}</strong>
          <span>${esc(textoEstadoAmigo(a))}</span>
        </div>
        <button class="mini discreto" data-tira="${a.codigo}" aria-label="Remover amigo">✕</button>
      </div>`).join('');
  }
  $('#progresso-filho').textContent =
    (Estado.nome ? Estado.nome + ' · ' : '') +
    `Nível ${Estado.nivel} de ${TOTAL_NIVEIS} · ${Estado.totalEstrelas()} estrelas`;
  const concluidos = Object.keys(Estado.estrelas).length;
  $('#relatorio-aprendizagem').innerHTML =
    `<p><strong>${concluidos}</strong> níveis concluídos · <strong>${Estado.totalEstrelas()}</strong> estrelas conquistadas</p>` +
    `<div class="relatorio-grelha">${Object.entries(Estado.aprendizagem).map(([k,v])=>{const t=v.certas+v.erros,p=t?Math.round(v.certas/t*100):0;return `<div><strong>${({cores:'Cores',contar:'Contagem',formas:'Formas',letras:'Letras',memoria:'Memória',logica:'Lógica',somas:'Somas',animais:'Animais',frutas:'Frutas',legumes:'Legumes',toupeiras:'Toupeiras',cesto:'Cesto',puzzle:'Puzzle',colheita:'Colheita',flores:'Flores',pontos:'Ligar pontos',procurar:'Procurar',pintar:'Pintar'})[k]||k}</strong><span>${v.certas} respostas certas · ${t} tentativas</span><div class="barra-progresso"><i style="width:${p}%"></i></div><small>${t?p+'% de sucesso':'Ainda sem dados'}</small></div>`}).join('')}</div>` +
    `<p class="aviso">Dados agregados guardados apenas neste dispositivo. A percentagem orienta a adaptação da dificuldade; não é uma avaliação clínica ou escolar.</p>`;
  const selPerfil = $('#perfil-ativo');
  if(selPerfil){
    const perfis = Estado.listaPerfis();
    selPerfil.innerHTML = perfis.map(p => `<option value="${p.id}">${p.nome.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</option>`).join('');
    selPerfil.value = Estado.perfilId;
  }
  const selIdade=$('#idade-crianca'); if(selIdade) selIdade.value=String(Estado.idade||5);
  const selLimite=$('#limite-tempo'); if(selLimite) selLimite.value=String(Estado.limiteMinutos);
  desenhaVoz();
  desenhaConta();
}

function desenhaVoz(){
  const d = Som.diagnostico();
  const opcoes = d.vozesPt.map(v => v);
  for(const [id, genero] of [['#voz-homem','m'],['#voz-mulher','f']]){
    const sel = $(id), atual = Som.vozesPreferidas[genero] || '';
    sel.innerHTML = '<option value="">Automática (recomendada)</option>' + opcoes.map(v => {
      const nome = v.replace(/ \([^)]*\)$/, '');
      return `<option value="${nome.replaceAll('&','&amp;').replaceAll('\"','&quot;')}">${v}</option>`;
    }).join('');
    sel.value = atual;
  }
  document.querySelectorAll('input[name=voz]').forEach(r => { r.checked = r.value === d.modo; });
  const partes = [];
  const quem = d.personagem === 'f' ? 'da avó (feminina)' : 'do avô (masculina)';
  partes.push(d.vozesPt.length
    ? `Vozes PT-PT detetadas: ${d.vozesPt.join(', ')}. A aplicação exclui deliberadamente vozes pt-BR.`
    : d.temApi ? 'Não foi encontrada uma voz pt-PT. Instale uma voz Português (Portugal) nas definições do dispositivo; não será usada uma voz brasileira.'
               : 'Este aparelho não disponibiliza síntese de voz. As instruções continuam visíveis no ecrã.');
  $('#diag-voz').textContent = partes.join(' ');
}


/* ============================================ CONTA DOS PAIS (cloud) ======= */
/* ---- PIN dos pais: ação de adulto exigida pela Google Play para funções sociais.
   Guardado só neste aparelho, com sal e PBKDF2 (100 000 voltas). 3 erros = 5 minutos de espera. ---- */
const PIN_CHAVE = 'eab-pin', PIN_BLOQ = 'eab-pin-bloq';
const b64 = u => btoa(String.fromCharCode(...u)), desb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function hashPin(pin, sal){
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  return b64(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: sal, iterations: 100000, hash: 'SHA-256' }, k, 256)));
}
const pinExiste = () => { try{ const d = JSON.parse(localStorage.getItem(PIN_CHAVE) || 'null'); return !!(d && d.s && d.h); }catch(e){ return false; } };
const pinFraco = p => /^(\d)\1{3}$/.test(p) || ['0123','1234','2345','3456','4567','5678','6789','3210','4321','5432','6543','7654','8765','9876'].includes(p);
async function criaPin(pin){
  const sal = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(PIN_CHAVE, JSON.stringify({ s: b64(sal), h: await hashPin(pin, sal) }));
  localStorage.removeItem(PIN_BLOQ);
}
async function verificaPin(pin){
  let b = {}; try{ b = JSON.parse(localStorage.getItem(PIN_BLOQ) || '{}'); }catch(e){}
  if(b.ate && Date.now() < b.ate) return 'bloqueado';
  const d = JSON.parse(localStorage.getItem(PIN_CHAVE) || 'null');
  if(!d) return 'sem-pin';
  if(await hashPin(pin, desb64(d.s)) === d.h){ localStorage.removeItem(PIN_BLOQ); return 'ok'; }
  const n = (b.n || 0) + 1;
  localStorage.setItem(PIN_BLOQ, JSON.stringify(n >= 3 ? { n: 0, ate: Date.now() + 300000 } : { n }));
  return n >= 3 ? 'bloqueado' : 'errado';
}
/* pede o PIN num campo; devolve { ok, msg } e limpa o campo */
async function validaPinAdulto(campo){
  const pin = (campo.value || '').trim(); campo.value = '';
  if(!pinExiste()) return { ok: false, msg: 'Crie primeiro o PIN dos pais (no início deste painel).' };
  if(!/^\d{4}$/.test(pin)) return { ok: false, msg: 'Escreva o PIN dos pais (4 números).' };
  const r = await verificaPin(pin);
  if(r === 'ok') return { ok: true };
  return { ok: false, msg: r === 'bloqueado' ? 'Demasiadas tentativas. Espere 5 minutos.' : 'PIN errado.' };
}
$('#btn-criar-pin').onclick = async () => {
  const a = $('#pin-novo').value.trim(), b = $('#pin-novo2').value.trim(), aviso = $('#aviso-pin');
  if(!/^\d{4}$/.test(a)){ aviso.textContent = 'O PIN tem de ter 4 números.'; return; }
  if(pinFraco(a)){ aviso.textContent = 'Escolha um PIN menos óbvio (não 1234, 1111…).'; return; }
  if(a !== b){ aviso.textContent = 'Os dois PIN têm de ser iguais.'; return; }
  await criaPin(a);
  $('#pin-novo').value = $('#pin-novo2').value = ''; aviso.textContent = 'PIN criado.';
  desenhaConta();
};

function desenhaConta(){
  const estado = $('#conta-estado'), fora = $('#conta-fora'), dentro = $('#conta-dentro');
  if(!estado) return;
  $('#pin-criar').hidden = pinExiste();
  if(!Nuvem.configurada){
    estado.textContent = 'A partilha com amigos não está disponível neste jogo. O progresso fica só neste aparelho.';
    fora.hidden = true; dentro.hidden = true; return;
  }
  if(!Nuvem.consentida){
    estado.textContent = Nuvem.apagarPendente
      ? 'A partilha está desligada. Falta terminar de apagar os dados da cloud: acontece sozinho quando houver internet.'
      : 'A partilha com amigos está desligada. Nada sai deste aparelho.';
    fora.hidden = false; dentro.hidden = true; return;
  }
  const h = Nuvem.ultimaSync ? new Date(Nuvem.ultimaSync).toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'}) : 'ainda não';
  estado.textContent = `Partilha com amigos ligada. Última atualização: ${h}.` + (Nuvem.erro ? ' ' + Nuvem.erro : '');
  fora.hidden = true; dentro.hidden = false;
}
Nuvem.aMudar = desenhaConta;
/* progresso novo da cloud: aplica-se sem recarregar, e nunca a meio de um jogo */
let dadosPendentes = false;
function aplicaPendentes(){
  if(!dadosPendentes) return;
  const ecra = document.body.dataset.ecra;
  if(!['inicio', 'mundos', 'mapa', 'quinta', 'pais'].includes(ecra)) return;
  dadosPendentes = false;
  Estado.carrega();
  aplicaIdade();
  const cs = $('#conta-estrelas'); if(cs) cs.textContent = Estado.saldo();
  if(ecra === 'mundos') abreMundos();
  else if(ecra === 'quinta') redesenhaQuinta();
}
Nuvem.aoTrazerDados = () => { dadosPendentes = true; aplicaPendentes(); };
async function tentaConta(acao){
  const aviso = $('#aviso-conta');
  aviso.textContent = '';
  const botoes = document.querySelectorAll('#painel-conta button');
  botoes.forEach(b => b.disabled = true);
  try{ await acao(); }
  catch(e){ aviso.textContent = Nuvem.mensagem(e); }
  finally{ botoes.forEach(b => b.disabled = false); }
}
$('#btn-ativar-partilha').onclick = async () => {
  if(!$('#consentimento-pais').checked){ $('#aviso-conta').textContent = 'Marque a caixa para confirmar que é o pai, mãe ou responsável.'; return; }
  const pin = await validaPinAdulto($('#pin-ativar'));
  if(!pin.ok){ $('#aviso-conta').textContent = pin.msg; return; }
  if(!confirm('Vai ligar a partilha com amigos.\n\nSó sai do aparelho: o código da família, o nível do jogo e os itens da quinta. Não há nome, fotografias, mensagens nem localização. Cada amigo tem de ser autorizado por si, juntando o código dele.\n\nPode desligar e apagar tudo quando quiser.\n\nConfirma que é o pai, mãe ou responsável?')) return;
  tentaConta(async () => { await Nuvem.ativa(); atualizaAmigos(true); });
};
$('#btn-sair-conta').onclick = () => tentaConta(async () => {
  if(!confirm('Desligar a partilha e apagar da cloud tudo o que foi publicado? Os amigos deixam de ver esta criança e a lista de amigos é apagada.')) return;
  const r = await Nuvem.desativa(listaParaApagar(false));
  Estado.amigos = []; Estado.guarda();
  $('#aviso-conta').textContent = r.ok ? 'Pronto: tudo foi apagado da cloud.'
    : 'Sem ligação neste momento. A partilha ficou desligada e o apagamento completa-se sozinho assim que houver internet.';
});

$('#idade-crianca')?.addEventListener('change',e=>{Estado.idade=+e.target.value;Estado.guarda();aplicaIdade();});
$('#limite-tempo')?.addEventListener('change',e=>{Estado.limiteMinutos=Math.max(0,Math.min(180,+e.target.value||0));Estado.guarda();});
$('#btn-apagar-perfil')?.addEventListener('click',async()=>{
  if(!confirm('Apagar permanentemente o progresso deste perfil neste dispositivo (e o que partilhou na cloud)?')) return;
  if(Nuvem.configurada && Nuvem.consentida){ try{ await Nuvem.apagaPerfis(listaParaApagar(true)); }catch(e){} }
  try{ const ap=JSON.parse(localStorage.getItem('eab-apagados')||'[]'); ap.push(Estado.perfilId); localStorage.setItem('eab-apagados',JSON.stringify(ap)); }catch(e){}
  Estado.apagando = true; clearTimeout(Estado._tg);          /* nada volta a gravar o perfil apagado */
  localStorage.removeItem('eab-perfil-'+Estado.perfilId);
  localStorage.removeItem('eab');                              /* copia antiga que ressuscitava o progresso */
  const ps=Estado.listaPerfis().filter(p=>p.id!==Estado.perfilId);
  if(!ps.length) ps.push({id:'principal',nome:'Criança 1'});
  localStorage.setItem('eab-perfis',JSON.stringify(ps));
  localStorage.setItem('eab-perfil-ativo',ps[0].id); location.reload();
});
$('#btn-apagar-tudo')?.addEventListener('click',async()=>{
  if(!confirm('Apagar TODOS os perfis e dados deste jogo, neste aparelho e na cloud? Não é possível desfazer.')) return;
  if(Nuvem.configurada && (Nuvem.consentida || Nuvem.apagarPendente)){ try{ await Nuvem.desativa(listaParaApagar(false)); }catch(e){} }
  Estado.apagando = true; clearTimeout(Estado._tg);
  /* a lista de apagamentos pendentes fica (só tem códigos): serve para terminar o apagamento na cloud se estava sem internet */
  try{ Object.keys(localStorage).filter(k => (k === 'eab' || k.startsWith('eab-')) && k !== 'eab-apagar-pendente').forEach(k => localStorage.removeItem(k)); }catch(e){}
  try{ if(window.caches) caches.keys().then(ks => ks.filter(k => k.startsWith('eab')).forEach(k => caches.delete(k))); }catch(e){}
  location.reload();
});
$('#perfil-ativo').addEventListener('change', e => {
  const id = e.target.value;
  if(!id || id === Estado.perfilId) return;
  Estado.guarda();
  localStorage.setItem('eab-perfil-ativo', id);
  location.reload();
});

$('#form-perfil').onsubmit = e => {
  e.preventDefault();
  const campo = $('#nome-perfil');
  const nome = campo.value.trim();
  const aviso = $('#aviso-perfil');
  if(!nome){ aviso.textContent = 'Escreva o nome ou uma alcunha da criança.'; return; }
  const perfis = Estado.listaPerfis();
  if(perfis.length >= 6){ aviso.textContent = 'Por agora, pode criar até 6 perfis neste dispositivo.'; return; }
  const id = 'p' + Date.now().toString(36);
  perfis.push({id, nome});
  localStorage.setItem('eab-perfis', JSON.stringify(perfis));
  const dados = {nivel:1, estrelas:{}, companheiro:'avo', nome, perguntouNome:true, idade:null, codigo:codigoNovo(), amigos:[], missaoDia:null};
  localStorage.setItem('eab-perfil-' + id, JSON.stringify(dados));
  localStorage.setItem('eab-perfil-ativo', id);
  location.reload();
};

document.addEventListener('change', e => {
  if(e.target.name === 'voz'){
    Som.defineModo(e.target.value);
    desenhaVoz();
    Som.fala(fraseTeste());
  }
  if(e.target.id === 'voz-homem' || e.target.id === 'voz-mulher'){
    Som.defineVozPreferida(e.target.id === 'voz-mulher' ? 'f' : 'm', e.target.value);
    Som.defineVoz(e.target.id === 'voz-mulher' ? 'f' : 'm');
    Som.defineModo('aparelho');
    document.querySelector('input[name=voz][value=aparelho]').checked = true;
    Som.arranca(); Som.fala(fraseTeste());
  }
});
if('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', () => { if($('#ecra-pais')?.classList.contains('on')) desenhaVoz(); });
function fraseTeste(){
  return Som.personagem === 'f'
    ? 'Olá! Eu sou a Avó Beagle. Vamos ao mapa!'
    : 'Olá! Eu sou o Avô Beagle. Vamos ao mapa!';
}
$('#btn-testar-voz').onclick = () => { Som.arranca(); Som.fala(fraseTeste()); };

$('#lista-amigos').onclick = async e => {
  const b = e.target.closest('[data-tira]'); if(!b) return;
  const a = Estado.amigos.find(x => x.codigo === b.dataset.tira); if(!a) return;
  if(!confirm('Remover este amigo? Deixam de ver a quinta um do outro.')) return;
  const aviso = $('#aviso-amigo');
  const ok = Nuvem.consentida ? await Nuvem.revoga(Estado.codigo, a) : true;
  if(!ok){ aviso.textContent = 'Sem ligação: não foi possível retirar a permissão agora. Tente outra vez com internet.'; return; }
  Estado.amigos = Estado.amigos.filter(x => x.codigo !== a.codigo);
  Estado.guarda(); aviso.textContent = ''; desenhaPais();
};

$('#form-amigo').onsubmit = async e => {
  e.preventDefault();
  const campo = $('#campo-codigo'), aviso = $('#aviso-amigo');
  const bruto = campo.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cod = bruto.length === 12 ? `${bruto.slice(0, 4)}-${bruto.slice(4, 8)}-${bruto.slice(8)}` : '';
  if(!CODIGO_RE.test(cod)){ aviso.textContent = 'O código tem este aspeto: ABCD-EFGH-JKMN.'; return; }
  if(!Nuvem.consentida){ aviso.textContent = 'Ligue primeiro a partilha com amigos (mais acima).'; return; }
  if(cod === Estado.codigo || codigosLocais().has(cod)){ aviso.textContent = 'Esse código é desta família.'; return; }
  if(Estado.amigos.some(a => a.codigo === cod)){ aviso.textContent = 'Esse amigo já está na lista.'; return; }
  if(Estado.amigos.length >= 12){ aviso.textContent = 'O máximo é de 12 amigos.'; return; }
  const pin = await validaPinAdulto($('#pin-amigo'));
  if(!pin.ok){ aviso.textContent = pin.msg; return; }
  const botao = e.submitter; if(botao) botao.disabled = true;
  aviso.textContent = 'A juntar…';
  try{
    const uid = await Nuvem.concede(Estado.codigo, cod);
    Estado.amigos.push({ ...amigoDeCodigo(cod), uid, estado: 'pendente', rv: Date.now(), resumo: null });
    Estado.guarda();
    campo.value = '';
    aviso.textContent = 'Código juntado. A criança só vê o amigo quando o pai ou a mãe do amigo também juntar o código desta família.';
    desenhaPais(); atualizaAmigos(true);
  }catch(err){ aviso.textContent = Nuvem.mensagem(err); }
  finally{ if(botao) botao.disabled = false; }
};

$('#btn-fechar-porta').onclick = () => abreMapa(false, mundoVisto);
$('#btn-sair-pais').onclick   = () => abreMapa(false, mundoVisto);

/* =================================================== ARRANQUE ============ */
const carregador = new GLTFLoader();
function paraBuffer(b64){
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8.buffer;
}
const carrega = b64 => new Promise((ok, erro) =>
  carregador.parse(paraBuffer(b64), '', ok, erro));

/* Ao carregar em Começar: ecrã de carregamento até as vozes e a quinta 3D
   estarem prontas (no máximo 15 s; se a rede for lenta, a voz do aparelho
   serve de reserva e o jogo arranca na mesma). */
let aPreparar = false;
$('#btn-comecar').onclick = async () => {
  if(aPreparar) return;
  aPreparar = true;
  Som.arranca();              /* o áudio só pode nascer de um toque */
  pintaBotaoSom();
  $('#texto-carregar').textContent = 'A preparar as vozes do avô e da avó…';
  mostra('#ecra-carregar');
  const espera = ms => new Promise(r => setTimeout(r, ms));
  try{
    const pronto = Promise.all([
      Som.carregaVozes('m'), Som.carregaVozes('f'),
      import('./quinta3d.js').catch(() => null),
    ]).then(async () => {
      const v = Som.pacotes[Som.personagem];
      if(v){ const k = Object.keys(v)[0]; if(k) await Som.buffer(k); }   /* descodifica uma frase: prova que o som funciona */
    });
    await Promise.all([Promise.race([pronto, espera(15000)]), espera(900)]);
  }catch(e){ console.warn('Preparação das vozes incompleta', e); }
  aPreparar = false;
  if(!Estado.nome && !Estado.perguntouNome){ $('#campo-nome').value = ''; mostra('#ecra-nome'); return; }
  segueAposNome();
};

$('#form-nome').onsubmit = e => {
  e.preventDefault();
  const v = $('#campo-nome').value.trim().replace(/\s+/g, ' ').slice(0, 14);
  Estado.perguntouNome = true;
  if(v){ Estado.nome = v; }
  Estado.guarda();
  Som.efeito('toque');
  segueAposNome();
};
$('#btn-saltar-nome').onclick = () => { Som.efeito('toque'); Estado.perguntouNome = true; Estado.guarda(); segueAposNome(); };

/* idade: pergunta-se uma vez por perfil; os pais podem mudá-la na Área dos Pais */
function segueAposNome(){ Estado.idade ? vaiEscolher() : vaiIdade(); }
function vaiIdade(){
  Voz.diz('Quantos anos tens?', null, null, 'Quantos anos tens?');
  mostra('#ecra-idade');
}
document.querySelectorAll('#lista-idades [data-idade]').forEach(b => {
  b.onclick = () => {
    Som.efeito('toque');
    Estado.idade = +b.dataset.idade;
    Estado.guarda();
    aplicaIdade();
    vaiEscolher();
  };
});

function vaiEscolher(){
  const ola = Estado.nome ? `Olá, ${Estado.nome}! Quem te vai ajudar hoje?`
                          : 'Olá! Quem te vai ajudar hoje?';
  Voz.diz(ola, null, null, 'Olá! Quem te vai ajudar hoje?');
  vista = VISTAS.escolher;
  if(avo){ avo.visivel(true); avo.faz('acenar'); setTimeout(() => avo && avo.faz('repouso'), 2600); }
  if(ava){ ava.visivel(true); setTimeout(() => { ava.faz('acenar'); setTimeout(() => ava && ava.faz('repouso'), 2400); }, 900); }
  /* ao voltar à escolha, repõe os botões */
  saudacaoId++; $('#ecra-escolher').classList.remove('a-saudar'); delete document.body.dataset.saudacao;
  const iv = $('#intro-video'); if(iv && !iv.getAttribute('src')){ iv.setAttribute('src', './media/ava-intro.mp4'); iv.load(); }
  mostra('#ecra-escolher');
  $('#barra').hidden = false;
}

$('#esc-avo').onclick = () => escolhe('avo');
$('#esc-ava').onclick = () => escolhe('ava');
/* Saudação depois de escolher o avô ou a avó: o jogo só passa ao mapa quando a
   fala termina (e, no caso da avó, quando o vídeo de boas-vindas acaba). */
let saudacaoId = 0;
function terminaSaudacao(id){
  if(id !== saudacaoId) return;
  saudacaoId++;
  const v = $('#intro-video');
  try{ v.pause(); }catch(e){}
  delete document.body.dataset.saudacao;
  $('#ecra-escolher').classList.remove('a-saudar');
  try{ localStorage.setItem('eab-intro-vista', '1'); }catch(e){}
  abreMundos();
}
function escolhe(q){
  Som.arranca();
  Som.efeito('toque');
  Som.tom = q === 'ava' ? 1.18 : 1;      /* efeitos sonoros mais agudos */
  Som.defineVoz(q === 'ava' ? 'f' : 'm'); /* voz feminina para a avó */
  soUm(q);
  activo.faz('acenar');

  const id = ++saudacaoId;
  const video = $('#intro-video');
  let jaVista = false;
  try{ jaVista = localStorage.getItem('eab-intro-vista') === '1'; }catch(e){}
  let falaAcabou = false, videoPronto = true, tempoMinimo = false;
  const tenta = () => { if(falaAcabou && videoPronto && tempoMinimo) terminaSaudacao(id); };
  setTimeout(() => { tempoMinimo = true; tenta(); }, 3800);   /* dá tempo de ler o balão, mesmo sem voz */

  $('#ecra-escolher').classList.add('a-saudar');
  if(q === 'ava'){
    /* a avó aparece no vídeo; o avô fica, por agora, só com a imagem dele */
    document.body.dataset.saudacao = 'ava';
    videoPronto = false;
    const acabou = () => { videoPronto = true; tenta(); };
    video.onended = acabou;
    video.onerror = acabou;                         /* sem vídeo (offline): segue só com a imagem */
    setTimeout(acabou, jaVista ? 4000 : 10800);     /* a partir da 2.ª vez não é preciso esperar pelo fim */
    try{
      video.muted = true; video.currentTime = 0;
      const r = video.play(); if(r && r.catch) r.catch(acabou);
    }catch(e){ acabou(); }
  }

  Voz.diz(`Olá! Eu sou ${q === 'avo' ? 'o Avô Beagle' : 'a Avó Beagle'}. Vamos ao mapa!`,
          () => { if(id !== saudacaoId) return; activo.faz('repouso'); falaAcabou = true; setTimeout(tenta, 500); });
  setTimeout(() => { falaAcabou = true; tenta(); }, 9000);   /* segurança se a voz falhar */
}
$('#btn-saltar-saudacao').onclick = () => { Som.efeito('toque'); terminaSaudacao(saudacaoId); };

$('#stage').insertAdjacentHTML('afterbegin', quinta());
const jardim=document.createElement('div'); jardim.className='quinta-conquistas'; jardim.setAttribute('aria-label','Conquistas da quinta');
function atualizaQuinta(){
  const n=Estado.totalEstrelas(), arv=Math.min(6,Math.floor(n/2)), flores=Math.min(12,n);
  const marcos=['🌱','🌿','🌳','🌳🌼','🌳🌸','🌳🍎'];
  const fase=Math.min(5,Math.floor(n/2));
  jardim.innerHTML=`<span class="quinta-arvore" title="A quinta cresce com as estrelas">${marcos[fase]}</span><span>🌼 ${flores}/12</span><span>⭐ ${n}</span>`;
}
$('#stage').append(jardim);


/* ================================================ A MINHA QUINTA ========= */
const Cap = t => t.charAt(0).toUpperCase() + t.slice(1);
let abaLoja = 'edificios', novoEd = null;

/* ---- quinta 3D: carrega-se só ao abrir o ecrã; se falhar, fica a grelha 2D ---- */

/* jogos de cada casa da quinta (dentro do edifício ou no botão 🎮 do lote) */
function abreJogosDaCasa(id){
  if(limiteAtingido()){ mostraAvisoLimite(); return; }
  Som.arranca();
  abreJogosCasa(Som, n => { Estado.extra = (Estado.extra || 0) + n; Estado.guarda(); const cs = $('#conta-estrelas'); if(cs) cs.textContent = Estado.saldo(); },
    id, Estado.quinta.itens, c => abreLoja('bichos', null, c));
}
let Q3D = null, q3dTentou = false;
async function iniciaQ3D(){
  if(q3dTentou) return; q3dTentou = true;
  try{
    const { Quinta3D } = await import('./quinta3d.js');
    if(!Quinta3D.suportado()) throw new Error('sem WebGL');
    const ecra = $('#ecra-quinta'), nome = $('#q3d-nome');
    Q3D = new Quinta3D($('#q3d-canvas'), {
      toque: id => { Som.arranca(); Som.efeito('toque'); $('#q3d-dica').hidden = true; Q3D.entra(id); },
      vazio: id => { Som.efeito('toque'); abreLoja('edificios', id); },
      amigo: () => { Som.arranca(); Som.efeito('toque'); Voz.diz(pick(['Olá!', 'Muito bem!'])); },
      visita: cod => {
        const a = Estado.amigos.find(x => x.codigo === cod); if(!a || !a.resumo) return;
        Som.arranca(); Som.efeito('toque');
        avisaAmigo(a.resumo);
      },
      entrou: def => {
        Voz.cala(); Som.fala(`${Cap(def.art)} ${def.nome}.`);
        ecra.classList.add('dentro'); $('#q3d-dica').hidden = true;
        nome.textContent = def.nome; nome.hidden = false;
        $('#q3d-sair').hidden = false;
        $('#q3d-mais').hidden = !BICHOS_LOJA.some(b => b.casa === def.id);
        $('#q3d-jogos').hidden = false;
        $('#texto-voltar').textContent = 'Quinta';
      },
      dentro: def => { if(def.id === 'pomar' || def.id === 'estufa') return; },
      saiu: () => {
        ecra.classList.remove('dentro'); nome.hidden = true;
        $('#q3d-sair').hidden = true; $('#q3d-mais').hidden = true; $('#q3d-jogos').hidden = true;
        $('#texto-voltar').textContent = 'Brincar';
      },
      bicho: id => { const b = achaItem(id); Som.efeito('toque'); if(Som.temClips([b.som])) Som.fala(b.som); },
    });
    $('#q3d-sair').onclick = () => { Som.efeito('toque'); Q3D.sai(); };
    $('#q3d-jogos').onclick = () => { Som.efeito('toque'); if(Q3D.nomeAtual) abreJogosDaCasa(Q3D.nomeAtual.id); };
    $('#q3d-mais').onclick = () => { Som.efeito('toque'); if(Q3D.nomeAtual) abreLoja('bichos', null, Q3D.nomeAtual.id); };
    $('#q3d').hidden = false; ecra.classList.add('com3d');
    redesenhaQuinta();
    if(document.body.dataset.ecra === 'quinta') Q3D.ativa(true);
  }catch(e){
    /* se a 3D falhar a meio, volta-se mesmo à grelha 2D (antes ficava um ecrã azul vazio) */
    console.error('Quinta 3D indisponível; a usar a grelha 2D.', e);
    try{ if(Q3D && Q3D.ativa) Q3D.ativa(false); }catch(_){}
    Q3D = null;
    try{ $('#q3d').hidden = true; $('#ecra-quinta').classList.remove('com3d', 'dentro'); redesenhaQuinta(); }catch(_){}
  }
}

function redesenhaQuinta(){
  const it = Estado.quinta.itens;
  if(Q3D) Q3D.atualiza(it, novoEd, visitantesQuinta());
  desenhaQuinta($('#quinta-grelha'), it, novoEd);
  $('#quinta-resumo').innerHTML =
    `<span>🏠 ${contaEdificios(it)}</span><span>🐾 ${contaBichos(it)}</span><span>⭐ ${Estado.saldo()}</span>` +
    `<span title="${nivelQuinta(it).nome}">🌳 Nível ${nivelQuinta(it).nivel}</span>`;
  $('#conta-estrelas').textContent = Estado.saldo();
}
function abreQuinta(novo){
  atualizaAmigos();
  Voz.cala(); Fala.esconde(); jogo.para();
  $('#tabuleiro').innerHTML = '';
  novoEd = novo || null;
  $('#loja').hidden = true; $('#loja-fundo').hidden = true;
  redesenhaQuinta();
  mostra('#ecra-quinta');
  iniciaQ3D();
  $('#barra').hidden = false;
  $('#ecra-quinta').scrollTop = 0;
  if(novo) setTimeout(() => {
    const l = document.querySelector(`#quinta-grelha .lote[data-ed="${novo}"]`);
    if(l) l.scrollIntoView({ behavior:'smooth', block:'center' });
  }, 160);
}
let casaLoja = null;
function abreLoja(aba, destaque, casa){
  casaLoja = casa || null;
  const it = Estado.quinta.itens;
  abaLoja = aba || (EDIFICIOS.every(e => it[e.id]) ? 'bichos' : 'edificios');
  desenhaLoja($('#loja-lista'), it, Estado.saldo(), abaLoja, casaLoja);
  if(abaLoja === 'amigos') festa.prepara(PERSONAGENS.map(p => p.id));   /* descarrega os modelos em segundo plano */
  document.querySelectorAll('#loja .aba').forEach(b => b.classList.toggle('on', b.dataset.aba === abaLoja));
  $('#loja-saldo').textContent = Estado.saldo();
  $('#loja').hidden = false; $('#loja-fundo').hidden = false;
  $('#loja-lista').scrollTop = 0;
  if(destaque){
    const c = document.querySelector(`#loja-lista .item-loja[data-id="${destaque}"]`);
    if(c){ c.classList.add('destaque'); c.scrollIntoView({ block:'center' }); }
  }
}
function fechaLoja(){ $('#loja').hidden = true; $('#loja-fundo').hidden = true; }

/* toque num amigo que passeia: resumo curto */
function avisaAmigo(r){
  let el = $('#aviso-nivel-quinta');
  if(!el){ el = document.createElement('div'); el.id = 'aviso-nivel-quinta'; el.className = 'aviso-nivel'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.innerHTML = `<span class="an-em">👫</span><b>${esc(r.nome || 'Amigo')}</b><span>Nível ${r.nivel || 1} · Quinta nível ${r.nqNivel || 1}</span>`;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  clearTimeout(avisaNivelQuinta.t); avisaNivelQuinta.t = setTimeout(() => el.classList.remove('on'), 3200);
}

/* a quinta subiu de nível: aviso com festa */
function avisaNivelQuinta(nq){
  let el = $('#aviso-nivel-quinta');
  if(!el){ el = document.createElement('div'); el.id = 'aviso-nivel-quinta'; el.className = 'aviso-nivel'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.innerHTML = `<span class="an-em">🌳</span><b>A tua quinta subiu!</b><span>Nível ${nq.nivel} · ${nq.nome}</span>`;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  Som.efeito('nivel');
  Som.fala('Muito bem! A tua quinta subiu de nível!');
  confete(document.body, innerWidth / 2, innerHeight * .25, ['#F7C21B', '#E0162B', '#2C6FD6', '#3DA35D', '#fff']);
  clearTimeout(avisaNivelQuinta.t); avisaNivelQuinta.t = setTimeout(() => el.classList.remove('on'), 4200);
}

function compra(id, botao){
  const item = achaItem(id), it = Estado.quinta.itens;
  if(!item) return;
  const eEdificio = EDIFICIOS.some(e => e.id === id);
  const ePers = PERSONAGENS.some(p => p.id === id);
  if(Estado.saldo() < item.preco) return;
  if(eEdificio || ePers){ if(it[id]) return; }
  else{ if(!it[item.casa] || (it[id] || 0) >= item.max) return; }
  const primeiro = !eEdificio && !(it[id] || 0);   /* primeiro animal desta espécie */
  const nivelAntes = nivelQuinta(it).nivel;
  it[id] = (it[id] || 0) + 1;
  Estado.guarda();
  Som.efeito('certo');
  if(botao){
    const r = botao.getBoundingClientRect();
    confete(document.body, r.left + r.width / 2, r.top, ['#F7C21B', '#E0162B', '#2C6FD6', '#3DA35D', '#fff']);
  }
  const nq = nivelQuinta(it);
  if(nq.nivel > nivelAntes) setTimeout(() => avisaNivelQuinta(nq), ePers ? 1200 : 700);
  if(ePers){
    /* personagem nova: festa logo ali, e volta à loja ao fechar */
    fechaLoja(); redesenhaQuinta();
    festa.mostra(id, { titulo: `${item.nome}!`, sub: 'Já faz parte da tua quinta!', aoFechar: () => abreLoja('amigos') });
    return;
  }
  if(!primeiro) Som.fala(eEdificio ? `Já tens ${item.art} ${item.nome}!` : `${item.nome}! Bem-vind${item.art}!`);
  if(eEdificio){
    fechaLoja();
    novoEd = id;
    redesenhaQuinta();
    setTimeout(() => {
      const l = document.querySelector(`#quinta-grelha .lote[data-ed="${id}"]`);
      if(l) l.scrollIntoView({ behavior:'smooth', block:'center' });
    }, 120);
  }else if(primeiro){
    fechaLoja();
    redesenhaQuinta();
    setTimeout(() => miniFilme(item, Som, () => { redesenhaQuinta(); abreLoja(abaLoja, null, casaLoja); }), 350);
  }else{
    redesenhaQuinta();
    abreLoja(abaLoja, null, casaLoja);
  }
}

$('#btn-loja').onclick = () => { Som.arranca(); Som.efeito('toque'); abreLoja(); };
$('#btn-fechar-loja').onclick = () => { Som.efeito('toque'); fechaLoja(); };
$('#loja-fundo').onclick = fechaLoja;
$('#loja').addEventListener('click', e => {
  const aba = e.target.closest('.aba');
  if(aba){ Som.efeito('toque'); abreLoja(aba.dataset.aba); return; }
  const c = e.target.closest('[data-comprar]');
  if(c && !c.disabled){ Som.arranca(); compra(c.dataset.comprar, c); }
});
$('#quinta-grelha').addEventListener('click', e => {
  Som.arranca();
  const jg = e.target.closest('[data-jogos]');
  if(jg){ Som.efeito('toque'); abreJogosDaCasa(jg.dataset.jogos); return; }
  const bicho = e.target.closest('.bicho');
  if(bicho){
    const b = achaItem(bicho.dataset.b);
    const img = bicho.querySelector('img');
    img.classList.remove('salta'); void img.offsetWidth; img.classList.add('salta');
    Som.efeito('toque');
    if(Som.temClips([b.som])) Som.fala(b.som);
    return;
  }
  const ed = e.target.closest('[data-edificio]');
  if(ed){ Som.efeito('toque'); const x = achaItem(ed.dataset.edificio); Som.fala(`${Cap(x.art)} ${x.nome}.`); return; }
  const mais = e.target.closest('[data-mais]');
  if(mais){ Som.efeito('toque'); abreLoja('bichos', null, mais.dataset.mais); return; }
  const vazio = e.target.closest('.lote.vazio');
  if(vazio){ Som.efeito('toque'); abreLoja('edificios', vazio.dataset.ed); }
});
$('#btn-quinta-barra').onclick = () => { Som.efeito('toque'); Voz.cala(); Fala.esconde(); abreQuinta(); };
$('#btn-ir-quinta').onclick = () => { Som.efeito('toque'); Voz.cala(); Fala.esconde(); abreQuinta(); };


(async function iniciar(){
  try {
  try{ iniciaVida3d(); }catch(e){ console.warn('Vida 3D', e); }
  Estado.carrega();
  aplicaIdade();
  /* pede ao navegador para não apagar o progresso por falta de espaço */
  try{ navigator.storage && navigator.storage.persist && navigator.storage.persist(); }catch(e){}
  Nuvem.inicia();
  Som.endpointNeural = '';  /* sem serviço de voz externo: nenhum texto sai do aparelho */
  try{ localStorage.removeItem('eab-tts-endpoint'); }catch(e){}
  Som.carregaPreferencia();
  Som.carregaPreferenciasVoz();
  Som.tom = Estado.companheiro === 'ava' ? 1.18 : 1;
  Som.defineVoz(Estado.companheiro === 'ava' ? 'f' : 'm');
  redimensiona();
  requestAnimationFrame(anima);
  try{
    const [mAvo, mAva] = await Promise.all([import('../modelos/avo.js'), import('../modelos/ava.js')]);
    const [g1, g2] = await Promise.all([carrega(mAvo.default), carrega(mAva.default)]);
    avo = new Rig(cena, g1, { esqueleto: true });   /* o GLTFLoader tira os ':' dos nomes dos ossos */
    ava = new Rig(cena, g2, { esqueleto: true });
    avo.grupo.position.x -= .52; ava.grupo.position.x += .52;
    avo.grupo.rotation.y += 14 * Math.PI / 180;
    ava.grupo.rotation.y -= 14 * Math.PI / 180;
    avo.faz('repouso'); ava.faz('repouso');
    activo = Estado.companheiro === 'ava' ? ava : avo;
    pintaBotaoSom();
    mostra('#ecra-inicio');
  }catch(e){
    console.error('Falha ao iniciar a Escola dos Avós:', e);
    // A falha de modelos/armazenamento não deve bloquear a entrada na aplicação.
    pintaBotaoSom();
    mostra('#ecra-inicio');
    const aviso = document.createElement('p');
    aviso.className = 'aviso';
    aviso.textContent = 'Algumas animações não ficaram disponíveis. Pode continuar a utilizar os jogos.';
    $('#ecra-inicio').append(aviso);
  }
  } catch (erroArranque) {
    console.error('Erro no arranque da Escola dos Avós:', erroArranque);
    $('#texto-carregar').textContent = 'O arranque encontrou um erro. Atualize a página (Ctrl+F5) e consulte a consola (F12).';
  }
})();
