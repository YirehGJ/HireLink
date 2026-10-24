// Escena del administrador (cuenta de demostración admin@example.com): panel, usuarios, «Ver como», organizaciones, vacantes y auditoría.
// Para no tocar a las personas de la demostración, lo que modifica (suspender, reactivar) se hace sobre el reclutador de ejemplo.
import {
  RECLUTADOR, VISTA_ANCHA, sleep, session, preparar, snap, pulsar, waitText, go, esperarSinAvisos, alejarRaton,
} from './ayudas.mjs';
import { VACANTE } from './reclutador.mjs';

const CORREO = RECLUTADOR.email;

export async function escenaAdmin() {
  const s = await session('admin@example.com');
  const { page } = s;
  await preparar(page, VISTA_ANCHA);

  // --- panel principal
  await go(page, '/dashboard/admin/overview', 'Panel de Administración', 4000);
  await snap(page, 'adm-01-panel', {
    marks: [
      { n: 1, css: 'nav[aria-label="Menú principal"]', pad: 6, pos: 'r' },
      { n: 2, card: 'candidatos · ', pos: 'tl' },
      { n: 3, card: 'Empresas con perfil activo', pos: 'tl' },
      { n: 4, card: 'Publicadas y recibiendo postulaciones', pos: 'tl' },
      { n: 5, card: 'en los últimos 7 días', pos: 'tl' },
      { n: 6, text: 'Auditoría y KPIs', tag: 'a', pad: 4, pos: 'b' },
    ],
    clip: { x: 0, y: 0, w: 1280, h: 760 },
  });

  // --- gestión de usuarios: buscar a la persona de ejemplo
  await pulsar(page, 'Gestión Usuarios', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/admin/users', { timeout: 30000 });
  await sleep(3000);
  await page.click('input[placeholder="Buscar por nombre, email o rol..."]');
  await page.keyboard.type('andres.mejia.manual', { delay: 30 });
  await sleep(1200);
  await snap(page, 'adm-02-usuarios', {
    marks: [
      { n: 1, css: 'input[placeholder="Buscar por nombre, email o rol..."]', pad: 4, pos: 'l' },
      { n: 2, fila: CORREO, css: 'button[role="combobox"]', nth: 0, pad: 4, pos: 't' },
      { n: 3, fila: CORREO, css: 'button[role="combobox"]', nth: 1, pad: 4, pos: 't' },
      { n: 4, fila: CORREO, text: 'Activo', tag: 'div, span', pad: 4, pos: 't' },
      { n: 5, fila: CORREO, css: 'button[aria-haspopup="menu"]', pad: 4, pos: 't' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 560 },
  });

  // --- el menú de acciones de esa persona
  await abrirAcciones(page);
  await sleep(900);
  await snap(page, 'adm-03-acciones', {
    marks: [
      { n: 1, text: 'Ver Perfil', tag: '[role=menuitem]', pad: 2, pos: 'l' },
      { n: 2, text: 'Ver como (solo lectura)', tag: '[role=menuitem]', pad: 2, pos: 'l' },
      { n: 3, text: 'Suspender', tag: '[role=menuitem]', pad: 2, pos: 'l' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 720 },
    fijo: true,
  });

  // --- suspender: no pide confirmación, el cambio es inmediato
  await clickItem(page, 'Suspender');
  await waitText(page, 'Estado de usuario actualizado', 20000);
  await sleep(900);
  await snap(page, 'adm-04-suspendido', {
    marks: [
      { n: 1, text: 'Estado de usuario actualizado', tag: 'div', closest: 'li', pad: 4, pos: 'l' },
      { n: 2, fila: CORREO, text: 'Suspendido', tag: 'div, span', pad: 4, pos: 'b' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 560 },
  });
  await esperarSinAvisos(page);

  // --- lo que ve la persona suspendida (otra sesión, la del reclutador de ejemplo)
  {
    const t = await session(RECLUTADOR.email);
    await preparar(t.page, VISTA_ANCHA);
    await go(t.page, '/dashboard/jobs', 'Tu cuenta está suspendida', 2500);
    await snap(t.page, 'adm-05-cuenta-suspendida', {
      marks: [{ n: 1, text: 'Cerrar sesión', tag: 'button', pad: 4, pos: 'r' }],
      clip: { x: 256, y: 120, w: 1024, h: 560 },
    });
    await t.ctx.close();
  }

  // --- reactivar
  await page.bringToFront();
  await abrirAcciones(page);
  await sleep(700);
  await snap(page, 'adm-06-reactivar', {
    marks: [{ n: 1, text: 'Reactivar', tag: '[role=menuitem]', pad: 2, pos: 'l' }],
    clip: { x: 256, y: 0, w: 1024, h: 720 },
    fijo: true,
  });
  await clickItem(page, 'Reactivar');
  await waitText(page, 'Estado de usuario actualizado', 20000);
  await esperarSinAvisos(page);

  // --- «Ver como» (solo lectura)
  await abrirAcciones(page);
  await clickItem(page, 'Ver como (solo lectura)');
  await page.waitForFunction(() => location.pathname === '/dashboard/jobs', { timeout: 30000 });
  await sleep(3500);
  await snap(page, 'adm-07-ver-como', {
    marks: [
      { n: 1, text: 'Modo solo lectura', tag: 'span', pad: 6, pos: 'tl' },
      { n: 2, text: 'Salir', tag: 'button', pad: 4, pos: 'b' },
      { n: 3, text: 'Crear Vacante', tag: 'a, button', pad: 4, pos: 'b' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 520 },
  });
  await pulsar(page, 'Salir', 'button');
  await page.waitForFunction(() => location.pathname === '/dashboard/admin/users', { timeout: 30000 });
  await sleep(3000);

  // --- ficha de la persona (Ver Perfil)
  await page.click('input[placeholder="Buscar por nombre, email o rol..."]');
  await page.keyboard.type('andres.mejia.manual', { delay: 30 });
  await sleep(1000);
  await abrirAcciones(page);
  await clickItem(page, 'Ver Perfil');
  await page.waitForFunction(() => /^\/dashboard\/users\/[^/]+$/.test(location.pathname), { timeout: 30000 });
  await sleep(2500);
  await snap(page, 'adm-08-perfil-usuario', {
    marks: [
      { n: 1, text: 'Ver como (solo lectura)', tag: 'button', pad: 4, pos: 'b' },
      { n: 2, text: 'Volver a Usuarios', tag: 'a', pad: 4, pos: 'b' },
      { n: 3, text: 'Información del Usuario', tag: 'h2, h3', closest: 'div.rounded-2xl', pad: 0, pos: 'tl' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 720 },
  });

  // --- organizaciones
  await pulsar(page, 'Organizaciones', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/admin/organizations', { timeout: 30000 });
  await sleep(3000);
  // El orden de la lista no es estable (Firestore ordena por identificador): se sube la fila de la empresa de ejemplo para que la imagen sea corta.
  await page.evaluate((nombre) => {
    const fila = [...document.querySelectorAll('tbody tr')].find((r) => r.textContent.includes(nombre));
    if (fila) fila.parentElement.prepend(fila);
  }, RECLUTADOR.empresa);
  await sleep(400);
  await snap(page, 'adm-09-organizaciones', {
    marks: [
      { n: 1, text: 'Nueva organización', tag: 'button', pad: 4, pos: 'l' },
      { n: 2, fila: RECLUTADOR.empresa, pad: 2, pos: 'l' },
      { n: 3, fila: RECLUTADOR.empresa, aria: 'Editar', pad: 4, pos: 'b' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 640 },
  });
  await pulsarFila(page, RECLUTADOR.empresa, 'button[aria-label="Editar"]');
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await sleep(900);
  await page.click('[role="dialog"] h2'); // quita la selección azul del primer campo
  await sleep(300);
  await snap(page, 'adm-10-editar-organizacion', {
    marks: [
      { n: 1, css: '#org-name', pad: 4, pos: 'l' },
      { n: 2, css: '#org-web', pad: 4, pos: 'l' },
      { n: 3, css: '#org-desc', pad: 4, pos: 'l' },
      { n: 4, text: 'Guardar', tag: 'button', pad: 4, pos: 'b' },
      { n: 5, text: 'Cancelar', tag: 'button', pad: 4, pos: 'b' },
    ],
    clip: { css: '[role="dialog"]', margen: 50 },
    fijo: true,
  });
  await pulsar(page, 'Cancelar', 'button', '[role="dialog"]');
  await sleep(700);

  // --- gestión de vacantes
  await pulsar(page, 'Gestión Vacantes', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/admin/jobs', { timeout: 30000 });
  await sleep(3000);
  await page.click('input[placeholder="Buscar por título, ID de vacante o empresa..."]');
  await page.keyboard.type('Logística Tapatía', { delay: 30 });
  await sleep(1200);
  await snap(page, 'adm-11-vacantes', {
    marks: [
      { n: 1, css: 'input[placeholder="Buscar por título, ID de vacante o empresa..."]', pad: 4, pos: 'l' },
      { n: 2, css: 'main button[role="combobox"]', pad: 4, pos: 't' },
      { n: 3, fila: VACANTE.titulo, text: 'Publicada', tag: 'div, span', pad: 4, pos: 't' },
      { n: 4, fila: VACANTE.titulo, css: 'button[aria-haspopup="menu"]', pad: 4, pos: 't' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 560 },
  });
  await pulsarFila(page, VACANTE.titulo, 'button[aria-haspopup="menu"]');
  await sleep(900);
  await snap(page, 'adm-12-vacantes-acciones', {
    marks: [
      { n: 1, text: 'Ver / Editar Vacante', tag: '[role=menuitem]', pad: 2, pos: 'l' },
      { n: 2, text: 'Desactivar Vacante', tag: '[role=menuitem]', pad: 2, pos: 'l' },
      { n: 3, text: 'Eliminar Vacante', tag: '[role=menuitem]', pad: 2, pos: 'l' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 720 },
    fijo: true,
  });
  await clickItem(page, 'Eliminar Vacante');
  await page.waitForSelector('[role="alertdialog"]', { timeout: 15000 });
  await sleep(700);
  await snap(page, 'adm-13-eliminar-vacante', {
    marks: [
      { n: 1, css: '[role="alertdialog"] h2', pad: 4, pos: 'l' },
      { n: 2, text: 'Cancelar', tag: 'button', pad: 4, pos: 'b' },
      { n: 3, text: 'Sí, eliminar vacante', tag: 'button', pad: 4, pos: 'b' },
    ],
    clip: { css: '[role="alertdialog"]', margen: 40 },
    fijo: true,
  });
  await pulsar(page, 'Cancelar', 'button', '[role="alertdialog"]');
  await sleep(700);

  // --- auditoría: se filtra por la persona de ejemplo para ver solo sus acciones
  await pulsar(page, 'Auditoría', 'a');
  await page.waitForFunction(() => location.pathname === '/dashboard/admin/audit', { timeout: 30000 });
  await sleep(3500);
  await page.click('input[placeholder="Filtrar por usuario, acción o detalle…"]');
  await page.keyboard.type('andres.mejia.manual', { delay: 30 });
  await sleep(1200);
  await snap(page, 'adm-14-auditoria', {
    marks: [
      { n: 1, text: 'Registro de Auditoría', tag: '[role=tab]', pad: 3, pos: 't' },
      { n: 2, css: 'input[placeholder="Filtrar por usuario, acción o detalle…"]', pad: 4, pos: 'l' },
      { n: 3, text: 'Acción', tag: 'th', pad: 4, pos: 't' },
      { n: 4, text: 'Embudo y KPIs', tag: '[role=tab]', pad: 3, pos: 't' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 900 },
  });
  await pulsarTabAdmin(page, 'Embudo y KPIs');
  await waitText(page, 'Embudo de selección', 40000);
  await sleep(2500);
  await snap(page, 'adm-15-kpis', {
    marks: [
      { n: 1, text: 'Embudo de selección', tag: 'h2, h3', closest: 'div.rounded-2xl', pad: 0, pos: 'tl' },
      { n: 2, text: 'Indicadores clave', tag: 'h2, h3', closest: 'div.rounded-2xl', pad: 0, pos: 'tl' },
      { n: 3, text: 'Vacantes con más postulaciones', tag: 'h2, h3', closest: 'div.rounded-2xl', pad: 0, pos: 'tl' },
    ],
    clip: { x: 256, y: 0, w: 1024, h: 820 },
  });
  await s.ctx.close();
}

// ---- ayudas propias de esta escena

// Abre el menú «···» de la fila de la persona de ejemplo.
async function abrirAcciones(page) {
  await pulsarFila(page, CORREO, 'button[aria-haspopup="menu"]');
}

// Pulsa un elemento dentro de la fila (tr) que contiene cierto texto.
async function pulsarFila(page, texto, selector) {
  const h = await page.evaluateHandle((t, sel) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const filas = [...document.querySelectorAll('tr')].filter((f) => norm(f.textContent).includes(t));
    const f = filas.sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
    return f ? f.querySelector(sel) : null;
  }, texto, selector);
  const el = h.asElement();
  if (!el) throw new Error(`No se encontró ${selector} en la fila «${texto}»`);
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await sleep(300);
  await el.click();
  await alejarRaton(page);
  await sleep(500);
}

// Elige una opción de un menú abierto (role=menuitem).
async function clickItem(page, texto) {
  const h = await page.evaluateHandle((t) => [...document.querySelectorAll('[role="menuitem"]')].find((o) => o.textContent.replace(/\s+/g, ' ').trim() === t) || null, texto);
  const el = h.asElement();
  if (!el) throw new Error(`No se encontró la opción «${texto}»`);
  await el.click();
  await alejarRaton(page);
}

async function pulsarTabAdmin(page, texto) {
  const h = await page.evaluateHandle((t) => [...document.querySelectorAll('[role="tab"]')].find((o) => o.textContent.trim() === t) || null, texto);
  const el = h.asElement();
  if (!el) throw new Error(`No se encontró la pestaña «${texto}»`);
  await el.click();
  await alejarRaton(page);
}

