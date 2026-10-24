// Escenas de la candidata de ejemplo (Daniela Ruiz Esquivel): registro, perfil, CV con IA, vacantes, postulaciones y avisos.
import {
  BASE, PASS, CANDIDATA, RECLUTADOR, CV_PDF, TARJETA, sleep, session, preparar, snap, escribir, pulsar, pickSelect,
  limpiarCuentas, waitText, go, tarjeta, pulsarEnCard, pulsarTab, pulsarDia, enDias, alejarRaton, esperarSinAvisos, setInput, altura, llenar,
} from './ayudas.mjs';
import { VACANTE } from './reclutador.mjs';

const TARJETA_DE = tarjeta;

/** Registro, primer ingreso, perfil completo con el CV de ejemplo y recomendaciones. */
export async function escenaCandidata1() {
  await limpiarCuentas();
  const s = await session(null);
  const { page } = s;
  await preparar(page);

  // --- registro real de la cuenta de ejemplo
  await page.goto(BASE + '/register', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await escribir(page, 'Nombre completo', CANDIDATA.nombre);
  await escribir(page, 'Email', CANDIDATA.email);
  await escribir(page, 'Contraseña', PASS);
  await pulsar(page, 'Crear cuenta');
  await page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 });
  await sleep(3500);

  // --- primer ingreso: tarjeta de primeros pasos
  await snap(page, 'can-01-primeros-pasos', {
    marks: [
      { n: 1, text: 'Primeros pasos', tag: 'h2', pad: 6, pos: 'l' },
      { n: 2, css: 'ol a[href="/dashboard/profile"]', nth: 0, pad: 4, pos: 'l' },
      { n: 3, css: 'ol a[href="/dashboard/profile"]', nth: 1, pad: 4, pos: 'l' },
      { n: 4, css: 'ol a[href="/dashboard/explore"]', pad: 4, pos: 'l' },
      { n: 5, aria: 'Cerrar los primeros pasos', pad: 4, pos: 'r' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 560 },
  });

  // --- cómo es la pantalla: menú, avisos, nombre y salir
  await snap(page, 'can-00-pantalla', {
    marks: [
      { n: 1, css: 'nav[aria-label="Menú principal"]', pad: 6, pos: 'r' },
      { n: 2, text: 'Notificaciones', tag: 'button', pad: 4, pos: 'r' },
      { n: 3, text: CANDIDATA.nombre, tag: 'span, p, div', parent: 2, pad: 6, pos: 'r' },
      { n: 4, text: 'Cerrar Sesión', pad: 6, pos: 'r' },
      { n: 5, css: 'h1', pad: 8, pos: 'l' },
    ],
    clip: { x: 0, y: 0, w: 1280, h: 760 },
  });

  // --- Mi Perfil vacío
  await pulsar(page, 'Mi Perfil', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/profile', { timeout: 30000 });
  await sleep(2500);
  await snap(page, 'can-02-perfil-vista-general', {
    marks: [
      { n: 1, css: 'nav[aria-label="Menú principal"] a[href="/dashboard/profile"]', pad: 4, pos: 'r' },
      { n: 2, ...TARJETA_DE('Información Principal'), pad: 4, pos: 'tl' },
      { n: 3, ...TARJETA_DE('Currículum Vitae (CV)'), pad: 4, pos: 'tl' },
      { n: 4, ...TARJETA_DE('Guardar Cambios'), pad: 4, pos: 'tl' },
    ],
    clip: 'vista',
  });

  // --- llenar a mano: información principal
  await escribir(page, 'Titular Profesional', 'Desarrolladora Front-End');
  await escribir(page, 'Ubicación', 'Guadalajara, Jalisco, México');
  await escribir(page, 'Años de Experiencia', '3');
  await pickSelect(page, { label: 'Seniority al que aspiras' }, 'Junior');
  await snap(page, 'can-03-perfil-informacion', {
    marks: [
      { n: 1, label: 'Titular Profesional', pos: 'l' },
      { n: 2, label: 'Ubicación', pos: 'l' },
      { n: 3, label: 'Años de Experiencia', pos: 'r' },
      { n: 4, label: 'Seniority al que aspiras', pos: 'l' },
      { n: 5, css: 'button[role="switch"]', pad: 6, pos: 'l' },
    ],
    clip: TARJETA_DE('Información Principal'),
  });

  // --- habilidades
  for (let i = 0; i < 3; i++) await pulsar(page, 'Añadir Habilidad');
  const habilidades = [['React', '3', '4'], ['TypeScript', '3', '4'], ['CSS', '3', '4']];
  for (let i = 0; i < habilidades.length; i++) {
    const [n, a, l] = habilidades[i];
    for (const [sel, v] of [[`input[name="skills.${i}.name"]`, n], [`input[name="skills.${i}.years"]`, a], [`input[name="skills.${i}.level"]`, l]]) {
      await llenar(page, sel, v, { retraso: 8 });
    }
  }
  await snap(page, 'can-04-perfil-habilidades', {
    marks: [
      { n: 1, css: 'input[name="skills.0.name"]', pos: 'l' },
      { n: 2, css: 'input[name="skills.0.years"]', pos: 'b' },
      { n: 3, css: 'input[name="skills.0.level"]', pos: 'b' },
      { n: 4, text: 'Eliminar habilidad', tag: 'button', nth: 0, pad: 4, pos: 'r' },
      { n: 5, text: 'Añadir Habilidad', tag: 'button', pad: 4, pos: 'r' },
    ],
    clip: TARJETA_DE('Habilidades'),
  });

  // --- experiencia
  await pulsar(page, 'Añadir Experiencia');
  const exp = { title: 'Desarrolladora Front-End', company: 'Tienda Tapatía Digital', startDate: 'Febrero 2024', endDate: 'Presente', description: 'Desarrolla el carrito y el pago con React y TypeScript.' };
  for (const [k, v] of Object.entries(exp)) {
    const sel = `[name="experience.0.${k}"]`;
    await llenar(page, sel, v, { retraso: 6 });
  }
  await snap(page, 'can-05-perfil-experiencia', {
    marks: [
      { n: 1, label: 'Puesto', pos: 'l' },
      { n: 2, label: 'Empresa', pos: 't' },
      { n: 3, css: '[name="experience.0.startDate"]', pos: 'l' },
      { n: 4, css: '[name="experience.0.endDate"]', pos: 't' },
      { n: 5, css: '[name="experience.0.description"]', pos: 'l' },
      { n: 6, text: 'Añadir Experiencia', tag: 'button', pad: 4, pos: 'r' },
    ],
    clip: TARJETA_DE('Experiencia Laboral'),
  });

  // --- educación
  await pulsar(page, 'Añadir Educación');
  const edu = { institution: 'Instituto Tecnológico de Occidente', degree: 'Ingeniería en Sistemas', field: 'Computación', startDate: '2017', endDate: '2021' };
  for (const [k, v] of Object.entries(edu)) {
    const sel = `[name="education.0.${k}"]`;
    await llenar(page, sel, v, { retraso: 6 });
  }
  await snap(page, 'can-06-perfil-educacion', {
    marks: [
      { n: 1, css: '[name="education.0.institution"]', pos: 'l' },
      { n: 2, css: '[name="education.0.degree"]', pos: 'l' },
      { n: 3, css: '[name="education.0.field"]', pos: 't' },
      { n: 4, css: '[name="education.0.startDate"]', pos: 'l' },
      { n: 5, css: '[name="education.0.endDate"]', pos: 't' },
      { n: 6, text: 'Añadir Educación', tag: 'button', pad: 4, pos: 'r' },
    ],
    clip: TARJETA_DE('Educación'),
  });

  // --- CV: antes de subirlo
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await snap(page, 'can-07-cv-subir', {
    marks: [
      { n: 1, css: '#cv-upload', pad: 4, pos: 'l' },
    ],
    clip: TARJETA_DE('Currículum Vitae (CV)'),
  });

  // --- CV: se sube el PDF y la IA lo lee (modelo de respaldo del servidor)
  // El modelo de respaldo a veces devuelve el análisis incompleto: la aplicación reintenta una vez y, si falla, avisa. Aquí se repite.
  let analizado = false;
  for (let intento = 1; intento <= 5 && !analizado; intento++) {
    const entrada = await page.$('#cv-upload');
    await entrada.uploadFile(CV_PDF);
    try {
      await page.waitForFunction(() => document.body.innerText.includes('Vista previa: sugerencias de la IA') || document.body.innerText.includes('Error al procesar CV'), { timeout: 120000 });
    } catch { /* se reintenta */ }
    analizado = await page.evaluate(() => document.body.innerText.includes('Vista previa: sugerencias de la IA'));
    if (!analizado) { console.log(`  el análisis del CV falló (intento ${intento}), se repite`); await esperarSinAvisos(page); }
  }
  if (!analizado) throw new Error('La IA no pudo analizar el CV después de 5 intentos');
  await sleep(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(600);
  await snap(page, 'can-08-cv-vista-previa', {
    marks: [
      { n: 1, ...TARJETA_DE('Vista previa: sugerencias de la IA'), pad: 4, pos: 'tl' },
      { n: 2, text: 'Aplicar sugerencias', tag: 'button', pad: 4, pos: 'b' },
      { n: 3, text: 'Descartar', tag: 'button', pad: 4, pos: 'b' },
    ],
    height: 1400,
    clip: TARJETA_DE('Vista previa: sugerencias de la IA'),
  });

  // --- CV: aplicar sugerencias
  await pulsar(page, 'Aplicar sugerencias');
  await sleep(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(600);
  await snap(page, 'can-09-cv-aplicado', {
    marks: [
      { n: 1, text: 'Resumen de tu CV (analizado por la IA)', tag: 'h5, div, p', closest: '[role=alert]', pad: 4, pos: 'tl' },
      { n: 2, label: 'Titular Profesional', pos: 'l' },
      { n: 3, text: 'Guardar Perfil', tag: 'button', pad: 4, pos: 'l' },
    ],
    height: 1100,
    clip: 'vista',
  });

  // --- guardar el perfil
  await pulsar(page, 'Guardar Perfil');
  await waitText(page, 'Perfil Actualizado', 30000);
  await sleep(600);
  await snap(page, 'can-10-perfil-guardado', {
    marks: [{ n: 1, text: 'Perfil Actualizado', tag: 'div', closest: 'li', pad: 4, pos: 'l' }],
    clip: { x: 760, y: 0, w: 520, h: 200 },
  });

  // --- la IA recalcula en segundo plano: se espera a que aparezcan recomendaciones en el inicio
  for (let i = 0; i < 40; i++) {
    await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle2' });
    await sleep(2500);
    if ((await page.evaluate(() => document.body.innerText)).includes('Razones Principales')) break;
    await sleep(5000);
  }
  await sleep(1200);
  await snap(page, 'can-11-inicio-recomendaciones', {
    marks: [
      { n: 1, text: 'Notificaciones', tag: 'button', pad: 4, pos: 'r' },
      { n: 2, text: 'Primeros pasos', tag: 'h2', pad: 6, pos: 'l' },
      { n: 3, css: 'main div.rounded-2xl:has(> div button:not([aria-label]))', pad: 0, pos: 'tl' },
      { n: 4, text: 'Match', tag: 'div, span', pad: 4, pos: 'r' },
      { n: 5, text: 'Razones Principales', tag: 'h3, h4, p', pad: 6, pos: 'l' },
      { n: 6, text: 'Match en espera de la empresa', tag: 'div, span', pad: 4, pos: 'r' },
      { n: 7, text: 'Postularme ahora', tag: 'button', pad: 4, pos: 'l' },
      { n: 8, text: 'Rechazar match', tag: 'button', pad: 4, pos: 'r' },
    ],
    clip: { x: 0, y: 0, w: 1280, h: 960 },
  });
  await s.ctx.close();
}






/** Buscar y filtrar vacantes, abrir la ficha, postularse y ver «Mis Postulaciones». */
export async function escenaCandidata2() {
  const s = await session(CANDIDATA.email);
  const { page } = s;
  await preparar(page);
  await go(page, '/dashboard', null, 2500);

  await pulsar(page, 'Explorar Vacantes', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/explore', { timeout: 30000 });
  await sleep(2500);
  await snap(page, 'can-12-explorar', {
    marks: [
      { n: 1, css: 'nav[aria-label="Menú principal"] a[href="/dashboard/explore"]', pad: 4, pos: 'r' },
      { n: 2, css: 'main input[type="text"], main input:not([type])', pad: 4, pos: 'l' },
      { n: 3, css: 'main button[role="combobox"]', nth: 0, pad: 4, pos: 't' },
      { n: 4, css: 'main button[role="combobox"]', nth: 1, pad: 4, pos: 't' },
      { n: 5, css: 'main button[role="combobox"]', nth: 2, pad: 4, pos: 't' },
      { n: 6, re: '^\\d+ vacantes?$', tag: 'p, span, div', pad: 4, pos: 'l' },
      { n: 7, text: 'Ver y postularme', tag: 'a', nth: 0, pad: 4, pos: 'l' },
    ],
    clip: { x: 0, y: 0, w: 1280, h: 760 },
  });

  // --- búsqueda por texto
  await page.click('main input[type="text"], main input:not([type])');
  await page.keyboard.type('React', { delay: 40 });
  await sleep(1200);
  await snap(page, 'can-13-explorar-busqueda', {
    marks: [
      { n: 1, css: 'main input[type="text"], main input:not([type])', pad: 4, pos: 'tl' },
      { n: 2, re: '^\\d+ vacantes?$', tag: 'p, span, div', pad: 4, pos: 'tl' },
      { n: 3, card: VACANTE.titulo, pad: 2, pos: 'tl' },
      { n: 4, card: VACANTE.titulo, text: 'Ver y postularme', tag: 'a', pad: 4, pos: 'l' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 780 },
  });

  // --- filtros: nivel
  await page.click('main button[role="combobox"]');
  await sleep(700);
  await snap(page, 'can-14-explorar-filtros', {
    marks: [
      { n: 1, css: '[role="listbox"]', pad: 4, pos: 'r' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 560 },
    fijo: true,
  });
  await page.keyboard.press('Escape');
  await sleep(400);

  // --- ficha de la vacante
  await pulsarEnCard(page, VACANTE.titulo, 'Ver y postularme', 'a');
  await page.waitForFunction(() => /^\/dashboard\/jobs\/[^/]+$/.test(location.pathname), { timeout: 30000 });
  await sleep(2500);
  await snap(page, 'can-15-vacante-detalle', {
    marks: [
      { n: 1, text: 'Volver', tag: 'a, button', pad: 4, pos: 'l' },
      { n: 2, text: 'Postularme ahora', tag: 'button', pad: 4, pos: 'l' },
      { n: 3, text: 'Remoto permitido', tag: 'span, div, p', pad: 4, pos: 'b' },
      { n: 4, text: 'Habilidades Requeridas', tag: 'h3, h4, h2', pad: 4, pos: 'l' },
      { n: 5, text: 'Sobre la empresa', tag: 'h3, h4, h2', pad: 4, pos: 'l' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 900 },
  });

  // --- postularse
  await pulsar(page, 'Postularme ahora');
  await waitText(page, '¡Postulación enviada!', 30000);
  await sleep(600);
  await snap(page, 'can-16-postulacion-enviada', {
    marks: [
      { n: 1, text: '¡Postulación enviada!', tag: 'div', closest: 'li', pad: 4, pos: 'l' },
      { n: 2, text: 'Ya postulaste', tag: 'button', pad: 4, pos: 'b' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 340 },
  });
  await esperarSinAvisos(page);

  // --- Mis Postulaciones
  await pulsar(page, 'Mis Postulaciones', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/applications', { timeout: 30000 });
  await sleep(3000);
  await snap(page, 'can-17-mis-postulaciones', {
    marks: [
      { n: 1, css: 'nav[aria-label="Menú principal"] a[href="/dashboard/applications"]', pad: 4, pos: 'r' },
      { n: 2, fila: VACANTE.titulo, pad: 2, pos: 'l' },
      { n: 3, fila: VACANTE.titulo, text: 'Postulado', tag: 'div, span', pad: 4, pos: 'b' },
      { n: 4, fila: VACANTE.titulo, text: 'Ver Vacante', tag: 'a', pad: 4, pos: 'b' },
      { n: 5, text: 'Mis Entrevistas', tag: 'h2, h3, h1, p', pad: 4, pos: 'l' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 1040 },
  });
  await s.ctx.close();
}

/** Avisos, el match aceptado, la entrevista en el calendario, la configuración de la cuenta y el cierre de sesión. */
export async function escenaCandidata3() {
  const s = await session(CANDIDATA.email);
  const { page } = s;
  await preparar(page);
  await go(page, '/dashboard', null, 4500);

  // --- campana de avisos: lo que hizo la empresa
  await pulsar(page, 'Notificaciones', 'button');
  await sleep(1500);
  await snap(page, 'can-18-avisos', {
    marks: [
      { n: 1, text: 'Notificaciones', tag: 'button', pad: 4, pos: 'r' },
      { n: 2, text: 'Marcar todas como leídas', tag: 'button', pad: 4, pos: 'b' },
      { n: 3, text: 'Entrevista agendada', tag: 'span', pad: 4, pos: 'r' },
    ],
    clip: { x: 0, y: 0, w: 700, h: 700 },
    fijo: true,
  });
  await pulsar(page, 'Marcar todas como leídas', 'button');
  await sleep(900);
  await snap(page, 'can-19-avisos-leidos', {
    marks: [
      { n: 1, text: 'Notificaciones', tag: 'button', pad: 4, pos: 'r' },
    ],
    clip: { x: 0, y: 0, w: 700, h: 560 },
    fijo: true,
  });
  await page.keyboard.press('Escape');
  await sleep(600);

  // --- Inicio: el match aceptado por la empresa
  await page.evaluate(() => window.scrollTo(0, 0));
  await snap(page, 'can-20-match-aceptado', {
    marks: [
      { n: 1, card: VACANTE.titulo, pad: 2, pos: 'tl' },
      { n: 2, text: '¡La empresa aceptó tu match!', tag: 'div, span', pad: 4, pos: 'r' },
      { n: 3, card: VACANTE.titulo, text: 'Ya postulaste', tag: 'button', pad: 4, pos: 'r' },
      { n: 4, card: VACANTE.titulo, text: 'Rechazar match', tag: 'button', pad: 4, pos: 'r' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 1000 },
  });

  // --- rechazar un match: solo se muestra la confirmación y se cancela
  await pulsarEnCard(page, VACANTE.titulo, 'Rechazar match', 'button');
  await page.waitForSelector('[role="alertdialog"]', { timeout: 15000 });
  await sleep(700);
  await snap(page, 'can-21-rechazar-match', {
    marks: [
      { n: 1, css: '[role="alertdialog"] h2', pad: 4, pos: 'l' },
      { n: 2, text: 'Cancelar', tag: 'button', pad: 4, pos: 'b' },
      { n: 3, text: 'Sí, rechazar', tag: 'button', pad: 4, pos: 'b' },
    ],
    clip: { css: '[role="alertdialog"]', margen: 40 },
    fijo: true,
  });
  await pulsar(page, 'Cancelar', 'button', '[role="alertdialog"]');
  await sleep(700);

  // --- Mis Postulaciones: estado «Entrevista» y calendario
  await pulsar(page, 'Mis Postulaciones', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/applications', { timeout: 30000 });
  await sleep(3000);
  await pulsarDia(page, enDias(7));
  await sleep(1200);
  await snap(page, 'can-22-entrevista', {
    marks: [
      { n: 1, fila: VACANTE.titulo, text: 'Entrevista', tag: 'div, span', pad: 4, pos: 'b' },
      { n: 2, css: '[role="grid"] button[aria-selected="true"], table button[aria-selected="true"]', pad: 4, pos: 't' },
      { n: 3, text: 'Entrevistas para', tag: 'h3, h2', pad: 4, pos: 'l' },
      { n: 4, text: 'Videollamada', tag: 'div, span', pad: 3, pos: 't' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 1040 },
  });

  // --- Configuración: apariencia
  await pulsar(page, 'Configuración', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/settings', { timeout: 30000 });
  await sleep(2500);
  await snap(page, 'can-23-config-apariencia', {
    marks: [
      { n: 1, css: 'nav[aria-label="Menú principal"] a[href="/dashboard/settings"]', pad: 4, pos: 'r' },
      { n: 2, text: 'Apariencia', tag: '[role=tab]', pad: 3, pos: 't' },
      { n: 3, text: 'Notificaciones', tag: '[role=tab]', pad: 3, pos: 't' },
      { n: 4, text: 'Cuenta y Seguridad', tag: '[role=tab]', pad: 3, pos: 't' },
      { n: 5, css: 'main button[role="switch"]', pad: 6, pos: 'b' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 460 },
  });
  await page.click('main button[role="switch"]');
  await alejarRaton(page);
  await sleep(1200);
  await snap(page, 'can-24-tema-oscuro', { clip: 'vista' });
  await page.click('main button[role="switch"]');
  await alejarRaton(page);
  await sleep(900);

  // --- Configuración: notificaciones
  await pulsarTab(page, 'Notificaciones');
  await sleep(1200);
  await snap(page, 'can-25-config-notificaciones', {
    marks: [
      { n: 1, css: 'main [role="tabpanel"] button[role="switch"]', nth: 0, pad: 6, pos: 'r' },
      { n: 2, css: 'main [role="tabpanel"] button[role="switch"]', nth: 1, pad: 6, pos: 'r' },
      { n: 3, css: 'main [role="tabpanel"] button[role="switch"]', nth: 2, pad: 6, pos: 'r' },
      { n: 4, css: 'main [role="tabpanel"] button[role="switch"]', nth: 3, pad: 6, pos: 'r' },
      { n: 5, text: 'Guardar cambios', tag: 'button', pad: 4, pos: 'r' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 940 },
  });

  // --- Configuración: cuenta y seguridad
  await pulsarTab(page, 'Cuenta y Seguridad');
  await sleep(1500);
  await snap(page, 'can-26-config-cuenta', {
    marks: [
      { n: 1, label: 'Nombre Completo', pos: 'l' },
      { n: 2, label: 'Email', pos: 'l' },
      { n: 3, label: 'Contraseña Actual', pos: 'l' },
      { n: 4, label: 'Nueva Contraseña', pos: 'l' },
      { n: 5, label: 'Confirmar Nueva Contraseña', pos: 'l' },
      { n: 6, text: 'Guardar Cambios', tag: 'button', pad: 4, pos: 'r' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 1000 },
  });

  // --- cerrar sesión
  await snap(page, 'can-27-cerrar-sesion', {
    marks: [{ n: 1, text: 'Cerrar Sesión', pad: 6, pos: 'r' }],
    clip: { x: 0, y: 560, w: 520, h: 340 },
  });
  await pulsar(page, 'Cerrar Sesión', 'a');
  await page.waitForFunction(() => location.pathname === '/', { timeout: 30000 }).catch(() => {});
  await sleep(1500);
  await s.ctx.close();
}


