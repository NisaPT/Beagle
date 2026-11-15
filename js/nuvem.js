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
export const Nuvem = {
  configurada: !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey),
  utilizador: null,
  ultimaSync: null,
  aMudar: () => {},          /* a interface redesenha-se */
  aoTrazerDados: () => {},   /* chegou progresso novo da cloud */
  resumo: null,              /* a app dá aqui o resumo público do perfil ativo */
  aposSync: () => {},        /* a app atualiza os amigos depois de sincronizar */

  async inicia(){
    if(!this.configurada) return;
    try{
      fb = await import('../lib/firebase.js');
      const app = fb.initializeApp(FIREBASE_CONFIG);
      auth = fb.getAuth(app);
      db = fb.getFirestore(app);
      fb.onAuthStateChanged(auth, async u => {
        this.utilizador = u ? { email: u.email, uid: u.uid } : null;
        this.aMudar();
        if(u) await this.sincroniza();
      });
      addEventListener('online', () => this.agenda(500));
    }catch(e){
      console.warn('Cloud indisponível', e);
      this.configurada = false;
      this.aMudar();
    }
  },

  async entraGoogle(){ await fb.signInWithPopup(auth, new fb.GoogleAuthProvider()); },
  async entraEmail(email, pw){ await fb.signInWithEmailAndPassword(auth, email, pw); },
  async criaConta(email, pw){ await fb.createUserWithEmailAndPassword(auth, email, pw); },
  async recupera(email){ await fb.sendPasswordResetEmail(auth, email); },
  async sai(){ await fb.signOut(auth); this.ultimaSync = null; this.aMudar(); },

  /* chamado sempre que o progresso é guardado */
  agenda(ms = 2500){
    if(!this.utilizador) return;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => this.sincroniza(), ms);
  },

  async sincroniza(){
    if(!this.utilizador || aSincronizar || !navigator.onLine) return;
    aSincronizar = true;
    try{
      const ref = fb.doc(db, COLECAO, this.utilizador.uid);
      const snap = await fb.getDoc(ref);
      const nuvem = snap.exists() ? snap.data() : { perfis: [], dados: {}, apagados: [] };
      const local = lerLocal();
      const r = fundeTudo(local, nuvem);
      const mudouLocal = JSON.stringify(r.dados) !== JSON.stringify(local.dados) ||
                         JSON.stringify(r.perfis) !== JSON.stringify(local.perfis);
      if(mudouLocal) escreveLocal(r);
      await fb.setDoc(ref, limpa({ perfis: r.perfis, dados: r.dados, apagados: r.apagados, atualizado: Date.now(), v: 1 }));
      this.ultimaSync = Date.now();
      this.erro = '';
      this.aMudar();
      if(mudouLocal) this.aoTrazerDados();
      this.publica().finally(() => this.aposSync());
    }catch(e){
      console.warn('Sincronização falhou', e);
      this.erro = 'Não foi possível guardar na cloud agora. Vai tentar outra vez.';
      this.aMudar();
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
      await fb.setDoc(fb.doc(db, 'ranking', r.codigo), limpa({ ...r, uid: this.utilizador.uid, atualizado: Date.now() }));
      return true;
    }catch(e){ console.warn('Não foi possível publicar o resumo', e); return false; }
  },

  /* devolve { CODIGO: resumo } só dos que existem */
  async lerResumos(codigos){
    const r = {};
    if(!this.ligada) return r;
    await Promise.all(codigos.map(async c => {
      try{ const s = await fb.getDoc(fb.doc(db, 'ranking', c)); if(s.exists()) r[c] = s.data(); }
      catch(e){ console.warn('Resumo indisponível', c, e); }
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
