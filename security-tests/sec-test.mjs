// Batería de pruebas de seguridad contra las reglas de Firestore (proyecto real).
// SOLO usa cuentas y datos desechables (prefijo sec.*), que se eliminan al terminar.
import fs from 'fs';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where, limit,
} from 'firebase/firestore';

const env = fs.readFileSync('.env.local', 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.+)$', 'm')) || [])[1]?.trim().replace(/^"|"$/g, '');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: get('FIREBASE_PROJECT_ID'),
    clientEmail: get('FIREBASE_CLIENT_EMAIL'),
    privateKey: get('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  }),
});
const adb = admin.firestore();
const aauth = admin.auth();
const PASS = 'TestPass1234';
const cfg = {
  apiKey: get('NEXT_PUBLIC_FB_API_KEY'), authDomain: get('NEXT_PUBLIC_FB_AUTH_DOMAIN'),
  projectId: get('NEXT_PUBLIC_FB_PROJECT_ID'), appId: get('NEXT_PUBLIC_FB_APP_ID'),
};
const EMAILS = ['sec.reca', 'sec.recb', 'sec.cand1', 'sec.cand2', 'sec.fresh', 'sec.susp', 'sec.admin'].map((s) => `${s}@example.com`);

async function login(email, name) {
  const app = initializeApp(cfg, name);
  const cred = await signInWithEmailAndPassword(getAuth(app), email, PASS);
  return { uid: cred.user.uid, db: getFirestore(app) };
}

const orig = {}; // documentos de usuario originales para restaurar tras cada ataque
const docs = [];
async function mkUser(email, role, extra = {}) {
  let u;
  try { u = await aauth.getUserByEmail(email); await aauth.updateUser(u.uid, { password: PASS }); }
  catch { u = await aauth.createUser({ email, password: PASS, displayName: email }); }
  orig[u.uid] = { id: u.uid, email, fullName: email, role, status: 'active', ...extra };
  await adb.doc(`users/${u.uid}`).set(orig[u.uid]);
  return u.uid;
}
async function resetUsers() { for (const [uid, d] of Object.entries(orig)) await adb.doc(`users/${uid}`).set(d); }

const results = [];
const isDenied = (e) => /permission|insufficient|PERMISSION/i.test(String(e?.message) + e?.code);
async function deny(name, fn) {
  try { await fn(); results.push({ name, ok: false, note: 'PERMITIDO (vulnerable)' }); }
  catch (e) { results.push({ name, ok: isDenied(e), note: isDenied(e) ? 'denegado' : 'error inesperado: ' + e?.message }); }
  await resetUsers();
}
async function allow(name, fn) {
  try { await fn(); results.push({ name, ok: true, note: 'permitido' }); }
  catch (e) { results.push({ name, ok: false, note: 'BLOQUEADO indebidamente: ' + (e?.code || e?.message) }); }
}

async function cleanup() {
  for (const p of docs) { try { await adb.doc(p).delete(); } catch {} }
  for (const email of EMAILS) {
    try { const u = await aauth.getUserByEmail(email); await aauth.deleteUser(u.uid); await adb.doc(`users/${u.uid}`).delete(); await adb.doc(`candidates/${u.uid}`).delete(); } catch {}
  }
}

try {
  await cleanup();
  const orgA = await adb.collection('organizations').add({ name: 'SEC Org A' }); docs.push(orgA.path);
  const orgB = await adb.collection('organizations').add({ name: 'SEC Org B' }); docs.push(orgB.path);
  const recAUid = await mkUser('sec.reca@example.com', 'recruiter', { organizationRef: orgA.id });
  const recBUid = await mkUser('sec.recb@example.com', 'recruiter', { organizationRef: orgB.id });
  const cand1Uid = await mkUser('sec.cand1@example.com', 'candidate');
  const cand2Uid = await mkUser('sec.cand2@example.com', 'candidate');
  const suspUid = await mkUser('sec.susp@example.com', 'candidate', { status: 'suspended' });
  const adminUid = await mkUser('sec.admin@example.com', 'admin');
  const freshAuth = await aauth.createUser({ email: 'sec.fresh@example.com', password: PASS });
  await adb.doc(`candidates/${cand1Uid}`).set({ userRef: cand1Uid, headline: 'Dev', location: 'MX', yearsOfExperience: 2, available: true, skills: [] });
  const jobBase = { organizationRef: orgA.id, descriptionMd: 'x'.repeat(60), searchTags: ['a'], seniority: 'junior', location: 'x', remoteAllowed: false, contractType: 'Full-time' };
  const job = await adb.collection('jobs').add({ ...jobBase, title: 'SEC Job', status: 'published' }); docs.push(job.path);
  const draft = await adb.collection('jobs').add({ ...jobBase, title: 'SEC Draft', status: 'draft' }); docs.push(draft.path);
  // postulación legítima existente de cand1 para probar lectura cruzada
  await adb.doc(`jobs/${job.id}/applications/${cand1Uid}`).set({ candidateRef: cand1Uid, jobRef: job.id, status: 'applied' });
  await adb.doc(`users/${cand1Uid}/applications/${job.id}`).set({ candidateRef: cand1Uid, jobRef: job.id, status: 'applied' });

  const A = await login('sec.reca@example.com', 'recA');
  const B = await login('sec.recb@example.com', 'recB');
  const C1 = await login('sec.cand1@example.com', 'cand1');
  const C2 = await login('sec.cand2@example.com', 'cand2');
  const AD = await login('sec.admin@example.com', 'adm');
  const F = await login('sec.fresh@example.com', 'fresh');
  const S = await login('sec.susp@example.com', 'susp');

  // ---- controles positivos (no deben bloquearse) ----
  await allow('CTRL candidato lee su propio perfil', () => getDoc(doc(C1.db, 'users', C1.uid)));
  await allow('CTRL candidato edita su perfil profesional', () => setDoc(doc(C1.db, 'candidates', C1.uid), { headline: 'Dev Senior', skills: [{ name: 'React', level: 3, years: 2, source: 'manual' }] }, { merge: true }));
  await allow('CTRL candidato actualiza su nombre en users', () => updateDoc(doc(C1.db, 'users', C1.uid), { fullName: 'Nuevo Nombre' }));
  await allow('CTRL candidato lista vacantes publicadas', () => getDocs(query(collection(C1.db, 'jobs'), where('status', '==', 'published'), limit(5))));
  await allow('CTRL candidato lee vacante publicada', () => getDoc(doc(C1.db, 'jobs', job.id)));
  await allow('CTRL candidato postula correctamente', () => setDoc(doc(C2.db, 'jobs', job.id, 'applications', C2.uid), { candidateRef: C2.uid, jobRef: job.id, status: 'applied', source: 'recommendation', cvRef: '', appliedAt: new Date(), updatedAt: new Date() }));
  await allow('CTRL reclutador A lee postulantes de su vacante', () => getDocs(collection(A.db, 'jobs', job.id, 'applications')));
  await allow('CTRL reclutador A lista sus vacantes (incluye borradores)', () => getDocs(query(collection(A.db, 'jobs'), where('organizationRef', '==', orgA.id))));
  await allow('CTRL reclutador A edita su vacante', () => updateDoc(doc(A.db, 'jobs', job.id), { title: 'SEC Job editada' }));
  await allow('CTRL reclutador A edita su organización', () => updateDoc(doc(A.db, 'organizations', orgA.id), { name: 'SEC Org A v2' }));
  await allow('CTRL reclutador A cambia estado de postulación', () => updateDoc(doc(A.db, 'jobs', job.id, 'applications', cand1Uid), { status: 'screening', shortlisted: true }));
  await allow('CTRL admin lista usuarios', () => getDocs(query(collection(AD.db, 'users'), limit(2))));
  await allow('CTRL admin cambia rol de un usuario', () => updateDoc(doc(AD.db, 'users', cand2Uid), { role: 'recruiter' }));
  await resetUsers();

  // ---- escalada de privilegios ----
  await deny('S01 candidato se auto-asigna rol admin', () => updateDoc(doc(C1.db, 'users', C1.uid), { role: 'admin' }));
  await deny('S02 candidato se une a la organización A (organizationRef)', () => updateDoc(doc(C1.db, 'users', C1.uid), { organizationRef: orgA.id }));
  await deny('S03 reclutador B se cambia a la organización A', () => updateDoc(doc(B.db, 'users', B.uid), { organizationRef: orgA.id }));
  await deny('S04 registro nuevo con rol admin', () => setDoc(doc(F.db, 'users', F.uid), { id: F.uid, email: 'sec.fresh@example.com', fullName: 'x', role: 'admin', status: 'active' }));
  await deny('S05 registro nuevo como reclutador de la org A', () => setDoc(doc(F.db, 'users', F.uid), { id: F.uid, email: 'sec.fresh@example.com', fullName: 'x', role: 'recruiter', status: 'active', organizationRef: orgA.id }));
  await adb.doc(`users/${F.uid}`).delete();
  await deny('S06 usuario cambia su propio email en users', () => updateDoc(doc(C1.db, 'users', C1.uid), { email: 'otro@x.com' }));
  await deny('S06b usuario se marca a sí mismo como suspendido/activo arbitrario', () => updateDoc(doc(C1.db, 'users', C1.uid), { status: 'banned' }));

  // ---- suspensión ----
  await deny('S07 usuario suspendido se reactiva solo', () => updateDoc(doc(S.db, 'users', S.uid), { status: 'active' }));
  await deny('S08 usuario suspendido escribe su perfil de candidato', () => setDoc(doc(S.db, 'candidates', S.uid), { headline: 'sigo activo' }, { merge: true }));

  // ---- aislamiento entre organizaciones ----
  await deny('S09 reclutador B edita vacante de A', () => updateDoc(doc(B.db, 'jobs', job.id), { title: 'hackeado' }));
  await deny('S10 reclutador B borra vacante de A', () => deleteDoc(doc(B.db, 'jobs', job.id)));
  await deny('S11 reclutador B lee postulantes de A', () => getDocs(collection(B.db, 'jobs', job.id, 'applications')));
  await deny('S12 reclutador B lee entrevistas de A', () => getDocs(query(collection(B.db, 'interviews'), where('jobRef', '==', job.id))));
  await deny('S13 reclutador B lee recomendaciones de A', () => getDocs(query(collection(B.db, 'recommendations'), where('jobRef', '==', job.id))));
  await deny('S14 reclutador B edita organización de A', () => updateDoc(doc(B.db, 'organizations', orgA.id), { name: 'hackeada' }));
  await deny('S15 reclutador A edita organización de B', () => updateDoc(doc(A.db, 'organizations', orgB.id), { name: 'hackeada' }));
  await deny('S16 reclutador B crea vacante a nombre de la org A', () => addDoc(collection(B.db, 'jobs'), { ...jobBase, title: 'falsa', status: 'published' }));
  await deny('S16b reclutador B cambia la vacante de A a su propia organización (robo)', () => updateDoc(doc(B.db, 'jobs', job.id), { organizationRef: orgB.id }));

  // ---- permisos por rol ----
  await deny('S17 candidato crea vacante', () => addDoc(collection(C1.db, 'jobs'), { ...jobBase, title: 'x', status: 'published' }));
  await deny('S18 candidato borra vacante', () => deleteDoc(doc(C1.db, 'jobs', job.id)));
  await deny('S19 candidato agenda entrevista', () => addDoc(collection(C1.db, 'interviews'), { organizationRef: orgA.id, candidateRef: C1.uid, jobRef: job.id }));
  await deny('S20 candidato lista todos los usuarios', () => getDocs(collection(C1.db, 'users')));
  await deny('S21 reclutador lista todos los usuarios', () => getDocs(collection(A.db, 'users')));
  await deny('S22 candidato lee auditLogs', () => getDocs(collection(C1.db, 'auditLogs')));
  await deny('S23 reclutador lee auditLogs', () => getDocs(collection(A.db, 'auditLogs')));
  await deny('S24 candidato escribe en auditLogs', () => addDoc(collection(C1.db, 'auditLogs'), { action: 'x' }));
  await deny('S25 candidato lee vacante en borrador', () => getDoc(doc(C1.db, 'jobs', draft.id)));
  await deny('S26 candidato lista borradores', () => getDocs(query(collection(C1.db, 'jobs'), where('status', '==', 'draft'))));
  await deny('S26b candidato borra organización', () => deleteDoc(doc(C1.db, 'organizations', orgA.id)));

  // ---- datos ajenos ----
  await deny('S27 candidato 2 edita el perfil del candidato 1', () => setDoc(doc(C2.db, 'candidates', C1.uid), { headline: 'hackeado' }, { merge: true }));
  await deny('S28 candidato 2 lee las postulaciones de candidato 1', () => getDocs(collection(C2.db, 'users', C1.uid, 'applications')));
  await deny('S29 candidato 2 lee notificaciones de candidato 1', () => getDocs(collection(C2.db, 'users', C1.uid, 'notifications')));
  await deny('S30 candidato se crea una notificación', () => addDoc(collection(C1.db, 'users', C1.uid, 'notifications'), { title: 'falsa', read: false }));
  await deny('S31 candidato 2 lee el documento de usuario de candidato 1', () => getDoc(doc(C2.db, 'users', C1.uid)));
  await deny('S32 candidato 2 lee recomendaciones de candidato 1', () => getDocs(query(collection(C2.db, 'recommendations'), where('candidateRef', '==', C1.uid))));
  await deny('S32b candidato lee la postulación de otro candidato en la vacante', () => getDoc(doc(C2.db, 'jobs', job.id, 'applications', C1.uid)));

  // ---- integridad de postulaciones y matches ----
  await adb.doc(`jobs/${job.id}/applications/${C2.uid}`).delete();
  await deny('S33 candidato crea postulación con estado "hired"', () => setDoc(doc(C2.db, 'jobs', job.id, 'applications', C2.uid), { candidateRef: C2.uid, jobRef: job.id, status: 'hired', source: 'x', cvRef: '' }));
  await deny('S33b candidato suspendido intenta postularse', () => setDoc(doc(S.db, 'jobs', job.id, 'applications', S.uid), { candidateRef: S.uid, jobRef: job.id, status: 'applied', source: 'x', cvRef: '' }));
  await deny('S33c candidato postula a una vacante cerrada/borrador', () => setDoc(doc(C2.db, 'jobs', draft.id, 'applications', C2.uid), { candidateRef: C2.uid, jobRef: draft.id, status: 'applied', source: 'x', cvRef: '' }));
  await deny('S34 candidato crea postulación a nombre de otro', () => setDoc(doc(C2.db, 'jobs', job.id, 'applications', C1.uid), { candidateRef: C1.uid, jobRef: job.id, status: 'applied', source: 'x', cvRef: '' }));
  await deny('S35 candidato crea espejo con estado "hired"', () => setDoc(doc(C2.db, 'users', C2.uid, 'applications', job.id), { candidateRef: C2.uid, jobRef: job.id, status: 'hired' }));
  await deny('S36 candidato escribe una recomendación', () => setDoc(doc(C1.db, 'recommendations', `${C1.uid}_${job.id}`), { candidateRef: C1.uid, jobRef: job.id, score: 1, status: 'accepted' }));
  await deny('S37 candidato modifica campos de una notificación', async () => {
    const n = await adb.collection('users').doc(C1.uid).collection('notifications').add({ title: 't', read: false });
    await updateDoc(doc(C1.db, 'users', C1.uid, 'notifications', n.id), { title: 'cambiada' });
  });
  await deny('S37b candidato se cambia su propio estado de postulación', () => updateDoc(doc(C1.db, 'jobs', job.id, 'applications', C1.uid), { status: 'offer' }));

  // ---- validación de tamaño ----
  await deny('S38 candidato guarda perfil de 500 KB (DoS/costo)', () => setDoc(doc(C1.db, 'candidates', C1.uid), { headline: 'x'.repeat(500000) }, { merge: true }));
  await deny('S39 reclutador crea vacante con descripción de 500 KB', () => addDoc(collection(A.db, 'jobs'), { ...jobBase, title: 'grande', status: 'published', descriptionMd: 'x'.repeat(500000) }));
} catch (e) {
  console.error('ERROR DE PREPARACIÓN:', e);
} finally {
  await cleanup();
  const bad = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.name} -> ${r.note}`);
  console.log(`\n${results.length - bad.length}/${results.length} correctas, ${bad.length} vulnerabilidades/fallos`);
  process.exit(0);
}
