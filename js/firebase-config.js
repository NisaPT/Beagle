/* Configuração do Firebase (contas e cópia na cloud).
   Enquanto isto estiver a null, o jogo funciona só neste aparelho e a Área dos
   Pais mostra "contas ainda não ativadas".

   Como preencher: ver NUVEM-FIREBASE.md. Cole aqui o objeto firebaseConfig da
   consola do Firebase (Definições do projeto > As suas apps > Configuração).
   Estes valores NÃO são segredos: a segurança está nas regras do Firestore. */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBC_B3F0PYZyM-9-EgLt2qpZ733clAqlEY",
  authDomain: "avos-beagle.firebaseapp.com",
  projectId: "avos-beagle",
  storageBucket: "avos-beagle.firebasestorage.app",
  messagingSenderId: "450847649767",
  appId: "1:450847649767:web:fbb52fda14a8e776fb1742"
};
/* exemplo:
export const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "o-seu-projeto.firebaseapp.com",
  projectId: "o-seu-projeto",
  storageBucket: "o-seu-projeto.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
*/
