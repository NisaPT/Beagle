# Contas dos pais e cópia na cloud (Firebase)

O código já está no jogo. Falta criar o projeto no Firebase e colar a configuração em `js/firebase-config.js`. Demora cerca de 10 minutos e é gratuito (plano Spark).

## 1. Criar o projeto
1. Abra https://console.firebase.google.com com a conta Google que vai gerir o jogo.
2. **Criar um projeto** (ou "Add project"), nome `escola-avos-beagle`. Pode desativar o Google Analytics.

## 2. Ativar o login
1. **Build → Authentication → Get started**.
2. Separador **Sign-in method**: ativar **apenas Anonymous (Anónimo)**. Não ative Google nem Email/Password: o jogo para crianças não usa contas.
3. Separador **Settings → Authorized domains → Add domain**: acrescente o endereço do jogo na Vercel (por exemplo `escolabeagle.vercel.app`) e, mais tarde, o domínio próprio. `localhost` já vem incluído.

## 3. Criar a base de dados
1. **Build → Firestore Database → Create database**.
2. Modo **Production**. Região **eur3 (europe-west)** (mais perto de Portugal).
3. Separador **Rules**: apague o conteúdo e cole isto, depois **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ranking/{codigo} {
      allow get: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow update: if request.auth != null && resource.data.uid == request.auth.uid
                    && request.resource.data.uid == request.auth.uid;
      allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
    }
    match /seguidores/{codigo} {
      allow get: if request.auth != null;
      allow create, update: if request.auth != null
                            && request.resource.data.keys().hasOnly(['codigos'])
                            && request.resource.data.codigos.size() <= 100;
    }
  }
}
```

Só se pode ler um código que se conhece (não há listagem). O progresso completo já não vai para a cloud. A partilha só funciona depois de os pais a ligarem na Área dos Pais.

## 4. Obter a configuração
1. **Project settings** (roda dentada) → **Your apps** → ícone **</>** (Web).
2. Nome da app: `Escola dos Avós Beagle`. Não ative o Firebase Hosting.
3. Copie o objeto `firebaseConfig` que aparece.
4. Cole-o em `js/firebase-config.js`, no lugar de `null`:

```js
export const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "o-seu-projeto.firebaseapp.com",
  projectId: "o-seu-projeto",
  storageBucket: "o-seu-projeto.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

Estes valores **não são segredos**. Quem protege os dados são as regras do passo 3.

## 5. Publicar
```
git add .
git commit -m "Contas na cloud"
git push
```

## Como funciona
- O jogo continua a guardar tudo no aparelho e funciona sem internet nem conta.
- Na **Área dos Pais → Conta e cópia na cloud**, os pais entram com Google ou email. A partir daí, cada vez que a criança progride, o progresso é copiado para a cloud.
- Noutro telemóvel ou tablet, basta entrar com a mesma conta: o progresso aparece.
- Nunca se perde progresso: ao juntar dois aparelhos fica o nível mais alto e as melhores estrelas de cada um.
- Guardamos só: nível, estrelas, estatísticas de acerto, idade e a alcunha escolhida. Nada de fotos, mensagens ou dados da criança além disso.

## Para a Play Store
- Preencha a **Segurança dos dados** a indicar: email (conta dos pais) e progresso de jogo, recolhidos para guardar o progresso, não partilhados com terceiros.
- É necessária uma **política de privacidade** pública. Posso redigi-la.
- O login com Google dentro da app Android (Capacitor) precisa de um plugin nativo; o login por email funciona como está.
