/* Contas dos pais + cópia do progresso na cloud (Firebase Auth + Firestore).
   O jogo continua a funcionar sem internet e sem conta: o armazenamento local é
   sempre a fonte principal; a cloud é uma cópia que também serve para mudar de
   aparelho. Só guardamos o progresso e a alcunha escolhida, nunca dados da criança
   além disso. */
import { FIREBASE_CONFIG } from './firebase-config.js';

const COLECAO = 'utilizadores';
let fb = null, auth = null, db = null, temporizador = null, aSincronizar = false;

const lerJSON = (k, def) => { try{ return JSON.parse(localStorage.getItem(k) || 'null') ?? def; }catch(e){ return def; } };
const limpa = o => JSON.parse(JSON.stringify(o));

/* ------------------------------------------------------ fusão sem perdas */
export function fundePerfil(a, b){
  if(!a) return b;
  if(!b) return a;
  const novo = (a.t || 0) >= (b.t || 0) ? a : b;
  const velho = novo === a ? b : a;
  const r = { ...velho, ...novo };
  r.nivel = Math.max(a.nivel || 1, b.nivel || 1);
  r.estrelas = { ...(b.estrelas || {}) };
  for(const [k, v] of Object.entries(a.estrelas || {})) r.estrelas[k] = Math.max(r.estrelas[k] || 0, v);
  r.aprendizagem = novo.aprendizagem || velho.aprendizagem;
  /* quinta: fica o maior número de cada item comprado em qualquer aparelho */
  const qi = { ...((b.quinta && b.quinta.itens) || {}) };
  for(const [k, v] of Object.entries((a.quinta && a.quinta.itens) || {})) qi[k] = Math.max(qi[k] || 0, v);
  r.quinta = { itens: qi };
  r.nome = novo.nome || velho.nome || '';
  r.idade = novo.idade || velho.idade || null;
  r.perguntouNome = !!(a.perguntouNome || b.perguntouNome);
  r.t = Math.max(a.t || 0, b.t || 0);
  return r;
}

export function fundeTudo(local, nuvem){
  const apagados = [...new Set([...(local.apagados || []), ...(nuvem.apagados || [])])];
  const ids = new Set([...Object.keys(local.dados || {}), ...Object.keys(nuvem.dados || {})]);
  const dados = {}, perfis = [];
  const nomes = {};
  [...(nuvem.perfis || []), ...(local.perfis || [])].forEach(p => { nomes[p.id] = p.nome || nomes[p.id]; });
  for(const id of ids){
    if(apagados.includes(id)) continue;
    dados[id] = fundePerfil(local.dados?.[id], nuvem.dados?.[id]);
    perfis.push({ id, nome: dados[id].nome || nomes[id] || 'Criança' });
  }
  return { perfis, dados, apagados };
}

/* ------------------------------------------------------------- local */
function lerLocal(){
  const perfis = lerJSON('eab-perfis', []);
  const dados = {};
  perfis.forEach(p => { const d = lerJSON('eab-perfil-' + p.id, null); if(d) dados[p.id] = d; });
  return { perfis, dados, apagados: lerJSON('eab-apagados', []) };
}
function escreveLocal(r){
  try{
    localStorage.setItem('eab-perfis', JSON.stringify(r.perfis));
    localStorage.setItem('eab-apagados', JSON.stringify(r.apagados || []));
    for(const [id, d] of Object.entries(r.dados)) localStorage.setItem('eab-perfil-' + id, JSON.stringify(d));
    const ativo = localStorage.getItem('eab-perfil-ativo');
    if(!ativo || !r.perfis.some(p => p.id === ativo) ) localStorage.setItem('eab-perfil-ativo', r.perfis[0]?.id || 'principal');
  }catch(e){}
}

/* ------------------------------------------------------------ estado */
/* Versão Google Play (apps para crianças): a partilha com amigos é OPT-IN dos pais.
   Enquanto os pais não aceitarem (Área dos Pais), nada é carregado nem enviado.
   Depois de aceitarem: login anónimo (sem email, sem Google) e só se publica um resumo
   mínimo (alcunha, estrelas, níveis, personagens). O progresso completo NÃO vai para a cloud. */
const CLOUD_ATIVA = true;
const CHAVE_PARTILHA = 'eab-partilha';
const consentimentoDado = () => { try{ return localStorage.getItem(CHAVE_PARTILHA) === '1'; }catch(e){ return false; } };
export const Nuvem = {
  configurada: CLOUD_ATIVA && !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey),
  consentida: consentimentoDado(),
  utilizador: null,
  ultimaSync: null,
  aMudar: () => {},          /* a interface redesenha-se */
  aoTrazerDados: () => {},   /* chegou progresso novo da cloud */
  resumo: null,              /* a app dá aqui o resumo público do perfil ativo */
  aposSync: () => {},        /* a app atualiza os amigos depois de sincronizar */

  async inicia(){
    if(!this.configurada || !this.consentida || fb) return;
    try{
      fb = await import('../lib/firebase.js');
      const app = fb.initializeApp(FIREBASE_CONFIG);
      auth = fb.getAuth(app);
      db = fb.getFirestore(app);
      fb.onAuthStateChanged(auth, async u => {
        this.utilizador = u ? { uid: u.uid } : null;
        this.aMudar();
        if(u) await this.sincroniza();
        else if(this.consentida) fb.signInAnonymously(auth).catch(e => { this.erro = 'Não foi possível ligar. Tente mais tarde.'; this.aMudar(); });
      });
      addEventListener('online', () => this.agenda(500));
    }catch(e){
      console.warn('Cloud indisponível', e);
      this.configurada = false;
      this.aMudar();
    }
  },

  /* os pais aceitam a partilha */
  async ativa(){
    try{ localStorage.setItem(CHAVE_PARTILHA, '1'); }catch(e){}
    this.consentida = true; this.erro = '';
    await this.inicia();
    this.aMudar();
  },
  /* os pais retiram a partilha: apaga o que foi publicado e a identidade anónima */
  async desativa(codigos = []){
    this.consentida = false;
    try{ localStorage.removeItem(CHAVE_PARTILHA); }catch(e){}
    try{
      if(fb && db && auth && auth.currentUser){
        for(const c of codigos) await fb.deleteDoc(fb.doc(db, 'ranking', c)).catch(() => {});
        await fb.deleteUser(auth.currentUser).catch(() => fb.signOut(auth));
      }
    }catch(e){ console.warn('Não foi possível apagar tudo da cloud', e); }
    this.utilizador = null; this.ultimaSync = null; this.aMudar();
  },

  /* chamado sempre que o progresso é guardado */
  agenda(ms = 2500){
    if(!this.utilizador) return;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => this.sincroniza(), ms);
  },

  /* já não há cópia do progresso na cloud: só o resumo mínimo para os amigos */
  async sincroniza(){
    if(!this.utilizador || aSincronizar || !navigator.onLine) return;
    aSincronizar = true;
    try{
      this.ultimaSync = Date.now(); this.erro = ''; this.aMudar();
      this.publica().finally(() => this.aposSync());
    }finally{ aSincronizar = false; }
  },

  /* ------------------------------------------------ amigos (ranking) ----
     Cada perfil publica um resumo pequeno em ranking/{código}: alcunha, estrelas,
     níveis e que personagens tem. Só isto — nada mais da criança. Os amigos leem
     o resumo pelo código. Ver as regras em NUVEM-FIREBASE.md. */
  get ligada(){ return !!(this.utilizador && db && navigator.onLine); },

  async publica(){
    try{
      if(!this.ligada || !this.resumo) return false;
      const r = this.resumo();
      if(!r || !r.codigo) return false;
      const chave = JSON.stringify(r) + this.utilizador.uid;
      if(chave === this._ultimaPub) return true;             /* nada mudou: não escreve outra vez */
      await fb.setDoc(fb.doc(db, 'ranking', r.codigo), limpa({ ...r, uid: this.utilizador.uid, atualizado: Date.now() }));
      this._ultimaPub = chave;
      return true;
    }catch(e){ console.warn('Não foi possível publicar o resumo', e); return false; }
  },

  /* devolve { CODIGO: resumo } só dos que existem */
  async lerResumos(codigos){
    const r = {};
    this.erroAmigos = '';
    if(!this.ligada) return r;
    await Promise.all(codigos.map(async c => {
      try{ const s = await fb.getDoc(fb.doc(db, 'ranking', c)); if(s.exists()) r[c] = s.data(); }
      catch(e){ this.erroAmigos = (e && e.code) || 'erro'; console.warn('Resumo indisponível', c, e); }
    }));
    return r;
  },

  /* quem me adicionou: para a amizade ser dos dois lados */
  async quemMeSegue(meuCodigo){
    try{
      if(!this.ligada) return [];
      const s = await fb.getDoc(fb.doc(db, 'seguidores', meuCodigo));
      return s.exists() ? (s.data().codigos || []).filter(c => typeof c === 'string') : [];
    }catch(e){ return []; }
  },
  async avisaSeguir(meuCodigo, codigoAmigo){
    try{
      if(!this.ligada) return false;
      const ref = fb.doc(db, 'seguidores', codigoAmigo);
      const s = await fb.getDoc(ref);
      const codigos = s.exists() ? (s.data().codigos || []) : [];
      if(!codigos.includes(meuCodigo)) await fb.setDoc(ref, { codigos: [...codigos, meuCodigo].slice(-100) });
      return true;
    }catch(e){ console.warn('Não foi possível avisar o amigo', e); return false; }
  },

  /* mensagens em português, sem culpar ninguém */
  mensagem(e){
    const c = (e && e.code) || '';
    return ({
      'auth/invalid-credential': 'Email ou palavra-passe não estão certos. Tente outra vez.',
      'auth/wrong-password': 'Email ou palavra-passe não estão certos. Tente outra vez.',
      'auth/user-not-found': 'Não encontrámos essa conta. Pode criá-la com "Criar conta".',
      'auth/email-already-in-use': 'Já existe uma conta com este email. Use "Entrar".',
      'auth/weak-password': 'A palavra-passe precisa de pelo menos 6 caracteres.',
      'auth/invalid-email': 'Este email não parece estar completo.',
      'auth/missing-password': 'Escreva a palavra-passe.',
      'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de terminar.',
      'auth/cancelled-popup-request': 'A janela do Google foi fechada antes de terminar.',
      'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Permita janelas para este site e tente outra vez.',
      'auth/network-request-failed': 'Sem ligação à internet. Tente outra vez quando estiver ligado.',
      'auth/too-many-requests': 'Foram feitas muitas tentativas. Espere um pouco e tente outra vez.',
      'auth/unauthorized-domain': 'Este endereço ainda não está autorizado no Firebase.',
    })[c] || 'Não foi possível concluir. Tente outra vez.';
  },
};
