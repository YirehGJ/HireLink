// Pruebas funcionales con navegador, parte 2 (fases F5 a F13): postulaciones, gestión de postulantes, entrevistas,
// matches, recomendaciones de la IA, filtros, avisos, panel del administrador y configuración de la cuenta.
// Requiere haber corrido antes funcional-1.mjs (crea las cuentas, empresas y vacantes que usa).
//   node qa-tests/funcional-2.mjs <etiqueta> [F5 F6 F7 F8 F8b F9 F9b F10 F11 F12 F13]      (sin fases = todas)
import fs from 'fs';
import path from 'path';
import {
  BASE, PASS, ENV, sleep, db, auth, TS, uidOf, tryUid, launch, close, session, loginUI, go, bodyText, hasText, waitText,
  setInput, clickText, pickSelect, record, results, saveResults, deleteJobCascade, OUT_DIR, STATE_FILE,
} from './lib.mjs';
import { RECRUITERS, CANDIDATES, jobOwner } from './datos.mjs';

const TAG = process.argv[2] || 'run';
const PHASES = process.argv.slice(3);
const run = (f) => PHASES.length === 0 || PHASES.includes(f);
// SOLO=<texto> limita F9b a los casos que lo contienen (por ejemplo SOLO=valentina) para gastar menos cupo de IA al repetirla.
const SOLO = (process.env.SOLO || '').toLowerCase();
const SHOTS = path.join(OUT_DIR, `capturas_${TAG}`);
fs.mkdirSync(SHOTS, { recursive: true });
const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
state.created = state.created || { apps: [], notes: [] };
const saveState = () => fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` }).catch(() => {});
const BLOCK_RECS = ['/api/recommendations/generate'];
const STATUS_LABEL = { applied: 'Postulado', screening: 'En Revisión', assessment: 'Evaluación', interview: 'Entrevista', offer: 'Oferta', hired: 'Contratado', rejected: 'Rechazado', withdrawn: 'Retirado' };
const typeCode = { 'Videollamada': 'video', 'Teléfono': 'phone', 'Presencial': 'onsite' };
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const recentNotif = async (uid, type, sinceMs, contains = '') => {
  const snap = await db.collection(`users/${uid}/notifications`).orderBy('createdAt', 'desc').limit(25).get();
  return snap.docs.map((d) => d.data()).find((n) => n.type === type && n.createdAt.toMillis() >= sinceMs && (!contains || (n.body + n.title).includes(contains)));
};
const norm = (s) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

await launch();

// sesiones por reclutador (se reutilizan dentro de cada fase)
async function recruiterSessions(extra = {}) {
  const map = {};
  for (const r of RECRUITERS) map[r.key] = await session(r.email, { block: BLOCK_RECS, ...extra });
  return map;
}
const closeAll = async (map) => { for (const s of Object.values(map)) await s.ctx.close(); };
const rowOf = (name) => `(() => [...document.querySelectorAll('tr')].find((r) => r.textContent.includes(${JSON.stringify(name)})))()`;

// ------------------------------------------------------------------ F5: postulaciones (10)
if (run('F5')) {
  console.log('\n== F5: Postulaciones ==');
  for (const c of CANDIDATES) {
    const s = await session(c.email, { block: BLOCK_RECS });
    const jobId = state.jobs[c.job];
    const uid = state.uids[c.email];
    const owner = jobOwner(c.job);
    const ownerUid = state.uids[owner.email];
    const started = Date.now();
    await go(s.page, `/dashboard/jobs/${jobId}`, 'Postularme ahora');
    if (c.key === 'carolina') await shot(s.page, 'F5_detalle_vacante_candidato');
    await clickText(s.page, 'Postularme ahora');
    const applied = await waitText(s.page, 'Ya postulaste', 20000);
    await sleep(3500);
    const app = (await db.doc(`jobs/${jobId}/applications/${uid}`).get()).data();
    const mirror = (await db.doc(`users/${uid}/applications/${jobId}`).get()).data();
    const note = await recentNotif(ownerUid, 'new_application', started - 2000, c.job);
    const audits = await db.collection('auditLogs').orderBy('createdAt', 'desc').limit(30).get();
    const audit = audits.docs.map((d) => d.data()).find((a) => a.action === 'application_created' && a.targetId === `${jobId}/${uid}`);
    await go(s.page, '/dashboard/applications', 'Historial de Postulaciones');
    const listed = (await bodyText(s.page)).includes(c.job);
    const ok = applied && app?.status === 'applied' && app?.candidateRef === uid && !!app?.notifiedAt && mirror?.status === 'applied' && !!note && !!audit && listed;
    record('F5', 'Postulaciones', `${c.fullName} se postula a «${c.job}»`, ok,
      `estado ${app?.status}; copia del candidato ${mirror ? 'sí' : 'no'}; aviso al reclutador ${note ? 'sí' : 'no'}; auditoría ${audit ? 'sí' : 'no'}; visible en «Mis postulaciones» ${listed}`);
    if (c.key === 'carolina') await shot(s.page, 'F5_mis_postulaciones');
    await s.ctx.close();
  }
}

// ------------------------------------------------------------------ F6: gestión de postulantes por reclutadores (10)
if (run('F6')) {
  console.log('\n== F6: Gestión de postulantes (estado, shortlist y notas) ==');
  const targets = ['screening', 'assessment', 'screening', 'assessment', 'offer', 'hired', 'rejected', 'screening', 'assessment', 'offer'];
  const rec = await recruiterSessions();
  for (const [i, c] of CANDIDATES.entries()) {
    const owner = jobOwner(c.job);
    const s = rec[owner.key];
    const jobId = state.jobs[c.job];
    const uid = state.uids[c.email];
    const target = targets[i];
    const started = Date.now();
    await go(s.page, `/dashboard/jobs/${jobId}`, 'Candidatos Postulados');
    if (i === 0) await shot(s.page, 'F6_candidatos_postulados');
    // estado
    await pickSelect(s.page, { aria: `Cambiar estado de ${c.fullName}` }, STATUS_LABEL[target]);
    await sleep(3500);
    const app1 = (await db.doc(`jobs/${jobId}/applications/${uid}`).get()).data();
    const mirror = (await db.doc(`users/${uid}/applications/${jobId}`).get()).data();
    const note = await recentNotif(uid, 'application_status_changed', started - 2000, STATUS_LABEL[target]);
    record('F6', 'Gestión de postulantes', `estado de ${c.fullName} → ${STATUS_LABEL[target]}`, app1?.status === target && mirror?.status === target && !!note,
      `postulación ${app1?.status}; copia del candidato ${mirror?.status}; aviso al candidato ${note ? 'sí' : 'no'}`);
    // shortlist (los pares)
    if (i % 2 === 0) {
      await s.page.evaluate((js) => { const row = eval(js); row.querySelector('button[aria-label="Agregar a shortlist"]').click(); }, rowOf(c.fullName));
      await sleep(2000);
      const app2 = (await db.doc(`jobs/${jobId}/applications/${uid}`).get()).data();
      record('F6', 'Gestión de postulantes', `shortlist de ${c.fullName}`, app2?.shortlisted === true);
    }
    // notas privadas
    await s.page.evaluate((js) => { const row = eval(js); [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Detalles').click(); }, rowOf(c.fullName));
    await sleep(1200);
    if (i === 0) await shot(s.page, 'F6_detalle_candidato');
    const nota = `Entrevista inicial pendiente con ${c.fullName.split(' ')[0]}. Perfil alineado a «${c.job}».`;
    await setInput(s.page, '#notes', nota);
    await clickText(s.page, 'Guardar notas');
    await sleep(2000);
    const app3 = (await db.doc(`jobs/${jobId}/applications/${uid}`).get()).data();
    record('F6', 'Gestión de postulantes', `notas privadas de ${c.fullName}`, app3?.recruiterNotes === nota);
    await clickText(s.page, 'Cerrar');
    await sleep(500);
  }
  await closeAll(rec);
}

// ------------------------------------------------------------------ F7: entrevistas (10 agendadas, 3 canceladas)
if (run('F7')) {
  console.log('\n== F7: Entrevistas ==');
  const types = ['Videollamada', 'Teléfono', 'Presencial'];
  const places = { 'Videollamada': (k) => `https://meet.example.com/entrevista-${k}`, 'Teléfono': () => '+52 55 5550 1234', 'Presencial': () => 'Oficinas de la empresa, Av. Reforma 250, Ciudad de México' };
  const rec = await recruiterSessions();
  const made = [];
  for (const [i, c] of CANDIDATES.entries()) {
    const owner = jobOwner(c.job);
    const s = rec[owner.key];
    const jobId = state.jobs[c.job];
    const uid = state.uids[c.email];
    const when = new Date(Date.now() + (i + 2) * 864e5);
    const date = isoDate(when);
    const hour = 9 + (i % 9);
    const time = `${pad(hour)}:00`;
    const type = types[i % 3];
    const place = places[type](c.key);
    const expected = new Date(`${date}T${time}`);
    const started = Date.now();
    await go(s.page, `/dashboard/jobs/${jobId}`, 'Candidatos Postulados');
    await s.page.evaluate((js) => { const row = eval(js); [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Detalles').click(); }, rowOf(c.fullName));
    await sleep(1200);
    await setInput(s.page, '#int-date', date);
    await setInput(s.page, '#int-time', time);
    await pickSelect(s.page, { root: '[role="dialog"]' }, type);
    await setInput(s.page, '#int-place', place);
    if (i === 0) await shot(s.page, 'F7_agendar_entrevista');
    await clickText(s.page, 'Agendar y notificar');
    await sleep(4500);
    const q = await db.collection('interviews').where('candidateRef', '==', uid).where('jobRef', '==', jobId).get();
    const iv = q.docs.map((d) => ({ id: d.id, ...d.data() })).find((x) => x.location === place);
    const app = (await db.doc(`jobs/${jobId}/applications/${uid}`).get()).data();
    const expectedText = expected.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City' });
    const note = await recentNotif(uid, 'interview_scheduled', started - 2000);
    const okTime = !!iv && iv.scheduledStart.toMillis() === expected.getTime();
    const okNote = !!note && note.body.includes(expectedText);
    record('F7', 'Entrevistas', `agendar ${type.toLowerCase()} con ${c.fullName} (${date} ${time})`, okTime && iv.type === typeCode[type] && app?.status === 'interview' && okNote,
      `entrevista ${iv ? 'creada' : 'NO creada'}; fecha exacta ${okTime}; estado de la postulación ${app?.status}; el aviso dice «…${(note?.body || '').slice(-34)}»`);
    if (iv) made.push({ ...iv, cand: c, owner });
  }
  state.created.interviews = made.map((m) => m.id);
  // cancelar 3
  for (const m of made.slice(0, 3)) {
    const s = rec[m.owner.key];
    const uid = state.uids[m.cand.email];
    const started = Date.now();
    await go(s.page, `/dashboard/jobs/${state.jobs[m.cand.job]}`, 'Candidatos Postulados');
    await clickText(s.page, 'Entrevistas', '[role="tab"]');
    await sleep(2000);
    const d = m.scheduledStart.toDate();
    const cell = await s.page.evaluateHandle((day) => [...document.querySelectorAll('td button, button[name="day"]')].find((b) => b.textContent.trim() === String(day) && !b.disabled && !/outside/.test(b.className)) || null, d.getDate());
    if (cell.asElement()) await cell.asElement().click();
    await sleep(900);
    const showed = (await bodyText(s.page)).includes(m.cand.fullName);
    if (m === made[0]) await shot(s.page, 'F7_calendario_reclutador');
    const btn = await s.page.$('button[aria-label="Cancelar entrevista"]');
    if (btn) { await btn.click(); await sleep(3500); }
    const gone = !(await db.doc(`interviews/${m.id}`).get()).exists;
    const note = await recentNotif(uid, 'interview_cancelled', started - 2000);
    record('F7', 'Entrevistas', `cancelar la entrevista de ${m.cand.fullName}`, showed && !!btn && gone && !!note, `visible en el calendario ${showed}; eliminada ${gone}; aviso al candidato ${note ? 'sí' : 'no'}`);
  }
  // el candidato ve sus entrevistas vigentes
  for (const m of made.slice(3, 6)) {
    const s = await session(m.cand.email, { block: BLOCK_RECS });
    await go(s.page, '/dashboard/applications', 'Mis Entrevistas');
    const d = m.scheduledStart.toDate();
    const cell = await s.page.evaluateHandle((day) => [...document.querySelectorAll('td button, button[name="day"]')].find((b) => b.textContent.trim() === String(day) && !b.disabled && !/outside/.test(b.className)) || null, d.getDate());
    if (cell.asElement()) await cell.asElement().click();
    await sleep(900);
    const t = await bodyText(s.page);
    record('F7', 'Entrevistas', `${m.cand.fullName} ve su entrevista en «Mis postulaciones»`, t.includes(m.cand.job) && t.includes(`${pad(d.getHours())}:00`), `muestra la vacante y la hora ${pad(d.getHours())}:00`);
    if (m === made[3]) await shot(s.page, 'F7_calendario_candidato');
    await s.ctx.close();
  }
  await closeAll(rec);
  saveState();
}

// ------------------------------------------------------------------ F8: matches de la IA (10 respuestas de reclutadores + 3 de candidatos)
if (run('F8') || run('F8b')) {
  console.log('\n== F8: Matches de la IA: aceptar y rechazar ==');
  const onlyCandidates = PHASES.includes('F8b') && !PHASES.includes('F8');
  const T = [
    { rec: 'reclutar@example.com', job: 'seed_job_frontend_jr', cand: 'diego.hernandez@example.com', name: 'Diego Hernández Soto', action: 'accept' },
    { rec: 'reclutar@example.com', job: 'seed_job_frontend_jr', cand: 'gabriela.montes@example.com', name: 'Gabriela Montes Orozco', action: 'accept' },
    { rec: 'reclutar@example.com', job: 'seed_job_frontend_jr', cand: 'candidato@example.com', name: 'Candidato Prueba', action: 'reject' },
    { rec: 'reclutar@example.com', job: 'seed_job_practicante', cand: 'roberto.salazar@example.com', name: 'Roberto Salazar Peña', action: 'accept' },
    { rec: 'reclutar@example.com', job: 'seed_job_practicante', cand: 'samuel.vargas@example.com', name: 'Samuel Vargas Echeverría', action: 'reject' },
    { rec: 'reclutar@example.com', job: 'seed_job_devops', cand: 'ivan.santillan@example.com', name: 'Iván Santillán Pedraza', action: 'accept' },
    { rec: 'marco.delgado@example.com', job: 'seed_job_datos', cand: 'luis.ramos@example.com', name: 'Luis Fernando Ramos Aguilar', action: 'accept' },
    { rec: 'hector.aguilar@example.com', job: 'seed_job_fullstack_jr_edu', cand: 'natalia.cervantes@example.com', name: 'Natalia Cervantes Ponce', action: 'accept' },
    { rec: 'karla.medina@example.com', job: 'seed_job_bi', cand: 'elena.navarro@example.com', name: 'Elena Navarro Pineda', action: 'accept' },
    { rec: 'karla.medina@example.com', job: 'seed_job_scrum', cand: 'paulina.castillo@example.com', name: 'Paulina Castillo Ríos', action: 'reject' },
  ];
  const sess = {};
  state.created.apps = state.created.apps || [];
  for (const t of onlyCandidates ? [] : T) {
    const s = (sess[t.rec] = sess[t.rec] || (await session(t.rec, { block: BLOCK_RECS })));
    const uid = await uidOf(t.cand);
    const recId = `${uid}_${t.job}`;
    const before = (await db.doc(`recommendations/${recId}`).get()).data();
    const appBefore = (await db.doc(`jobs/${t.job}/applications/${uid}`).get()).exists;
    const started = Date.now();
    await go(s.page, `/dashboard/jobs/${t.job}`, 'Candidatos Postulados');
    await clickText(s.page, 'Recomendados', '[role="tab"]');
    await sleep(1800);
    const clicked = await s.page.evaluate((name, label) => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim().includes(label) && b.closest('.rounded-lg.border')?.textContent.includes(name));
      if (!btn) return false;
      btn.scrollIntoView({ block: 'center' });
      btn.click();
      return true;
    }, t.name, t.action === 'accept' ? 'Aceptar candidato' : 'Rechazar');
    await sleep(4000);
    const after = (await db.doc(`recommendations/${recId}`).get()).data();
    const app = (await db.doc(`jobs/${t.job}/applications/${uid}`).get()).data();
    const mirror = (await db.doc(`users/${uid}/applications/${t.job}`).get()).exists;
    if (t.action === 'accept' && !appBefore && app) state.created.apps.push(`jobs/${t.job}/applications/${uid}`, `users/${uid}/applications/${t.job}`);
    const note = await recentNotif(uid, t.action === 'accept' ? 'match_accepted' : 'match_rejected', started - 2000);
    const audits = await db.collection('auditLogs').orderBy('createdAt', 'desc').limit(30).get();
    const audit = audits.docs.map((d) => d.data()).find((a) => a.action === (t.action === 'accept' ? 'match_accepted' : 'match_rejected_by_recruiter') && a.targetId === recId && a.createdAt.toMillis() >= started - 2000);
    const expectedStatus = t.action === 'accept' ? 'accepted' : 'rejected_by_recruiter';
    const ok = clicked && before?.status === 'pending' && after?.status === expectedStatus && !!note && !!audit && (t.action === 'reject' || (!!app && mirror));
    record('F8', 'Matches de la IA', `${t.action === 'accept' ? 'aceptar' : 'rechazar'} a ${t.name} (${Math.round((before?.score || 0) * 100)}%)`, ok,
      `match ${before?.status} → ${after?.status}; ${t.action === 'accept' ? `postulación ${app?.status || 'no existe'}` : 'sin postulación nueva'}; aviso al candidato ${note ? 'sí' : 'no'}; auditoría ${audit ? 'sí' : 'no'}`);
    if (t.name === 'Diego Hernández Soto') await shot(s.page, 'F8_matches_reclutador');
  }
  for (const s of Object.values(sess)) await s.ctx.close();
  // el candidato rechaza el match en cualquier momento
  const C = [
    { cand: 'fernanda.ortiz@example.com', job: 'seed_job_qa', title: 'QA Engineer' },
    { cand: 'valeria.nunez@example.com', job: 'seed_job_riesgo', title: 'Analista de Riesgo Crediticio (Data)' },
    { cand: 'carlos.mendoza@example.com', job: 'seed_job_java_pagos', title: 'Desarrollador Backend Java (Pagos)' },
  ];
  for (const t of C) {
    const s = await session(t.cand, { block: BLOCK_RECS });
    const uid = await uidOf(t.cand);
    const recId = `${uid}_${t.job}`;
    const started = Date.now();
    await go(s.page, '/dashboard', 'Tus Próximas Oportunidades');
    await waitText(s.page, t.title, 25000);
    await sleep(600);
    const clicked = await s.page.evaluate((title) => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Rechazar match') && b.closest('div[class*="bg-card"]')?.textContent.includes(title));
      if (!btn) return false;
      btn.scrollIntoView({ block: 'center' });
      btn.click();
      return true;
    }, t.title);
    await sleep(700);
    if (clicked) await clickText(s.page, 'Sí, rechazar');
    await sleep(4000);
    const rec = (await db.doc(`recommendations/${recId}`).get()).data();
    const app = (await db.doc(`jobs/${t.job}/applications/${uid}`).get()).data();
    const orgId = (await db.doc(`jobs/${t.job}`).get()).data().organizationRef;
    const recruiters = (await db.collection('users').where('organizationRef', '==', orgId).where('role', '==', 'recruiter').get()).docs;
    let notified = 0;
    for (const r of recruiters) if (await recentNotif(r.id, 'match_rejected_by_candidate', started - 2000)) notified++;
    const stillShown = (await bodyText(s.page)).includes(t.title);
    record('F8', 'Matches de la IA', `${t.cand.split('@')[0]} rechaza el match de «${t.title}»`, clicked && rec?.status === 'rejected_by_candidate' && app?.status === 'withdrawn' && notified === recruiters.length && !stillShown,
      `match ${rec?.status}; postulación ${app?.status}; reclutadores avisados ${notified}/${recruiters.length}; sigue visible ${stillShown}`);
    await s.ctx.close();
  }
  saveState();
}

// ------------------------------------------------------------------ F9: IA, recomendaciones reales (UI del reclutador y API del candidato)
async function idToken(email) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${ENV.NEXT_PUBLIC_FB_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASS, returnSecureToken: true }),
  });
  return (await r.json()).idToken;
}
if (run('F9')) {
  console.log('\n== F9: Recomendaciones calculadas por la IA ==');
  const esIA = (r) => /^groq-/.test(r.engineVersion ?? ''); // groq-gpt-oss-120b o, con GROQ_MODEL_ID, otro modelo
  const aiRecs = async () => (await db.collection('recommendations').get()).docs.filter((d) => esIA(d.data()));
  const before = (await aiRecs()).length;
  // A) botón «Buscar candidatos» del reclutador (3 vacantes)
  for (const j of [{ title: 'Desarrollador Móvil iOS', owner: RECRUITERS[0] }, { title: 'Ingeniero de Machine Learning', owner: RECRUITERS[4] }, { title: 'Analista de Datos Clínicos', owner: RECRUITERS[0] }]) {
    const s = await session(j.owner.email);
    const jobId = state.jobs[j.title];
    await go(s.page, `/dashboard/jobs/${jobId}`, 'Candidatos Postulados');
    await clickText(s.page, 'Recomendados', '[role="tab"]');
    await sleep(1500);
    const t0 = Date.now();
    await clickText(s.page, 'Buscar candidatos');
    const done = await waitText(s.page, 'Recomendaciones actualizadas', 90000);
    const ms = Date.now() - t0;
    const txt = await bodyText(s.page);
    const processed = Number((txt.match(/(\d+) candidatos revisados/) || [])[1] || 0);
    const recs = (await db.collection('recommendations').where('jobRef', '==', jobId).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
    const valid = recs.every((r) => r.score >= 0 && r.score <= 1 && Array.isArray(r.reasons) && r.reasons.length >= 1 && r.reasons.length <= 5 && esIA(r));
    const best = [...recs].sort((a, b) => b.score - a.score)[0];
    let bestName = '';
    if (best) bestName = (await db.doc(`candidates/${best.candidateRef}`).get()).data()?.fullName || best.candidateRef;
    record('F9', 'IA: recomendaciones por vacante', `«${j.title}»: botón «Buscar candidatos»`, done && recs.length >= 1 && valid,
      `${ms} ms; ${processed} candidatos revisados; ${recs.length} puntajes guardados; mejor: ${bestName} (${Math.round((best?.score || 0) * 100)}%)`);
    if (j.title === 'Desarrollador Móvil iOS') {
      await shot(s.page, 'F9_buscar_candidatos');
      // Segunda pulsación sin cambios: los puntajes vigentes se reutilizan y no se vuelve a gastar IA en ellos.
      const stamp = async () => new Map((await db.collection('recommendations').where('jobRef', '==', jobId).get()).docs.map((d) => [d.id, d.data().updatedAt?.toMillis()]));
      const antes = await stamp();
      await sleep(6000); // deja que desaparezca el aviso anterior
      const t1 = Date.now();
      await clickText(s.page, 'Buscar candidatos');
      const sinCambios = await waitText(s.page, 'sin cambios desde la última vez', 90000);
      const ms2 = Date.now() - t1;
      const despues = await stamp();
      const intactas = [...antes].filter(([id, t]) => despues.get(id) === t).length;
      const conHuella = (await db.collection('recommendations').where('jobRef', '==', jobId).get()).docs.filter((d) => !!d.data().inputHash).length;
      record('F9', 'IA: caché de recomendaciones', `«${j.title}»: segunda pulsación sin cambios reutiliza los puntajes`, sinCambios && intactas === antes.size && conHuella === despues.size,
        `${ms2} ms; ${intactas} de ${antes.size} puntajes sin recalcular; ${conHuella} de ${despues.size} con huella`);
    }
    await s.ctx.close();
    await sleep(15000);
  }
  // B) recálculo al guardar el perfil del candidato (5 candidatos, por la API)
  for (const c of CANDIDATES.slice(0, 5)) {
    const tok = await idToken(c.email);
    const t0 = Date.now();
    const res = await fetch(`${BASE}/api/recommendations/generate`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' } });
    const body = await res.json().catch(() => ({}));
    const ms = Date.now() - t0;
    const uid = state.uids[c.email];
    const mine = (await db.collection('recommendations').where('candidateRef', '==', uid).get()).docs.map((d) => d.data());
    const valid = mine.every((r) => r.score >= 0 && r.score <= 1 && r.reasons.length >= 1 && r.reasons.length <= 5);
    record('F9', 'IA: recomendaciones por candidato', `${c.fullName}`, res.status === 200 && valid, `HTTP ${res.status} en ${ms} ms; evaluadas ${body.processed ?? '?'}, omitidas por tiempo ${body.skipped ?? '?'}; guardadas ${mine.length}`);
    await sleep(15000);
  }
  // C) segunda llamada sin cambios en el perfil: reutiliza los puntajes vigentes (no gasta tokens en ellos)
  {
    const c = CANDIDATES[0];
    const uid = state.uids[c.email];
    const stamp = async () => new Map((await db.collection('recommendations').where('candidateRef', '==', uid).get()).docs.map((d) => [d.id, d.data().updatedAt?.toMillis()]));
    const antes = await stamp();
    const tok = await idToken(c.email);
    const t0 = Date.now();
    const res = await fetch(`${BASE}/api/recommendations/generate`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' } });
    const body = await res.json().catch(() => ({}));
    const despues = await stamp();
    const intactas = [...antes].filter(([id, t]) => despues.get(id) === t).length;
    record('F9', 'IA: caché de recomendaciones', `${c.fullName}: segunda llamada sin cambios reutiliza los puntajes`, res.status === 200 && (body.cached ?? 0) >= 1 && intactas === antes.size,
      `HTTP ${res.status} en ${Date.now() - t0} ms; ${body.cached ?? 0} reutilizados de ${body.processed ?? '?'} revisados; ${intactas} de ${antes.size} puntajes sin recalcular`);
    await sleep(15000);
  }
  const after = (await aiRecs()).length;
  record('F9', 'IA: recomendaciones', 'recomendaciones nuevas calculadas por el modelo', after - before >= 10, `${after - before} nuevas (antes ${before}, después ${after})`);
}

// ------------------------------------------------------------------ F9b: la priorización por habilidades pone al candidato ideal entre los primeros evaluados
if (run('F9b')) {
  console.log('\n== F9b: Priorización previa a la IA ==');
  const cases = [
    { title: 'Desarrollador Móvil iOS', owner: RECRUITERS[0], ideal: 'valentina.cruz@example.com' },
    { title: 'Ingeniero de Machine Learning', owner: RECRUITERS[4], ideal: 'sebastian.arellano@example.com' },
  ];
  for (const c of cases) {
    if (SOLO && !`${c.title} ${c.ideal}`.toLowerCase().includes(SOLO)) continue;
    const jobId = state.jobs[c.title];
    // se parte de cero para esa vacante: nadie tiene recomendación todavía
    for (const r of (await db.collection('recommendations').where('jobRef', '==', jobId).get()).docs) await r.ref.delete();
    const s = await session(c.owner.email);
    await go(s.page, `/dashboard/jobs/${jobId}`, 'Candidatos Postulados');
    await clickText(s.page, 'Recomendados', '[role="tab"]');
    await sleep(1500);
    const t0 = Date.now();
    await clickText(s.page, 'Buscar candidatos');
    const done = await waitText(s.page, 'Recomendaciones actualizadas', 90000);
    const ms = Date.now() - t0;
    const idealUid = await uidOf(c.ideal);
    const recs = (await db.collection('recommendations').where('jobRef', '==', jobId).get()).docs.map((d) => d.data());
    const top = [...recs].sort((a, b) => b.score - a.score)[0];
    const idealRec = recs.find((r) => r.candidateRef === idealUid);
    record('F9b', 'IA: priorización por habilidades', `«${c.title}»: el candidato ideal se evalúa y queda primero`, done && !!idealRec && top?.candidateRef === idealUid,
      `${ms} ms; ${recs.length} evaluados; ideal ${idealRec ? Math.round(idealRec.score * 100) + '%' : 'NO evaluado'}; mejor puntaje ${Math.round((top?.score || 0) * 100)}%`);
    if (c.title === 'Desarrollador Móvil iOS') await shot(s.page, 'F9b_recomendados_ios');
    await s.ctx.close();
    await sleep(15000);
  }
  // del lado del candidato: se evalúan primero las vacantes que coinciden con sus habilidades
  for (const email of ['valentina.cruz@example.com', 'sebastian.arellano@example.com']) {
    if (SOLO && !email.includes(SOLO)) continue;
    const uid = await uidOf(email);
    for (const r of (await db.collection('recommendations').where('candidateRef', '==', uid).get()).docs) await r.ref.delete();
    const tok = await idToken(email);
    const t0 = Date.now();
    const res = await fetch(`${BASE}/api/recommendations/generate`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' } });
    const body = await res.json().catch(() => ({}));
    const mine = (await db.collection('recommendations').where('candidateRef', '==', uid).get()).docs.map((d) => d.data());
    const top = [...mine].sort((a, b) => b.score - a.score)[0];
    const topTitle = top ? (await db.doc(`jobs/${top.jobRef}`).get()).data()?.title : '';
    const expected = email.startsWith('valentina') ? 'Desarrollador Móvil iOS' : 'Ingeniero de Machine Learning';
    record('F9b', 'IA: priorización por habilidades', `${email.split('@')[0]}: la vacante que coincide con su perfil se evalúa primero`, res.status === 200 && topTitle === expected,
      `${Date.now() - t0} ms; ${body.processed ?? '?'} evaluadas; mejor puntaje ${Math.round((top?.score || 0) * 100)}% en «${topTitle}»`);
    await sleep(15000);
  }
}

// ------------------------------------------------------------------ F10: búsqueda y filtros (10 consultas contra el resultado esperado en la base de datos)
if (run('F10')) {
  console.log('\n== F10: Búsqueda y filtros ==');
  const jobs = (await db.collection('jobs').where('status', '==', 'published').get()).docs.map((d) => d.data());
  const jobCount = (o) => jobs.filter((j) =>
    (!o.seniority || j.seniority === o.seniority) && (o.mode === undefined || (o.mode === 'remote' ? j.remoteAllowed : !j.remoteAllowed)) &&
    (!o.days || Date.now() - j.createdAt.toMillis() <= o.days * 864e5) &&
    (!o.q || norm(j.title).includes(norm(o.q)) || norm(j.location).includes(norm(o.q)) || (j.searchTags || []).some((t) => norm(t).includes(norm(o.q))))).length;
  const s = await session('carolina.mejia@example.com', { block: BLOCK_RECS });
  const setSearch = async (page, aria, q) => { await setInput(page, 'input[aria-label="' + aria + '"]', q); };
  const uiCount = async (page, word) => { await sleep(700); const m = (await bodyText(page)).match(new RegExp(`(\\d+) ${word}`)); return m ? Number(m[1]) : -1; };
  const Q = [
    { caso: 'texto «python»', o: { q: 'python' }, apply: async () => setSearch(s.page, 'Buscar vacantes', 'python') },
    { caso: 'texto «diseñador» (con acento)', o: { q: 'diseñador' }, apply: async () => setSearch(s.page, 'Buscar vacantes', 'diseñador') },
    { caso: 'texto «disenador» (sin acento) da lo mismo', o: { q: 'disenador' }, apply: async () => setSearch(s.page, 'Buscar vacantes', 'disenador') },
    { caso: 'seniority Senior', o: { seniority: 'senior' }, apply: async () => { await setSearch(s.page, 'Buscar vacantes', ''); await pickSelect(s.page, { aria: 'Filtrar por seniority' }, 'Senior'); } },
    { caso: 'modalidad remota + Junior', o: { mode: 'remote', seniority: 'junior' }, apply: async () => { await pickSelect(s.page, { aria: 'Filtrar por seniority' }, 'Junior'); await pickSelect(s.page, { aria: 'Filtrar por modalidad' }, 'Remoto permitido'); } },
    { caso: 'publicadas en los últimos 7 días', o: { days: 7 }, apply: async () => { await pickSelect(s.page, { aria: 'Filtrar por seniority' }, 'Todos los niveles'); await pickSelect(s.page, { aria: 'Filtrar por modalidad' }, 'Toda modalidad'); await pickSelect(s.page, { aria: 'Filtrar por fecha de publicación' }, 'Últimos 7 días'); } },
    { caso: 'publicadas en las últimas 24 horas', o: { days: 1 }, apply: async () => { await pickSelect(s.page, { aria: 'Filtrar por fecha de publicación' }, 'Últimas 24 horas'); } },
    { caso: 'presencial + texto «ciudad de mexico» (sin acento)', o: { mode: 'onsite', q: 'ciudad de mexico' }, apply: async () => { await pickSelect(s.page, { aria: 'Filtrar por fecha de publicación' }, 'Cualquier fecha'); await pickSelect(s.page, { aria: 'Filtrar por modalidad' }, 'Solo presencial'); await setSearch(s.page, 'Buscar vacantes', 'ciudad de mexico'); } },
    { caso: 'texto «react» + Junior', o: { q: 'react', seniority: 'junior' }, apply: async () => { await pickSelect(s.page, { aria: 'Filtrar por modalidad' }, 'Toda modalidad'); await pickSelect(s.page, { aria: 'Filtrar por seniority' }, 'Junior'); await setSearch(s.page, 'Buscar vacantes', 'react'); } },
    { caso: 'texto sin coincidencias «zzzz»', o: { q: 'zzzz' }, apply: async () => { await pickSelect(s.page, { aria: 'Filtrar por seniority' }, 'Todos los niveles'); await setSearch(s.page, 'Buscar vacantes', 'zzzz'); } },
  ];
  await go(s.page, '/dashboard/explore', 'Ver y postularme');
  const counts = [];
  for (const q of Q) {
    await q.apply();
    const got = await uiCount(s.page, 'vacantes?');
    const exp = jobCount(q.o);
    counts.push(got);
    const msg = q.o.q === 'zzzz' ? (await hasText(s.page, 'No hay vacantes que coincidan')) : true;
    record('F10', 'Explorar vacantes (candidato)', q.caso, got === exp && msg, `pantalla ${got}, base de datos ${exp}`);
  }
  record('F10', 'Explorar vacantes (candidato)', 'la búsqueda no distingue acentos', counts[1] === counts[2] && counts[1] > 0, `«diseñador» ${counts[1]} = «disenador» ${counts[2]}`);
  await s.ctx.close();
  // reclutadores buscan candidatos
  const cands = (await db.collection('candidates').get()).docs.map((d) => d.data());
  const candCount = (o) => cands.filter((c) =>
    (!o.available || c.available) && (!o.target || c.targetSeniority === o.target) && (!o.level || (c.skills || []).some((k) => k.level >= o.level)) &&
    (!o.q || norm(c.headline).includes(norm(o.q)) || norm(c.fullName).includes(norm(o.q)) || norm(c.location).includes(norm(o.q)) || (c.skills || []).some((k) => norm(k.name).includes(norm(o.q))))).length;
  const r = await session('karla.medina@example.com', { block: BLOCK_RECS });
  await go(r.page, '/dashboard/candidates', 'Contactar');
  const total = await uiCount(r.page, 'candidatos?');
  record('F10', 'Explorar candidatos (reclutador)', 'total de candidatos sin filtros', total === cands.length, `pantalla ${total}, base de datos ${cands.length}`);
  const R = [
    { caso: 'texto «react»', o: { q: 'react' }, apply: async () => setSearch(r.page, 'Buscar candidatos', 'react') },
    { caso: 'texto «ingenieria» (sin acento)', o: { q: 'ingenieria' }, apply: async () => setSearch(r.page, 'Buscar candidatos', 'ingenieria') },
    { caso: 'seniority objetivo Junior', o: { target: 'junior' }, apply: async () => { await setSearch(r.page, 'Buscar candidatos', ''); await pickSelect(r.page, { aria: 'Seniority objetivo' }, 'Junior'); } },
    { caso: 'solo disponibles', o: { available: true }, apply: async () => { await pickSelect(r.page, { aria: 'Seniority objetivo' }, 'Cualquier seniority'); await r.page.click('#available'); } },
    { caso: 'alguna habilidad de nivel 5', o: { level: 5 }, apply: async () => { await r.page.click('#available'); await pickSelect(r.page, { aria: 'Nivel mínimo de habilidad' }, 'Alguna skill nivel 5'); } },
    { caso: 'texto «monterrey» + disponibles', o: { q: 'monterrey', available: true }, apply: async () => { await pickSelect(r.page, { aria: 'Nivel mínimo de habilidad' }, 'Cualquier nivel'); await r.page.click('#available'); await setSearch(r.page, 'Buscar candidatos', 'monterrey'); } },
  ];
  for (const q of R) {
    await q.apply();
    const got = await uiCount(r.page, 'candidatos?');
    record('F10', 'Explorar candidatos (reclutador)', q.caso, got === candCount(q.o), `pantalla ${got}, base de datos ${candCount(q.o)}`);
  }
  await r.ctx.close();
}

// ------------------------------------------------------------------ F11: notificaciones (10 usuarios; 3 las marcan como leídas)
if (run('F11')) {
  console.log('\n== F11: Notificaciones ==');
  const users = ['luis.ramos@example.com', 'andres.gutierrez@example.com', 'oscar.dominguez@example.com', 'rebeca.zamora@example.com', 'laura.beltran@example.com',
    'ricardo.fuentes@example.com', 'karla.medina@example.com', 'daniela.cortes@example.com', 'andrea.villasenor@example.com', 'carolina.mejia@example.com'];
  const unreadInUi = (page) => page.evaluate(() => { const sr = [...document.querySelectorAll('span.sr-only')].find((e) => e.textContent.startsWith('Notificaciones')); const m = sr?.textContent.match(/(\d+) sin leer/); return m ? Number(m[1]) : 0; });
  const unreadInDb = async (uid) => (await db.collection(`users/${uid}/notifications`).orderBy('createdAt', 'desc').limit(20).get()).docs.filter((d) => !d.data().read).length;
  const markers = [];
  for (const [i, email] of users.entries()) {
    const s = await session(email, { block: BLOCK_RECS });
    await sleep(1500);
    const uid = await uidOf(email);
    const ui = await unreadInUi(s.page);
    const dbc = await unreadInDb(uid);
    record('F11', 'Notificaciones', `contador de la campana de ${email.split('@')[0]}`, ui === dbc, `campana ${ui}, base de datos ${dbc}`);
    if (['luis.ramos@example.com', 'ricardo.fuentes@example.com', 'andrea.villasenor@example.com'].includes(email) && dbc > 0) {
      const bell = await s.page.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.querySelector('span.sr-only')?.textContent.startsWith('Notificaciones')));
      await bell.asElement().click();
      await sleep(800);
      if (email.startsWith('luis')) await shot(s.page, 'F11_campana');
      await clickText(s.page, 'Marcar todas como leídas');
      await sleep(2500);
      const dbAfter = await unreadInDb(uid);
      markers.push(email);
      record('F11', 'Notificaciones', `«Marcar todas como leídas» de ${email.split('@')[0]}`, dbAfter === 0, `sin leer antes ${dbc}, después ${dbAfter}`);
    }
    await s.ctx.close();
  }
}

// ------------------------------------------------------------------ F12: panel del administrador (más de 10 acciones)
const dropdownAction = async (page, rowText, itemText) => {
  const btn = await page.evaluateHandle((name) => {
    const row = [...document.querySelectorAll('tbody tr')].find((r) => r.textContent.includes(name));
    return row ? [...row.querySelectorAll('button')].find((b) => b.querySelector('span.sr-only')?.textContent === 'Abrir menú') : null;
  }, rowText);
  if (!btn.asElement()) throw new Error(`Sin menú para ${rowText}`);
  await btn.asElement().evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await btn.asElement().click();
  await sleep(600);
  const item = await page.evaluateHandle((t) => [...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent.trim().includes(t)) || null, itemText);
  if (!item.asElement()) throw new Error(`Sin opción «${itemText}»`);
  await item.asElement().click();
  await sleep(500);
};
const latestAudit = async (action, sinceMs, containsDetails = '') => {
  const snap = await db.collection('auditLogs').orderBy('createdAt', 'desc').limit(40).get();
  return snap.docs.map((d) => d.data()).find((a) => a.action === action && a.createdAt.toMillis() >= sinceMs && (!containsDetails || (a.details || '').includes(containsDetails)));
};
if (run('F12')) {
  console.log('\n== F12: Panel del administrador ==');
  const s = await session('admin@example.com');
  const t00 = Date.now();
  // 1) indicadores del panel contra la base de datos
  await go(s.page, '/dashboard/admin/overview', 'Panel de Administración', 3500);
  const users = (await db.collection('users').get()).docs.map((d) => d.data());
  const jobsAll = (await db.collection('jobs').get()).docs.map((d) => d.data());
  const orgsN = (await db.collection('organizations').get()).size;
  const apps = (await db.collectionGroup('applications').get()).docs.filter((d) => d.ref.path.startsWith('jobs/'));
  const txt = await bodyText(s.page);
  const metric = (title) => { const m = txt.match(new RegExp(title + '\\s*\\n\\s*(\\d+)')); return m ? Number(m[1]) : -1; };
  const M = [
    ['Usuarios Totales', users.length], ['Candidatos', users.filter((u) => u.role === 'candidate').length], ['Organizaciones', orgsN],
    ['Vacantes abiertas', jobsAll.filter((j) => j.status === 'published').length], ['Vacantes cerradas', jobsAll.filter((j) => j.status === 'closed').length], ['Postulaciones', apps.length],
  ];
  for (const [title, exp] of M) record('F12', 'Panel: indicadores', title, metric(title) === exp, `pantalla ${metric(title)}, base de datos ${exp}`);
  await shot(s.page, 'F12_panel');
  // 2) tabla de usuarios
  await go(s.page, '/dashboard/admin/users', 'Todos los Usuarios', 2500);
  const rowsN = await s.page.evaluate(() => document.querySelectorAll('tbody tr').length);
  const firstRole = await s.page.evaluate(() => document.querySelector('tbody tr button[role="combobox"]')?.textContent.trim());
  record('F12', 'Usuarios', 'la tabla lista a todos los usuarios y empieza por los administradores', rowsN === users.length && firstRole === 'Admin', `filas ${rowsN} de ${users.length}; primer rol «${firstRole}»`);
  await s.page.type('input[placeholder="Buscar por nombre, email o rol..."]', 'alejandro quiroz');
  await sleep(600);
  record('F12', 'Usuarios', 'búsqueda por nombre', (await s.page.evaluate(() => document.querySelectorAll('tbody tr').length)) === 1);
  await setInput(s.page, 'input[placeholder="Buscar por nombre, email o rol..."]', '');
  // 3) cambio de rol (ida y vuelta)
  const alej = await uidOf('alejandro.quiroz@example.com');
  let t0 = Date.now();
  await pickSelect(s.page, { aria: 'Rol de Alejandro Quiroz Beltrán' }, 'Reclutador');
  await sleep(2500);
  record('F12', 'Usuarios', 'cambiar el rol de Alejandro a Reclutador', (await db.doc(`users/${alej}`).get()).data().role === 'recruiter' && !!(await latestAudit('user_role_changed', t0 - 2000, 'alejandro.quiroz')));
  t0 = Date.now();
  await pickSelect(s.page, { aria: 'Rol de Alejandro Quiroz Beltrán' }, 'Candidato');
  await sleep(2500);
  record('F12', 'Usuarios', 'devolver a Alejandro al rol Candidato', (await db.doc(`users/${alej}`).get()).data().role === 'candidate');
  // 4) suspender y reactivar a Regina; la cuenta suspendida queda bloqueada
  const reg = await uidOf('regina.palacios@example.com');
  t0 = Date.now();
  await dropdownAction(s.page, 'Regina Palacios Soto', 'Suspender');
  await sleep(2500);
  record('F12', 'Usuarios', 'suspender a Regina', (await db.doc(`users/${reg}`).get()).data().status === 'suspended' && !!(await latestAudit('user_status_changed', t0 - 2000, 'regina.palacios')));
  const sr = await session('regina.palacios@example.com', { block: BLOCK_RECS });
  await sleep(1500);
  const blocked = (await bodyText(sr.page)).includes('Tu cuenta está suspendida');
  const tok = await (async () => { const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${ENV.NEXT_PUBLIC_FB_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'regina.palacios@example.com', password: PASS, returnSecureToken: true }) }); return (await r.json()).idToken; })();
  const apiRes = await fetch(`${BASE}/api/applications/notify-new`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: 'x' }) });
  record('F12', 'Usuarios', 'la cuenta suspendida ve el bloqueo y la API la rechaza', blocked && apiRes.status === 403, `pantalla de bloqueo ${blocked}; API ${apiRes.status}`);
  await shot(sr.page, 'F12_cuenta_suspendida');
  await sr.ctx.close();
  await dropdownAction(s.page, 'Regina Palacios Soto', 'Reactivar');
  await sleep(2500);
  const sr2 = await session('regina.palacios@example.com', { block: BLOCK_RECS });
  record('F12', 'Usuarios', 'reactivar a Regina y volver a entrar', (await db.doc(`users/${reg}`).get()).data().status === 'active' && !(await hasText(sr2.page, 'Tu cuenta está suspendida')));
  await sr2.ctx.close();
  // 5) cambiar la organización de un reclutador (ida y vuelta)
  const xim = await uidOf('ximena.robles@example.com');
  const orgX = (await db.doc(`users/${xim}`).get()).data().organizationRef;
  t0 = Date.now();
  await pickSelect(s.page, { aria: 'Organización de Ximena Robles Ibáñez' }, 'Innova Salud Labs');
  await sleep(2500);
  record('F12', 'Usuarios', 'asignar a Ximena a otra organización', (await db.doc(`users/${xim}`).get()).data().organizationRef === state.orgs.andrea && !!(await latestAudit('user_organization_changed', t0 - 2000, 'ximena.robles')));
  await pickSelect(s.page, { aria: 'Organización de Ximena Robles Ibáñez' }, 'Turismo Tech Riviera');
  await sleep(2500);
  record('F12', 'Usuarios', 'devolver a Ximena a su organización', (await db.doc(`users/${xim}`).get()).data().organizationRef === orgX);
  // 6) organizaciones: validaciones, alta y edición
  await go(s.page, '/dashboard/admin/organizations', 'Nueva organización', 2000);
  await clickText(s.page, 'Nueva organización');
  await sleep(800);
  await clickText(s.page, 'Guardar', 'button', '[role="dialog"]');
  await sleep(800);
  record('F12', 'Organizaciones', 'nombre vacío se rechaza', await hasText(s.page, 'El nombre es requerido'));
  await s.page.type('#org-name', 'Salud Digital Norte');
  await s.page.type('#org-web', 'ftp://archivos.example.com');
  await clickText(s.page, 'Guardar', 'button', '[role="dialog"]');
  await sleep(800);
  record('F12', 'Organizaciones', 'sitio web que no es http(s) se rechaza', await hasText(s.page, 'El sitio web no es válido'));
  await setInput(s.page, '#org-web', 'https://saluddigitalnorte.example.com');
  await setInput(s.page, '#org-desc', 'Clínica digital con atención médica a distancia para el norte del país.');
  t0 = Date.now();
  await clickText(s.page, 'Guardar', 'button', '[role="dialog"]');
  await sleep(3000);
  const orgDoc = (await db.collection('organizations').where('name', '==', 'Salud Digital Norte').get()).docs[0];
  record('F12', 'Organizaciones', 'crear «Salud Digital Norte»', !!orgDoc && orgDoc.data().website === 'https://saluddigitalnorte.example.com' && !!(await latestAudit('organization_created', t0 - 2000, 'Salud Digital Norte')));
  if (orgDoc) {
    await s.page.evaluate(() => { const row = [...document.querySelectorAll('tbody tr')].find((r) => r.textContent.includes('Salud Digital Norte')); row.querySelector('button[aria-label="Editar"]').click(); });
    await sleep(800);
    await setInput(s.page, '#org-desc', 'Clínica digital con telemedicina y expediente electrónico para clínicas del norte del país.');
    await clickText(s.page, 'Guardar', 'button', '[role="dialog"]');
    await sleep(3000);
    record('F12', 'Organizaciones', 'editar la descripción de «Salud Digital Norte»', (await orgDoc.ref.get()).data().description.includes('telemedicina'));
    await shot(s.page, 'F12_organizaciones');
    await orgDoc.ref.delete();
  }
  // 7) vacantes: desactivar, reactivar y eliminar (en cascada)
  await go(s.page, '/dashboard/admin/jobs', 'Todas las Vacantes', 2500);
  const ui = (title) => state.jobs[title];
  t0 = Date.now();
  await dropdownAction(s.page, 'Diseñador UI para Plataformas Educativas', 'Desactivar');
  await sleep(2500);
  record('F12', 'Vacantes', 'desactivar una vacante', (await db.doc(`jobs/${ui('Diseñador UI para Plataformas Educativas')}`).get()).data().status === 'closed' && !!(await latestAudit('job_status_changed', t0 - 2000, 'Diseñador UI')));
  await dropdownAction(s.page, 'Diseñador UI para Plataformas Educativas', 'Reactivar');
  await sleep(2500);
  record('F12', 'Vacantes', 'reactivar la vacante', (await db.doc(`jobs/${ui('Diseñador UI para Plataformas Educativas')}`).get()).data().status === 'published');
  const delTitle = 'Desarrollador Frontend Junior (React)';
  const delId = ui(delTitle);
  const reginaApps = (await db.doc(`users/${reg}/applications/${delId}`).get()).exists;
  t0 = Date.now();
  await dropdownAction(s.page, delTitle, 'Eliminar Vacante');
  await sleep(800);
  await clickText(s.page, 'Sí, eliminar vacante');
  await sleep(5000);
  const left = {
    vacante: (await db.doc(`jobs/${delId}`).get()).exists, postulaciones: (await db.collection(`jobs/${delId}/applications`).get()).size,
    copia: (await db.doc(`users/${reg}/applications/${delId}`).get()).exists, recs: (await db.collection('recommendations').where('jobRef', '==', delId).get()).size,
    entrevistas: (await db.collection('interviews').where('jobRef', '==', delId).get()).size,
  };
  const noteDel = await recentNotif(reg, 'job_removed', t0 - 2000, delTitle);
  record('F12', 'Vacantes', 'eliminar una vacante borra todo lo que depende de ella y avisa al candidato', reginaApps && !left.vacante && !left.postulaciones && !left.copia && !left.recs && !left.entrevistas && !!noteDel && !!(await latestAudit('job_deleted', t0 - 2000, delTitle)),
    `restos ${JSON.stringify(left)}; aviso a Regina ${noteDel ? 'sí' : 'no'}`);
  // 8) auditoría y KPIs
  await go(s.page, '/dashboard/admin/audit', 'Últimas Acciones', 2500);
  const at = await bodyText(s.page);
  const wanted = ['Cambió rol de usuario', 'Cambió estado de usuario', 'Asignó organización', 'Creó organización', 'Editó organización', 'Cambió estado de vacante', 'Eliminó vacante'];
  const seen = wanted.filter((w) => at.includes(w));
  record('F12', 'Auditoría', 'el registro muestra las acciones recién hechas', seen.length === wanted.length, `${seen.length}/${wanted.length}: ${wanted.filter((w) => !at.includes(w)).join(', ') || 'todas'}`);
  await shot(s.page, 'F12_auditoria');
  await clickText(s.page, 'Embudo y KPIs', '[role="tab"]');
  await sleep(2500);
  const kt = await bodyText(s.page);
  const apps2 = (await db.collectionGroup('applications').get()).docs.filter((d) => d.ref.path.startsWith('jobs/')).length;
  record('F12', 'Auditoría', 'el embudo cuenta todas las postulaciones', new RegExp(`${apps2} en total`).test(kt), `pantalla «${(kt.match(/\((\d+) en total\)/) || [])[0]}», base de datos ${apps2}`);
  await shot(s.page, 'F12_kpis');
  // 9) «Ver como» (solo lectura)
  await go(s.page, '/dashboard/admin/users', 'Todos los Usuarios', 2000);
  await dropdownAction(s.page, 'Andrea Villaseñor Lozano', 'Ver como');
  await sleep(3500);
  const vt = await bodyText(s.page);
  const andreaJob = state.jobs['Analista de Datos Clínicos'];
  await go(s.page, `/dashboard/jobs/${andreaJob}`, 'Candidatos Postulados', 2500);
  const closeDisabled = await s.page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Cerrar vacante'))?.disabled);
  record('F12', 'Ver como', 'modo de solo lectura: banner visible y acciones deshabilitadas', /Modo solo lectura/.test(vt) && closeDisabled === true, `banner ${/Modo solo lectura/.test(vt)}; «Cerrar vacante» deshabilitado ${closeDisabled}`);
  await shot(s.page, 'F12_ver_como');
  await clickText(s.page, 'Salir');
  await sleep(2500);
  record('F12', 'Ver como', 'salir vuelve a la gestión de usuarios', (await s.page.evaluate(() => location.pathname)) === '/dashboard/admin/users');
  // 10) perfil de un usuario y perfil propio
  await go(s.page, `/dashboard/users/${await uidOf('carolina.mejia@example.com')}`, 'Información del Usuario', 2000);
  const pt = await bodyText(s.page);
  record('F12', 'Usuarios', 'ficha de un candidato muestra su perfil profesional', pt.includes('Carolina Mejía Barrera') && pt.includes('Perfil profesional') && /\d+ años? de exp\./.test(pt));
  await go(s.page, '/dashboard/profile', 'Información del Administrador', 1500);
  record('F12', 'Administrador', 'su perfil muestra nombre, correo, rol y estado', (await hasText(s.page, 'admin@example.com')) && (await hasText(s.page, 'Administrador')) && (await hasText(s.page, 'Activo')));
  await s.ctx.close();
}

// ------------------------------------------------------------------ F13: cuenta, contraseña, preferencias, tema y recuperación (10+ acciones)
if (run('F13')) {
  console.log('\n== F13: Configuración de la cuenta ==');
  const signIn = async (email, password) => { const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${ENV.NEXT_PUBLIC_FB_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) }); return r.ok; };
  const openAccount = async (page) => { await go(page, '/dashboard/settings', 'Configuración', 1200); await clickText(page, 'Cuenta y Seguridad', '[role="tab"]'); await sleep(800); await page.waitForSelector('input[placeholder="Tu nombre y apellido"]'); };
  // 1-5) cambio de nombre
  const renames = [['carolina.mejia@example.com', 'Carolina Mejía Barrera', 'Carolina Mejía-Barrera'], ['fernando.trevino@example.com', 'Fernando Treviño Salas', 'Fernando Treviño S.'], ['daniela.ochoa@example.com', 'Daniela Ochoa Fuentes', 'Daniela Ochoa F.'],
    ['ricardo.alonso@example.com', 'Ricardo Alonso Peña', 'Ricardo A. Peña'], ['valentina.cruz@example.com', 'Valentina Cruz Moreno', 'Valentina Cruz-Moreno']];
  for (const [email, from, to] of renames) {
    const s = await session(email, { block: BLOCK_RECS });
    await openAccount(s.page);
    await setInput(s.page, 'input[placeholder="Tu nombre y apellido"]', to);
    await clickText(s.page, 'Guardar Cambios');
    await sleep(3000);
    const uid = await uidOf(email);
    const dbName = (await db.doc(`users/${uid}`).get()).data().fullName;
    const authName = (await auth.getUser(uid)).displayName;
    await sleep(500);
    const side = (await bodyText(s.page)).includes(to);
    record('F13', 'Cuenta', `cambiar el nombre de ${from}`, dbName === to && authName === to && side, `perfil «${dbName}»; cuenta de acceso «${authName}»; barra lateral actualizada ${side}`);
    await s.ctx.close();
  }
  // 6-8) cambio de contraseña (con restauración)
  for (const email of ['fernando.trevino@example.com', 'daniela.ochoa@example.com', 'ricardo.alonso@example.com']) {
    const s = await session(email, { block: BLOCK_RECS });
    await openAccount(s.page);
    const pw = await s.page.$$('input[type="password"]');
    await pw[0].type(PASS); await pw[1].type('NuevaClave2026!'); await pw[2].type('NuevaClave2026!');
    await clickText(s.page, 'Guardar Cambios');
    await sleep(3500);
    const newOk = await signIn(email, 'NuevaClave2026!');
    const oldOk = await signIn(email, PASS);
    record('F13', 'Cuenta', `cambiar la contraseña de ${email.split('@')[0]}`, newOk && !oldOk, `entra con la nueva ${newOk}; con la anterior ${oldOk}`);
    await auth.updateUser(await uidOf(email), { password: PASS });
    await s.ctx.close();
  }
  // 9) confirmación distinta
  {
    const s = await session('jimena.salgado@example.com', { block: BLOCK_RECS });
    await openAccount(s.page);
    const pw = await s.page.$$('input[type="password"]');
    await pw[0].type(PASS); await pw[1].type('NuevaClave2026!'); await pw[2].type('OtraClave2026!');
    await clickText(s.page, 'Guardar Cambios');
    await sleep(1500);
    record('F13', 'Cuenta', 'la confirmación de contraseña distinta se rechaza', await hasText(s.page, 'Las nuevas contraseñas no coinciden'));
    await s.ctx.close();
  }
  // 10-12) preferencias de notificación
  for (const email of ['valentina.cruz@example.com', 'emiliano.rojas@example.com', 'jimena.salgado@example.com']) {
    const uid = await uidOf(email);
    await db.doc(`users/${uid}/settings/notifications`).delete().catch(() => {});
    const s = await session(email, { block: BLOCK_RECS });
    await go(s.page, '/dashboard/settings', 'Configuración', 1200);
    await clickText(s.page, 'Notificaciones', '[role="tab"]');
    await sleep(900);
    const before = await s.page.evaluate(() => [...document.querySelectorAll('button[role="switch"]')].map((b) => b.getAttribute('aria-checked')));
    await s.page.evaluate(() => { const sw = [...document.querySelectorAll('button[role="switch"]')].filter((b) => !b.disabled); sw[0].click(); });
    await clickText(s.page, 'Guardar cambios');
    await sleep(2500);
    const saved = (await db.doc(`users/${uid}/settings/notifications`).get()).data();
    await go(s.page, '/dashboard/settings', 'Configuración', 1200);
    await clickText(s.page, 'Notificaciones', '[role="tab"]');
    await sleep(1200);
    const reload = await s.page.evaluate(() => [...document.querySelectorAll('button[role="switch"]')].map((b) => b.getAttribute('aria-checked')));
    record('F13', 'Cuenta', `preferencias de notificación de ${email.split('@')[0]}`, saved?.communication_emails === false && reload[0] === 'false', `por defecto ${JSON.stringify(before)}; guardado communication_emails=${saved?.communication_emails}; tras recargar ${JSON.stringify(reload)}`);
    await s.ctx.close();
  }
  // 13-14) tema claro/oscuro
  for (const email of ['regina.palacios@example.com', 'sebastian.arellano@example.com']) {
    const s = await session(email, { block: BLOCK_RECS });
    await go(s.page, '/dashboard/settings', 'Configuración', 1200);
    const isDark = () => s.page.evaluate(() => document.documentElement.classList.contains('dark'));
    const start = await isDark();
    await s.page.click('#theme-switch');
    await sleep(800);
    const flipped = await isDark();
    await s.page.reload({ waitUntil: 'networkidle2' });
    await sleep(1200);
    const persisted = await isDark();
    record('F13', 'Cuenta', `tema de la interfaz de ${email.split('@')[0]}`, flipped !== start && persisted === flipped, `inicial ${start ? 'oscuro' : 'claro'}; tras un clic ${flipped ? 'oscuro' : 'claro'}; tras recargar ${persisted ? 'oscuro' : 'claro'}`);
    await s.ctx.close();
  }
  // 15-17) recuperación de contraseña (3 correos reales de prueba)
  for (const email of ['carolina.mejia@example.com', 'emiliano.rojas@example.com', 'alejandro.quiroz@example.com']) {
    const s = await session(null);
    await go(s.page, '/forgot-password', 'Recuperar Contraseña', 800);
    await s.page.type('input[placeholder="tu@email.com"]', email);
    await clickText(s.page, 'Enviar correo');
    await sleep(4500);
    const calls = s.log.responses.filter((r) => /accounts:sendOobCode/.test(r.url) && r.status === 200);
    record('F13', 'Recuperar contraseña', `solicitar el correo para ${email.split('@')[0]}`, calls.length >= 1 && (await hasText(s.page, 'Revisa tu correo')), `respuestas 200 de Firebase: ${calls.length}`);
    if (email.startsWith('carolina')) await shot(s.page, 'F13_recuperar_contrasena');
    await s.ctx.close();
  }
}

saveResults(path.join(OUT_DIR, `funcional-2_${TAG}.json`));
await close();
const fails = results.filter((r) => !r.ok);
console.log(`\nPruebas: ${results.length} | correctas: ${results.length - fails.length} | con falla: ${fails.length}`);
for (const f of fails) console.log(' - FALLA', f.fase, f.funcion, f.caso, f.detalle);
process.exit(0);








