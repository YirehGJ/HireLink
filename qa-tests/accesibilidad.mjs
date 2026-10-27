// Pruebas de teclado, celular y primeros pasos con navegador real (Semana 6). No usan la IA ni gastan tokens.
//   node qa-tests/accesibilidad.mjs <etiqueta>
//
// Cubren lo que axe-core no puede comprobar solo: el orden del teclado, el enlace «Saltar al contenido», el menú del
// celular (se abre, atrapa el foco, se cierra con Esc y al navegar), que ninguna página desborde a 375 px y que la guía
// de primeros pasos aparezca, avance y se pueda cerrar. Las cuentas que crea se eliminan al terminar.
import path from 'path';
import {
  BASE, PASS, sleep, launch, close, session, go, record, results, saveResults, deleteAccountCascade, OUT_DIR, checkCsp,
} from './lib.mjs';

const TAG = process.argv[2] || 'corrida';
const F = 'A11Y';
const CELULAR = { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const ESCRITORIO = { width: 1366, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false };
const EMAIL_CAND = 'qa.a11y.candidata@example.com';
const EMAIL_REC = 'qa.a11y.reclutador@example.com';

const ok = (funcion, caso, cond, detalle = '') => record(F, funcion, caso, cond, detalle);
const activo = (page) => page.evaluate(() => {
  const e = document.activeElement;
  return {
    tag: e?.tagName?.toLowerCase(), id: e?.id || '', enDialogo: !!e?.closest('[role="dialog"]'),
    texto: (e?.getAttribute('aria-label') || e?.getAttribute('placeholder') || e?.textContent || '').trim().slice(0, 60),
  };
});
const tab = async (page, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press('Tab'); await sleep(60); } };
const tieneIndicadorDeFoco = (page) => page.evaluate(() => {
  const e = document.activeElement;
  if (!e || e === document.body) return false;
  const s = getComputedStyle(e);
  return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
});

await launch();
try {
  // ---------------------------------------------------------------- limpieza previa (la prueba se puede repetir)
  for (const e of [EMAIL_CAND, EMAIL_REC]) await deleteAccountCascade(e);

  // ---------------------------------------------------------------- 1. páginas públicas
  console.log('\n== 1. Páginas públicas: «Saltar al contenido», landmarks y HTML estático ==');
  const anon = await session(null);
  const p = anon.page;
  await p.setViewport(ESCRITORIO);
  for (const [ruta, nombre] of [['/', 'Inicio'], ['/login', 'Iniciar sesión'], ['/register', 'Registro'], ['/forgot-password', 'Recuperar contraseña']]) {
    await go(p, ruta, null, 800);
    const info = await p.evaluate(() => ({
      mains: document.querySelectorAll('main').length,
      h1: document.querySelectorAll('h1').length,
      skip: !!document.querySelector('a[href="#contenido"]'),
      idContenido: !!document.getElementById('contenido'),
    }));
    ok(nombre, 'tiene exactamente un <main> y un <h1>', info.mains === 1 && info.h1 === 1, `main ${info.mains}, h1 ${info.h1}`);
    ok(nombre, 'tiene el enlace «Saltar al contenido» y su destino', info.skip && info.idContenido);
    await p.keyboard.press('Tab'); // recién cargada la página, el primer Tab debe llegar al enlace
    await sleep(150);
    const a = await activo(p);
    const visible = await p.evaluate(() => { const r = document.activeElement?.getBoundingClientRect(); return !!r && r.width > 40 && r.height > 20; });
    ok(nombre, 'el primer Tab llega al enlace «Saltar al contenido» y se ve', /Saltar al contenido/.test(a.texto) && visible, a.texto);
    await p.keyboard.press('Enter');
    await sleep(200);
    ok(nombre, 'Enter lleva el foco al contenido principal', (await activo(p)).id === 'contenido');
  }
  // El formulario de inicio de sesión y el de registro ya vienen en el HTML (sin esperar al JavaScript).
  for (const [ruta, marca, nombre] of [['/login', 'Iniciar Sesión', 'Inicio de sesión'], ['/register', 'Únete a HireLink', 'Registro']]) {
    const html = await (await fetch(BASE + ruta)).text();
    ok(nombre, 'el formulario viene en el HTML inicial (se dibuja antes de que cargue el JavaScript)', html.includes(marca) && html.includes('type="password"'), `${html.length} bytes`);
  }
  // Orden del teclado en el inicio de sesión
  await go(p, '/login', null, 800);
  const orden = [];
  for (let i = 0; i < 9; i++) { await tab(p); const a = await activo(p); orden.push(a.texto || a.tag); }
  // Desde la 1.1 el botón «Google» está apagado salvo NEXT_PUBLIC_GOOGLE_LOGIN=true: después de «Entrar» sigue el enlace de registro.
  const esperado = ['Saltar al contenido', 'HireLink', 'tu@email.com', '********', 'Mostrar contraseña', 'Recuérdame', '¿Olvidaste', 'Entrar'];
  const enOrden = esperado.every((x, i) => (x === 'Recuérdame' ? orden[i] === 'button' || orden[i] === 'Recuérdame' || /checkbox/.test(orden[i]) || orden[i] === '' : orden[i]?.includes(x)))
    && /Google|Regístrate/.test(orden[8] || '');
  ok('Inicio de sesión', 'el teclado recorre en orden: saltar, logo, correo, contraseña, ver contraseña, recuérdame, olvidé, entrar y, al final, Google (si está activo) o el enlace de registro', enOrden, orden.join(' > '));
  await anon.ctx.close();

  // ---------------------------------------------------------------- 2. escritorio autenticado
  console.log('\n== 2. Escritorio con sesión de candidato ==');
  const cand = await session('candidato@example.com');
  const c = cand.page;
  await c.setViewport(ESCRITORIO);
  await go(c, '/dashboard', 'Tus Próximas Oportunidades', 1500);
  const lm = await c.evaluate(() => ({
    mains: document.querySelectorAll('main').length,
    nav: !!document.querySelector('nav[aria-label="Menú principal"]'),
    lateral: !!document.querySelector('[role="complementary"][aria-label="Barra lateral"]'),
    actual: document.querySelector('nav[aria-label="Menú principal"] a[aria-current="page"]')?.textContent?.trim(),
    topbarVisible: (() => { const h = document.querySelector('header.sticky'); return !!h && getComputedStyle(h).display !== 'none'; })(),
    ancho: document.documentElement.scrollWidth,
  }));
  ok('Menú lateral', 'landmarks: un main, la navegación «Menú principal» y la barra lateral', lm.mains === 1 && lm.nav && lm.lateral);
  ok('Menú lateral', 'la opción actual se marca con aria-current', lm.actual === 'Inicio', String(lm.actual));
  ok('Menú lateral', 'la barra superior del celular no se ve en escritorio', !lm.topbarVisible);
  await c.evaluate(() => { document.activeElement?.blur?.(); });
  await tab(c);
  ok('Teclado', 'primer Tab: «Saltar al contenido principal»', /Saltar al contenido/.test((await activo(c)).texto));
  await c.keyboard.press('Enter');
  await sleep(200);
  ok('Teclado', 'el salto deja el foco en el contenido (no en el menú)', (await activo(c)).id === 'contenido');
  await tab(c);
  const siguiente = await activo(c);
  ok('Teclado', 'el siguiente Tab cae dentro del contenido, no en el menú', siguiente.tag !== 'body' && !(await c.evaluate(() => !!document.activeElement?.closest('[role="complementary"]'))), `${siguiente.tag} «${siguiente.texto}»`);
  // Indicador de foco visible en el menú
  await c.evaluate(() => { document.querySelector('nav[aria-label="Menú principal"] a')?.focus(); });
  ok('Teclado', 'el foco del menú se ve (anillo u contorno)', await tieneIndicadorDeFoco(c));
  await cand.ctx.close();

  // ---------------------------------------------------------------- 3. celular
  console.log('\n== 3. Celular (375 px) ==');
  const mob = await session('candidato@example.com');
  const m = mob.page;
  await m.setViewport(CELULAR);
  for (const [ruta, espera, nombre] of [
    ['/dashboard', 'Tus Próximas Oportunidades', 'Inicio'],
    ['/dashboard/explore', 'Explorar Vacantes', 'Explorar vacantes'],
    ['/dashboard/profile', 'Información Principal', 'Mi perfil'],
    ['/dashboard/applications', 'Mis Postulaciones', 'Mis postulaciones'],
    ['/dashboard/settings', 'Configuración', 'Configuración'],
  ]) {
    await go(m, ruta, espera, 1800);
    const d = await m.evaluate(() => {
      const ancho = Math.max(document.documentElement.scrollWidth, window.innerWidth);
      const lateral = document.querySelector('[role="complementary"]');
      const rl = lateral?.getBoundingClientRect();
      return { ancho, lateralVisible: !!rl && rl.width > 0 && getComputedStyle(lateral).display !== 'none' };
    });
    ok(nombre, 'no hay desbordamiento horizontal a 375 px', d.ancho <= 376, `ancho ${d.ancho}`);
    ok(nombre, 'el menú lateral no ocupa la pantalla', !d.lateralVisible);
  }
  await go(m, '/dashboard', 'Tus Próximas Oportunidades', 1500);
  const barra = await m.evaluate(() => {
    const h = document.querySelector('header.sticky');
    const t = document.querySelector('[data-sidebar="trigger"]');
    const r = t?.getBoundingClientRect();
    return { barra: !!h && getComputedStyle(h).display !== 'none', boton: !!t, w: r?.width, h: r?.height, nombre: t?.textContent?.trim(), campana: [...(h?.querySelectorAll('button .sr-only') ?? [])].some((s) => s.textContent.includes('Notificaciones')) };
  });
  ok('Menú del celular', 'hay barra superior con botón de menú y campana', barra.barra && barra.boton && barra.campana, JSON.stringify(barra));
  ok('Menú del celular', 'el botón de menú mide al menos 44 x 44 px', barra.w >= 44 && barra.h >= 44, `${barra.w}x${barra.h}`);
  ok('Menú del celular', 'el botón de menú tiene nombre accesible en español', /menú/i.test(barra.nombre || ''), barra.nombre);
  await m.focus('[data-sidebar="trigger"]');
  await m.keyboard.press('Enter');
  await sleep(500);
  const dlg = await m.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return { abierto: !!d, titulo: d?.querySelector('[id^="radix"]')?.textContent?.trim() || d?.getAttribute('aria-labelledby'), nav: !!d?.querySelector('nav[aria-label="Menú principal"]'), opciones: [...(d?.querySelectorAll('nav a') ?? [])].map((a) => a.textContent.trim()) };
  });
  ok('Menú del celular', 'Enter abre el panel con la navegación', dlg.abierto && dlg.nav, dlg.opciones.join(', '));
  ok('Menú del celular', 'el foco queda dentro del panel', (await activo(m)).enDialogo);
  const fondo = await m.evaluate(() => {
    const color = getComputedStyle(document.querySelector('[role="dialog"]')).backgroundColor;
    const partes = (color.match(/rgba?\(([^)]+)\)/)?.[1] ?? '').split(',').map((x) => parseFloat(x));
    return { color, alfa: partes.length === 4 ? partes[3] : 1 };
  });
  ok('Menú del celular', 'el panel tiene fondo opaco (no se transparenta la página)', fondo.alfa >= 0.95, fondo.color);
  let dentro = true;
  for (let i = 0; i < 14; i++) { await tab(m); if (!(await activo(m)).enDialogo) dentro = false; }
  ok('Menú del celular', 'el foco no se escapa del panel al recorrerlo con Tab', dentro);
  await m.keyboard.press('Escape');
  await sleep(500);
  ok('Menú del celular', 'Esc cierra el panel', !(await m.evaluate(() => !!document.querySelector('[role="dialog"]'))));
  ok('Menú del celular', 'al cerrar, el foco vuelve al botón de menú', await m.evaluate(() => document.activeElement?.matches('[data-sidebar="trigger"]')));
  await m.click('[data-sidebar="trigger"]');
  await sleep(500);
  await m.evaluate(() => [...document.querySelectorAll('[role="dialog"] nav a')].find((a) => a.textContent.includes('Explorar Vacantes'))?.click());
  await m.waitForFunction(() => location.pathname === '/dashboard/explore', { timeout: 30000 }).catch(() => {});
  await sleep(1000);
  ok('Menú del celular', 'al elegir una opción se navega y el panel se cierra', (await m.evaluate(() => location.pathname)) === '/dashboard/explore' && !(await m.evaluate(() => !!document.querySelector('[role="dialog"]'))));
  await mob.ctx.close();

  // ---------------------------------------------------------------- 4. diálogo del reclutador (foco)
  console.log('\n== 4. Diálogos: el foco entra y vuelve ==');
  const rec = await session('reclutar@example.com');
  const r = rec.page;
  await go(r, '/dashboard/jobs/seed_job_frontend_jr', 'Candidatos Postulados', 2500);
  const abrio = await r.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Detalles' && x.closest('tr')); b?.focus(); b?.click(); return !!b; });
  await sleep(700);
  ok('Detalles del candidato', 'el botón abre un diálogo y el foco pasa a él', abrio && (await activo(r)).enDialogo);
  await r.keyboard.press('Escape');
  await sleep(500);
  ok('Detalles del candidato', 'Esc lo cierra y el foco vuelve al botón «Detalles»', await r.evaluate(() => !document.querySelector('[role="dialog"]') && document.activeElement?.textContent?.trim() === 'Detalles'));
  await rec.ctx.close();

  // ---------------------------------------------------------------- 5. primeros pasos
  console.log('\n== 5. Guía de primeros pasos (cuentas nuevas) ==');
  async function registrar(page, email, nombre, rol) {
    await page.goto(BASE + '/register' + (rol === 'recruiter' ? '?role=recruiter' : ''), { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('input[placeholder="Juan Pérez"]', { timeout: 60000 });
    await sleep(600);
    await page.type('input[placeholder="Juan Pérez"]', nombre);
    await page.type('input[placeholder="tu@email.com"]', email);
    await page.type('input[type="password"]', PASS);
    const tipo = await page.evaluate(() => document.querySelector('button[role="combobox"]')?.textContent?.trim());
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Crear cuenta')?.click());
    const entro = await page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 }).then(() => true).catch(() => false);
    if (!entro) console.log('   (no entró al panel) ' + (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 240));
    await sleep(2500);
    return tipo;
  }
  const nuevaC = await session(null);
  await nuevaC.page.setViewport(ESCRITORIO);
  const tipoC = await registrar(nuevaC.page, EMAIL_CAND, 'Candidata Accesibilidad', 'candidate');
  ok('Registro', 'sin parámetro, el tipo de cuenta por defecto es candidato', /Candidato/.test(tipoC || ''), tipoC);
  await sleep(1500);
  let txt = await nuevaC.page.evaluate(() => document.body.innerText);
  ok('Primeros pasos', 'candidata nueva: aparece la guía con 0 de 3 pasos', txt.includes('Primeros pasos') && txt.includes('0 de 3 completados'));
  ok('Primeros pasos', 'el paso del CV está marcado como opcional', /Deja que la IA lea tu CV\s*\(opcional\)/.test(txt));
  await nuevaC.page.evaluate(() => document.querySelector('button[aria-label="Cerrar los primeros pasos"]')?.click());
  await sleep(500);
  ok('Primeros pasos', 'se puede cerrar', !(await nuevaC.page.evaluate(() => document.body.innerText)).includes('Primeros pasos'));
  await nuevaC.page.reload({ waitUntil: 'networkidle2' });
  await sleep(2500);
  ok('Primeros pasos', 'al recargar sigue cerrada (se recuerda en el navegador)', !(await nuevaC.page.evaluate(() => document.body.innerText)).includes('Primeros pasos'));
  await nuevaC.ctx.close();

  const nuevaR = await session(null);
  await nuevaR.page.setViewport(ESCRITORIO);
  const tipoR = await registrar(nuevaR.page, EMAIL_REC, 'Reclutador Accesibilidad', 'recruiter');
  ok('Registro', 'con ?role=recruiter el tipo de cuenta queda en Reclutador', /Reclutador/.test(tipoR || ''), tipoR);
  await sleep(1500);
  txt = await nuevaR.page.evaluate(() => document.body.innerText);
  ok('Primeros pasos', 'reclutador nuevo: aparece la guía con 0 de 2 pasos', txt.includes('Primeros pasos') && txt.includes('0 de 2 completados'));
  ok('Primeros pasos', 'enlaza al perfil de la empresa y a crear la vacante', await nuevaR.page.evaluate(() => [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/dashboard/profile' && /Ir/.test(a.textContent)) && [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/dashboard/jobs/new' && /Ir/.test(a.textContent))));
  await nuevaR.ctx.close();

  // La guía no estorba a quien ya empezó: la cuenta de demostración con perfil y postulaciones no la ve.
  const demo = await session('candidato@example.com');
  await demo.page.setViewport(ESCRITORIO);
  await go(demo.page, '/dashboard', 'Tus Próximas Oportunidades', 2500);
  ok('Primeros pasos', 'una candidata con perfil y postulaciones no ve la guía', !(await demo.page.evaluate(() => document.body.innerText)).includes('Primeros pasos'));
  await demo.ctx.close();
} finally {
  for (const e of [EMAIL_CAND, EMAIL_REC]) await deleteAccountCascade(e).catch(() => {});
  checkCsp('CSP');
  saveResults(path.join(OUT_DIR, `accesibilidad_${TAG}.json`));
  await close();
}
const fallas = results.filter((x) => !x.ok).length;
console.log(`\n${results.length - fallas}/${results.length} correctas, ${fallas} fallas`);
process.exit(fallas ? 1 : 0);
