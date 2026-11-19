/* Testes das regras do Firestore (NÃO executados onde foram escritos).
   Correr: cd testes-regras && npm i @firebase/rules-unit-testing firebase
           npx firebase emulators:exec --only firestore "node teste.mjs"   (a partir da raiz do projeto, com firebase.json a apontar para firestore.rules) */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

const A = 'ABCD-EFGH-JKMN', B = 'PQRS-TUVW-XYZ2';
const env = await initializeTestEnvironment({ projectId: 'teste', firestore: { rules: fs.readFileSync('../firestore.rules', 'utf8') } });
const ana = env.authenticatedContext('uidAna').firestore();
const rui = env.authenticatedContext('uidRui').firestore();
const mau = env.authenticatedContext('uidMau').firestore();
const anon = env.unauthenticatedContext().firestore();
const exp = new Date(Date.now() + 864e5);
const perfil = (uid, extra = {}) => ({ uid, nivel: 3, itens: { casa: 1 }, consent: 1, expira: exp, t: Date.now(), ...extra });
let falhas = 0;
const t = async (nome, p) => { try { await p; console.log('ok  :', nome); } catch (e) { falhas++; console.log('FALHA:', nome, String(e).slice(0, 120)); } };

await t('Ana cria o seu código', assertSucceeds(setDoc(doc(ana, 'codigos', A), { uid: 'uidAna', expira: exp })));
await t('Rui cria o seu código', assertSucceeds(setDoc(doc(rui, 'codigos', B), { uid: 'uidRui', expira: exp })));
await t('Mau não pode apanhar o código da Ana', assertFails(setDoc(doc(mau, 'codigos', A), { uid: 'uidMau', expira: exp })));
await t('Código mal formado rejeitado', assertFails(setDoc(doc(ana, 'codigos', 'ABCD-1234'), { uid: 'uidAna', expira: exp })));
await t('Ana publica o perfil', assertSucceeds(setDoc(doc(ana, 'perfis', A), perfil('uidAna'))));
await t('Perfil com texto livre rejeitado', assertFails(setDoc(doc(ana, 'perfis', A), perfil('uidAna', { nome: 'Maria' }))));
await t('Perfil com nível absurdo rejeitado', assertFails(setDoc(doc(ana, 'perfis', A), perfil('uidAna', { nivel: 9999 }))));
await t('Perfil com uid de outro rejeitado', assertFails(setDoc(doc(ana, 'perfis', A), perfil('uidRui'))));
await t('Sem sessão não lê nada', assertFails(getDoc(doc(anon, 'perfis', A))));
await t('Rui NÃO lê o perfil da Ana sem autorização', assertFails(getDoc(doc(rui, 'perfis', A))));
await t('Ana autoriza o Rui', assertSucceeds(setDoc(doc(ana, 'ver', `${A}_uidRui`), { donoCodigo: A, donoUid: 'uidAna', leitorUid: 'uidRui', expira: exp })));
await t('Rui lê o perfil da Ana', assertSucceeds(getDoc(doc(rui, 'perfis', A))));
await t('Mau continua sem ler', assertFails(getDoc(doc(mau, 'perfis', A))));
await t('Mau não cria autorizações em nome da Ana', assertFails(setDoc(doc(mau, 'ver', `${A}_uidMau`), { donoCodigo: A, donoUid: 'uidMau', leitorUid: 'uidMau', expira: exp })));
await t('Mau não cria autorizações com o código e uid da Ana', assertFails(setDoc(doc(mau, 'ver', `${A}_uidRui`), { donoCodigo: A, donoUid: 'uidAna', leitorUid: 'uidRui', expira: exp })));
await t('Rui não pode escrever no perfil da Ana', assertFails(setDoc(doc(rui, 'perfis', A), perfil('uidRui'))));
await t('Rui (leitor) pode retirar a autorização', assertSucceeds(deleteDoc(doc(rui, 'ver', `${A}_uidRui`))));
await t('Rui deixa de ler', assertFails(getDoc(doc(rui, 'perfis', A))));
await t('Mau não lista coleções antigas (ranking)', assertFails(getDoc(doc(mau, 'ranking', A))));
await t('Mau não apaga o perfil da Ana', assertFails(deleteDoc(doc(mau, 'perfis', A))));
await t('Ana apaga o seu perfil e código', assertSucceeds(Promise.all([deleteDoc(doc(ana, 'perfis', A)), deleteDoc(doc(ana, 'codigos', A))])));
console.log(falhas ? `\n${falhas} FALHAS` : '\nTODOS OS TESTES PASSARAM');
await env.cleanup(); process.exit(falhas ? 1 : 0);
