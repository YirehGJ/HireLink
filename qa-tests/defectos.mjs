// Sondas de defectos de HireLink contra staging. Cada sonda devuelve { defecto: true|false, detalle }.
// Se ejecutaron antes y después de corregir cada hallazgo (ver el informe extra de la Semana 4).
//   node qa-tests/defectos.mjs <etiqueta> [P01 P02 ...]      (sin códigos = todas)
import fs from 'fs';
import path from 'path';
import { BASE, PASS, sleep, db, TS, uidOf, launch, browser, OUT_DIR, cspViolations, watchCsp } from './lib.mjs';

const TAG = process.argv[2] || 'despues';
const ONLY = process.argv.slice(3);
await launch();
async function session(email, { uncheckRemember = false } = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const log = { console: [], requests: [] };
  watchCsp(page);
  page.on('console', (m) => { if (m.type() === 'error') log.console.push(m.text().slice(0, 240)); });
  page.on('request', (r) => log.requests.push(r.url()));
  if (email) {
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2', timeout: 180000 });
    await page.waitForSelector('input[type="password"]', { timeout: 90000 });
    await page.type('input[placeholder="tu@email.com"]', email);
    await page.type('input[type="password"]', PASS);
    if (uncheckRemember) {
      const checked = await page.$eval('button[role="checkbox"]', (b) => b.getAttribute('aria-checked') === 'true');
      if (checked) await page.click('button[role="checkbox"]');
    }
    await Promise.all([
      page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 120000 }),
      page.click('button[type="submit"]'),
    ]);
    await sleep(2500);
  }
  return { page, ctx, log };
}
async function go(page, route, waitText, settle = 1800) {
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 180000 });
  if (waitText) await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout: 60000 }, waitText);
  await sleep(settle);
}
const bodyText = (page) => page.evaluate(() => document.body.innerText);
const setInput = (page, sel, val) =>
  page.evaluate((s, v) => {
    const el = document.querySelector(s);
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, sel, val);
// Clic real con el ratón (los componentes Radix, como las pestañas, responden a mousedown).
async function clickText(page, text, tag = 'button') {
  const h = await page.evaluateHandle((t, tg) => {
    const els = [...document.querySelectorAll(tg)];
    return els.find((e) => e.textContent.trim() === t) || els.find((e) => e.textContent.trim().includes(t)) || null;
  }, text, tag);
  const el = h.asElement();
  if (!el) throw new Error(`No se encontró «${text}»`);
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await el.click();
}

const results = [];
async function probe(id, titulo, fn) {
  if (ONLY.length && !ONLY.includes(id)) return;
  const t0 = Date.now();
  try {
    const r = await fn();
    results.push({ id, titulo, ...r, ms: Date.now() - t0 });
    console.log(`${id.padEnd(4)} ${(r.defecto ? 'DEFECTO' : 'OK     ')}  ${titulo}\n       -> ${r.detalle}`);
  } catch (e) {
    results.push({ id, titulo, defecto: null, detalle: 'ERROR DE LA SONDA: ' + e.message, ms: Date.now() - t0 });
    console.log(`${id.padEnd(4)} ERROR    ${titulo}\n       -> ${e.message}`);
  }
}

// ---------------------------------------------------------------- P1 recuperar contraseña
await probe('P01', 'Recuperar contraseña envía un correo real', async () => {
  const s = await session(null);
  await go(s.page, '/forgot-password', 'Recuperar Contraseña');
  await s.page.type('input[placeholder="tu@email.com"]', 'samuel.vargas@example.com');
  const before = s.log.requests.length;
  await s.page.click('button[type="submit"]');
  await sleep(4500);
  const calls = s.log.requests.slice(before).filter((u) => /identitytoolkit\.googleapis\.com.*sendOobCode/i.test(u));
  const txt = await bodyText(s.page);
  await s.ctx.close();
  return { defecto: calls.length === 0, detalle: `solicitudes a Firebase (sendOobCode): ${calls.length}; mensaje de éxito mostrado: ${/enviado|recibir[aá]s/i.test(txt)}` };
});

// ---------------------------------------------------------------- P2 recuérdame
const authStorage = (page) => page.evaluate(async () => {
  const idb = await new Promise((res) => {
    const rq = indexedDB.open('firebaseLocalStorageDb');
    rq.onsuccess = () => {
      try {
        const tx = rq.result.transaction('firebaseLocalStorage', 'readonly');
        const c = tx.objectStore('firebaseLocalStorage').count();
        c.onsuccess = () => res(c.result);
        c.onerror = () => res(-1);
      } catch { res(0); }
    };
    rq.onerror = () => res(-1);
  });
  const ses = Object.keys(sessionStorage).filter((k) => k.startsWith('firebase:authUser')).length;
  const loc = Object.keys(localStorage).filter((k) => k.startsWith('firebase:authUser')).length;
  return { idb: idb + loc, ses, loc };
});
await probe('P02', '«Recuérdame» desmarcado limita la sesión a la pestaña', async () => {
  const s = await session('elena.navarro@example.com', { uncheckRemember: true });
  const info = await authStorage(s.page);
  await s.ctx.close();
  return { defecto: info.idb > 0, detalle: `sesión en IndexedDB (persistente): ${info.idb}; en sessionStorage: ${info.ses}` };
});
await probe('P02b', '«Recuérdame» marcado (por defecto) mantiene la sesión persistente', async () => {
  const s = await session('elena.navarro@example.com');
  const info = await authStorage(s.page);
  await s.ctx.close();
  return { defecto: info.idb === 0, detalle: `sesión en IndexedDB (persistente): ${info.idb}; en sessionStorage: ${info.ses}` };
});
// ---------------------------------------------------------------- P3 guard /dashboard/jobs
await probe('P03', 'Un candidato no ve la pantalla de gestión de vacantes', async () => {
  const s = await session('elena.navarro@example.com');
  await go(s.page, '/dashboard/jobs');
  const txt = await bodyText(s.page);
  await s.ctx.close();
  return { defecto: /Gestión de Vacantes/.test(txt), detalle: /Gestión de Vacantes/.test(txt) ? 'el candidato ve «Gestión de Vacantes» y el botón «Crear Vacante»' : 'bloqueado o redirigido' };
});

// ---------------------------------------------------------------- P4 markdown en tarjetas y detalle
await probe('P04', 'Las descripciones se muestran sin símbolos de Markdown', async () => {
  const s = await session('elena.navarro@example.com');
  await go(s.page, '/dashboard/explore', 'Ver y postularme');
  const card = await bodyText(s.page);
  await go(s.page, '/dashboard/jobs/seed_job_bi', 'Habilidades Requeridas');
  const det = await bodyText(s.page);
  await s.ctx.close();
  const c = (card.match(/##/g) || []).length, d = (det.match(/##/g) || []).length;
  return { defecto: c + d > 0, detalle: `símbolos «##» visibles: tarjetas=${c}, detalle=${d}` };
});

// ---------------------------------------------------------------- P5 pluralización
await probe('P05', 'Concordancia «1 año / N años» de experiencia', async () => {
  const s = await session('karla.medina@example.com');
  await go(s.page, '/dashboard/candidates', 'Contactar');
  const txt = await bodyText(s.page);
  await s.ctx.close();
  const bad = (txt.match(/\b1 años/g) || []).length;
  return { defecto: bad > 0, detalle: `apariciones de «1 años»: ${bad}` };
});

// ---------------------------------------------------------------- P6 perfil del administrador
await probe('P06', 'El perfil del administrador muestra sus datos', async () => {
  const s = await session('admin@example.com');
  await go(s.page, '/dashboard/profile', 'Mi Perfil de Administrador');
  const txt = await bodyText(s.page);
  await s.ctx.close();
  const has = /admin@example\.com/.test(txt.split('Cerrar Sesión').pop() || '') || /Información del Administrador/.test(txt);
  return { defecto: !/Información del Administrador/.test(txt), detalle: /Información del Administrador/.test(txt) ? 'muestra la tarjeta con rol, estado e id' : 'la página queda vacía (solo título)' };
});

// ---------------------------------------------------------------- P7 eliminar vacante en cascada
await probe('P07', 'Eliminar una vacante no deja datos huérfanos', async () => {
  const luis = await uidOf('luis.ramos@example.com');
  const laura = await uidOf('laura.beltran@example.com');
  const jid = 'qa_probe_job_1';
  const now = TS.now();
  await db.doc(`jobs/${jid}`).set({ organizationRef: 'seed_org_aurora', title: 'Vacante de prueba de eliminación', descriptionMd: 'Texto de prueba para validar la eliminación en cascada de una vacante.', location: 'Ciudad de México, México', seniority: 'mid', remoteAllowed: false, contractType: 'Full-time', status: 'published', searchTags: ['QA'], createdAt: now });
  const app = { candidateRef: luis, jobRef: jid, status: 'applied', source: 'recommendation', cvRef: '', appliedAt: now, updatedAt: now };
  await db.doc(`jobs/${jid}/applications/${luis}`).set(app);
  await db.doc(`users/${luis}/applications/${jid}`).set(app);
  await db.doc(`recommendations/${luis}_${jid}`).set({ candidateRef: luis, jobRef: jid, score: 0.7, reasons: ['Prueba'], status: 'pending', engineVersion: 'qa', createdAt: now, updatedAt: now });
  await db.doc('interviews/qa_probe_interview_1').set({ jobRef: jid, jobTitle: 'Vacante de prueba de eliminación', organizationRef: 'seed_org_aurora', candidateRef: luis, candidateName: 'Luis Fernando Ramos Aguilar', interviewerRef: laura, type: 'video', scheduledStart: TS.fromDate(new Date(Date.now() + 3 * 864e5)), location: 'Videollamada', createdAt: now });
  const s = await session('laura.beltran@example.com');
  await go(s.page, `/dashboard/jobs/${jid}`, 'Candidatos Postulados');
  await clickText(s.page, 'Eliminar');
  await sleep(700);
  await clickText(s.page, 'Sí, eliminar');
  await s.page.waitForFunction(() => location.pathname === '/dashboard/jobs', { timeout: 30000 }).catch(() => {});
  await sleep(2500);
  await s.ctx.close();
  const left = {
    vacante: (await db.doc(`jobs/${jid}`).get()).exists ? 1 : 0,
    postulaciones: (await db.collection(`jobs/${jid}/applications`).get()).size,
    copiasCandidato: (await db.doc(`users/${luis}/applications/${jid}`).get()).exists ? 1 : 0,
    recomendaciones: (await db.collection('recommendations').where('jobRef', '==', jid).get()).size,
    entrevistas: (await db.collection('interviews').where('jobRef', '==', jid).get()).size,
  };
  const orphans = left.postulaciones + left.copiasCandidato + left.recomendaciones + left.entrevistas;
  // Limpieza de lo que haya quedado
  await db.doc(`jobs/${jid}`).delete().catch(() => {});
  await db.doc(`jobs/${jid}/applications/${luis}`).delete().catch(() => {});
  await db.doc(`users/${luis}/applications/${jid}`).delete().catch(() => {});
  await db.doc(`recommendations/${luis}_${jid}`).delete().catch(() => {});
  await db.doc('interviews/qa_probe_interview_1').delete().catch(() => {});
  return { defecto: orphans > 0 || left.vacante > 0, detalle: `tras eliminar: ${JSON.stringify(left)}` };
});

// ---------------------------------------------------------------- P8 entrevista en el pasado
await probe('P08', 'No se puede agendar una entrevista en una fecha pasada', async () => {
  const valeria = await uidOf('valeria.nunez@example.com');
  const s = await session('laura.beltran@example.com');
  await go(s.page, '/dashboard/jobs/seed_job_riesgo', 'Candidatos Postulados');
  // la tabla se llena después del título: se espera a que aparezca la fila de Valeria
  await s.page.waitForFunction(() => [...document.querySelectorAll('tr')].some((r) => r.textContent.includes('Valeria')), { timeout: 45000 });
  // fila de Valeria
  await s.page.evaluate(() => {
    const row = [...document.querySelectorAll('tr')].find((r) => r.textContent.includes('Valeria'));
    [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Detalles').click();
  });
  await sleep(1000);
  await setInput(s.page, '#int-date', '2024-01-15');
  await setInput(s.page, '#int-place', 'https://meet.example.com/entrevista-pasada');
  await clickText(s.page, 'Agendar y notificar');
  await sleep(4500);
  const txt = await bodyText(s.page);
  const q = await db.collection('interviews').where('candidateRef', '==', valeria).where('jobRef', '==', 'seed_job_riesgo').get();
  const created = q.docs.filter((d) => d.data().location.includes('entrevista-pasada'));
  // Limpieza y restauración
  for (const d of created) await d.ref.delete();
  await db.doc(`jobs/seed_job_riesgo/applications/${valeria}`).update({ status: 'screening' });
  await db.doc(`users/${valeria}/applications/seed_job_riesgo`).update({ status: 'screening' }).catch(() => {});
  await s.ctx.close();
  return { defecto: created.length > 0, detalle: `entrevistas creadas con fecha 2024-01-15: ${created.length}; aviso en pantalla: ${/Entrevista agendada/.test(txt) ? 'Entrevista agendada' : (/fecha|hora/i.test(txt) ? 'rechazada con aviso' : 'sin aviso')}` };
});

// ---------------------------------------------------------------- P9 etiquetas vacías / duplicadas
await probe('P09', 'Las habilidades de la vacante se normalizan (sin vacíos ni duplicados)', async () => {
  const s = await session('laura.beltran@example.com');
  await go(s.page, '/dashboard/jobs/new', 'Título de la Vacante');
  await s.page.type('input[placeholder="Ej. Ingeniero de Software"]', 'Analista de Datos Financieros QA');
  await s.page.type('input[placeholder="Ej. Ciudad de México, Remoto"]', 'Ciudad de México, México');
  await s.page.type('input[placeholder="Ej. React, Node.js, Liderazgo"]', 'React,, Node.js , ,react,  ');
  await setInput(s.page, 'textarea', 'Analiza información financiera y construye reportes para la dirección. Requiere experiencia con SQL y comunicación clara.');
  await clickText(s.page, 'Crear Vacante');
  await s.page.waitForFunction(() => location.pathname === '/dashboard/jobs', { timeout: 40000 }).catch(() => {});
  await sleep(2500);
  const q = await db.collection('jobs').where('title', '==', 'Analista de Datos Financieros QA').get();
  const tags = q.empty ? null : q.docs[0].data().searchTags;
  await sleep(6000); // deja terminar el cálculo de recomendaciones en segundo plano
  for (const d of q.docs) {
    const recs = await db.collection('recommendations').where('jobRef', '==', d.id).get();
    for (const r of recs.docs) await r.ref.delete();
    await db.recursiveDelete(d.ref);
  }
  await s.ctx.close();
  const bad = tags && (tags.some((t) => !String(t).trim()) || new Set(tags.map((t) => String(t).toLowerCase())).size !== tags.length);
  return { defecto: tags === null ? null : !!bad, detalle: `etiquetas guardadas: ${JSON.stringify(tags)}` };
});

// ---------------------------------------------------------------- P10 botón volver del candidato
await probe('P10', 'En el detalle de una vacante, «Volver» regresa a Explorar', async () => {
  const s = await session('elena.navarro@example.com');
  await go(s.page, '/dashboard/jobs/seed_job_bi', 'Habilidades Requeridas');
  const href = await s.page.evaluate(() => [...document.querySelectorAll('a')].find((a) => a.textContent.trim() === 'Volver')?.getAttribute('href'));
  await s.ctx.close();
  return { defecto: href !== '/dashboard/explore', detalle: `enlace «Volver»: ${href}` };
});

// ---------------------------------------------------------------- P11 errores de permisos en consola (feed)
await probe('P11', 'El inicio del candidato no genera errores de permisos en consola', async () => {
  const s = await session('elena.navarro@example.com');
  await go(s.page, '/dashboard', 'Match', 3000);
  const errs = s.log.console.filter((t) => /insufficient permissions|Warning: Function components/.test(t));
  await s.ctx.close();
  return { defecto: errs.length > 0, detalle: `errores relevantes: ${errs.length}${errs[0] ? ' | ' + errs[0].slice(0, 110) : ''}` };
});

// ---------------------------------------------------------------- P12 guard sin parpadeo / consultas no autorizadas
await probe('P12', 'Un reclutador en /admin no dispara consultas no autorizadas', async () => {
  const s = await session('laura.beltran@example.com');
  s.log.console.length = 0;
  await go(s.page, '/dashboard/admin/users', null, 3000);
  const errs = s.log.console.filter((t) => /insufficient permissions/.test(t));
  await s.ctx.close();
  return { defecto: errs.length > 0, detalle: `consultas denegadas: ${errs.length}${errs[0] ? ' | ' + errs[0].slice(0, 100) : ''}` };
});

// ---------------------------------------------------------------- P13 contraseña incorrecta
await probe('P13', 'Con contraseña actual incorrecta no se aplica ningún cambio de cuenta', async () => {
  const samuel = await uidOf('samuel.vargas@example.com');
  const original = (await db.doc(`users/${samuel}`).get()).data().fullName;
  const s = await session('samuel.vargas@example.com');
  await go(s.page, '/dashboard/settings', 'Configuración');
  await clickText(s.page, 'Cuenta y Seguridad', '[role="tab"]');
  await sleep(800);
  await s.page.waitForSelector('input[placeholder="Tu nombre y apellido"]');
  await s.page.click('input[placeholder="Tu nombre y apellido"]', { clickCount: 3 });
  await s.page.type('input[placeholder="Tu nombre y apellido"]', 'Samuel Vargas QA Cambiado');
  const pw = await s.page.$$('input[type="password"]');
  await pw[0].type('ClaveIncorrecta99');
  await pw[1].type('NuevaClave12345');
  await pw[2].type('NuevaClave12345');
  await clickText(s.page, 'Guardar Cambios');
  await sleep(4000);
  const txt = await bodyText(s.page);
  const after = (await db.doc(`users/${samuel}`).get()).data().fullName;
  await db.doc(`users/${samuel}`).update({ fullName: original });
  await s.ctx.close();
  return { defecto: after !== original, detalle: `aviso: ${/contraseña actual es incorrecta/.test(txt) ? '«contraseña actual incorrecta»' : 'otro'}; nombre guardado: «${after}» (original «${original}»)` };
});

// ---------------------------------------------------------------- P16 idioma del documento
await probe('P16', 'El documento declara el idioma español', async () => {
  const s = await session(null);
  await go(s.page, '/login');
  const lang = await s.page.evaluate(() => document.documentElement.lang);
  const title = await s.page.title();
  await s.ctx.close();
  return { defecto: lang !== 'es', detalle: `lang="${lang}", título="${title}"` };
});

// ---------------------------------------------------------------- P17 preferencias por defecto
await probe('P17', 'Las preferencias de correo muestran el valor que el servidor aplica', async () => {
  const email = 'natalia.cervantes@example.com';
  const uid = await uidOf(email);
  await db.doc(`users/${uid}/settings/notifications`).delete().catch(() => {});
  const s = await session(email);
  await go(s.page, '/dashboard/settings', 'Configuración');
  await clickText(s.page, 'Notificaciones', '[role="tab"]');
  await sleep(1000);
  const states = await s.page.evaluate(() => [...document.querySelectorAll('button[role="switch"]')].map((b) => b.getAttribute('aria-checked')));
  await s.ctx.close();
  // El servidor envía por defecto (opt-out): el primer interruptor debe verse activado.
  return { defecto: states[0] !== 'true', detalle: `interruptores sin preferencia guardada: ${JSON.stringify(states)} (el servidor envía por defecto)` };
});

// ---------------------------------------------------------------- P18 recursos de terceros
await probe('P18', 'La aplicación no solicita imágenes a servicios externos', async () => {
  const s = await session('karla.medina@example.com');
  await go(s.page, '/dashboard/candidates', 'Contactar', 2500);
  const ext = s.log.requests.filter((u) => /picsum\.photos/.test(u));
  await s.ctx.close();
  return { defecto: ext.length > 0, detalle: `solicitudes a picsum.photos: ${ext.length} (se envía el identificador de cada persona)` };
});

// ---------------------------------------------------------------- P19 etiquetas del panel
await probe('P19', 'El panel del administrador no etiqueta «nuevos» al total de candidatos', async () => {
  const s = await session('admin@example.com');
  await go(s.page, '/dashboard/admin/overview', 'Panel de Administración');
  const txt = await bodyText(s.page);
  await s.ctx.close();
  return { defecto: /Nuevos candidatos/.test(txt), detalle: /Nuevos candidatos/.test(txt) ? 'tarjeta «Nuevos candidatos» muestra el total acumulado' : 'etiqueta corregida' };
});

// ---------------------------------------------------------------- P20 el reclutador ve sus entrevistas
await probe('P20', 'El reclutador ve en el calendario las entrevistas agendadas de su vacante', async () => {
  const diego = await uidOf('diego.hernandez@example.com');
  const laura = await uidOf('laura.beltran@example.com');
  const iid = 'qa_probe_interview_2';
  await db.doc(`interviews/${iid}`).set({ jobRef: 'seed_job_riesgo', jobTitle: 'Analista de Riesgo Crediticio (Data)', organizationRef: 'seed_org_aurora', candidateRef: diego, candidateName: 'Diego Hernández Soto', interviewerRef: laura, type: 'video', scheduledStart: TS.fromDate(new Date(Date.now() + 2 * 864e5)), location: 'https://meet.example.com/cancelar', createdAt: TS.now() });
  const s = await session('laura.beltran@example.com');
  await go(s.page, '/dashboard/jobs/seed_job_riesgo', 'Candidatos Postulados');
  s.log.console.length = 0;
  await clickText(s.page, 'Entrevistas', '[role="tab"]');
  await sleep(2500);
  const txt = await bodyText(s.page);
  const denied = s.log.console.filter((t) => /insufficient permissions/.test(t)).length;
  const visible = /\d+ entrevistas? en total/.test(txt);
  await db.doc(`interviews/${iid}`).delete().catch(() => {});
  await s.ctx.close();
  return { defecto: !visible, detalle: `consultas denegadas por Firestore: ${denied}; calendario muestra «N entrevistas en total»: ${visible}` };
});

// ---------------------------------------------------------------- P21 cancelar entrevista avisa al candidato
await probe('P21', 'Cancelar una entrevista la elimina y avisa al candidato', async () => {
  const diego = await uidOf('diego.hernandez@example.com');
  const laura = await uidOf('laura.beltran@example.com');
  const before = (await db.collection(`users/${diego}/notifications`).get()).size;
  const iid = 'qa_probe_interview_4';
  const when = new Date(Date.now() + 2 * 864e5);
  await db.doc(`interviews/${iid}`).set({ jobRef: 'seed_job_riesgo', jobTitle: 'Analista de Riesgo Crediticio (Data)', organizationRef: 'seed_org_aurora', candidateRef: diego, candidateName: 'Diego Hernández Soto', interviewerRef: laura, type: 'video', scheduledStart: TS.fromDate(when), location: 'https://meet.example.com/cancelar', createdAt: TS.now() });
  const s = await session('laura.beltran@example.com');
  await go(s.page, '/dashboard/jobs/seed_job_riesgo', 'Candidatos Postulados');
  await clickText(s.page, 'Entrevistas', '[role="tab"]');
  await sleep(2000);
  const cellH = await s.page.evaluateHandle((d) => [...document.querySelectorAll('td button, button[name="day"]')].find((b) => b.textContent.trim() === String(d) && !b.disabled && !/outside/.test(b.className)) || null, when.getDate());
  if (cellH.asElement()) await cellH.asElement().click();
  await sleep(900);
  const cancelBtn = await s.page.$('button[aria-label="Cancelar entrevista"]');
  // Cancelar pide confirmación desde la 1.1.
  if (cancelBtn) { await cancelBtn.click(); await sleep(700); await clickText(s.page, 'Cancelar entrevista', 'button', '[role="alertdialog"]'); await sleep(3500); }
  const after = (await db.collection(`users/${diego}/notifications`).get()).size;
  const gone = !(await db.doc(`interviews/${iid}`).get()).exists;
  await db.doc(`interviews/${iid}`).delete().catch(() => {});
  const notes = await db.collection(`users/${diego}/notifications`).get();
  for (const n of notes.docs) if (/cancel/i.test(n.data().title + n.data().body) && !n.data().seed) await n.ref.delete();
  await s.ctx.close();
  return { defecto: !cancelBtn || !gone || after <= before, detalle: `botón de cancelar disponible: ${!!cancelBtn}; entrevista eliminada: ${gone}; avisos del candidato antes/después: ${before}/${after}` };
});
// ---------------------------------------------------------------- P22 sin sesión
await probe('P22', 'Sin sesión, una página del dashboard lleva al inicio de sesión y regresa tras entrar', async () => {
  const s = await session(null);
  await s.page.goto(BASE + '/dashboard/jobs/seed_job_bi', { waitUntil: 'networkidle2', timeout: 120000 });
  await s.page.waitForFunction(() => location.pathname === '/login', { timeout: 15000 }).catch(() => {});
  const url1 = s.page.url().replace(BASE, '');
  let back = '(no se intentó)';
  if (url1.startsWith('/login')) {
    await s.page.waitForSelector('input[type="password"]', { timeout: 30000 });
    await s.page.type('input[placeholder="tu@email.com"]', 'elena.navarro@example.com');
    await s.page.type('input[type="password"]', PASS);
    await s.page.click('button[type="submit"]');
    await s.page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 }).catch(() => {});
    await sleep(1500);
    back = s.page.url().replace(BASE, '');
  }
  await s.ctx.close();
  return { defecto: !url1.startsWith('/login') || back !== '/dashboard/jobs/seed_job_bi', detalle: `redirigido a: ${url1}; tras iniciar sesión: ${back}` };
});

// ---------------------------------------------------------------- P23 hora del aviso de entrevista
await probe('P23', 'El aviso de entrevista muestra la hora agendada (servidor en UTC)', async () => {
  const valeria = await uidOf('valeria.nunez@example.com');
  const started = Date.now();
  const s = await session('laura.beltran@example.com');
  await go(s.page, '/dashboard/jobs/seed_job_riesgo', 'Candidatos Postulados');
  await s.page.evaluate(() => {
    const row = [...document.querySelectorAll('tr')].find((r) => r.textContent.includes('Valeria'));
    [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Detalles').click();
  });
  await sleep(1000);
  const d = new Date(Date.now() + 3 * 864e5);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  await setInput(s.page, '#int-date', iso);
  await setInput(s.page, '#int-time', '10:00');
  await setInput(s.page, '#int-place', 'https://meet.example.com/prueba-hora');
  await clickText(s.page, 'Agendar y notificar');
  await sleep(5000);
  const notes = await db.collection(`users/${valeria}/notifications`).orderBy('createdAt', 'desc').limit(5).get();
  const mine = notes.docs.find((n) => n.data().type === 'interview_scheduled' && n.data().createdAt.toMillis() >= started);
  const body = mine ? mine.data().body : '(sin aviso)';
  const ok = /10:00\s?a\.?\s?m/i.test(body);
  // Limpieza y restauración
  const q = await db.collection('interviews').where('candidateRef', '==', valeria).where('jobRef', '==', 'seed_job_riesgo').get();
  for (const x of q.docs) if (x.data().location.includes('prueba-hora')) await x.ref.delete();
  if (mine) await mine.ref.delete();
  await db.doc(`jobs/seed_job_riesgo/applications/${valeria}`).update({ status: 'screening' });
  await db.doc(`users/${valeria}/applications/seed_job_riesgo`).update({ status: 'screening' }).catch(() => {});
  const audits = await db.collection('auditLogs').orderBy('createdAt', 'desc').limit(10).get();
  for (const a of audits.docs) if (a.data().action === 'interview_scheduled' && a.data().createdAt.toMillis() >= started) await a.ref.delete();
  await s.ctx.close();
  return { defecto: !ok, detalle: `agendada a las 10:00 (hora local); el aviso dice: «${body.slice(-70)}»` };
});
// ---------------------------------------------------------------- P24 política de contenido (CSP)
await probe('P24', 'La política de contenido no bloquea nada de lo que la aplicación necesita', async () => {
  const vistas = [...new Set(cspViolations)];
  return { defecto: vistas.length > 0, detalle: vistas.length ? `${vistas.length} bloqueos: ${vistas.slice(0, 3).join(' | ')}` : 'ninguna violación en todas las sondas anteriores (cabecera Content-Security-Policy activa)' };
});
fs.writeFileSync(path.join(OUT_DIR, `defectos_${TAG}.json`), JSON.stringify(results, null, 2));
await browser.close();
const d = results.filter((r) => r.defecto === true).length;
console.log(`\nSondas: ${results.length} | con defecto: ${d} | correctas: ${results.filter((r) => r.defecto === false).length} | con error de sonda: ${results.filter((r) => r.defecto === null).length}`);
process.exit(0);





