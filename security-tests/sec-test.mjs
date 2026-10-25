// Batería de pruebas de seguridad contra las reglas de Firestore (proyecto real).
// SOLO usa cuentas y datos desechables (prefijo sec.*), que se eliminan al terminar.
import fs from 'fs';
import { initializeApp as initAdmin, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where, limit,
} from 'firebase/firestore';

import { loadEnv } from './env.mjs';
const { get } = loadEnv();
initAdmin({
  credential: cert({
    projectId: get('FIREBASE_PROJECT_ID'),
    clientEmail: get('FIREBASE_CLIENT_EMAIL'),
    privateKey: get('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  }),
});
const adb = getAdminFirestore();
const aauth = getAdminAuth();
const PASS = 'TestPass1234';
const cfg = {
  apiKey: get('NEXT_PUBLIC_FB_API_KEY'), authDomain: get('NEXT_PUBLIC_FB_AUTH_DOMAIN'),
  projectId: get('NEXT_PUBLIC_FB_PROJECT_ID'), appId: get('NEXT_PUBLIC_FB_APP_ID'),
};
const EMAILS = ['sec.reca', 'sec.recb', 'sec.recc', 'sec.suspr', 'sec.demo', 'sec.cand1', 'sec.cand2', 'sec.cand3', 'sec.fresh', 'sec.susp', 'sec.admin'].map((s) => `${s}@example.com`);

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
  const orgC = await adb.collection('organizations').add({ name: 'SEC Org C' }); docs.push(orgC.path);
  // Desde la 1.1 una reclutadora solo ve candidatas y publica si un administrador la aprobó (recruiterApproved).
  const recAUid = await mkUser('sec.reca@example.com', 'recruiter', { organizationRef: orgA.id, recruiterApproved: true });
  const recBUid = await mkUser('sec.recb@example.com', 'recruiter', { organizationRef: orgB.id, recruiterApproved: true });
  // Reclutadora recién registrada: tiene su empresa, pero nadie la ha aprobado.
  const recCUid = await mkUser('sec.recc@example.com', 'recruiter', { organizationRef: orgC.id });
  // Reclutadora aprobada que luego fue suspendida.
  const suspRUid = await mkUser('sec.suspr@example.com', 'recruiter', { organizationRef: orgA.id, recruiterApproved: true, status: 'suspended' });
  // Fue reclutadora de A y la degradaron a candidata (datos heredados: conserva organizationRef).
  const demoUid = await mkUser('sec.demo@example.com', 'candidate', { organizationRef: orgA.id });
  const cand1Uid = await mkUser('sec.cand1@example.com', 'candidate');
  const cand2Uid = await mkUser('sec.cand2@example.com', 'candidate');
  const cand3Uid = await mkUser('sec.cand3@example.com', 'candidate');
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
  // Desde la 1.1 las notas privadas y la shortlist viven aparte de la postulación (la lee la candidata).
  await adb.doc(`jobs/${job.id}/applicantNotes/${cand1Uid}`).set({ shortlisted: true, recruiterNotes: 'nota privada', updatedAt: new Date() }); docs.push(`jobs/${job.id}/applicantNotes/${cand1Uid}`);
  // Postulación que la candidata retiró (la reclutadora no puede reactivarla)
  await adb.doc(`jobs/${job.id}/applications/${cand3Uid}`).set({ candidateRef: cand3Uid, jobRef: job.id, status: 'withdrawn' }); docs.push(`jobs/${job.id}/applications/${cand3Uid}`);
  // Una vacante y una entrevista de la empresa B / A para las pruebas de entrevistas
  const jobB = await adb.collection('jobs').add({ ...jobBase, organizationRef: orgB.id, title: 'SEC Job B', status: 'published' }); docs.push(jobB.path);
  const interview = await adb.collection('interviews').add({ jobRef: job.id, jobTitle: 'SEC Job', organizationRef: orgA.id, candidateRef: cand1Uid, interviewerRef: recAUid, type: 'video', scheduledStart: new Date(Date.now() + 86400000), location: 'https://meet.example.com/sec', createdAt: new Date() }); docs.push(interview.path);
  // Datos de una candidata suspendida
  await adb.doc(`candidates/${suspUid}`).set({ userRef: suspUid, headline: 'Susp', location: 'MX', yearsOfExperience: 1, available: true, skills: [] });
  await adb.doc(`users/${suspUid}/notifications/n1`).set({ title: 't', read: false }); docs.push(`users/${suspUid}/notifications/n1`);
  await adb.doc(`users/${suspUid}/applications/${job.id}`).set({ candidateRef: suspUid, jobRef: job.id, status: 'applied' }); docs.push(`users/${suspUid}/applications/${job.id}`);
  const interviewBase = { jobRef: job.id, jobTitle: 'SEC Job', organizationRef: orgA.id, candidateRef: cand1Uid, candidateName: 'x', interviewerRef: recAUid, type: 'video', scheduledStart: new Date(Date.now() + 2 * 86400000), location: 'https://meet.example.com/x', createdAt: new Date() };

  const A = await login('sec.reca@example.com', 'recA');
  const B = await login('sec.recb@example.com', 'recB');
  const RC = await login('sec.recc@example.com', 'recC');
  const SR = await login('sec.suspr@example.com', 'suspR');
  const DM = await login('sec.demo@example.com', 'demo');
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
  // Las reglas autorizan las entrevistas por la empresa del documento: la consulta debe fijar organizationRef.
  // (Antes la app consultaba solo por jobRef y el calendario del reclutador quedaba vacío sin avisar.)
  await allow('CTRL reclutador A lista las entrevistas de su vacante (jobRef + organizationRef)', () => getDocs(query(collection(A.db, 'interviews'), where('jobRef', '==', job.id), where('organizationRef', '==', orgA.id))));
  await allow('CTRL reclutador A cambia estado de postulación', () => updateDoc(doc(A.db, 'jobs', job.id, 'applications', cand1Uid), { status: 'screening' }));
  await allow('CTRL reclutador A guarda notas y shortlist (applicantNotes)', () => setDoc(doc(A.db, 'jobs', job.id, 'applicantNotes', cand1Uid), { shortlisted: true, recruiterNotes: 'Buen perfil', updatedAt: new Date() }, { merge: true }));
  await allow('CTRL reclutador A lee las notas de su vacante', () => getDocs(collection(A.db, 'jobs', job.id, 'applicantNotes')));
  await allow('CTRL reclutador A agenda entrevista con una persona que se postuló', async () => { const r = await addDoc(collection(A.db, 'interviews'), interviewBase); docs.push(r.path); });
  await allow('CTRL reclutador A cambia el lugar de una entrevista', () => updateDoc(doc(A.db, 'interviews', interview.id), { location: 'nueva sala' }));
  await allow('CTRL reclutador A lee candidatas', () => getDocs(query(collection(A.db, 'candidates'), limit(2))));
  await allow('CTRL admin lista usuarios', () => getDocs(query(collection(AD.db, 'users'), limit(2))));
  await allow('CTRL admin lista candidatas', () => getDocs(query(collection(AD.db, 'candidates'), limit(2))));
  await allow('CTRL reclutadora sin aprobar edita su propia organización', () => updateDoc(doc(RC.db, 'organizations', orgC.id), { name: 'SEC Org C v2' }));
  await allow('CTRL reclutadora sin aprobar lee su propio documento de usuario', () => getDoc(doc(RC.db, 'users', RC.uid)));
  await allow('CTRL candidata suspendida sí lee su propio documento de usuario (la pantalla le avisa)', () => getDoc(doc(S.db, 'users', S.uid)));
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
  await deny('S12b reclutador B lee entrevistas de A fijando organizationRef de A', () => getDocs(query(collection(B.db, 'interviews'), where('jobRef', '==', job.id), where('organizationRef', '==', orgA.id))));
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

  // ---- 1.1: las cuentas ya no se gestionan desde el navegador (lo hace /api/admin/users con el SDK de administración) ----
  await deny('S40 administrador cambia un rol desde el cliente', () => updateDoc(doc(AD.db, 'users', cand2Uid), { role: 'recruiter' }));
  await deny('S40b administrador suspende a alguien desde el cliente', () => updateDoc(doc(AD.db, 'users', cand2Uid), { status: 'suspended' }));
  await deny('S40c administrador aprueba a una reclutadora desde el cliente', () => updateDoc(doc(AD.db, 'users', recCUid), { recruiterApproved: true }));
  await deny('S40d administrador borra un usuario desde el cliente', () => deleteDoc(doc(AD.db, 'users', cand2Uid)));

  // ---- 1.1: notas privadas y shortlist fuera del documento que lee la candidata ----
  await deny('S41 candidata lee sus notas privadas', () => getDoc(doc(C1.db, 'jobs', job.id, 'applicantNotes', cand1Uid)));
  await deny('S41b candidata lista las notas de la vacante', () => getDocs(collection(C1.db, 'jobs', job.id, 'applicantNotes')));
  await deny('S41c candidata escribe una nota privada', () => setDoc(doc(C1.db, 'jobs', job.id, 'applicantNotes', cand1Uid), { recruiterNotes: 'x', updatedAt: new Date() }));
  await deny('S41d reclutador B lee las notas de la empresa A', () => getDocs(collection(B.db, 'jobs', job.id, 'applicantNotes')));
  await deny('S41e reclutador A guarda un campo ajeno en la nota', () => setDoc(doc(A.db, 'jobs', job.id, 'applicantNotes', cand1Uid), { recruiterNotes: 'x', extra: 1, updatedAt: new Date() }));
  await deny('S41f reclutador A guarda una nota de 500 KB', () => setDoc(doc(A.db, 'jobs', job.id, 'applicantNotes', cand1Uid), { recruiterNotes: 'x'.repeat(500000), updatedAt: new Date() }));
  await deny('S43 reclutador A escribe la shortlist en la postulación (campo prohibido)', () => updateDoc(doc(A.db, 'jobs', job.id, 'applications', cand1Uid), { shortlisted: true }));
  await deny('S44 reclutador A pone una postulación en «retirado»', () => updateDoc(doc(A.db, 'jobs', job.id, 'applications', cand1Uid), { status: 'withdrawn' }));
  await deny('S45 reclutador A revive una postulación que la candidata retiró', () => updateDoc(doc(A.db, 'jobs', job.id, 'applications', cand3Uid), { status: 'screening' }));

  // ---- 1.1: reclutadoras sin aprobar ----
  await deny('S46 reclutadora sin aprobar lista candidatas', () => getDocs(collection(RC.db, 'candidates')));
  await deny('S46b reclutadora sin aprobar lee una candidata', () => getDoc(doc(RC.db, 'candidates', cand1Uid)));
  await deny('S47 reclutadora sin aprobar publica una vacante', () => addDoc(collection(RC.db, 'jobs'), { ...jobBase, organizationRef: orgC.id, title: 'sin aprobar', status: 'published' }));
  await deny('S48 reclutadora se aprueba a sí misma', () => updateDoc(doc(RC.db, 'users', RC.uid), { recruiterApproved: true }));
  await deny('S49 registro nuevo como reclutadora ya aprobada', () => setDoc(doc(F.db, 'users', F.uid), { id: F.uid, email: 'sec.fresh@example.com', fullName: 'x', role: 'recruiter', status: 'active', recruiterApproved: true }));
  await adb.doc(`users/${F.uid}`).delete();

  // ---- 1.1: cuentas suspendidas ya no leen ----
  await deny('S50 candidata suspendida lee su perfil de candidata', () => getDoc(doc(S.db, 'candidates', S.uid)));
  await deny('S50b candidata suspendida lee sus postulaciones', () => getDocs(collection(S.db, 'users', S.uid, 'applications')));
  await deny('S50c candidata suspendida lee sus avisos', () => getDocs(collection(S.db, 'users', S.uid, 'notifications')));
  await deny('S50d candidata suspendida lista vacantes publicadas', () => getDocs(query(collection(S.db, 'jobs'), where('status', '==', 'published'), limit(3))));
  await deny('S51 reclutadora suspendida lista candidatas', () => getDocs(collection(SR.db, 'candidates')));
  await deny('S51b reclutadora suspendida lee los postulantes de su vacante', () => getDocs(collection(SR.db, 'jobs', job.id, 'applications')));
  await deny('S51c reclutadora suspendida edita su vacante', () => updateDoc(doc(SR.db, 'jobs', job.id), { title: 'suspendida' }));

  // ---- 1.1: el rol cuenta (quien dejó de ser reclutadora no conserva el acceso a su empresa) ----
  await deny('S52 quien dejó de ser reclutadora lee los postulantes de su antigua empresa', () => getDocs(collection(DM.db, 'jobs', job.id, 'applications')));
  await deny('S52b quien dejó de ser reclutadora edita la vacante de su antigua empresa', () => updateDoc(doc(DM.db, 'jobs', job.id), { title: 'degradada' }));
  await deny('S52c quien dejó de ser reclutadora lista candidatas', () => getDocs(collection(DM.db, 'candidates')));

  // ---- 1.1: entrevistas solo para quien se postuló a una vacante de la propia empresa ----
  await deny('S53 reclutador A agenda con una persona que no se postuló', () => addDoc(collection(A.db, 'interviews'), { ...interviewBase, candidateRef: F.uid }));
  await deny('S53b reclutador A agenda con una vacante de otra empresa', () => addDoc(collection(A.db, 'interviews'), { ...interviewBase, jobRef: jobB.id }));
  await deny('S53c reclutador A agenda a nombre de otra reclutadora', () => addDoc(collection(A.db, 'interviews'), { ...interviewBase, interviewerRef: recBUid }));
  await deny('S53d reclutador A agenda con un tipo de entrevista inválido', () => addDoc(collection(A.db, 'interviews'), { ...interviewBase, type: 'telepatia' }));
  await deny('S54 reclutador A cambia a quién va una entrevista', () => updateDoc(doc(A.db, 'interviews', interview.id), { candidateRef: cand2Uid }));
  await deny('S54b reclutador A mueve una entrevista a otra empresa', () => updateDoc(doc(A.db, 'interviews', interview.id), { organizationRef: orgB.id }));

  // ---- 1.1: tipos y tamaños ----
  await deny('S55 usuario escribe un teléfono que no es texto', () => updateDoc(doc(C1.db, 'users', C1.uid), { phone: 123 }));
  await deny('S55b usuario escribe un nombre de 500 caracteres', () => updateDoc(doc(C1.db, 'users', C1.uid), { fullName: 'x'.repeat(500) }));
  await deny('S56 candidata guarda habilidades que no son una lista', () => setDoc(doc(C1.db, 'candidates', C1.uid), { skills: 'react' }, { merge: true }));
  await deny('S56b reclutador A guarda etiquetas que no son una lista', () => updateDoc(doc(A.db, 'jobs', job.id), { searchTags: 'react' }));
} catch (e) {
  console.error('ERROR DE PREPARACIÓN:', e);
} finally {
  await cleanup();
  const bad = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.name} -> ${r.note}`);
  console.log(`\n${results.length - bad.length}/${results.length} correctas, ${bad.length} vulnerabilidades/fallos`);
  process.exit(0);
}
