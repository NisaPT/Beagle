# Publicar na Google Play — lista de verificação (jogo para crianças, v4.30)

> Verificado a 19/11/2026 nas páginas oficiais da Google Play; as políticas mudam — reveja antes de submeter. Isto não é aconselhamento jurídico.

## A. Antes de empacotar (ficheiros do projeto)
- [ ] `privacidade.html`: preencher responsável, NIF, morada, email e região do Firestore; retirar a caixa de rascunho.
- [ ] `apagar-dados.html`: preencher o email.
- [ ] Firebase: seguir `NUVEM-FIREBASE.md` (regras, TTL, apagar coleções antigas, restringir a chave).
- [ ] Correr `testes-regras/teste.mjs` no emulador do Firestore.
- [ ] Testes manuais do relatório `analise-v4.29.2.md` + os de Amigos (secção abaixo).

## B. App Android
- [ ] Empacotar a PWA (TWA com Bubblewrap, ou Capacitor). Alvo: **Android 16 (API 36)** — exigido para novas apps e atualizações desde 31/08/2026.
- [ ] Digital Asset Links (`/.well-known/assetlinks.json`) para o TWA abrir sem barra de endereço.
- [ ] Assinatura pelo Play App Signing. Fazer o `VERSAO` do `sw.js` e o `?v=` do `index.html` coincidirem (ambos 4.30.0 agora).
- [ ] Não pedir permissões desnecessárias (o jogo não precisa de nenhuma).

## C. Play Console
- [ ] **Público-alvo e conteúdo:** só “5 anos ou menos” (a política diz que apps para bebés/pré-escolar devem selecionar apenas este grupo). Não marcar grupos mistos.
- [ ] **Anúncios:** “não tem anúncios”. **Compras na app:** não.
- [ ] **Classificação de conteúdo (IARC):** responder com verdade (sem violência, sem chat; há partilha limitada com amigos autorizados, sem texto livre).
- [ ] **Política de Privacidade:** URL público de `privacidade.html`.
- [ ] **Segurança dos dados (Data safety):** declarar, para a partilha opcional: identificadores (código de família e ID anónimo) e atividade na app (nível, itens da quinta); recolha **opcional**; cifrada em trânsito; **o utilizador pode pedir apagamento** (na app e por email). Confirmar as categorias exatas no formulário. Não há partilha com terceiros além do subcontratante.
- [ ] **Eliminação de dados:** indicar o caminho na app e o URL de `apagar-dados.html`.
- [ ] **Países:** recomendado iniciar só em Portugal/EEE (a política de privacidade tem a secção 11 para os restantes; nos EUA o COPPA exige consentimento parental verificável, que esta versão não implementa).
- [ ] Verificar se o Firebase (Auth/Firestore) está aceite para serviços dirigidos a crianças nos termos da Google (política Families: SDKs/APIs aprovados) — **a confirmar**; na versão TWA o código do Firebase corre no conteúdo web e não como SDK Android, mas a Google decide a interpretação.
- [ ] **Testes:** contas novas de programador podem ter de fazer um teste fechado com testadores durante um período mínimo antes da produção — confirmar o requisito atual na consola.
- [ ] **Verificação do programador** (identidade/morada) conforme os avisos da Play Console.

## D. Funcionalidades sociais — requisitos da Families Policy e como esta versão os cumpre
| Requisito | Estado |
|---|---|
| Adulto pode gerir (ligar/desligar) funções sociais | ✅ Área dos Pais: ligar, juntar, remover amigos, desligar e apagar |
| Ação de adulto antes de trocar informação pessoal | ⚠️ Cálculo 6×6–14×14 com bloqueio + caixa de consentimento + confirmação. Reforço recomendado: PIN ou verificação por email do responsável (não implementado) |
| Lembrete de segurança online | ✅ Ecrã Amigos: “Só vemos as quintas de amigos que o pai e a mãe conhecem…” |
| Sem chat com desconhecidos / sem texto livre | ✅ Sem chat, sem mensagens, sem nomes escritos |
| Política de privacidade fiel | ✅ rascunho completo — falta preencher |
| Não recolher IDs do aparelho/publicidade | ✅ (não há) |

## E. Testes manuais de Amigos (dois aparelhos, duas famílias)
1. Aparelho 1 e 2, partilha desligada: nada na rede (DevTools → Network sem pedidos a firestore/identitytoolkit).
2. Ligar a partilha no 1 sem marcar a caixa → recusa; marcando → pede confirmação.
3. Pai 1 junta o código do 2 → estado “À espera”; criança 1 NÃO vê o amigo; criança 2 NÃO vê a criança 1.
4. Pai 2 junta o código do 1 → ambas as crianças veem-se (lista Amigos + quinta + nível).
5. Pai 1 remove o amigo → a criança 2 deixa de ver a criança 1 (esperar um refresh).
6. Código inválido, código próprio, código inexistente, 13.º amigo → mensagens corretas.
7. “Desligar e apagar”: verificar na consola que `perfis`, `codigos`, `ver` e o utilizador anónimo desapareceram; repetir com o aparelho offline (fica pendente) e depois online.
8. Apagar perfil/todos os dados com a partilha ligada → mesmo resultado na consola.
9. Corromper o documento `perfis/…` à mão (itens com HTML, nível 9999) → a app não rebenta e não mostra HTML.
10. Sem as regras publicadas → mensagem “Falta publicar as regras”, sem ciclo de códigos novos.
