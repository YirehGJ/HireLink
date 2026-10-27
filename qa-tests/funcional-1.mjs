// Pruebas funcionales con navegador, parte 1 (fases F0 a F4): limpieza, registro, empresas, vacantes y perfiles con CV.
// Se ejecutan contra STAGING con 10 registros reales por función (ver qa-tests/README.md).
//   node qa-tests/funcional-1.mjs <etiqueta> [F0 F1 F2 F3 F4]      (sin fases = todas, en orden)
import fs from 'fs';
import path from 'path';
import {
  BASE, PASS, sleep, db, auth, TS, uidOf, tryUid, launch, close, session, loginUI, go, bodyText, hasText, waitText,
  setInput, clickText, pickSelect, record, results, saveResults, deleteAccountCascade, deleteJobCascade, OUT_DIR, CV_DIR, STATE_FILE,
} from './lib.mjs';
import { RECRUITERS, CANDIDATES, ALL_QA_EMAILS } from './datos.mjs';

const TAG = process.argv[2] || 'run';
const PHASES = process.argv.slice(3);
const run = (f) => PHASES.length === 0 || PHASES.includes(f);
const SHOTS = path.join(OUT_DIR, `capturas_${TAG}`);
fs.mkdirSync(SHOTS, { recursive: true });
let state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { uids: {}, orgs: {}, jobs: {}, apps: {} };
const saveState = () => fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
const BLOCK_RECS = ['/api/recommendations/generate']; // el recálculo automático se prueba aparte (F9)
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` }).catch(() => {});
const seniorityCode = { 'Intern': 'intern', 'Junior': 'junior', 'Mid-level': 'mid', 'Senior': 'senior', 'Lead': 'lead' };
const parseTags = (s) => { const seen = new Set(); const out = []; for (const raw of s.split(',')) { const t = raw.trim(); if (!t || seen.has(t.toLowerCase())) continue; seen.add(t.toLowerCase()); out.push(t); } return out; };

await launch();

// ------------------------------------------------------------------ F0: limpieza de ejecuciones anteriores
if (run('F0')) {
  console.log('\n== F0: limpieza de cuentas y datos de ejecuciones anteriores ==');
  let n = 0;
  for (const e of ALL_QA_EMAILS) if (await deleteAccountCascade(e)) n++;
  // postulaciones creadas al aceptar matches de datos de ejemplo (F8) en una ejecución anterior
  for (const p of state.created?.apps ?? []) await db.doc(p).delete().catch(() => {});
  state = { uids: {}, orgs: {}, jobs: {}, apps: {}, created: { apps: [] } };
  saveState();
  console.log(`cuentas eliminadas: ${n}`);
}

// ------------------------------------------------------------------ F1: registro (15 cuentas por la pantalla real)
async function registerUI(page, { fullName, email, password = PASS, role, useSelect = false }) {
  await page.goto(BASE + '/register' + (role === 'recruiter' && !useSelect ? '?role=recruiter' : ''), { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForSelector('input[placeholder="Juan Pérez"]', { timeout: 60000 });
  await page.type('input[placeholder="Juan Pérez"]', fullName);
  await page.type('input[placeholder="tu@email.com"]', email);
  await page.type('input[type="password"]', password);
  if (useSelect) await pickSelect(page, { label: 'Tipo de cuenta' }, role === 'recruiter' ? 'Reclutador' : 'Candidato');
  await clickText(page, 'Crear cuenta');
}

if (run('F1')) {
  console.log('\n== F1: Registro e inicio de sesión ==');
  // 4 validaciones negativas en la pantalla de registro
  const anon = await session(null);
  const neg = [
    { caso: 'correo inválido', f: 'Persona Prueba', e: 'correo-invalido', p: 'ClaveSegura123', esperado: 'Email inválido' },
    { caso: 'contraseña de menos de 8 caracteres', f: 'Persona Prueba', e: 'persona.prueba@example.com', p: 'abc123', esperado: 'Mínimo 8 caracteres' },
    { caso: 'nombre de un solo carácter', f: 'A', e: 'persona.prueba@example.com', p: 'ClaveSegura123', esperado: 'Mínimo 2 caracteres' },
  ];
  for (const n of neg) {
    await anon.page.goto(BASE + '/register', { waitUntil: 'networkidle2' });
    await anon.page.waitForSelector('input[placeholder="Juan Pérez"]');
    await anon.page.type('input[placeholder="Juan Pérez"]', n.f);
    await anon.page.type('input[placeholder="tu@email.com"]', n.e);
    await anon.page.type('input[type="password"]', n.p);
    await clickText(anon.page, 'Crear cuenta');
    await sleep(1200);
    record('F1', 'Registro', `validación: ${n.caso}`, await hasText(anon.page, n.esperado), `mensaje esperado «${n.esperado}»`);
  }
  // correo ya registrado
  await anon.page.goto(BASE + '/register', { waitUntil: 'networkidle2' });
  await anon.page.waitForSelector('input[placeholder="Juan Pérez"]');
  await anon.page.type('input[placeholder="Juan Pérez"]', 'Candidato Repetido');
  await anon.page.type('input[placeholder="tu@email.com"]', 'candidato@example.com');
  await anon.page.type('input[type="password"]', 'ClaveSegura123');
  await clickText(anon.page, 'Crear cuenta');
  await sleep(3000);
  record('F1', 'Registro', 'correo ya registrado', /Email ya registrado/.test(await bodyText(anon.page)), 'aviso «Email ya registrado.»');
  // inicio de sesión: contraseña incorrecta
  await anon.page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await anon.page.type('input[placeholder="tu@email.com"]', 'candidato@example.com');
  await anon.page.type('input[type="password"]', 'ClaveIncorrecta999');
  await clickText(anon.page, 'Entrar');
  await sleep(3000);
  record('F1', 'Inicio de sesión', 'contraseña incorrecta', /Credenciales inválidas/.test(await bodyText(anon.page)) && (await anon.page.evaluate(() => location.pathname)) === '/login', 'permanece en /login con aviso');
  await anon.ctx.close();

  // 15 registros reales
  const people = [
    ...RECRUITERS.map((r, i) => ({ ...r, role: 'recruiter', useSelect: i === 0 })),
    ...CANDIDATES.map((c) => ({ ...c, role: 'candidate' })),
  ];
  for (const p of people) {
    const s = await session(null);
    const t0 = Date.now();
    await registerUI(s.page, p);
    let landed = false;
    try { await s.page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 }); landed = true; } catch {}
    await sleep(2500);
    const uid = await tryUid(p.email);
    let doc = null;
    if (uid) { state.uids[p.email] = uid; doc = (await db.doc(`users/${uid}`).get()).data(); }
    const ok = landed && !!doc && doc.role === p.role && doc.status === 'active' && doc.email === p.email && doc.fullName === p.fullName && !doc.organizationRef;
    record('F1', 'Registro', `${p.role === 'recruiter' ? 'reclutador' : 'candidato'}: ${p.fullName}`, ok,
      `${Date.now() - t0} ms; destino ${await s.page.evaluate(() => location.pathname)}; rol guardado «${doc?.role}»`);
    if (p.key === 'andrea' || p.key === 'carolina') await shot(s.page, `F1_${p.key}_tras_registro`);
    // Desde la 1.1 una reclutadora nace sin aprobar (no ve candidatas ni publica). `/api/admin/users` (approve_recruiter)
    // lo hace en la aplicación; aquí se simula con el SDK de administración para que las fases siguientes puedan publicar.
    if (p.role === 'recruiter' && uid) {
      record('F1', 'Registro', `reclutador nace sin aprobar: ${p.fullName}`, doc?.recruiterApproved !== true, 'recruiterApproved ausente o falso');
      await db.doc(`users/${uid}`).update({ recruiterApproved: true });
    }
    await s.ctx.close();
  }
  saveState();
  // inicio de sesión de las 15 cuentas nuevas
  let loginOk = 0;
  for (const p of people) {
    const s = await session(null);
    try { await loginUI(s, p.email); loginOk++; } catch {}
    await s.ctx.close();
  }
  record('F1', 'Inicio de sesión', '15 cuentas nuevas inician sesión con su contraseña', loginOk === 15, `${loginOk}/15`);
}

// ------------------------------------------------------------------ F2: perfil de la empresa (5 empresas)
if (run('F2')) {
  console.log('\n== F2: Perfil de la empresa ==');
  for (const [i, r] of RECRUITERS.entries()) {
    const s = await session(r.email, { block: BLOCK_RECS });
    await go(s.page, '/dashboard/profile', 'Información de la Empresa');
    if (i === 0) {
      // validaciones del formulario
      await s.page.type('input[placeholder="Ej. Tech Innovators Inc."]', r.org.name);
      await s.page.type('input[placeholder="https://tu-empresa.com"]', 'innovasalud');
      await s.page.type('textarea', 'corta');
      await clickText(s.page, 'Guardar Cambios');
      await sleep(1200);
      const t = await bodyText(s.page);
      record('F2', 'Perfil de la empresa', 'sitio web sin https:// se rechaza', /Debe ser una URL válida/.test(t));
      record('F2', 'Perfil de la empresa', 'descripción de menos de 20 caracteres se rechaza', /al menos 20 caracteres/.test(t));
      await setInput(s.page, 'input[placeholder="https://tu-empresa.com"]', 'javascript:alert(1)');
      await clickText(s.page, 'Guardar Cambios');
      await sleep(1000);
      record('F2', 'Perfil de la empresa', 'un enlace javascript: se rechaza', /Debe ser una URL válida/.test(await bodyText(s.page)));
      await setInput(s.page, 'input[placeholder="https://tu-empresa.com"]', r.org.website);
      await setInput(s.page, 'textarea', r.org.description);
    } else {
      await s.page.type('input[placeholder="Ej. Tech Innovators Inc."]', r.org.name);
      await s.page.type('input[placeholder="https://tu-empresa.com"]', r.org.website);
      await setInput(s.page, 'textarea', r.org.description);
    }
    await clickText(s.page, 'Guardar Cambios');
    await sleep(3500);
    const uid = state.uids[r.email] || (await uidOf(r.email));
    const u = (await db.doc(`users/${uid}`).get()).data();
    const org = u?.organizationRef ? (await db.doc(`organizations/${u.organizationRef}`).get()).data() : null;
    const ok = !!org && org.name === r.org.name && org.website === r.org.website && org.ownerUid === uid && org.description === r.org.description;
    if (u?.organizationRef) state.orgs[r.key] = u.organizationRef;
    record('F2', 'Perfil de la empresa', `crear «${r.org.name}»`, ok, `organizationRef=${u?.organizationRef ? 'enlazada' : 'sin enlazar'}`);
    if (i === 0) await shot(s.page, 'F2_empresa_creada');
    await s.ctx.close();
  }
  saveState();
}

// ------------------------------------------------------------------ F3: vacantes (10; 5 con descripción de la IA)
if (run('F3')) {
  console.log('\n== F3: Vacantes ==');
  const aiTimes = [];
  for (const r of RECRUITERS) {
    const s = await session(r.email, { block: BLOCK_RECS });
    for (const j of r.jobs) {
      await go(s.page, '/dashboard/jobs/new', 'Título de la Vacante');
      await s.page.type('input[placeholder="Ej. Ingeniero de Software"]', j.title);
      await s.page.type('input[placeholder="Ej. Ciudad de México, Remoto"]', j.location);
      await s.page.type('input[placeholder="Ej. React, Node.js, Liderazgo"]', j.tags + ', ');   // coma final a propósito
      await pickSelect(s.page, { label: 'Seniority' }, j.seniority);
      if (j.remote) await s.page.click('button[role="switch"]');
      let aiMs = null, aiLen = null;
      if (j.ai) {
        const t0 = Date.now();
        await clickText(s.page, 'Generar con IA');
        let len = 0;
        for (let k = 0; k < 120 && len < 50; k++) { await sleep(1000); len = await s.page.evaluate(() => document.querySelector('textarea')?.value.length ?? 0); }
        aiMs = Date.now() - t0; aiLen = len;
        aiTimes.push(aiMs);
        record('F3', 'IA: descripción de vacante', `«${j.title}»`, len >= 200, `${aiMs} ms; ${len} caracteres`);
      } else {
        await setInput(s.page, 'textarea', j.desc);
      }
      await sleep(500);
      await clickText(s.page, 'Crear Vacante');
      let landed = false;
      try { await s.page.waitForFunction(() => location.pathname === '/dashboard/jobs', { timeout: 40000 }); landed = true; } catch {}
      await sleep(2500);
      const q = await db.collection('jobs').where('organizationRef', '==', state.orgs[r.key]).get();
      const doc = q.docs.find((d) => d.data().title === j.title);
      const d = doc?.data();
      const expectedTags = parseTags(j.tags);
      const ok = landed && !!d && d.status === 'published' && d.seniority === seniorityCode[j.seniority] && d.remoteAllowed === j.remote &&
        JSON.stringify(d.searchTags) === JSON.stringify(expectedTags) && d.location === j.location && (d.descriptionMd || '').length >= 50;
      if (doc) state.jobs[j.title] = doc.id;
      record('F3', 'Vacantes', `crear «${j.title}»`, ok, `etiquetas guardadas ${JSON.stringify(d?.searchTags)}${j.ai ? '' : ''}`);
      if (landed && j.title === 'Desarrollador Móvil iOS') await shot(s.page, 'F3_lista_vacantes');
    }
    await s.ctx.close();
  }
  saveState();
  if (aiTimes.length) record('F3', 'IA: descripción de vacante', `resumen de ${aiTimes.length} generaciones`, true, `promedio ${Math.round(aiTimes.reduce((a, b) => a + b, 0) / aiTimes.length)} ms; mínimo ${Math.min(...aiTimes)} ms; máximo ${Math.max(...aiTimes)} ms`);
}

// ------------------------------------------------------------------ F4: perfil del candidato con CV (10 análisis con IA)
if (run('F4')) {
  console.log('\n== F4: Perfil del candidato y análisis de CV con IA ==');
  const times = [];
  for (const c of CANDIDATES) {
    const s = await session(c.email, { block: BLOCK_RECS });
    await go(s.page, '/dashboard/profile', 'Información Principal');
    const input = await s.page.$('#cv-upload');
    const t0 = Date.now();
    await input.uploadFile(path.join(CV_DIR, `${c.cv}.pdf`));
    const gotPreview = await waitText(s.page, 'Vista previa: sugerencias de la IA', 180000);
    const ms = Date.now() - t0;
    times.push(ms);
    const txt = await bodyText(s.page);
    const sk = Number((txt.match(/Habilidades \((\d+)\)/) || [])[1] || 0);
    const ex = Number((txt.match(/Experiencia \((\d+)\)/) || [])[1] || 0);
    const ed = Number((txt.match(/Educación \((\d+)\)/) || [])[1] || 0);
    record('F4', 'IA: análisis de CV', `${c.fullName}`, gotPreview && sk >= 3 && ex >= 1 && ed >= 1, `${ms} ms; habilidades ${sk}, experiencia ${ex}, educación ${ed}`);
    if (!gotPreview) { await shot(s.page, `F4_${c.key}_sin_vista_previa`); await s.ctx.close(); continue; }
    if (c.key === 'sebastian') await shot(s.page, 'F4_vista_previa_ia');
    await clickText(s.page, 'Aplicar sugerencias');
    await sleep(800);
    await pickSelect(s.page, { label: 'Seniority al que aspiras' }, c.seniority);
    await clickText(s.page, 'Guardar Perfil');
    await sleep(3500);
    const uid = state.uids[c.email] || (await uidOf(c.email));
    const d = (await db.doc(`candidates/${uid}`).get()).data();
    const ok = !!d && (d.headline || '').length >= 5 && (d.skills || []).length >= 3 && (d.cvText || '').length > 100 && (d.cvSummary || '').length > 20 &&
      d.targetSeniority === seniorityCode[c.seniority] && d.fullName === c.fullName && d.email === c.email;
    record('F4', 'Perfil del candidato', `guardar perfil de ${c.fullName}`, ok, `titular «${d?.headline}»; ${(d?.skills || []).length} habilidades; objetivo ${d?.targetSeniority}`);
    await s.ctx.close();
    await sleep(6000); // respeta el límite de tokens por minuto de la IA gratuita
  }
  if (times.length) record('F4', 'IA: análisis de CV', `resumen de ${times.length} análisis`, true, `promedio ${Math.round(times.reduce((a, b) => a + b, 0) / times.length)} ms; mínimo ${Math.min(...times)} ms; máximo ${Math.max(...times)} ms`);
}

saveResults(path.join(OUT_DIR, `funcional-1_${TAG}.json`));
await close();
const fails = results.filter((r) => !r.ok);
console.log(`\nPruebas: ${results.length} | correctas: ${results.length - fails.length} | con falla: ${fails.length}`);
for (const f of fails) console.log(' - FALLA', f.fase, f.funcion, f.caso, f.detalle);
process.exit(0);


