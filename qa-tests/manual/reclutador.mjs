// Escenas del reclutador de ejemplo (Andrés Mejía Solís, empresa «Logística Tapatía»): registro, perfil de la empresa,
// vacante con IA, postulantes, notas, entrevistas, recomendados y cierre de la vacante.
import {
  BASE, PASS, CANDIDATA, RECLUTADOR, TARJETA, sleep, session, preparar, snap, escribir, pulsar, pickSelect,
  limpiarCuenta, waitText, go, tarjeta, esperarSinAvisos, pulsarEnCard, pulsarTab, pulsarDia, enDias, altura, setInput,
} from './ayudas.mjs';

export const VACANTE = {
  titulo: 'Desarrollador Front-End React',
  ubicacion: 'Guadalajara, Jalisco, México',
  habilidades: 'React, TypeScript, CSS, Git',
};

const DESCRIPCION_EMPRESA = 'Empresa de logística y transporte de carga con operaciones en Guadalajara, que desarrolla su propia plataforma de seguimiento de envíos.';

/** Registro como reclutador, perfil de la empresa y publicación de la primera vacante. */
export async function escenaReclutador1() {
  await limpiarCuenta(RECLUTADOR);
  const s = await session(null);
  const { page } = s;
  await preparar(page);

  // --- desde la página principal se llega al registro con el tipo de cuenta ya elegido
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await pulsar(page, 'Contratar al mejor talento', 'a');
  await page.waitForFunction(() => location.pathname === '/register', { timeout: 30000 });
  await sleep(1500);
  await escribir(page, 'Nombre completo', RECLUTADOR.nombre);
  await escribir(page, 'Email', RECLUTADOR.email);
  await escribir(page, 'Contraseña', PASS);
  await snap(page, 'rec-01-registro', {
    marks: [
      { n: 1, label: 'Nombre completo', pos: 'l' },
      { n: 2, label: 'Email', pos: 'l' },
      { n: 3, label: 'Contraseña', pos: 'l' },
      { n: 4, label: 'Tipo de cuenta', pos: 'l' },
      { n: 5, text: 'Crear cuenta', tag: 'button', pos: 'l' },
    ],
    clip: { css: TARJETA, margen: 50 },
  });
  await pulsar(page, 'Crear cuenta');
  await page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 });
  await sleep(3500);

  // --- primer ingreso
  await snap(page, 'rec-02-primeros-pasos', {
    marks: [
      { n: 1, text: 'Primeros pasos', tag: 'h2', pad: 6, pos: 'l' },
      { n: 2, css: 'ol a[href="/dashboard/profile"]', pad: 4, pos: 'l' },
      { n: 3, css: 'ol a[href="/dashboard/jobs/new"]', pad: 4, pos: 'l' },
      { n: 4, aria: 'Cerrar los primeros pasos', pad: 4, pos: 'r' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 600 },
  });
  await snap(page, 'rec-00-pantalla', {
    marks: [
      { n: 1, css: 'nav[aria-label="Menú principal"]', pad: 6, pos: 'r' },
      { n: 2, text: 'Notificaciones', tag: 'button', pad: 4, pos: 'r' },
      { n: 3, text: RECLUTADOR.nombre, tag: 'span, p, div', parent: 2, pad: 6, pos: 'r' },
      { n: 4, text: 'Cerrar Sesión', pad: 6, pos: 'r' },
      { n: 5, css: 'h1', pad: 8, pos: 'l' },
    ],
    clip: { x: 0, y: 0, w: 1280, h: 760 },
  });

  // --- perfil de la empresa
  await pulsar(page, 'Perfil', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/profile', { timeout: 30000 });
  await sleep(2000);
  await escribir(page, 'Nombre de la Empresa', RECLUTADOR.empresa);
  await escribir(page, 'Sitio Web', 'https://logisticatapatia.example.com');
  await escribir(page, 'Descripción de la Empresa', DESCRIPCION_EMPRESA);
  await snap(page, 'rec-03-perfil-empresa', {
    marks: [
      { n: 1, css: 'nav[aria-label="Menú principal"] a[href="/dashboard/profile"]', pad: 4, pos: 'r' },
      { n: 2, label: 'Nombre de la Empresa', pos: 'l' },
      { n: 3, label: 'Sitio Web', pos: 'l' },
      { n: 4, label: 'Descripción de la Empresa', pos: 'l' },
      { n: 5, text: 'Guardar Cambios', tag: 'button', pos: 'l' },
    ],
    clip: { x: 0, y: 0, w: 1280, h: 760 },
  });
  await pulsar(page, 'Guardar Cambios');
  await waitText(page, 'Perfil de la Organización Actualizado', 30000);
  await sleep(600);
  await snap(page, 'rec-04-perfil-guardado', {
    marks: [{ n: 1, text: 'Perfil de la Organización Actualizado', tag: 'div', closest: 'li', pad: 4, pos: 'l' }],
    clip: { x: 760, y: 0, w: 520, h: 200 },
  });

  // --- vacantes: lista vacía
  await esperarSinAvisos(page);
  await pulsar(page, 'Vacantes', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/jobs', { timeout: 30000 });
  await sleep(2500);
  await esperarSinAvisos(page);
  await snap(page, 'rec-05-vacantes-vacio', {
    marks: [
      { n: 1, css: 'nav[aria-label="Menú principal"] a[href="/dashboard/jobs"]', pad: 4, pos: 'r' },
      { n: 2, text: 'Crear Vacante', tag: 'a, button', pad: 4, pos: 'l' },
    ],
    clip: { x: 0, y: 0, w: 1280, h: 620 },
  });

  // --- formulario de la vacante: primero los avisos cuando falta algo
  await pulsar(page, 'Crear Vacante', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/jobs/new', { timeout: 30000 });
  await sleep(2000);
  await pulsar(page, 'Crear Vacante', 'button');
  await sleep(900);
  await snap(page, 'rec-06-vacante-errores', {
    marks: [
      { n: 1, text: 'El título debe tener al menos 5 caracteres.', tag: 'p', pad: 3, pos: 'l' },
      { n: 2, text: 'La ubicación es requerida.', tag: 'p', pad: 3, pos: 'l' },
      { n: 3, text: 'Ingresa al menos una habilidad o palabra clave.', tag: 'p', pad: 3, pos: 'l' },
      { n: 4, text: 'La descripción debe tener al menos 50 caracteres.', tag: 'p', pad: 3, pos: 'l' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 860 },
  });

  // --- se llena con los datos de la vacante de ejemplo
  await escribir(page, 'Título de la Vacante', VACANTE.titulo);
  await escribir(page, 'Ubicación', VACANTE.ubicacion);
  await page.click('button[role="switch"]');
  await escribir(page, 'Habilidades y Palabras Clave', VACANTE.habilidades);
  await snap(page, 'rec-07-vacante-datos', {
    marks: [
      { n: 1, label: 'Título de la Vacante', pos: 'l' },
      { n: 2, label: 'Ubicación', pos: 'l' },
      { n: 3, label: 'Seniority', pos: 'l' },
      { n: 4, css: 'button[role="switch"]', pad: 6, pos: 'l' },
      { n: 5, label: 'Habilidades y Palabras Clave', pos: 'l' },
      { n: 6, text: 'Generar con IA', tag: 'button', pad: 4, pos: 'l' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 760 },
  });

  // --- «Generar con IA» (modelo de respaldo del servidor)
  // Si el modelo de respaldo falla, la aplicación avisa «Error de la IA»: se repite hasta que escriba la descripción.
  let redactada = false;
  for (let intento = 1; intento <= 5 && !redactada; intento++) {
    await pulsar(page, 'Generar con IA');
    try {
      await page.waitForFunction(() => (document.querySelector('textarea[name="descriptionMd"]')?.value || '').length > 80 || document.body.innerText.includes('Error de la IA'), { timeout: 120000 });
    } catch { /* se reintenta */ }
    redactada = await page.evaluate(() => (document.querySelector('textarea[name="descriptionMd"]')?.value || '').length > 80);
    if (!redactada) { console.log(`  «Generar con IA» falló (intento ${intento}), se repite`); await esperarSinAvisos(page); }
  }
  if (!redactada) throw new Error('La IA no pudo redactar la descripción después de 5 intentos');
  await sleep(1200);
  await snap(page, 'rec-08-vacante-ia', {
    marks: [
      { n: 1, css: 'textarea[name="descriptionMd"]', pad: 4, pos: 'l' },
      { n: 2, text: 'Crear Vacante', tag: 'button', pad: 4, pos: 'l' },
      { n: 3, text: 'Cancelar', tag: 'button', pad: 4, pos: 'l' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 1000 },
  });

  // --- publicar
  await pulsar(page, 'Crear Vacante', 'button');
  await waitText(page, 'Vacante Creada', 30000);
  await sleep(400);
  await snap(page, 'rec-09-vacante-creada', {
    marks: [{ n: 1, text: 'Vacante Creada', tag: 'div', closest: 'li', pad: 4, pos: 'l' }],
    clip: { x: 760, y: 0, w: 520, h: 200 },
  });
  await page.waitForFunction(() => location.pathname === '/dashboard/jobs', { timeout: 30000 });
  await sleep(2500);
  await snap(page, 'rec-10-vacante-publicada', {
    marks: [
      { n: 1, text: VACANTE.titulo, tag: 'h3, h2, div', pad: 4, pos: 'l' },
      { n: 2, text: 'Publicada', tag: 'div, span', pad: 4, pos: 'r' },
      { n: 3, text: 'Gestionar Vacante', tag: 'a, button', pad: 4, pos: 'l' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 560 },
  });
  await s.ctx.close();
}

const NOTA = 'Buen perfil para el equipo de interfaces. Confirmar disponibilidad para empezar en noviembre.';
const ENLACE = 'https://meet.google.com/xyz-abcd-efg';

/** Avisos, postulantes, shortlist, notas, entrevista, recomendados de la IA, candidatos y cierre de la vacante. */
export async function escenaReclutador2() {
  const s = await session(RECLUTADOR.email);
  const { page } = s;
  await preparar(page);
  await go(page, '/dashboard/jobs', 'Gestión de Vacantes', 3500);

  // --- campana: avisa que hay una postulación nueva
  await pulsar(page, 'Notificaciones', 'button');
  await sleep(1500);
  await snap(page, 'rec-11-avisos', {
    marks: [
      { n: 1, text: 'Notificaciones', tag: 'button', pad: 4, pos: 'r' },
      { n: 2, text: 'Nueva postulación', tag: 'span', pad: 4, pos: 'r' },
    ],
    clip: { x: 0, y: 0, w: 700, h: 640 },
    fijo: true,
  });
  await page.keyboard.press('Escape');
  await sleep(500);

  // --- la vacante ya cuenta una postulación
  await snap(page, 'rec-12-vacante-con-postulante', {
    marks: [
      { n: 1, re: '^\\d+ aplicantes?$', tag: 'div, span, p', pad: 4, pos: 'l' },
      { n: 2, text: 'Gestionar Vacante', tag: 'a, button', pad: 4, pos: 'l' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 620 },
  });

  // --- se abre la vacante: pestaña Candidatos
  await pulsarEnCard(page, VACANTE.titulo, 'Gestionar Vacante', 'a');
  await page.waitForFunction(() => /^\/dashboard\/jobs\/[^/]+$/.test(location.pathname), { timeout: 30000 });
  await sleep(3500);
  await snap(page, 'rec-13-vacante-gestion', {
    marks: [
      { n: 1, text: 'Volver', tag: 'a, button', pad: 4, pos: 'l' },
      { n: 2, text: 'Cerrar vacante', tag: 'button', pad: 4, pos: 'b' },
      { n: 3, text: 'Eliminar', tag: 'button', pad: 4, pos: 'b' },
      { n: 4, text: 'Detalles', tag: '[role=tab]', pad: 3, pos: 't' },
      { n: 5, re: '^Candidatos \\(\\d+\\)$', tag: '[role=tab]', pad: 3, pos: 't' },
      { n: 6, text: 'Recomendados', tag: '[role=tab]', pad: 3, pos: 't' },
      { n: 7, text: 'Entrevistas', tag: '[role=tab]', pad: 3, pos: 't' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 400 },
  });
  await snap(page, 'rec-14-candidatos', {
    marks: [
      { n: 1, css: '#only-shortlist', pad: 6, pos: 'l' },
      { n: 2, aria: 'Filtrar por estado', pad: 4, pos: 't' },
      { n: 3, text: 'Match IA', tag: 'th', pad: 4, pos: 't' },
      { n: 4, fila: CANDIDATA.nombre, text: CANDIDATA.nombre, tag: 'button', pad: 4, pos: 'l' },
      { n: 5, aria: 'Agregar a shortlist', pad: 4, pos: 't' },
      { n: 6, fila: CANDIDATA.nombre, text: 'Detalles', tag: 'button', pad: 4, pos: 't' },
      { n: 7, aria: `Cambiar estado de ${CANDIDATA.nombre}`, pad: 4, pos: 'b' },
    ],
    clip: { x: 256, y: 200, w: 1024, h: 560 },
  });

  // --- shortlist
  await page.click('button[aria-label="Agregar a shortlist"]');
  await sleep(1200);
  await snap(page, 'rec-15-shortlist', {
    marks: [{ n: 1, aria: 'Quitar de shortlist', pad: 4, pos: 'l' }],
    clip: { x: 256, y: 320, w: 1024, h: 360 },
  });

  // --- cambiar el estado de la postulación
  await page.click(`button[role="combobox"][aria-label="Cambiar estado de ${CANDIDATA.nombre}"]`);
  await sleep(800);
  await snap(page, 'rec-16-estados', {
    marks: [
      { n: 1, css: '[role="listbox"]', pad: 4, pos: 'r' },
      { n: 2, text: 'En Revisión', tag: '[role=option]', pad: 2, pos: 'l' },
    ],
    clip: { x: 256, y: 200, w: 1024, h: 620 },
    fijo: true,
  });
  await clickOpcion(page, 'En Revisión');
  await sleep(2500);
  await snap(page, 'rec-17-estado-cambiado', {
    marks: [
      { n: 1, fila: CANDIDATA.nombre, text: 'En Revisión', tag: 'div, span', pad: 4, pos: 'b' },
    ],
    clip: { x: 256, y: 320, w: 1024, h: 360 },
  });

  // --- detalles del postulante: notas y entrevista
  await altura(page, 1750);
  await pulsarEnCard(page, 'Candidatos Postulados', 'Detalles', 'button');
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await sleep(1800);
  // La ventana es muy larga: la primera imagen muestra la parte de la persona (hasta antes de las notas); las notas y la entrevista
  // se enseñan en sus propias imágenes, donde el texto se lee mejor.
  const geo = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]').getBoundingClientRect();
    const n = [...document.querySelectorAll('[role="dialog"] label')].find((l) => l.textContent.includes('Notas privadas')).getBoundingClientRect();
    return { x: d.left, y: d.top, w: d.width, corte: n.top };
  });
  await snap(page, 'rec-18-detalles', {
    marks: [
      { n: 1, css: '[role="dialog"] h2', pad: 4, pos: 'l' },
      { n: 2, css: '[role="dialog"] a[href^="mailto:"]', pad: 4, pos: 'b' },
      { n: 3, text: 'Resumen del CV (IA)', tag: 'p', closest: 'div.rounded-lg', pad: 0, pos: 'tl' },
      { n: 4, re: '^Compatibilidad IA: \\d+%$', tag: 'div', closest: 'div.rounded-lg', pad: 0, pos: 'tl' },
      { n: 5, text: 'Habilidades', tag: 'h3', pad: 4, pos: 'l' },
    ],
    clip: { x: geo.x - 34, y: geo.y - 34, w: geo.w + 68, h: geo.corte - geo.y + 34 - 6 },
    fijo: true,
  });

  // --- notas privadas
  await page.click('#notes');
  await page.type('#notes', NOTA, { delay: 8 });
  await snap(page, 'rec-19-notas', {
    marks: [
      { n: 1, label: 'Notas privadas del reclutador', pos: 'l' },
      { n: 2, text: 'Guardar notas', tag: 'button', pad: 4, pos: 'r' },
    ],
    clip: { css: '#notes', margen: 120 },
    fijo: true,
  });
  await pulsar(page, 'Guardar notas', 'button');
  await waitText(page, 'Notas guardadas', 20000);
  await sleep(500);
  await snap(page, 'rec-20-notas-guardadas', {
    marks: [{ n: 1, text: 'Notas guardadas', tag: 'div', closest: 'li', pad: 4, pos: 'l' }],
    clip: { x: 760, y: 0, w: 520, h: 140 },
    fijo: true,
  });
  await esperarSinAvisos(page);

  // --- agendar la entrevista (dentro de siete días)
  await setInput(page, '#int-date', enDias(7));
  await page.click('#int-place');
  await page.type('#int-place', ENLACE, { delay: 6 });
  await snap(page, 'rec-21-entrevista-agendar', {
    marks: [
      { n: 1, label: 'Fecha', pos: 'tr' },
      { n: 2, label: 'Hora', pos: 'tr' },
      { n: 3, label: 'Tipo', pos: 'tr' },
      { n: 4, label: 'Enlace de la videollamada', pos: 'l' },
      { n: 5, text: 'Agendar y notificar', tag: 'button', pad: 4, pos: 'r' },
    ],
    clip: { css: '#int-place', margen: 190 },
    fijo: true,
  });
  await pulsar(page, 'Agendar y notificar', 'button');
  await waitText(page, 'Entrevista agendada', 30000);
  await sleep(700);
  await snap(page, 'rec-22-entrevista-agendada', {
    marks: [{ n: 1, text: 'Entrevista agendada', tag: 'div', closest: 'li', pad: 4, pos: 'l' }],
    clip: { x: 760, y: 0, w: 520, h: 150 },
    fijo: true,
  });
  await altura(page, 900);
  await esperarSinAvisos(page);

  // --- la postulación pasó a «Entrevista»
  await snap(page, 'rec-23-estado-entrevista', {
    marks: [{ n: 1, fila: CANDIDATA.nombre, text: 'Entrevista', tag: 'div, span', pad: 4, pos: 'b' }],
    clip: { x: 256, y: 320, w: 1024, h: 360 },
  });

  // --- pestaña Entrevistas: calendario
  await pulsarTab(page, 'Entrevistas');
  await sleep(2000);
  await pulsarDia(page, enDias(7));
  await sleep(1000);
  await snap(page, 'rec-24-entrevistas', {
    marks: [
      { n: 1, css: '[role="grid"] button[aria-selected="true"], table button[aria-selected="true"]', pad: 4, pos: 't' },
      { n: 2, text: 'Entrevistas para', tag: 'h3, h2', pad: 4, pos: 'l' },
      { n: 3, text: CANDIDATA.nombre, tag: 'p', pad: 4, pos: 'l' },
      { n: 4, text: 'Videollamada', tag: 'div, span', pad: 3, pos: 't' },
      { n: 5, aria: 'Cancelar entrevista', pad: 4, pos: 'r' },
    ],
    clip: { x: 256, y: 200, w: 1024, h: 460 },
  });

  // --- pestaña Recomendados
  await pulsarTab(page, 'Recomendados');
  await sleep(2500);
  await snap(page, 'rec-25-recomendados', {
    marks: [
      { n: 1, text: 'Buscar candidatos', tag: 'button', pad: 4, pos: 'r' },
      { n: 2, re: '^En espera \\(\\d+\\)$', tag: '[role=tab]', pad: 3, pos: 't' },
      { n: 3, re: '^Aceptados \\(\\d+\\)$', tag: '[role=tab]', pad: 3, pos: 't' },
      { n: 4, re: '^Rechazados \\(\\d+\\)$', tag: '[role=tab]', pad: 3, pos: 't' },
      { n: 5, card: CANDIDATA.nombre, contenedor: 'div.rounded-lg.border', re: '^\\d+% Match$', tag: 'div, span', pad: 4, pos: 'l' },
      { n: 6, text: 'Aceptar candidato', tag: 'button', nth: 0, pad: 4, pos: 'b' },
      { n: 7, text: 'Rechazar', tag: 'button', nth: 0, pad: 4, pos: 'b' },
    ],
    clip: { x: 256, y: 200, w: 1024, h: 1000 },
  });
  // se acepta el match de la candidata de ejemplo: su tarjeta se identifica por el nombre
  await pulsarEnCard(page, CANDIDATA.nombre, 'Aceptar candidato', 'button', 'div.rounded-lg.border');
  await waitText(page, 'Match aceptado', 30000);
  await sleep(700);
  await snap(page, 'rec-26-match-aceptado', {
    marks: [{ n: 1, text: 'Match aceptado', tag: 'div', closest: 'li', pad: 4, pos: 'l' }],
    clip: { x: 760, y: 0, w: 520, h: 170 },
  });
  await esperarSinAvisos(page);
  await pulsarTab(page, 'Aceptados');
  await sleep(1500);
  await snap(page, 'rec-27-aceptados', {
    marks: [
      { n: 1, re: '^Aceptados \\(\\d+\\)$', tag: '[role=tab]', pad: 3, pos: 't' },
      { n: 2, text: 'Aceptado · ya está en tus candidatos postulados', tag: 'div, span', pad: 4, pos: 'b' },
    ],
    clip: { x: 256, y: 200, w: 1024, h: 760 },
  });

  // --- pestaña Detalles (editar la vacante)
  await pulsarTab(page, 'Detalles');
  await sleep(1500);
  await snap(page, 'rec-28-vacante-editar', {
    marks: [
      { n: 1, text: 'Editar Vacante', tag: 'h2, h3', pad: 4, pos: 'l' },
      { n: 2, text: 'Guardar Cambios', tag: 'button', pad: 4, pos: 'l' },
      { n: 3, text: 'Cancelar', tag: 'button', pad: 4, pos: 'l' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 1240 },
  });

  // --- cerrar y reabrir la vacante
  await pulsar(page, 'Cerrar vacante', 'button');
  await waitText(page, 'Vacante cerrada', 30000);
  await sleep(900);
  await snap(page, 'rec-29-vacante-cerrada', {
    marks: [
      { n: 1, text: 'Vacante cerrada', tag: 'div', closest: 'li', pad: 4, pos: 'l' },
      { n: 2, re: '^Vacante · Cerrada$', tag: 'p, span, div', pad: 4, pos: 'l' },
      { n: 3, text: 'Reabrir vacante', tag: 'button', pad: 4, pos: 'b' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 330 },
  });
  await esperarSinAvisos(page);
  await pulsar(page, 'Reabrir vacante', 'button');
  await waitText(page, 'Vacante reabierta', 30000);
  await esperarSinAvisos(page);

  // --- eliminar: solo se muestra la confirmación y se cancela
  await pulsar(page, 'Eliminar', 'button');
  await page.waitForSelector('[role="alertdialog"]', { timeout: 15000 });
  await sleep(700);
  await snap(page, 'rec-30-eliminar', {
    marks: [
      { n: 1, css: '[role="alertdialog"] h2', pad: 4, pos: 'l' },
      { n: 2, text: 'Cancelar', tag: 'button', pad: 4, pos: 'b' },
      { n: 3, text: 'Sí, eliminar', tag: 'button', pad: 4, pos: 'b' },
    ],
    clip: { css: '[role="alertdialog"]', margen: 40 },
    fijo: true,
  });
  await pulsar(page, 'Cancelar', 'button', '[role="alertdialog"]');
  await sleep(700);

  // --- Candidatos (menú): búsqueda de talento
  await pulsar(page, 'Candidatos', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/candidates', { timeout: 30000 });
  await sleep(3000);
  await snap(page, 'rec-31-explorar-candidatos', {
    marks: [
      { n: 1, css: 'nav[aria-label="Menú principal"] a[href="/dashboard/candidates"]', pad: 4, pos: 'r' },
      { n: 2, aria: 'Buscar candidatos', pad: 4, pos: 'l' },
      { n: 3, aria: 'Nivel mínimo de habilidad', pad: 4, pos: 't' },
      { n: 4, aria: 'Seniority objetivo', pad: 4, pos: 't' },
      { n: 5, css: '#available', pad: 6, pos: 't' },
      { n: 6, re: '^\\d+ candidatos?$', tag: 'p', pad: 4, pos: 'l' },
      { n: 7, text: 'Contactar', tag: 'a', nth: 0, pad: 4, pos: 'l' },
    ],
    clip: { x: 0, y: 0, w: 1280, h: 880 },
  });
  await page.click('input[aria-label="Buscar candidatos"]');
  await page.keyboard.type('React', { delay: 40 });
  await sleep(1200);
  await snap(page, 'rec-32-candidatos-busqueda', {
    marks: [
      { n: 1, aria: 'Buscar candidatos', pad: 4, pos: 'tl' },
      { n: 2, re: '^\\d+ candidatos?$', tag: 'p', pad: 4, pos: 'tl' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 760 },
  });
  await s.ctx.close();
}

// Elige una opción de una lista de Radix que ya está abierta.
async function clickOpcion(page, texto) {
  const h = await page.evaluateHandle((t) => [...document.querySelectorAll('[role="option"]')].find((o) => o.textContent.trim() === t) || null, texto);
  const el = h.asElement();
  if (!el) throw new Error(`No se encontró la opción «${texto}»`);
  await el.click();
}



