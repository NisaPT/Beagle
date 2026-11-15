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
    Som.fala(falado || texto, aoFim);
  },
  cala(){ Som.cala(); }
};

/* ==================================================== ESTADO ============= */
const CORES_AMIGO = ['#E0162B', '#2C6FD6', '#3DA35D', '#8E6BC8', '#F3822B', '#1B4D8F'];

function codigoNovo(){
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const d = n => Array.from({length:n}, () => letras[rnd(letras.length)]).join('');
  return d(4) + '-' + String(1000 + rnd(9000));
}

/* um código gera sempre o mesmo amigo: sem servidor, é o que dá para demonstrar */
function amigoDeCodigo(codigo){
  let h = 0;
  for(const c of codigo.toUpperCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return {
    codigo: codigo.toUpperCase(),
    animal: ANIMAIS[h % ANIMAIS.length],
    cor: CORES_AMIGO[(h >> 3) % CORES_AMIGO.length],
    nivel: 1 + (h >> 7) % TOTAL_NIVEIS,
  };
}

const Estado = {
  nivel:1, estrelas:{}, companheiro:'avo', codigo:null, amigos:[], nome:'', idade:null, perfilId:'principal',
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
        companheiro: g.companheiro || 'avo',
        nome: g.nome || (perfil && perfil.nome) || 'Criança 1',
        codigo: g.codigo || null,
        idade: [3,4,5,6,7].includes(g.idade) ? g.idade : null,
        amigos: g.amigos || null,
        missaoDia: g.missaoDia || null,
        aprendizagem:g.aprendizagem || this.aprendizagem,
        limiteMinutos:Number.isFinite(g.limiteMinutos)?g.limiteMinutos:30,
        tempoHoje:g.diaUso===chaveDia()?(g.tempoHoje||0):0, diaUso:chaveDia(),
      });
    }catch(e){ console.warn('Não foi possível carregar os perfis', e); }
    if(!this.codigo) this.codigo = codigoNovo();
    if(!this.amigos) this.amigos = ['MARU-2841', 'PIPO-5513', 'LUAS-7702'].map(amigoDeCodigo);
    this.guarda();
  },
  guarda(){
    const dados = {
      nivel:this.nivel, estrelas:this.estrelas, companheiro:this.companheiro,
      codigo:this.codigo, amigos:this.amigos, nome:this.nome, idade:this.idade, missaoDia:this.missaoDia || null,
      aprendizagem:this.aprendizagem, limiteMinutos:this.limiteMinutos,
      tempoHoje:this.tempoHoje, diaUso:chaveDia(),
    };
    try{
      localStorage.setItem('eab', JSON.stringify(dados));
      localStorage.setItem('eab-perfil-' + this.perfilId, JSON.stringify(dados));
      const perfis = this.listaPerfis();
      const perfil = perfis.find(p => p.id === this.perfilId);
      if(perfil && this.nome) perfil.nome = this.nome;
      localStorage.setItem('eab-perfis', JSON.stringify(perfis));
    }catch(e){}
  },
  totalEstrelas(){ return Object.values(this.estrelas).reduce((a, b) => a + b, 0); },
  ganha(nivel, estrelas){
    this.estrelas[nivel] = Math.max(this.estrelas[nivel] || 0, estrelas);
    if(nivel >= this.nivel) this.nivel = Math.min(TOTAL_NIVEIS, nivel + 1);
    this.guarda();
    if(typeof atualizaQuinta==='function') atualizaQuinta();
  }
};

/* a idade decide que jogos entram e quão difíceis podem ficar */
function aplicaIdade(){ defineTipos(perfilIdade(Estado.idade).tipos); }

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
document.addEventListener('visibilitychange', () => { if(!document.hidden) Som.retoma(); });
addEventListener('resize', redimensiona);
addEventListener('orientationchange', () => setTimeout(redimensiona, 160));

function anima(){
  requestAnimationFrame(anima);
  const dt = Math.min(relogio.getDelta(), .05);
  if(pausado) return;
  const t = relogio.elapsedTime;
  const k = 1 - Math.exp(-3.4 * dt);
  vistaPos.lerp(vista.pos, k); vistaAlvo.lerp(vista.alvo, k);
  camara.position.copy(vistaPos); camara.lookAt(vistaAlvo);
  if(avo) avo.atualiza(dt, t);
  if(ava) ava.atualiza(dt, t);
  if(!modoSem3D) renderizador.render(cena, camara);
}

/* =================================================== ECRÃS =============== */
function mostra(id){
  document.querySelectorAll('.ecra').forEach(s => s.classList.remove('on'));
  if(id) $(id).classList.add('on');
  document.body.dataset.ecra = id ? id.replace('#ecra-', '') : 'jogo';
  pausado = id === '#ecra-mapa' || id === '#ecra-mundos' || id === '#ecra-carregar';
  const t = $('#texto-voltar');
  if(t) t.textContent = id === '#ecra-mundos' ? 'Avós'
                      : id === '#ecra-mapa'   ? 'Quinta'
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
  $('#lista-mundos').innerHTML = MUNDOS.map((m, i) => {
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
  abreMapa(false, +b.dataset.mundo);
};

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
  mundoVisto = mundo !== undefined ? mundo : mundoDoNivel(Estado.nivel);
  desenhaMapa(telaMapa, Estado, Estado.amigos, mundoVisto);
  $('#faixa-mundo').textContent = MUNDOS[mundoVisto].nome;
  atualizaMissao();
  mostra('#ecra-mapa');
  $('#conta-estrelas').textContent = Estado.totalEstrelas();
  requestAnimationFrame(() => scrollParaNivel(caixaMapa, telaMapa, Estado.nivel, mundoVisto, suave));
}

telaMapa.addEventListener('click', e => {
  const b = e.target.closest('.nivel');
  if(!b || b.disabled) return;
  comecaNivel(+b.dataset.nivel);
});

/* Registo local e adaptativo: apenas contagens agregadas por competência. */
function atualizaTempoUso(){
  const agora=Date.now(), delta=Math.max(0,Math.min(300,Math.round((agora-(Estado.inicioSessao||agora))/1000)));
  Estado.tempoHoje=(Estado.tempoHoje||0)+delta; Estado.inicioSessao=agora; Estado.diaUso=chaveDia(); Estado.guarda();
}
function mostraAvisoLimite(){
  const aviso=document.createElement('div'); aviso.className='aviso-limite';
  aviso.innerHTML='<strong>🌿 Hora de descansar!</strong><p>O tempo de aprendizagem definido pelos adultos foi atingido. Amanhã há mais aventuras.</p><button class="botao" type="button">Voltar ao mapa</button>';
  document.body.append(aviso); aviso.querySelector('button').onclick=()=>{aviso.remove();abreMapa(false);};
}
document.addEventListener('visibilitychange',()=>{if(document.hidden) atualizaTempoUso();});
setInterval(()=>{if(!document.hidden) atualizaTempoUso();},30000);

/* ===================================================== JOGO ============== */
const jogo = new Jogo({
  raiz: $('#tabuleiro'),
  voz: Voz,
  som: Som,
  mascote: { faz: p => activo && activo.faz(p) },
  aoAcertar: tipo => {
    const k=tipo||jogo.tipo; if(!Estado.aprendizagem[k]) Estado.aprendizagem[k]={certas:0,erros:0};
    Estado.aprendizagem[k].certas++; Estado.guarda();
    $('#conta-estrelas').textContent = Estado.totalEstrelas();
  },
  aoErro: tipo => {
    const k=tipo||jogo.tipo; if(!Estado.aprendizagem[k]) Estado.aprendizagem[k]={certas:0,erros:0};
    Estado.aprendizagem[k].erros++; Estado.guarda();
  },
  aoSair: () => voltaAoMapa(),
  aoAcabar: (nivel, estrelas) => {
    Estado.ganha(nivel, estrelas);
    Estado.missaoDia = chaveDia();
    Estado.guarda();
    mostraRecompensa(nivel, estrelas);
  },
});

function comecaNivel(n){
  const P = perfilIdade(Estado.idade);
  const info = {...infoNivel(n)};       /* o tipo vem da rotação da idade (mapa.js) */
  const chave = info.tipo;
  const m = Estado.aprendizagem[chave] || {certas:0,erros:0};
  const total = m.certas + m.erros, taxa = total ? m.certas / total : .7;
  const ajuste = total >= 5 ? (taxa >= .85 ? 1 : taxa <= .5 ? -1 : 0) : 0;
  info.dificuldade = Math.max(1, Math.min(4, (info.dificuldade||1) + ajuste));
  info.opcoes   = Math.max(2, Math.min(P.opcoes,   (info.opcoes||3) + ajuste));
  info.maxConta = Math.max(3, Math.min(P.maxConta, (info.maxConta||5) + ajuste));
  info.formas   = Math.min(info.formas || 2, P.formas);
  info.paleta   = Math.min(info.paleta || 4, P.paleta);
  info.pares = P.pares; info.padroes = P.padroes; info.letraOpcoes = P.letraOpcoes;
  info.somaMax = P.somaMax ? P.somaMax + (ajuste > 0 ? 5 : 0) : 0;
  info.imagens = P.imagens;
  mostra(null);
  $('#tabuleiro').innerHTML = '';
  $('#barra').hidden = false;
  vista = VISTAS.um;
  Som.efeito('nivel');
  Voz.diz(`Nível ${info.noMundo}!`, null, null, 'Vamos lá!');
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
$('#btn-voltar').onclick = () => {
  Som.efeito('toque');
  const onde = document.body.dataset.ecra;
  if(onde === 'mundos') abreEscolha();        /* mundos -> escolher avô */
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
  activo.faz('acenar');
  Voz.diz(pick(['Olá!', 'Estou aqui!', 'Vamos jogar?']), () => activo.faz('repouso'));
});

/* ============================================== ÁREA DOS PAIS ============ */
let contaPorta = null, digitos = '';

$('#btn-pais').onclick = () => {
  Voz.cala(); Fala.esconde();
  const a = 3 + rnd(7), b = 4 + rnd(6);
  contaPorta = { r:a * b };
  digitos = '';
  $('#conta-porta').textContent = `${a} × ${b}`;
  $('#mostrador-porta').textContent = '';
  mostra('#ecra-porta');
};

$('#teclado-porta').innerHTML = [1,2,3,4,5,6,7,8,9,'←',0,'✓']
  .map(v => `<button class="num" data-t="${v}">${v}</button>`).join('');

$('#teclado-porta').onclick = e => {
  const b = e.target.closest('.num'); if(!b) return;
  const v = b.dataset.t;
  if(v === '←') digitos = digitos.slice(0, -1);
  else if(v === '✓'){
    if(+digitos === contaPorta.r){ desenhaPais(); mostra('#ecra-pais'); return; }
    digitos = '';
    $('#mostrador-porta').textContent = '✗';
    setTimeout(() => $('#mostrador-porta').textContent = '', 700);
    return;
  }
  else if(digitos.length < 3) digitos += v;
  $('#mostrador-porta').textContent = digitos;
};

function desenhaPais(){
  $('#meu-codigo').textContent = Estado.codigo;
  const lista = $('#lista-amigos');
  if(!Estado.amigos.length){
    lista.innerHTML = `<p class="vazio">Ainda não há amigos. Peça o código a outro pai ou mãe e escreva-o acima.</p>`;
  }else{
    lista.innerHTML = Estado.amigos.map(a => `
      <div class="amigo-linha">
        ${avatar(a.animal, a.cor, 44)}
        <div class="amigo-dados">
          <strong>${a.codigo}</strong>
          <span>Nível ${a.nivel}</span>
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
    `<div class="relatorio-grelha">${Object.entries(Estado.aprendizagem).map(([k,v])=>{const t=v.certas+v.erros,p=t?Math.round(v.certas/t*100):0;return `<div><strong>${({cores:'Cores',contar:'Contagem',formas:'Formas',letras:'Letras',memoria:'Memória',logica:'Lógica',somas:'Somas'})[k]||k}</strong><span>${v.certas} respostas certas · ${t} tentativas</span><div class="barra-progresso"><i style="width:${p}%"></i></div><small>${t?p+'% de sucesso':'Ainda sem dados'}</small></div>`}).join('')}</div>` +
    `<p class="aviso">Dados agregados guardados apenas neste dispositivo. A percentagem orienta a adaptação da dificuldade; não é uma avaliação clínica ou escolar.</p>`;
  const selPerfil = $('#perfil-ativo');
  if(selPerfil){
    const perfis = Estado.listaPerfis();
    selPerfil.innerHTML = perfis.map(p => `<option value="${p.id}">${p.nome.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</option>`).join('');
    selPerfil.value = Estado.perfilId;
  }
  const selIdade=$('#idade-crianca'); if(selIdade) selIdade.value=String(Estado.idade||5);
  const endpoint=$('#tts-endpoint'); if(endpoint) endpoint.value=Som.endpointNeural||'';
  desenhaVoz();
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

$('#tts-endpoint')?.addEventListener('change',e=>{
  const v=e.target.value.trim();
  if(v && !/^https:\/\//i.test(v) && !v.startsWith('/')){e.target.value='';$('#diag-voz').textContent='Use um endereço HTTPS ou um caminho local do servidor.';return;}
  Som.endpointNeural=v;try{localStorage.setItem('eab-tts-endpoint',v);}catch(e){}
  $('#diag-voz').textContent=v?'Gateway neural configurado. Confirme que o servidor devolve áudio PT-PT e protege as credenciais.':'Sem gateway neural: será usada a voz PT-PT do dispositivo, quando disponível.';
});
$('#idade-crianca')?.addEventListener('change',e=>{Estado.idade=+e.target.value;Estado.guarda();aplicaIdade();});
$('#limite-tempo')?.addEventListener('change',e=>{Estado.limiteMinutos=Math.max(0,Math.min(180,+e.target.value||0));Estado.guarda();});
$('#btn-apagar-perfil')?.addEventListener('click',()=>{
  if(!confirm('Apagar permanentemente o progresso deste perfil neste dispositivo?')) return;
  localStorage.removeItem('eab-perfil-'+Estado.perfilId);
  const ps=Estado.listaPerfis().filter(p=>p.id!==Estado.perfilId);
  if(!ps.length) ps.push({id:'principal',nome:'Criança 1'});
  localStorage.setItem('eab-perfis',JSON.stringify(ps));
  localStorage.setItem('eab-perfil-ativo',ps[0].id); location.reload();
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
  const dados = {nivel:1, estrelas:{}, companheiro:'avo', nome, codigo:codigoNovo(), amigos:[], missaoDia:null};
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

$('#lista-amigos').onclick = e => {
  const b = e.target.closest('[data-tira]'); if(!b) return;
  Estado.amigos = Estado.amigos.filter(a => a.codigo !== b.dataset.tira);
  Estado.guarda(); desenhaPais();
};

$('#form-amigo').onsubmit = e => {
  e.preventDefault();
  const campo = $('#campo-codigo');
  const cod = campo.value.trim().toUpperCase();
  const aviso = $('#aviso-amigo');
  if(!/^[A-Z]{3,4}-\d{4}$/.test(cod)){
    aviso.textContent = 'O código tem este aspeto: ABCD-1234.';
    return;
  }
  if(cod === Estado.codigo){ aviso.textContent = 'Esse é o seu próprio código.'; return; }
  if(Estado.amigos.some(a => a.codigo === cod)){ aviso.textContent = 'Esse amigo já está na lista.'; return; }
  Estado.amigos.push(amigoDeCodigo(cod));
  Estado.guarda();
  campo.value = ''; aviso.textContent = '';
  desenhaPais();
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

$('#btn-comecar').onclick = () => {
  Som.arranca();              /* o áudio só pode nascer de um toque */
  pintaBotaoSom();
  if(!Estado.nome){ $('#campo-nome').value = ''; mostra('#ecra-nome'); return; }
  segueAposNome();
};

$('#form-nome').onsubmit = e => {
  e.preventDefault();
  const v = $('#campo-nome').value.trim().replace(/\s+/g, ' ').slice(0, 14);
  if(v){ Estado.nome = v; Estado.guarda(); }
  Som.efeito('toque');
  segueAposNome();
};
$('#btn-saltar-nome').onclick = () => { Som.efeito('toque'); segueAposNome(); };

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
  vista = VISTAS.dois;
  if(avo){ avo.visivel(true); avo.faz('acenar'); setTimeout(() => avo && avo.faz('repouso'), 2600); }
  if(ava){ ava.visivel(true); setTimeout(() => { ava.faz('acenar'); setTimeout(() => ava && ava.faz('repouso'), 2400); }, 900); }
  mostra('#ecra-escolher');
  $('#barra').hidden = false;
}

$('#esc-avo').onclick = () => escolhe('avo');
$('#esc-ava').onclick = () => escolhe('ava');
function escolhe(q){
  Som.arranca();
  Som.efeito('toque');
  Som.tom = q === 'ava' ? 1.18 : 1;      /* efeitos sonoros mais agudos */
  Som.defineVoz(q === 'ava' ? 'f' : 'm'); /* voz feminina para a avó */
  soUm(q);
  activo.faz('acenar');
  Voz.diz(`Olá! Eu sou ${q === 'avo' ? 'o Avô Beagle' : 'a Avó Beagle'}. Vamos ao mapa!`,
          () => activo.faz('repouso'));
  setTimeout(() => abreMundos(), 900);
}

$('#stage').insertAdjacentHTML('afterbegin', quinta());
const jardim=document.createElement('div'); jardim.className='quinta-conquistas'; jardim.setAttribute('aria-label','Conquistas da quinta');
function atualizaQuinta(){
  const n=Estado.totalEstrelas(), arv=Math.min(6,Math.floor(n/2)), flores=Math.min(12,n);
  const marcos=['🌱','🌿','🌳','🌳🌼','🌳🌸','🌳🍎'];
  const fase=Math.min(5,Math.floor(n/2));
  jardim.innerHTML=`<span class="quinta-arvore" title="A quinta cresce com as estrelas">${marcos[fase]}</span><span>🌼 ${flores}/12</span><span>⭐ ${n}</span>`;
}
$('#stage').append(jardim);


(async function iniciar(){
  try {
  Estado.carrega();
  aplicaIdade();
  Som.endpointNeural=localStorage.getItem('eab-tts-endpoint')||'';
  Som.carregaPreferencia();
  Som.carregaPreferenciasVoz();
  Som.tom = Estado.companheiro === 'ava' ? 1.18 : 1;
  Som.defineVoz(Estado.companheiro === 'ava' ? 'f' : 'm');
  redimensiona();
  requestAnimationFrame(anima);
  try{
    const [mAvo, mAva] = await Promise.all([import('../modelos/avo.js'), import('../modelos/ava.js')]);
    const [g1, g2] = await Promise.all([carrega(mAvo.default), carrega(mAva.default)]);
    avo = new Rig(cena, g1);
    ava = new Rig(cena, g2);
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
