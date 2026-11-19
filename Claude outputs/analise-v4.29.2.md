# Auditoria completa — Escola dos Avós Beagle v4.29.2

Data: 2026-11-19 · Base: código da pasta `Beagle` (sw.js `VERSAO eab-4.29.2`; `index.html` ainda carrega `app.js?v=4.29.0`).
Método: leitura estática do código + documentos do projeto (v4.10.0, v4.17.2, v4.24, v4.25, v4.28, v4.29.1, ideias, histórias). **Não houve execução em dispositivo nem teste com crianças.**
Convenção: **[F]** = facto visto no código · **[S]** = suposição/inferência · **[V]** = a verificar (precisa de dispositivo ou do Firebase real).

---

## 0. Âmbito e limites (honestidade primeiro)

Lido por inteiro ou quase: `index.html`, `app.js`, `jogos.js`, `jogos2.js`, `jogos3.js`, `som.js`, `nuvem.js`, `sw.js`, `tarefas.js`, `mapa.js`, `idades.js`, `historias.js`, `quinta3d.js`, `animais3d.js`, `brincar.js`, `festa.js`, `arte.js`, `natureza.js` (parte), `movimento.js`, `privacidade.html`, `NUVEM-FIREBASE.md`, README, `vercel.json`.
Só por grep/amostragem: `amigos3d`, `curiosidades`, `minhaquinta`, `poses`, `bichos`, `quinta.js`, CSS fora do `index.html`, scripts em `ferramentas/`, modelos e media.
Não verificado: regras Firestore **realmente publicadas** (usei as de `NUVEM-FIREBASE.md`), FPS/RAM em telemóveis reais, comportamento em iOS Safari, leitores de ecrã, deploy real na Vercel.
Ficheiro `t VERSAO sw.js` (1822 bytes) na raiz: não foi possível aceder — **[V]**, parece lixo de um comando mal escrito.

**Informação em falta (preciso para fechar os [V]):** (a) modelos de telemóvel/tablet e browsers onde testas; (b) as regras Firestore atuais copiadas da consola; (c) se publicas por `git`→Vercel ou por CLI.

---

## 1. Resumo executivo

| Área | Nota | Porquê (curto) |
|---|---|---|
| 1. Erros e estabilidade | **5/10** | Avanço do jogo depende de callback de voz sem watchdog; bloqueio total se os modelos 3D falharem; SW guarda a página errada como `index.html`. |
| 2. Desempenho | **5/10** | ~11 MB de base64 em JS, ambos os pacotes de voz carregados no arranque, 3 contextos WebGL, sem tratamento de perda de contexto; nada medido em dispositivo real. |
| 3. Código | **6/10** | Estrutura modular razoável e várias correções boas desde v4.24; mas código morto, documentação desatualizada, versão a dobrar manualmente, zero handlers globais de erro. |
| 4. Design/usabilidade infantil | **6/10** | Contraste dos botões principais abaixo de WCAG; jogos só por cor; zoom bloqueado; Back do Android sai da app; área dos pais densa. |
| 5. Pedagogia e dificuldade | **6/10** | Perfis por idade existem e funcionam; contagem com género errado e clips em falta; sem andaime após erros; desbloqueio de mundos muito lento; quinta "farm" de estrelas. |
| 6. Segurança e privacidade | **4/10** | XSS/DoS por dados da nuvem não validados; apagar conta/perfil não apaga tudo na nuvem; política de privacidade ainda com *placeholders*; porta parental fraca. |

### Os 5 problemas mais graves

1. **S1 — Dados do Firestore injetados no HTML sem validação (XSS armazenado + DoS)** e regras que deixam qualquer utilizador autenticado escrever em `seguidores/{código}` e criar `ranking/<código>` com campos livres.
2. **E1 — O service worker guarda *qualquer* navegação como `./index.html`** (incl. `privacidade.html`): offline a app pode abrir na página de privacidade; sem `r.ok`, sem timeout.
3. **E2 — O jogo pode parar para sempre** se o callback de voz nunca chega (`Jogo.responde`, `Som.falaEmbutida` sem `ctx`).
4. **E3 — Bloqueio duro no ecrã "escolhe o avô/avó"** se `modelos/avo.js`/`ava.js` não carregarem (`avo`/`ava` ficam `null` → `soUm()` lança TypeError).
5. **P1 — Arranque pesado**: `btn-comecar` carrega as duas vozes (~11 MB base64 em JS) + Quinta3D; em telemóveis fracos é o candidato nº1 a ecrã azul/crash **[V]**.

---

## 2. Estado dos problemas já documentados

**Resolvido (verificado no código):** perfis de dificuldade por idade (`idades.js`, `numOpcoes`/`memoriaIgual`); limite diário ligado; "apagar perfil" já não ressuscita; SW em 2 fases com timeout; debounce de `Estado.guarda` (800 ms); rigs invisíveis saltados; menus a 30 fps; guardas de timers obsoletos (`Jogo.espera`); histórico de 20 rondas (`ap.rec`); `precarrega` enviado 4 s após o load.

**Continua por resolver:** pacotes de voz completos em base64 (B1); contagem com género/clips em falta (A4 de v4.24); ecrã azul da Quinta 3D (sem causa confirmada); zero medições de FPS em dispositivo real; zero testes com crianças; "farm" de estrelas; Galinheiro só com galo; sem `webglcontextlost`; `#uso-hoje` nunca atualizado.

---

## 3. Tabela de achados

Gravidade: Crítica / Alta / Média / Baixa · Esforço: Baixo / Médio / Alto · Tipo: F/S/V.

| ID | Área | Descrição | Onde | Grav. | Esf. | Tipo |
|---|---|---|---|---|---|---|
| S1 | 6 | `Estado.amigos[].resumo` vem do Firestore sem validação e é injetado com `innerHTML` (`x.estrelas`, `x.nivel`, `x.edificios`, `x.bichos`, `x.nq.nivel`); `[...x.nome][0]` rebenta se `nome` não for iterável. Regras permitem escrever `seguidores/{código}` a qualquer autenticado e `ranking/<código>` sem validação de tipo/tamanho. | `app.js` `desenhaRanking`, `desenhaPais` ~L872, L380 (`a.resumo = r`), `atualizaAmigos` L371–375; `NUVEM-FIREBASE.md` regras | **Crítica** | Baixo | F |
| E1 | 1 | Handler `navigate` guarda toda a navegação em `./index.html`; sem `r.ok`; sem timeout (rede lenta = ecrã branco). A Área dos Pais abre `privacidade.html` com `target=_blank`. | `sw.js` ~L232 | **Crítica** | Baixo | F |
| E2 | 1 | Avanço da ronda depende do callback da voz; sem watchdog. `falaEmbutida` retorna sem chamar `aoFim` se `!this.ctx` ou se mudo a meio da descodificação. | `jogos.js` `responde` L475–508; `som.js` `falaEmbutida` | **Alta** | Baixo | F (prob. [V]) |
| E3 | 1 | Falha a importar `modelos/avo.js`/`ava.js` → `avo`/`ava` = null → `escolhe()`→`soUm()`→`activo.visivel(true)` TypeError; mensagem diz "Pode continuar" mas não dá. | `app.js` `iniciar()` L1417–1458, `escolhe`, `soUm` | **Alta** | Baixo | F |
| P1 | 2 | `btn-comecar` carrega as duas vozes + quinta3d (race 15 s); `Som.arranca()` também (L64–65). `voz_m.js` 9,45 MB + `voz_extra_m.js` 1,85 MB (só o masculino), o feminino é equivalente [S]. Parse de JS gigante + `decodeAudioData`. | `app.js` L1088–1109; `som.js` L64–65 | **Alta** | Médio | F / impacto [V] |
| P2 | 2 | Sem `webglcontextlost/restored` em lado nenhum; 3 contextos WebGL (`#gl` DPR≤1.5; Quinta3D DPR≤2 + antialias + `high-performance`; renderer partilhado de `animais3d`). Quando o SO mata um contexto o canvas fica azul/preto. Causa plausível do "ecrã azul". | `rig.js`, `quinta3d.js`, `animais3d.js` | **Alta** | Médio | F (causa [V]) |
| E4 | 1 | Tempo de uso: `inicioSessao` nunca é reposto ao voltar ao primeiro plano; o 1.º tick de 30 s soma até 300 s de tempo inativo. | `app.js` L85, L498–506 | **Alta** | Baixo | F |
| S2 | 6 | Limite diário contornável: aviso só nos ecrãs mundos/mapa/ranking/quinta; "Ver a minha quinta" e `abreFilme` sem verificação. | `app.js` `atualizaTempoUso`, `abreFilme` | **Alta** | Baixo | F |
| S3 | 6 | Porta parental: pergunta 3–9 × 4–9, sem bloqueio nem limite de tentativas, resposta fixa até acertar; um aluno de 7 anos passa. | `app.js` L823–850 | **Alta** | Baixo | F |
| S4 | 6 | Apagar dados incompleto: `btn-sair-conta`/`Nuvem.desativa` engole erros de `deleteDoc`, sem verificação online, não remove entradas em `seguidores`; `btn-apagar-perfil` e `btn-apagar-tudo` não apagam `ranking/{código}`; utilizador anónimo Firebase não é apagado. A política promete remoção. | `nuvem.js` L114–124; `app.js` L978–995 | **Alta** | Médio | F |
| S5 | 6 | `privacidade.html` é rascunho: `[nome do programador/entidade]`, `[morada]`, `[email]`, data 16/11/2026 (futura em relação ao dia da escrita?). Afirma "região UE" — a confirmar na consola. Sem isto não pode ir para Play Store/App Store. | `privacidade.html` | **Alta** | Baixo | F / UE [V] |
| S6 | 6 | `NUVEM-FIREBASE.md` e `Nuvem.mensagem` ainda descrevem login Google/email e sincronização de progresso que já não existem. Risco de configurar regras erradas por engano. | `NUVEM-FIREBASE.md`, `nuvem.js` | Média | Baixo | F |
| S7 | 6 | Chave Firebase pública no repositório (normal em web), mas sem restrição por domínio confirmada. Sem CSP. `codigoNovo()` usa `Math.random` (4 letras+4 dígitos, adivinhável por enumeração). | `firebase-config.js`, `index.html`, `app.js` `codigoNovo` | Média | Baixo | F / restrição [V] |
| U1 | 4 | Contraste: `.botao` branco sobre #E8A765→#C07A38 = 2,07:1 / 3,45:1 (WCAG AA exige 4,5:1 texto normal, 3:1 grande); `.mini.discreto` 2,61:1. | `index.html` CSS `.botao`, `.mini.discreto` | **Alta** | Baixo | F |
| U2 | 4 | Jogos dependentes só de cor: `rondaLogica` (🔴🔵🟡🟢), `CORES` (verde/vermelho 1,53:1; laranja/verde 1,22:1), pintar em `jogos3.js`. Daltonismo (~8 % dos rapazes) não consegue jogar. | `jogos.js` `rondaLogica`, `CORES`; `jogos3.js` | **Alta** | Médio | F |
| U3 | 4 | Android: sem `popstate`/history → botão Voltar fecha a app a meio do jogo. | `app.js` (ausência) | **Alta** | Baixo | F |
| U4 | 4 | `viewport` com `maximum-scale=1, user-scalable=no` bloqueia zoom (acessibilidade, WCAG 1.4.4). | `index.html` | Média | Baixo | F |
| U5 | 4 | `#uso-hoje` ("0 min utilizados hoje") nunca é atualizado: mostra sempre 0 aos pais. | `index.html`, `app.js` | Média | Baixo | F |
| U6 | 4 | `#btn-pais` (⚙) sempre visível, inclusive em jogo: a criança toca-lhe por curiosidade; `btn-fechar-porta`→`abreMapa` não chama `jogo.para()` (só `voltaAoMapa` o faz): jogo atrás da porta pode continuar a falar. | `app.js` handlers `#btn-pais`, `btn-fechar-porta`, `abreMapa` | Média | Baixo | F |
| U7 | 4 | Alvos tácteis: `.mini` 2,7 rem (~43 px) — abaixo dos ~48 px recomendados para 3–5 anos. `tabindex` ausente no `index.html` (0 ocorrências); `rondaFormas` usa `role=button tabindex=0` sem handler de teclado; diálogos sem gestão de foco. | `index.html`, `jogos.js` `rondaFormas`, `tarefas.js` | Média | Médio | F |
| U8 | 4 | Área dos Pais: 8 painéis num scroll único + campo de URL "gateway TTS" (jargão de programador) exposto no mesmo ecrã que o limite de tempo. | `index.html` Área dos Pais | Média | Médio | F |
| U9 | 4 | Mudo (`btn-som`) cala tudo, voz incluída; sem controlo separado de música/volume; música em todos os jogos compete com a instrução falada. | `som.js` | Média | Médio | F |
| D1 | 5 | Contar usa `NUM[contados]` feminino ("uma, duas…") para "biscoitos" (masculino). Clips em falta no pacote do avô: "um", "dois", "onze", "quinze", "doze" (verificado nas chaves de `voz_m.js`/`voz_extra_m.js`; existem "uma","duas"). Cai para voz do dispositivo, que contradiz a regra "nunca voz do sistema". | `jogos.js` L237; `som.js` fallback | **Alta** | Médio | F |
| D2 | 5 | `rondaMemoria`: pares errados além da margem incrementam `this.erros` mas não `errosRonda` → `aoAcertar(…, errosRonda===0)` reporta sempre "à primeira" → adaptação e estrelas inflacionadas. | `jogos.js` `rondaMemoria` | Média | Baixo | F |
| D3 | 5 | Sem andaime pedagógico: após erros repetidos não há dica/redução de opções/demonstração (só "pontos"). Para 3 anos a frustração é o principal motivo de abandono [S]. `rondaLetras` revela a palavra na resposta errada (bom), mas sem repetição espaçada. | `jogos.js` | Média | Médio | F / efeito [S] |
| D4 | 5 | Desbloqueio de mundos 2–5 só no nível 101/201/… (`aberto = maior >= inicio`); 500 níveis com dificuldade quase plana (10 degraus de 50). Uma criança de 3–4 anos pode nunca ver o mundo 2. | `app.js` `abreMundos`; `mapa.js` | Média | Médio | F |
| D5 | 5 | `FIGURAS` para 3–4 anos têm 5–8 pontos numerados: sequência numérica acima da capacidade típica dos 3 anos. Errar a parte a pintar conta como erro. | `jogos3.js` | Média | Baixo | S |
| D6 | 5 | `tarefas.js`: cada minijogo dá +1 estrela com "Outra vez" ilimitado → farm de estrelas (já admitido em v4.28); estrelas são a moeda da loja → neutraliza a progressão. | `tarefas.js` `conclui` | Média | Baixo | F |
| E5 | 1 | `tarefas.js` `contar`: botão correto sem guarda `aEsperar`; duplo toque em <900 ms salta rondas e chama `fim()` duas vezes (+2 estrelas). | `tarefas.js` `abreJogosCasa`/`contar` | Média | Baixo | F |
| E6 | 1 | Voz errada após a história: `saiDaHistoria`→`soUm(Estado.companheiro)` sem `Som.defineVoz`; `historias.js` deixa a voz da Avó ('f'). Com companheiro Avô fala com a voz errada. | `app.js` `saiDaHistoria`; `historias.js` `fala()` | Média | Baixo | F |
| E7 | 1 | `Som.retoma()` só retoma `suspended`; no iOS o estado `interrupted` (chamada, alarme) deixa a app muda. | `som.js` `retoma` | Média | Baixo | F (iOS [V]) |
| E8 | 1 | `Estado.carrega`: se `JSON.parse` falha, grava os valores por omissão por cima → perda silenciosa de progresso. `guarda()` engole erros de quota (localStorage cheio). | `app.js` `Estado` | Média | Baixo | F |
| E9 | 1 | Nenhum `window.onerror`/`unhandledrejection`: qualquer exceção numa ronda deixa o ecrã preso, sem recuperação nem registo. | (ausência) | Média | Baixo | F |
| E10 | 1 | `rondaCesto`: toque nos 450 ms entre itens responde ao item seguinte ainda não visto. | `jogos2.js` | Baixa | Baixo | F |
| E11 | 1 | `brincar.js` desenho: sem tratamento de resize/rotação (desfasamento ponteiro/canvas). | `brincar.js` | Média | Médio | V |
| P3 | 2 | SW: `voz_extra_[fm].js` (~3,7 MB) estão em ESSENCIAL mas não casam com a regex cache-first (`voz_[fm]\.js`) → passam por `redePrimeiro` (reescrita a cada arranque). `.mp4`/`Range` não intercetados; `firebase.js`, `ava-intro.mp4`, ícones maskable não pré-guardados. | `sw.js` | Média | Baixo | F |
| P4 | 2 | `skipWaiting`+`clients.claim` misturam versões: imports dinâmicos (`quinta3d.js`, `modelos/avo.js`) podem carregar ficheiros novos num `app.js` antigo; `?v=4.29.0` vs `VERSAO 4.29.2` (duplo bump manual — README). | `sw.js`; `index.html` | Média | Médio | F |
| P5 | 2 | `anima()` aloca `vista.pos.clone()`/`posAlvo.clone()`/`alvoOlhar.clone()` por frame (ecrãs escolher/jogo); `quinta3d` idem em 'dentro'. Pressão de GC em Android fraco. | `app.js` `anima`; `quinta3d.js` | Baixa | Baixo | F / impacto [V] |
| P6 | 2 | `vida3d.js`: `MutationObserver` global em `document.body` (subtree + atributo `src`) para sempre — custo a cada `innerHTML` grande (mapa ~350 nós reconstruídos por `innerHTML`). | `vida3d.js`; `mapa.js` | Média | Médio | V |
| P7 | 2 | Quinta3D: muitos meshes/materiais por árvore/flor; nº de draw calls não medido (`renderer.info`); `ativa()` pode duplicar o loop se alternado no mesmo frame. | `quinta3d.js` | Média | Médio | V |
| C1 | 3 | Código morto: `fundePerfil`, `fundeTudo`, `aplicaPendentes`, entradas Google/email em `Nuvem.mensagem`. | `app.js`, `nuvem.js` | Baixa | Baixo | F |
| C2 | 3 | Dois números de versão a mexer à mão (`VERSAO` e `?v=`), já desalinhados. `TESTAR-ESCOLA-BEAGLE.txt` desatualizado (diz limite 15–90 min; código permite até 180). `guarda()` escreve sempre a chave legada `eab`. | README; `index.html`; `app.js` | Baixa | Baixo | F |
| C3 | 3 | Sem `.vercelignore`: `*.antigo` (~18 MB) e `ferramentas/` seriam enviados num deploy por CLI. Ficheiro `t VERSAO sw.js` perdido. | raiz | Baixa | Baixo | F / deploy [V] |
| C4 | 3 | `Som.fala` em mudo chama callback em 400 ms → rondas seguidas muito depressa (criança em mudo passa rondas sem ler). | `som.js` | Baixa | Baixo | F |

---

## 4. Roadmap priorizado

### Fazer já (antes de qualquer distribuição)
S1 (sanitizar + regras) · E1 (SW navegação) · E2 + E3 (watchdog e guarda dos rigs) · E4 + U5 + S2 (tempo de uso e limite) · S3 (porta parental) · S4 (apagar na nuvem) · S5 (preencher política de privacidade) · U1 (contraste) · U3 (botão Voltar) · E9 (handlers globais) · P2 (`webglcontextlost`) · E5/E6/E7/D2 (bugs pequenos).

### Próxima versão
P1 (carregar só a voz do companheiro; passar de base64 em JS para ficheiros `.mp3` com cache do SW) · D1 (clips "um/dois/onze/quinze/doze" no pacote do avô e género correto) · U2 (formas/símbolos além da cor) · D3 (andaime após 2 erros) · D4 (desbloqueio de mundos por estrelas/nível relativo) · D6 (limitar estrelas de tarefas por dia) · P3/P4 (regex SW, versão única) · U4/U6/U7/U8/U9 · C1–C3 · actualizar `NUVEM-FIREBASE.md`.

### Ideias futuras
Teste de usabilidade com 5–8 crianças (3, 4 e 5 anos) com observação silenciosa · telemetria local anónima de "onde falha" (só no ecrã dos pais) · modo "sem música" · repetição espaçada para letras/números · relatório semanal para pais (aprendeu / dificuldade) · Galinheiro com galinhas · medição automática de FPS por dispositivo para escolher DPR/antialias.

---

## 5. Código corrigido (problemas Críticos e Altos)

> Os trechos são patches pensados para o código visto, mas **não foram executados**. Onde a estrutura exata não foi vista, está marcado "adaptar".

### S1 — Sanitizar dados da nuvem + escapar + regras mais estritas

`app.js` (perto de L380) — nunca guardar `r` cru:

```js
const num = (v, max = 1e6) => Number.isFinite(+v) ? Math.max(0, Math.min(max, Math.trunc(+v))) : 0;
const CODIGO_RE = /^[A-Z]{4}[0-9]{4}$/;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function sanitizaResumo(r) {
  if (!r || typeof r !== 'object') return null;
  return {
    codigo:    CODIGO_RE.test(String(r.codigo)) ? String(r.codigo) : '',
    nome:      String(r.nome ?? 'Criança').slice(0, 14),
    estrelas:  num(r.estrelas),
    nivel:     num(r.nivel, 500),
    edificios: num(r.edificios, 999),
    bichos:    num(r.bichos, 999),
    nq: { nivel: num(r.nq && r.nq.nivel, 999) },
  };
}
// L380:  a.resumo = sanitizaResumo(r);   // e ignorar se null
// atualizaAmigos: filtrar códigos com CODIGO_RE.test(c) antes de ler/seguir
// desenhaRanking / desenhaPais: usar esc(x.nome) e [...String(x.nome)][0]
```

Regras Firestore (proposta — **adaptar ao esquema real publicado, [V]**):

```
match /ranking/{codigo} {
  allow get: if request.auth != null;
  allow create, update: if request.auth != null
    && request.resource.data.uid == request.auth.uid
    && (resource == null || resource.data.uid == request.auth.uid)
    && codigo.matches('^[A-Z]{4}[0-9]{4}$')
    && request.resource.data.nome is string && request.resource.data.nome.size() <= 14
    && request.resource.data.estrelas is int && request.resource.data.estrelas >= 0
    && request.resource.data.estrelas <= 1000000
    && request.resource.data.keys().hasOnly(['uid','codigo','nome','estrelas','nivel','edificios','bichos','nq','t']);
  allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
}
match /seguidores/{codigo} {
  allow create, update: if request.auth != null
    && codigo.matches('^[A-Z]{4}[0-9]{4}$')
    && request.resource.data.keys().hasOnly(['codigos'])
    && request.resource.data.codigos is list
    && request.resource.data.codigos.size() <= 100;
}
```
Nota: ainda assim qualquer autenticado pode escrever na lista `seguidores` de outro — é desenho do esquema atual. Redesenhar para `seguidores/{codigoAlvo}/lista/{uidSeguidor}` (cada um só escreve o seu documento) elimina o vetor; deixo como "Próxima versão".

### E1 — Service worker: não guardar qualquer navegação como `index.html`

```js
if (req.mode === 'navigate') {
  const u = new URL(req.url);
  const eRaiz = u.pathname === '/' || /\/(index(\.html)?)?$/.test(u.pathname);
  e.respondWith((async () => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(req, { signal: ctrl.signal });
      clearTimeout(t);
      if (r.ok && eRaiz) {
        const c = r.clone();
        e.waitUntil(caches.open(VERSAO).then(k => k.put('./index.html', c)));
      }
      return r;
    } catch {
      return (!eRaiz && await caches.match(req)) || await caches.match('./index.html');
    }
  })());
  return;
}
```
Corrigir também P3: `/\/(js\/voz_(extra_)?[fm]\.js|modelos\/|media\/|lib\/|fonts\/|icons\/)/`.

### E2 — Watchdog em `Jogo.responde` e `falaEmbutida` sempre a terminar

```js
// jogos.js — método auxiliar (usa o mecanismo de limpezas já existente)
dizSeguro(fala, cb, max = 7000) {
  let feito = false, w;
  const fim = () => { if (feito) return; feito = true; clearTimeout(w); cb && cb(); };
  w = setTimeout(fim, max);
  this.limpezas.push(() => { feito = true; clearTimeout(w); });
  this.ctx.voz.diz(fala, fim);
}
// em responde(): trocar this.diz(fala, ()=>{...}) por this.dizSeguro(fala, ()=>{...})

// som.js — falaEmbutida
if (!this.ctx) { aoFim && setTimeout(aoFim, 300); return false; }
// e, quando fica mudo a meio da descodificação: chamar aoFim em vez de só sair.
```
(Adaptar à assinatura real de `diz`; a ideia é: toda a fala acaba sempre em `aoFim`, no máximo ao fim de 7 s.)

### E3 — Não bloquear se os modelos 3D falharem

```js
// app.js
function soUm(q) {
  const todos = [avo, ava].filter(Boolean);
  if (!todos.length) { mostraAvisoModelos(); return; }   // aviso simples + botão "Tentar outra vez"
  const activo = q === 'ava' ? ava : avo;
  const alvo = activo || todos[0];
  todos.forEach(m => m.visivel(m === alvo));
}
// iniciar(): em caso de falha de import, guardar o erro e oferecer "Tentar outra vez"
// (import() de novo) em vez de seguir com avo/ava = null.
```

### E4 + U5 + S2 — Tempo de uso fiável e visível

```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden) atualizaTempoUso();          // fecha o intervalo antes de sair
  else Estado.inicioSessao = Date.now();            // não conta o tempo em segundo plano
});
// em atualizaTempoUso: cap de 300 → 60 s por tick
const delta = Math.max(0, Math.min(60, Math.round((agora - (Estado.inicioSessao || agora)) / 1000)));
// ... depois de somar:
const el = document.querySelector('#uso-hoje');
if (el) el.textContent = `${Math.floor(Estado.tempoHoje / 60)} min utilizados hoje`;
```
Para S2: chamar a verificação de limite também em "Ver a minha quinta" e `abreFilme` (extrair `limiteAtingido()` e usá-la em todos os pontos de entrada).

### S3 — Porta parental com bloqueio e pergunta nova a cada falha

```js
let falhasPorta = 0, bloqueadoAte = 0;
function novaPergunta() { const a = 6 + rnd(8), b = 6 + rnd(8); return { a, b, r: a * b }; }  // 36–169
function tentaPorta(resposta) {
  if (Date.now() < bloqueadoAte) return mostraMsg('Espera um pouco e tenta de novo.');
  if (+resposta === perguntaAtual.r) { falhasPorta = 0; return abrePais(); }
  if (++falhasPorta >= 3) { bloqueadoAte = Date.now() + 60_000; falhasPorta = 0; }
  perguntaAtual = novaPergunta(); desenhaPergunta();
}
```
(Nenhuma porta aritmética é segura contra uma criança curiosa de 8+; alternativa mais robusta: "mantém premido 3 s os dois cantos" ou escrever um número por extenso.)

### S4 — Apagar na nuvem de forma verificável

```js
// nuvem.js
async function apagaTudoNuvem(codigo) {
  if (!navigator.onLine) throw new Error('offline');
  await deleteDoc(doc(db, 'ranking', codigo));
  // limpar o código nas listas dos amigos (ou, após redesenho, apagar seguidores/{alvo}/lista/{uid})
  await deleteUser(auth.currentUser);           // remove o utilizador anónimo
}
// btn-apagar-perfil / btn-apagar-tudo / btn-sair-conta:
try { await apagaTudoNuvem(Estado.codigo); apagaLocal(); }
catch { mostraMsg('Sem ligação: não foi possível apagar na nuvem. Tenta quando estiveres online.'); }
```
Não apagar localmente antes de confirmar a nuvem (ou guardar um "pedido de apagar pendente" em `eab-apagados`).

### U1 — Contraste do botão principal

```css
.botao { background: linear-gradient(#A8631F, #8A4B12); color:#fff; } /* validar ≥4,5:1 com uma ferramenta antes de aprovar */
.mini.discreto { color:#5A3A1A; }                                      /* idem */
```

### U3 — Botão Voltar do Android

```js
history.replaceState({ec:'inicio'}, '');
function vai(ecra) { history.pushState({ec: ecra}, ''); mostra(ecra); }   // usar em vez de mostra() nas transições principais
addEventListener('popstate', e => {
  if (jogo && jogo.aCorrer) { jogo.para(); abreMapa(); return; }
  const ec = e.state && e.state.ec; if (ec) mostra(ec);
});
```

### P2 — Perda de contexto WebGL

```js
function protegeGL(canvas, renderer, loop) {
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); loop.pausa(); });
  canvas.addEventListener('webglcontextrestored', () => { renderer.resetState?.(); loop.retoma(); });
}
// aplicar em rig.js (#gl), quinta3d.js e animais3d.js. Em Three.js, texturas/geometrias são recriadas automaticamente;
// se não, recarregar a cena da quinta. Mostrar um botão "Atualizar" se a restauração falhar em 3 s.
```

### E9 — Rede de segurança global

```js
addEventListener('error', e => recuperaEcra('erro', e.message));
addEventListener('unhandledrejection', e => recuperaEcra('promessa', String(e.reason)));
function recuperaEcra() { try { jogo && jogo.para(); } catch {} /* voltar ao mapa + mensagem simples, sem jargão */ }
```

### E5 / E6 / E7 / D2 (pequenos, mas reais)

```js
// E5 tarefas.js contar: guarda
let ocupado = false;
btnCerto.onclick = () => { if (ocupado) return; ocupado = true; setTimeout(() => ocupado = false, 900); /* ... */ };
// E6 app.js saiDaHistoria
Som.defineVoz(Estado.companheiro === 'ava' ? 'f' : 'm'); soUm(Estado.companheiro);
// E7 som.js retoma
if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(()=>{});
// D2 jogos.js rondaMemoria — no ramo de par errado fora da margem:
this.erros++; this.errosRonda++;
```

---

## 6. Testes manuais antes da próxima versão

**Dispositivos mínimos:** 1 Android barato (≤3 GB RAM) · 1 iPhone/iPad com Safari · 1 tablet · 1 PC. **Browsers:** Chrome, Safari, Firefox.

1. **Instalação/offline:** instalar PWA; modo avião; abrir app → deve abrir o jogo, não a política. Abrir `privacidade` online, passar a offline, reabrir app.
2. **Atualização:** instalar v4.29.2, publicar v4.29.3, abrir com a app aberta → sem misturar ficheiros; verificar `?v=`.
3. **Rede lenta (3G simulado):** primeiro arranque; `btn-comecar` não deve deixar ecrã branco >15 s.
4. **Voz:** matar rede e `AudioContext`; jogar 10 rondas com mudo ligado e desligado; no mudo a ronda não pode saltar sozinha. Chamada recebida a meio (iOS): voltar e confirmar que há som.
5. **Modelos 3D:** bloquear `modelos/avo.js` nas DevTools → a app não pode bloquear em "escolher".
6. **Perda de contexto:** em Chrome `about:gpu`/extensão WEBGL_lose_context → `loseContext()` em cada um dos 3 canvases; recupera?
7. **Android Voltar:** a meio de uma ronda, no mapa, na quinta, na área dos pais.
8. **Limite diário:** limite 15 min; minimizar a app 10 min → não deve contar; atingir o limite → tentar "Ver a minha quinta" e filmes; verificar `#uso-hoje`.
9. **Porta parental:** 3 erros → bloqueio; reabrir fora de jogo → o jogo parou? (`jogo.para()`).
10. **Dados da nuvem (ambiente de teste Firebase):** escrever `ranking/TEST0001` com `nome:123`, `estrelas:"<img onerror=alert(1)>"` → app não pode rebentar nem executar. `seguidores/<código>` com 101 códigos → rejeitado.
11. **Apagar:** ativar nuvem, criar ranking, apagar perfil/tudo/sair → conferir na consola Firebase que `ranking`, `seguidores` e utilizador anónimo desapareceram; repetir offline.
12. **Contraste/daltonismo:** simulador de protanopia nos jogos Lógica/Pintar/Cores; auditoria Lighthouse/axe do contraste.
13. **Zoom:** pinça no ecrã dos pais (depois de remover `user-scalable=no`).
14. **Contar (home games):** duplo toque rápido no botão correto → só 1 estrela.
15. **Contagem falada:** contar 1–12 com avô e avó; verificar género e que não há voz do sistema.
16. **Memória:** errar 4 pares → estrelas devem baixar.
17. **Desempenho:** 10 min em Android fraco com `chrome://inspect` (FPS, memória, `renderer.info.render.calls` na quinta); ver se há "ecrã azul".
18. **Armazenamento:** encher o localStorage → app deve avisar, não falhar em silêncio. Corromper `eab` à mão → app não pode apagar o progresso.
19. **Rotação** no desenho livre; **multi-toque** (criança bate com a mão toda) nas rondas de arrastar e escolher.
20. **Com crianças (obrigatório):** 3 crianças × 10 min cada (3, 4, 5 anos), sem ajuda: registar onde se perdem, quando abandonam e se percebem as instruções faladas.

---

## 7. Pontos que não considero problema (para não os repetires)

`prefers-reduced-motion` já tratado globalmente; `confete` (16 nós, removidos em 1,1 s) é leve; `historias.js` tem watchdog de 7 s e limpeza correta; instalação em duas fases do SW está bem; `precarrega` já atrasado 4 s. Nenhum segredo encontrado em `js/` ou `ferramentas/` (a chave web do Firebase é pública por desenho).
