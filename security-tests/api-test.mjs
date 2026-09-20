// Pruebas de seguridad de la API + carga (100 usuarios simultáneos) contra un servidor en marcha.
// Uso: node api-test.mjs http://localhost:3000
// Usa SOLO cuentas/datos desechables (sec.*) que se eliminan al terminar.
import fs from 'fs';
import admin from 'firebase-admin';

const BASE = process.argv[2] || 'http://localhost:3000';
const env = fs.readFileSync('.env.local', 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.+)$', 'm')) || [])[1]?.trim().replace(/^"|"$/g, '');
admin.initializeApp({ credential: admin.credential.cert({ projectId: get('FIREBASE_PROJECT_ID'), clientEmail: get('FIREBASE_CLIENT_EMAIL'), privateKey: get('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n') }) });
const adb = admin.firestore();
const aauth = admin.auth();
const KEY = get('NEXT_PUBLIC_FB_API_KEY');
const PASS = 'TestPass1234';
const EMAILS = ['sec.reca', 'sec.recb', 'sec.cand1', 'sec.cand2', 'sec.susp'].map((s) => `${s}@example.com`);

async function token(email) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASS, returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error('login falló ' + email + ' ' + JSON.stringify(j).slice(0, 100));
  return j.idToken;
}
async function api(path, tok, body, method = 'POST') {
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json, headers: res.headers };
}

const results = [];
const expect = (name, got, want) => results.push({ name, ok: Array.isArray(want) ? want.includes(got) : got === want, note: `HTTP ${got} (esperado ${want})` });

const created = [];
async function mkUser(email, role, extra = {}) {
  let u;
  try { u = await aauth.getUserByEmail(email); await aauth.updateUser(u.uid, { password: PASS }); } catch { u = await aauth.createUser({ email, password: PASS }); }
  await adb.doc(`users/${u.uid}`).set({ id: u.uid, email, fullName: email, role, status: 'active', ...extra });
  return u.uid;
}
async function cleanup() {
  for (const p of created) { try { await adb.doc(p).delete(); } catch {} }
  for (const e of EMAILS) { try { const u = await aauth.getUserByEmail(e); await aauth.deleteUser(u.uid); await adb.doc(`users/${u.uid}`).delete(); await adb.doc(`candidates/${u.uid}`).delete(); } catch {} }
}

function pct(arr, p) { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; }

const uids = {};
try {
  await cleanup();
  const orgA = await adb.collection('organizations').add({ name: 'SEC Org A' }); created.push(orgA.path);
  const orgB = await adb.collection('organizations').add({ name: 'SEC Org B' }); created.push(orgB.path);
  uids.reca = await mkUser('sec.reca@example.com', 'recruiter', { organizationRef: orgA.id });
  uids.recb = await mkUser('sec.recb@example.com', 'recruiter', { organizationRef: orgB.id });
  uids.cand1 = await mkUser('sec.cand1@example.com', 'candidate');
  uids.cand2 = await mkUser('sec.cand2@example.com', 'candidate');
  uids.susp = await mkUser('sec.susp@example.com', 'candidate', { status: 'suspended' });
  const job = await adb.collection('jobs').add({ organizationRef: orgA.id, title: 'SEC Job', descriptionMd: 'x'.repeat(60), searchTags: ['a'], seniority: 'junior', location: 'x', remoteAllowed: false, status: 'published' }); created.push(job.path);
  await adb.doc(`jobs/${job.id}/applications/${uids.cand1}`).set({ candidateRef: uids.cand1, jobRef: job.id, status: 'screening' });
  await adb.doc(`candidates/${uids.cand1}`).set({ userRef: uids.cand1, headline: 'Dev', fullName: 'Cand Uno', skills: [] });
  await adb.doc(`recommendations/${uids.cand1}_${job.id}`).set({ candidateRef: uids.cand1, jobRef: job.id, score: 0.9, status: 'pending', reasons: [] }); created.push(`recommendations/${uids.cand1}_${job.id}`);

  const T = {};
  for (const [k, e] of [['reca', 'sec.reca'], ['recb', 'sec.recb'], ['cand1', 'sec.cand1'], ['cand2', 'sec.cand2'], ['susp', 'sec.susp']]) T[k] = await token(`${e}@example.com`);

  // ---------- 1) sin autenticación ----------
  for (const p of ['/api/audit', '/api/ai/extract-cv', '/api/ai/generate-description', '/api/applications/notify-new', '/api/applications/notify-status', '/api/recommendations/generate', '/api/recommendations/generate-for-job', '/api/matches/respond']) {
    expect(`A01 sin token -> ${p}`, (await api(p, null, {})).status, 401);
    expect(`A02 token falso -> ${p}`, (await api(p, 'eyJhbGciOiJSUzI1NiJ9.e30.x', {})).status, 401);
  }
  // ---------- 2) roles ----------
  expect('A03 candidato usa generar descripción (solo reclutador)', (await api('/api/ai/generate-description', T.cand1, { title: 'x', seniority: 'junior', searchTags: [] })).status, 403);
  expect('A04 reclutador usa análisis de CV (solo candidato)', (await api('/api/ai/extract-cv', T.reca, { cvText: 'x'.repeat(100) })).status, 403);
  expect('A05 candidato registra auditoría de admin', (await api('/api/audit', T.cand1, { action: 'user_role_changed', targetType: 'user', targetId: 'x' })).status, 403);
  expect('A06 reclutador registra auditoría de admin', (await api('/api/audit', T.reca, { action: 'user_role_changed', targetType: 'user', targetId: 'x' })).status, 403);
  expect('A07 reclutador registra auditoría permitida', (await api('/api/audit', T.reca, { action: 'job_updated', targetType: 'job', targetId: job.id })).status, 200);
  expect('A08 candidato manda notify-status', (await api('/api/applications/notify-status', T.cand1, { jobId: job.id, candidateUid: uids.cand1, newStatus: 'hired' })).status, 403);
  expect('A09 candidato genera candidatos de una vacante', (await api('/api/recommendations/generate-for-job', T.cand1, { jobId: job.id })).status, 403);
  expect('A10 reclutador usa generar recomendaciones de candidato', (await api('/api/recommendations/generate', T.reca, {})).status, 403);
  // ---------- 3) aislamiento entre organizaciones ----------
  expect('A11 reclutador B notify-status en vacante de A', (await api('/api/applications/notify-status', T.recb, { jobId: job.id, candidateUid: uids.cand1, newStatus: 'screening' })).status, 403);
  expect('A12 reclutador B genera candidatos de vacante de A', (await api('/api/recommendations/generate-for-job', T.recb, { jobId: job.id })).status, 403);
  expect('A13 reclutador B acepta match de A', (await api('/api/matches/respond', T.recb, { recId: `${uids.cand1}_${job.id}`, action: 'accept' })).status, 403);
  // ---------- 4) validación de entrada / notificaciones falsas ----------
  expect('A14 notify a un usuario sin postulación', (await api('/api/applications/notify-status', T.reca, { jobId: job.id, candidateUid: uids.cand2, newStatus: 'hired' })).status, 404);
  expect('A15 estado que no coincide con la postulación', (await api('/api/applications/notify-status', T.reca, { jobId: job.id, candidateUid: uids.cand1, newStatus: 'hired' })).status, 409);
  expect('A16 estado inválido', (await api('/api/applications/notify-status', T.reca, { jobId: job.id, candidateUid: uids.cand1, newStatus: '<script>' })).status, 400);
  expect('A17 notify correcto (estado coincide)', (await api('/api/applications/notify-status', T.reca, { jobId: job.id, candidateUid: uids.cand1, newStatus: 'screening' })).status, 200);
  expect('A18 candidato 2 rechaza match de candidato 1', (await api('/api/matches/respond', T.cand2, { recId: `${uids.cand1}_${job.id}`, action: 'reject' })).status, 403);
  expect('A19 candidato intenta ACEPTAR su propio match', (await api('/api/matches/respond', T.cand1, { recId: `${uids.cand1}_${job.id}`, action: 'accept' })).status, 403);
  expect('A20 acción inválida en match', (await api('/api/matches/respond', T.reca, { recId: `${uids.cand1}_${job.id}`, action: 'delete' })).status, 400);
  expect('A21 CV demasiado largo (DoS)', (await api('/api/ai/extract-cv', T.cand1, { cvText: 'x'.repeat(50000) })).status, 413);
  expect('A22 CV vacío', (await api('/api/ai/extract-cv', T.cand1, { cvText: 'corto' })).status, 400);
  expect('A23 body no-JSON', (await api('/api/audit', T.reca, undefined)).status, [400, 403]);
  // ---------- 5) suspendidos ----------
  for (const p of ['/api/audit', '/api/ai/extract-cv', '/api/recommendations/generate', '/api/applications/notify-new']) {
    expect(`A24 cuenta suspendida -> ${p}`, (await api(p, T.susp, { cvText: 'x'.repeat(100), jobId: job.id })).status, 403);
  }
  // ---------- 6) idempotencia: no se puede inundar de notificaciones ----------
  await adb.doc(`jobs/${job.id}/applications/${uids.cand2}`).set({ candidateRef: uids.cand2, jobRef: job.id, status: 'applied' });
  const n1 = await api('/api/applications/notify-new', T.cand2, { jobId: job.id });
  const n2 = await api('/api/applications/notify-new', T.cand2, { jobId: job.id });
  results.push({ name: 'A25 notify-new es idempotente (2ª llamada no duplica avisos)', ok: n1.status === 200 && n2.json?.duplicate === true, note: `1ª=${n1.status}, 2ª duplicate=${n2.json?.duplicate}` });
  // ---------- 7) límite de uso ----------
  const codes = [];
  for (let i = 0; i < 13; i++) codes.push((await api('/api/ai/extract-cv', T.cand2, { cvText: 'corto' })).status);
  results.push({ name: 'A26 límite de uso en IA (10/h): a la 11ª llamada -> 429', ok: codes.slice(0, 10).every((c) => c === 400) && codes.slice(10).every((c) => c === 429), note: codes.join(',') });
  // ---------- 8) cabeceras ----------
  const home = await fetch(BASE + '/');
  const h = home.headers;
  results.push({ name: 'H01 X-Frame-Options=DENY', ok: h.get('x-frame-options') === 'DENY', note: String(h.get('x-frame-options')) });
  results.push({ name: 'H02 X-Content-Type-Options=nosniff', ok: h.get('x-content-type-options') === 'nosniff', note: String(h.get('x-content-type-options')) });
  results.push({ name: 'H03 Strict-Transport-Security presente', ok: !!h.get('strict-transport-security'), note: String(h.get('strict-transport-security')) });
  results.push({ name: 'H04 no revela X-Powered-By', ok: !h.get('x-powered-by'), note: String(h.get('x-powered-by')) });
  results.push({ name: 'H05 API sin caché (no-store)', ok: (await api('/api/audit', null, {})).headers.get('cache-control') === 'no-store', note: '' });
  // ---------- 9) las Server Actions de IA ya no son públicas ----------
  const src = ['src/ai/flows/extract-cv-data-flow.ts', 'src/ai/flows/generate-job-description-flow.ts', 'src/ai/flows/match-candidate-job-flow.ts'].map((f) => fs.readFileSync(f, 'utf8'));
  results.push({ name: 'A27 los flujos de IA no están expuestos como Server Actions', ok: src.every((s) => !/^\s*['"]use server['"]/m.test(s)), note: '' });

  // ================= CARGA: 100 usuarios simultáneos =================
  const load = async (name, fn, n = 100) => {
    const t0 = Date.now(); const lat = [];
    const out = await Promise.all(Array.from({ length: n }, async (_, i) => { const s = Date.now(); try { const r = await fn(i); lat.push(Date.now() - s); return r; } catch (e) { lat.push(Date.now() - s); return { status: 0 }; } }));
    const okc = out.filter((r) => r.status >= 200 && r.status < 300).length;
    console.log(`LOAD ${name}: ${okc}/${n} OK | total ${Date.now() - t0}ms | p50 ${pct(lat, 50)}ms p95 ${pct(lat, 95)}ms max ${Math.max(...lat)}ms`);
    return okc;
  };
  const okPages = await load('100 visitas simultáneas a /login', () => fetch(BASE + '/login').then((r) => ({ status: r.status })));
  const okHome = await load('100 visitas simultáneas a /', () => fetch(BASE + '/').then((r) => ({ status: r.status })));
  const toks = [T.reca, T.recb, T.cand1, T.cand2];
  // 100 usuarios DISTINTOS (desechables), cada uno con su propia sesión, llamando a la vez.
  const LOAD_UIDS = Array.from({ length: 100 }, (_, i) => `secload${String(i).padStart(3, '0')}`);
  for (const uid of LOAD_UIDS) {
    try { await aauth.createUser({ uid, email: `${uid}@example.com`, password: PASS }); } catch {}
    await adb.doc(`users/${uid}`).set({ id: uid, email: `${uid}@example.com`, fullName: uid, role: 'recruiter', status: 'active', organizationRef: orgA.id });
  }
  const loadTokens = [];
  for (let i = 0; i < LOAD_UIDS.length; i += 20) {
    const chunk = LOAD_UIDS.slice(i, i + 20);
    loadTokens.push(...await Promise.all(chunk.map(async (uid) => {
      const custom = await aauth.createCustomToken(uid);
      const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: custom, returnSecureToken: true }) });
      return (await r.json()).idToken;
    })));
  }
  const okAudit = await load('100 USUARIOS DISTINTOS llamando a la vez a la API autenticada (token + Firestore + auditoría)', (i) => api('/api/audit', loadTokens[i], { action: 'job_updated', targetType: 'job', targetId: job.id }).then((r) => ({ status: r.status })));
  // Ráfaga abusiva: un solo usuario lanza 100 llamadas simultáneas. Debe responder rápido (200 o 429), sin errores 5xx ni colgarse.
  const burstStatus = [];
  const burstLat = [];
  await Promise.all(Array.from({ length: 100 }, async () => { const s = Date.now(); const r = await api('/api/audit', T.reca, { action: 'job_updated', targetType: 'job', targetId: job.id }); burstLat.push(Date.now() - s); burstStatus.push(r.status); }));
  const burstOk = burstStatus.filter((s) => s === 200).length, burst429 = burstStatus.filter((s) => s === 429).length, burst5xx = burstStatus.filter((s) => s >= 500 || s === 0).length;
  console.log(`LOAD ráfaga abusiva de 1 usuario x100: ${burstOk} OK, ${burst429} bloqueadas (429), ${burst5xx} errores 5xx | max ${Math.max(...burstLat)}ms`);
  results.push({ name: 'L05 ráfaga abusiva de 1 usuario: sin errores 5xx y sin colgarse (<6s)', ok: burst5xx === 0 && Math.max(...burstLat) < 6000 && burst429 > 0, note: `${burstOk} OK / ${burst429} x 429 / ${burst5xx} x 5xx, máx ${Math.max(...burstLat)}ms` });
  await aauth.deleteUsers(LOAD_UIDS).catch(() => {});
  for (const uid of LOAD_UIDS) await adb.doc(`users/${uid}`).delete().catch(() => {});
  const okRead = await load('100 lecturas simultáneas de Firestore con reglas (REST)', (i) => fetch(`https://firestore.googleapis.com/v1/projects/${get('NEXT_PUBLIC_FB_PROJECT_ID')}/databases/(default)/documents/jobs/${job.id}`, { headers: { Authorization: `Bearer ${toks[i % 4]}` } }).then((r) => ({ status: r.status })));
  results.push({ name: 'L01 100 simultáneos: /login', ok: okPages === 100, note: `${okPages}/100` });
  results.push({ name: 'L02 100 simultáneos: /', ok: okHome === 100, note: `${okHome}/100` });
  results.push({ name: 'L03 100 simultáneos: API autenticada', ok: okAudit === 100, note: `${okAudit}/100` });
  results.push({ name: 'L04 100 simultáneos: lecturas Firestore', ok: okRead === 100, note: `${okRead}/100` });
} catch (e) {
  console.error('ERROR:', e);
} finally {
  const rl = await adb.collection('rateLimits').get(); for (const d of rl.docs) { try { await d.ref.delete(); } catch {} }
  await cleanup();
  const bad = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.name} -> ${r.note}`);
  console.log(`\n${results.length - bad.length}/${results.length} correctas, ${bad.length} fallos`);
  process.exit(0);
}
