# Partilha com amigos (Firebase) — configuração (v4.30)

O jogo funciona sem internet e sem cloud. A cloud só existe para a função **Amigos** (ver a quinta e o nível uns dos outros) e só se liga na Área dos Pais, com autorização de um adulto.

## O que vai para a cloud (e o que nunca vai)
| Coleção | Conteúdo | Quem lê |
|---|---|---|
| `codigos/{código}` | `uid`, `expira` | qualquer sessão anónima, **um documento de cada vez** (para juntar um amigo) |
| `perfis/{código}` | `uid`, `nivel`, `itens` (ids→quantidade), `consent`, `expira`, `t` | o dono e os leitores autorizados por ele |
| `ver/{códigoDono}_{uidLeitor}` | quem autorizou quem | dono e leitor |

**Nunca** há nome, alcunha escrita, idade, estrelas, fotografias, mensagens, localização nem email. Não há ranking: o amigo aparece como “Coelhinho 42”, calculado a partir do código.

**Como se tornam amigos:** cada pai/mãe junta o código do outro na Área dos Pais. A autorização do dono (`ver/…`) é criada quando *ele* junta o código do outro; só então o outro pode ler o seu perfil. É sempre bilateral e nunca há pesquisa nem lista pública.

## Passos na consola do Firebase (projeto `avos-beagle`)
1. **Authentication → Sign-in method:** ativar só **Anónimo**. Desativar tudo o resto.
2. **Firestore → Regras:** colar o conteúdo de `firestore.rules` e publicar. (Estas regras substituem as antigas `ranking` e `seguidores`.)
3. **Apagar as coleções antigas** `ranking` e `seguidores` (Firestore → Dados → ⋮ → Eliminar coleção). Contêm dados da versão anterior, incluindo nomes escritos.
4. **Políticas TTL (apagamento automático):** Firestore → Índices → *Time-to-live* → criar uma política para cada grupo de coleções, campo `expira`: `perfis`, `codigos` e `ver`. Sem isto, a promessa de “180 dias” da Política de Privacidade não se cumpre.
5. **Localização da base de dados:** confirme que está na UE (ex.: `eur3` ou `europe-west1`) e escreva-a na Política de Privacidade. A localização não se pode mudar depois de criada.
6. **Restringir a chave de API** (Google Cloud Console → Credenciais): restrição por *HTTP referrer* ao domínio onde o jogo está alojado (Vercel) e limitar as APIs a Identity Toolkit e Firestore.
7. **Orçamento e alertas** (Google Cloud → Faturação): defina um limite e alertas de custos.
8. Opcional, recomendado antes de lançar à escala: **App Check** e limpeza automática de contas anónimas (requer Identity Platform).

## Testar as regras (antes de publicar)
Em `testes-regras/` há testes para o emulador do Firestore (`npm i; npx firebase emulators:exec --only firestore "node teste.mjs"`). **Não foram executados no ambiente onde foram escritos** — corra-os antes de publicar, ou use o “Rules Playground” da consola.

## Apagar
- A app apaga na cloud: perfil, código, autorizações e a própria identidade anónima (`Nuvem.apagaPendentes`). Se estiver sem internet, o pedido fica guardado (`eab-apagar-pendente`) e repete-se sozinho.
- Quem perdeu o aparelho: os dados caducam por TTL ao fim de 180 dias.

## Limitações conhecidas
- Código aleatório de 12 caracteres (31¹²): não é adivinhável, mas quem recebe o código de um pai pode juntá-lo; a autorização só vale quando o dono também junta o código do outro.
- Sem App Check, um script externo com a chave pública pode criar sessões anónimas e documentos (limitados por regras a campos validados). Ver ponto 8.
