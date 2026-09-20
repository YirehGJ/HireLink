// Regresión: las mismas escrituras que hace la app, con las reglas endurecidas. Solo datos desechables.
import fs from 'fs';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection, getDocs, query, where, writeBatch, serverTimestamp, deleteDoc } from 'firebase/firestore';

const env = fs.readFileSync('.env.local', 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.+)$', 'm')) || [])[1]?.trim().replace(/^"|"$/g, '');
admin.initializeApp({ credential: admin.credential.cert({ projectId: get('FIREBASE_PROJECT_ID'), clientEmail: get('FIREBASE_CLIENT_EMAIL'), privateKey: get('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n') }) });
const adb = admin.firestore(); const aauth = admin.auth();
const PASS = 'TestPass1234';
const cfg = { apiKey: get('NEXT_PUBLIC_FB_API_KEY'), authDomain: get('NEXT_PUBLIC_FB_AUTH_DOMAIN'), projectId: get('NEXT_PUBLIC_FB_PROJECT_ID'), appId: get('NEXT_PUBLIC_FB_APP_ID') };
const EM = ['flow.rec@example.com', 'flow.cand@example.com', 'flow.rec2@example.com'];

const results = [];
const step = async (name, fn) => { try { await fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, note: e?.code || e?.message }); } };

async function newAuth(email) {
  try { const u = await aauth.getUserByEmail(email); await aauth.deleteUser(u.uid); await adb.doc(`users/${u.uid}`).delete(); } catch {}
  const u = await aauth.createUser({ email, password: PASS });
  const app = initializeApp(cfg, email);
  await signInWithEmailAndPassword(getAuth(app), email, PASS);
  return { uid: u.uid, db: getFirestore(app) };
}

const cleanupDocs = [];
try {
  const R = await newAuth(EM[0]);
  const C = await newAuth(EM[1]);

  // --- registro (idéntico a userService.ensureProfileExists) ---
  await step('Registro de reclutador (users)', () => setDoc(doc(R.db, 'users', R.uid), { id: R.uid, email: EM[0], fullName: 'Flow Reclutador', role: 'recruiter', status: 'active' }));
  await step('Registro de candidato (users)', () => setDoc(doc(C.db, 'users', C.uid), { id: C.uid, email: EM[1], fullName: 'Flow Candidato', role: 'candidate', status: 'active' }));

  // --- reclutador: empresa (organizationService.createOrganization + setOrganizationRef) ---
  let orgId;
  await step('Reclutador crea su empresa (con ownerUid)', async () => { const r = await addDoc(collection(R.db, 'organizations'), { name: 'Flow Org', website: 'https://flow.example.com', description: 'Empresa de flujo', ownerUid: R.uid, createdAt: serverTimestamp() }); orgId = r.id; cleanupDocs.push(`organizations/${orgId}`); });
  await step('Reclutador se enlaza a SU empresa recién creada', () => updateDoc(doc(R.db, 'users', R.uid), { organizationRef: orgId }));
  await step('Reclutador edita su empresa (setDoc merge)', () => setDoc(doc(R.db, 'organizations', orgId), { name: 'Flow Org 2', updatedAt: serverTimestamp() }, { merge: true }));

  // --- vacante (jobService) ---
  let jobId;
  await step('Reclutador publica una vacante', async () => { const r = await addDoc(collection(R.db, 'jobs'), { title: 'Flow Job', location: 'Remoto', seniority: 'junior', remoteAllowed: true, descriptionMd: 'x'.repeat(80), searchTags: ['React'], organizationRef: orgId, contractType: 'Full-time', status: 'published', createdAt: serverTimestamp() }); jobId = r.id; cleanupDocs.push(`jobs/${jobId}`); });
  await step('Reclutador edita la vacante (setDoc merge)', () => setDoc(doc(R.db, 'jobs', jobId), { title: 'Flow Job v2', updatedAt: serverTimestamp() }, { merge: true }));
  await step('Reclutador lista sus vacantes (where organizationRef)', () => getDocs(query(collection(R.db, 'jobs'), where('organizationRef', '==', orgId))));

  // --- candidato: perfil (candidateService.saveProfile) ---
  await step('Candidato guarda su perfil con CV analizado', () => setDoc(doc(C.db, 'candidates', C.uid), { userRef: C.uid, fullName: 'Flow Candidato', email: EM[1], headline: 'Ingeniero React', location: 'CDMX', yearsOfExperience: 3, available: true, skills: [{ name: 'React', level: 4, years: 3, source: 'manual' }], cvSummary: 'Resumen '.repeat(20), cvText: 'texto del cv '.repeat(300), updatedAt: serverTimestamp() }, { merge: true }));
  await step('Candidato explora vacantes publicadas', () => getDocs(query(collection(C.db, 'jobs'), where('status', '==', 'published'))));

  // --- postulación (applicationService.applyToJob: batch con copia espejo) ---
  await step('Candidato postula (batch: postulación + espejo)', async () => {
    const b = writeBatch(C.db);
    const base = { candidateRef: C.uid, jobRef: jobId, status: 'applied', source: 'recommendation', cvRef: '', appliedAt: serverTimestamp(), updatedAt: serverTimestamp() };
    b.set(doc(C.db, 'jobs', jobId, 'applications', C.uid), base);
    b.set(doc(C.db, 'users', C.uid, 'applications', jobId), base);
    await b.commit();
  });
  await step('Candidato lee su postulación (espejo)', () => getDocs(collection(C.db, 'users', C.uid, 'applications')));
  await step('Candidato consulta si ya postuló (get)', () => getDoc(doc(C.db, 'jobs', jobId, 'applications', C.uid)));

  // --- reclutador gestiona la postulación ---
  await step('Reclutador ve postulantes', () => getDocs(collection(R.db, 'jobs', jobId, 'applications')));
  await step('Reclutador ve el perfil del candidato', () => getDoc(doc(R.db, 'candidates', C.uid)));
  await step('Reclutador cambia estado de la postulación', () => updateDoc(doc(R.db, 'jobs', jobId, 'applications', C.uid), { status: 'interview', updatedAt: serverTimestamp() }));
  await step('Reclutador marca shortlist y deja notas', () => updateDoc(doc(R.db, 'jobs', jobId, 'applications', C.uid), { shortlisted: true, recruiterNotes: 'Buen perfil', updatedAt: serverTimestamp() }));
  await step('Reclutador agenda entrevista', async () => { const r = await addDoc(collection(R.db, 'interviews'), { jobRef: jobId, jobTitle: 'Flow Job v2', organizationRef: orgId, candidateRef: C.uid, candidateName: 'Flow Candidato', interviewerRef: R.uid, type: 'video', scheduledStart: new Date(Date.now() + 86400000), location: 'https://meet.example.com/x', createdAt: serverTimestamp() }); cleanupDocs.push(`interviews/${r.id}`); });
  await step('Candidato ve sus entrevistas', () => getDocs(query(collection(C.db, 'interviews'), where('candidateRef', '==', C.uid))));
  await step('Reclutador cierra la vacante (setStatus)', () => setDoc(doc(R.db, 'jobs', jobId), { status: 'closed', updatedAt: serverTimestamp() }, { merge: true }));
  await step('Candidato aún puede ver la vacante cerrada', () => getDoc(doc(C.db, 'jobs', jobId)));
  await step('Reclutador actualiza su nombre (users)', () => updateDoc(doc(R.db, 'users', R.uid), { fullName: 'Flow Reclutador Nuevo' }));
  await step('Reclutador elimina la vacante', () => deleteDoc(doc(R.db, 'jobs', jobId)));
} catch (e) {
  console.error('ERROR:', e);
} finally {
  for (const p of cleanupDocs) await adb.doc(p).delete().catch(() => {});
  for (const email of EM) { try { const u = await aauth.getUserByEmail(email); await aauth.deleteUser(u.uid); await adb.doc(`users/${u.uid}`).delete(); await adb.doc(`candidates/${u.uid}`).delete(); } catch {} }
  const bad = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.name}${r.note ? ' -> ' + r.note : ''}`);
  console.log(`\n${results.length - bad.length}/${results.length} flujos correctos`);
  process.exit(0);
}
