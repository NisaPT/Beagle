/* Partilha opcional com amigos (Firebase: login anónimo + Firestore).

   PRINCÍPIOS (apps para crianças — Google Play Families, RGPD, COPPA):
   - Desligada por defeito. Só se liga na Área dos Pais, com autorização expressa de um adulto.
   - Nada de texto livre: não há nomes, mensagens, fotografias, localização nem contactos.
     O "nome" do amigo é calculado a partir do código (ex.: "Coelhinho 42").
   - Cada perfil publica só: nível do jogo e os itens da quinta (ids e quantidades).
   - Um amigo só vê esse perfil se o PAI/MÃE do dono o autorizou (documento ver/{código}_{uid}).
   - Tudo caduca (TTL de 180 dias sem uso) e tudo se apaga (apagaPendentes) — ver NUVEM-FIREBASE.md.
   - O jogo funciona sempre sem internet; o armazenamento local é a fonte principal. */
import { FIREBASE_CONFIG } from './firebase-config.js';

export const VERSAO_CONSENTIMENTO = 1;
export const CODIGO_RE = /^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/;
const DIAS_PERFIL = 180, DIAS_VER = 400;
const CHAVE_PARTILHA = 'eab-partilha';
const CHAVE_CONSENTIMENTO = 'eab-consentimento';
const CHAVE_PENDENTE = 'eab-apagar-pendente';

let fb = null, auth = null, db = null, temporizador = null, aSincronizar = false, aApagar = false;

const depois = dias => new Date(Date.now() + dias * 864e5);
const consentimentoDado = () => { try{ return localStorage.getItem(CHAVE_PARTILHA) === '1'; }catch(e){ return false; } };
const lerPendente = () => {
  try{
    const p = JSON.parse(localStorage.getItem(CHAVE_PENDENTE) || 'null');
    if(p && Array.isArray(p.perfis)) return { tudo: !!p.tudo, perfis: p.perfis };
  }catch(e){}
  return { tudo: false, perfis: [] };
};
const temPendente = () => { const p = lerPendente(); return p.tudo || p.perfis.length > 0; };
const guardaPendente = p => { try{ localStorage.setItem(CHAVE_PENDENTE, JSON.stringify(p)); }catch(e){} };
const limpaPendente = () => { try{ localStorage.removeItem(CHAVE_PENDENTE); }catch(e){} };

export const Nuvem = {
  configurada: !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey),
  consentida: consentimentoDado(),
  utilizador: null,
  ultimaSync: null,
  erro: '',
  erroAmigos: '',
  aMudar: () => {},            /* a interface redesenha-se */
  aoTrazerDados: () => {},     /* (já não há cópia do progresso na cloud; mantido por compatibilidade) */
  aposSync: () => {},          /* a app atualiza os amigos depois de publicar */
  aoPerderCodigo: () => {},    /* o código deste perfil pertence a outra identidade: a app gera um novo */
  resumo: null,                /* a app devolve aqui { codigo, nivel, itens } do perfil ativo */

  get ligada(){ return !!(this.utilizador && db && navigator.onLine); },
  get apagarPendente(){ return temPendente(); },

  async inicia(){
    if(!this.configurada || fb) return;
    if(!this.consentida && !temPendente()) return;
    try{
      fb = await import('../lib/firebase.js');
      const app = fb.initializeApp(FIREBASE_CONFIG);
      auth = fb.getAuth(app);
      db = fb.getFirestore(app);
      fb.onAuthStateChanged(auth, async u => {
        this.utilizador = u ? { uid: u.uid } : null;
        if(temPendente()){
          if(u) await this.apagaPendentes();
          else limpaPendente();                       /* sem sessão não há nada que a identidade possa apagar */
        }
        if(this.consentida){
          if(u) await this.sincroniza();
          else fb.signInAnonymously(auth).catch(() => { this.erro = 'Não foi possível ligar. Tente mais tarde.'; this.aMudar(); });
        }
        this.aMudar();
      });
      addEventListener('online', () => { if(temPendente()) this.apagaPendentes().then(() => this.aMudar()); else this.agenda(500); });
    }catch(e){
      console.warn('Cloud indisponível', e);
      this.configurada = false;
      this.aMudar();
    }
  },

  /* os pais autorizam a partilha (a app já pediu a confirmação expressa) */
  async ativa(){
    try{
      localStorage.setItem(CHAVE_PARTILHA, '1');
      localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify({ v: VERSAO_CONSENTIMENTO, t: Date.now() }));
    }catch(e){}
    this.consentida = true; this.erro = '';
    await this.inicia();
    this.aMudar();
  },

  /* os pais retiram a partilha e pedem o apagamento total.
     lista = [{ codigo, amigos:[{codigo, uid}] }] de TODOS os perfis deste aparelho.
     Devolve { ok } — se não houver ligação, fica pendente e repete-se sozinho. */
  async desativa(lista = []){
    this.consentida = false;
    try{ localStorage.removeItem(CHAVE_PARTILHA); localStorage.removeItem(CHAVE_CONSENTIMENTO); }catch(e){}
    guardaPendente({ tudo: true, perfis: [...lerPendente().perfis, ...lista] });
    await this.inicia();                              /* precisa da sessão para apagar */
    const r = await this.apagaPendentes();
    this.ultimaSync = null; this.aMudar();
    return r;
  },

  /* apagar só alguns perfis (ex.: "Apagar dados deste perfil") */
  async apagaPerfis(lista = []){
    if(!lista.length) return { ok: true };
    const p = lerPendente();
    guardaPendente({ tudo: p.tudo, perfis: [...p.perfis, ...lista] });
    await this.inicia();
    return this.apagaPendentes();
  },

  async _apaga(colecao, id){
    try{ await fb.deleteDoc(fb.doc(db, colecao, id)); return true; }
    catch(e){ console.warn('Não foi possível apagar', colecao, e && e.code); return false; }
  },

  /* apaga tudo o que ficou na lista pendente; só limpa a lista se tudo correu bem */
  async apagaPendentes(){
    const p = lerPendente();
    if(!p.tudo && !p.perfis.length) return { ok: true };
    if(!fb || !db || !auth) return { ok: false, motivo: 'sem-cloud' };
    if(!auth.currentUser) { limpaPendente(); return { ok: true }; }
    if(!navigator.onLine) return { ok: false, motivo: 'offline' };
    if(aApagar) return { ok: false, motivo: 'a-apagar' };
    aApagar = true;
    try{
      const meu = auth.currentUser.uid;
      let falhou = false;
      for(const perfil of p.perfis){
        if(!CODIGO_RE.test(String(perfil.codigo))) continue;
        for(const a of (perfil.amigos || [])){
          if(!CODIGO_RE.test(String(a.codigo)) || typeof a.uid !== 'string') continue;
          if(!await this._apaga('ver', `${perfil.codigo}_${a.uid}`)) falhou = true;   /* o que eu partilhei */
          if(!await this._apaga('ver', `${a.codigo}_${meu}`)) falhou = true;          /* o que partilharam comigo */
        }
        if(!await this._apaga('perfis', perfil.codigo)) falhou = true;
        if(!await this._apaga('codigos', perfil.codigo)) falhou = true;
      }
      if(falhou) return { ok: false, motivo: 'falhou' };
      if(p.tudo){
        try{ await fb.deleteUser(auth.currentUser); }
        catch(e){ try{ await fb.signOut(auth); }catch(_){ return { ok: false, motivo: 'falhou' }; } }
        this.utilizador = null;
      }
      limpaPendente();
      return { ok: true };
    }finally{ aApagar = false; }
  },

  /* chamado sempre que o progresso é guardado */
  agenda(ms = 2500){
    if(!this.utilizador || !this.consentida) return;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => this.sincroniza(), ms);
  },
  async sincroniza(){
    if(!this.utilizador || !this.consentida || aSincronizar || !navigator.onLine) return;
    aSincronizar = true;
    try{
      this.erro = '';
      await this.publica();
      this.ultimaSync = Date.now(); this.aMudar();
      this.aposSync();
    }finally{ aSincronizar = false; }
  },

  /* publica o perfil ativo: só código, nível e itens da quinta */
  async publica(){
    try{
      if(!this.ligada || !this.consentida || !this.resumo) return false;
      const r = this.resumo();
      if(!r || !CODIGO_RE.test(String(r.codigo))) return false;
      const uid = this.utilizador.uid;
      const chave = JSON.stringify(r) + uid;
      if(chave === this._ultimaPub) return true;                 /* nada mudou: não escreve outra vez */
      const exp = depois(DIAS_PERFIL);
      if(this._codigoOk !== r.codigo + uid){
        await fb.setDoc(fb.doc(db, 'codigos', r.codigo), { uid, expira: exp });
        this._codigoOk = r.codigo + uid;
      }
      await fb.setDoc(fb.doc(db, 'perfis', r.codigo), {
        uid, nivel: r.nivel, itens: r.itens, consent: VERSAO_CONSENTIMENTO, expira: exp, t: Date.now(),
      });
      this._ultimaPub = chave;
      return true;
    }catch(e){
      console.warn('Não foi possível publicar', e && e.code);
      if(e && e.code === 'permission-denied'){
        /* ou o código já pertence a outra identidade (ex.: sessão anónima perdida) → código novo,
           ou as regras do Firestore ainda não foram publicadas → só se avisa (nunca se gera códigos em ciclo) */
        let conflito = false;
        try{
          const c = this.resumo && this.resumo().codigo;
          const s = c && await fb.getDoc(fb.doc(db, 'codigos', c));
          conflito = !!(s && s.exists() && s.data().uid !== this.utilizador.uid);
        }catch(_){}
        if(conflito) this.aoPerderCodigo();
        else { this.erro = 'Sem permissão na cloud. Falta publicar as regras do Firestore (NUVEM-FIREBASE.md).'; this.aMudar(); }
      }
      return false;
    }
  },

  /* ----------------------------------------------------------- amigos */
  /* o pai/mãe juntou o código de um amigo: dou-lhe permissão de ver o MEU perfil.
     (ele só me vê a mim; eu só o vejo a ele quando o pai/mãe dele também me juntar.) */
  async concede(meuCodigo, codigoAmigo){
    if(!this.ligada) throw Object.assign(new Error('offline'), { code: 'eab/offline' });
    if(!CODIGO_RE.test(codigoAmigo) || !CODIGO_RE.test(meuCodigo)) throw Object.assign(new Error('codigo'), { code: 'eab/codigo-invalido' });
    await this.publica();                                           /* garante codigos/{meuCodigo} */
    const s = await fb.getDoc(fb.doc(db, 'codigos', codigoAmigo));
    if(!s.exists()) throw Object.assign(new Error('inexistente'), { code: 'eab/codigo-inexistente' });
    const uidAmigo = s.data().uid;
    if(typeof uidAmigo !== 'string' || !uidAmigo || uidAmigo.length > 128) throw Object.assign(new Error('uid'), { code: 'eab/codigo-invalido' });
    if(uidAmigo === this.utilizador.uid) throw Object.assign(new Error('proprio'), { code: 'eab/codigo-proprio' });
    await fb.setDoc(fb.doc(db, 'ver', `${meuCodigo}_${uidAmigo}`), {
      donoCodigo: meuCodigo, donoUid: this.utilizador.uid, leitorUid: uidAmigo, expira: depois(DIAS_VER),
    });
    return uidAmigo;
  },

  /* retira a amizade nos dois sentidos; devolve true só se ficou mesmo apagado */
  async revoga(meuCodigo, amigo){
    if(!this.ligada) return false;
    let ok = true;
    if(amigo.uid && !await this._apaga('ver', `${meuCodigo}_${amigo.uid}`)) ok = false;
    if(!await this._apaga('ver', `${amigo.codigo}_${this.utilizador.uid}`)) ok = false;
    return ok;
  },

  /* { estado:'ok', dados } | { estado:'pendente' } (ainda sem permissão ou ainda sem perfil) | { estado:'erro' } */
  async lerPerfil(codigo){
    if(!this.ligada) return { estado: 'erro' };
    try{
      const s = await fb.getDoc(fb.doc(db, 'perfis', codigo));
      return s.exists() ? { estado: 'ok', dados: s.data() } : { estado: 'pendente' };
    }catch(e){
      if(e && e.code === 'permission-denied') return { estado: 'pendente' };
      this.erroAmigos = (e && e.code) || 'erro';
      return { estado: 'erro' };
    }
  },

  /* mensagens em português, sem culpar ninguém */
  mensagem(e){
    const c = (e && e.code) || '';
    return ({
      'eab/offline': 'Sem ligação à internet. Tente outra vez quando estiver ligado.',
      'eab/codigo-invalido': 'O código não está certo. Tem este aspeto: ABCD-EFGH-JKMN.',
      'eab/codigo-inexistente': 'Não encontrámos esse código. Confirme com o outro pai ou mãe (e que a partilha dele está ligada).',
      'eab/codigo-proprio': 'Esse é o código desta família.',
      'auth/network-request-failed': 'Sem ligação à internet. Tente outra vez quando estiver ligado.',
      'auth/too-many-requests': 'Foram feitas muitas tentativas. Espere um pouco e tente outra vez.',
      'permission-denied': 'Sem permissão. Falta publicar as regras do Firestore (ver NUVEM-FIREBASE.md).',
    })[c] || 'Não foi possível concluir. Tente outra vez.';
  },
};
