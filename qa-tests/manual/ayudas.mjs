// Ayudas de las capturas del manual de usuario: preparar la ventana, dibujar recuadros numerados y guardar cada imagen.
// Las usan las escenas de esta carpeta; el punto de entrada es qa-tests/capturas-manual.mjs.
import fs from 'fs';
import path from 'path';
import {
  BASE, PASS, HERE, sleep, launch, close, session, go, clickText, pickSelect, setInput, waitText,
  deleteAccountCascade, tryUid, db,
} from '../lib.mjs';

export { BASE, PASS, sleep, launch, close, session, go, clickText, pickSelect, setInput, waitText, deleteAccountCascade, tryUid, db };

export const OUT = process.env.OUT_DIR || path.join(HERE, 'resultados', 'capturas-manual');
fs.mkdirSync(OUT, { recursive: true });
// ------------------------------------------------------------------ cuentas de ejemplo del manual
export const CANDIDATA = { email: 'daniela.ruiz.manual@example.com', nombre: 'Daniela Ruiz Esquivel' };
export const RECLUTADOR = { email: 'andres.mejia.manual@example.com', nombre: 'Andrés Mejía Solís', empresa: 'Logística Tapatía' };
export const CV_PDF = process.env.CV_PDF || path.join(OUT, '..', 'cv-daniela-ruiz.pdf');

// 1100 px: sigue siendo la disposicion de escritorio (menu fijo, columnas completas) y, al encajar la imagen en una pagina, el texto se ve mas grande que con 1280.
const VISTA = { width: 1100, height: 900, deviceScaleFactor: 2 };
// Las tablas de administración (usuarios, organizaciones, vacantes, auditoría) necesitan más ancho: con 1100 px la tabla de usuarios se desplaza de lado y oculta «Acciones».
export const VISTA_ANCHA = { width: 1280, height: 900, deviceScaleFactor: 2 };
const COLOR = '#E11D48';
const catalogo = []; // { nombre, ancho, alto } de cada imagen, para que el documento sepa a qué tamaño insertarla

// ------------------------------------------------------------------ utilidades de captura
export async function preparar(page, vista = VISTA) {
  await page.setViewport(vista);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  // Edge dibuja su propio ojo para mostrar la contraseña encima del de HireLink: se oculta para que la imagen sea clara.
  await page.evaluateOnNewDocument(() => {
    const css = 'input::-ms-reveal,input::-ms-clear{display:none!important}';
    const poner = () => { const s = document.createElement('style'); s.textContent = css; (document.head || document.documentElement).appendChild(s); };
    if (document.head) poner(); else document.addEventListener('DOMContentLoaded', poner);
  });
}

// Tarjeta (Card) que contiene un título: sirve para recortar una sección o para enmarcarla.
export const tarjeta = (titulo) => ({ text: titulo, tag: 'h1, h2, h3, h4', closest: 'div.rounded-2xl' });

// Tarjeta central de las páginas de acceso (registro, inicio de sesión, recuperar contraseña).
export const TARJETA = 'main#contenido > div';

/**
 * Dibuja recuadros numerados sobre los elementos indicados, recorta la zona y guarda la imagen.
 *  marks: [{ n, css | text [+ tag] | label | placeholder | aria | box:[x,y,w,h], nth, within, parent, pad, pos }]
 *  clip:  undefined (zona que cubren los recuadros) | 'vista' | {x,y,w,h} | {css|text|label...} (zona de ese elemento)
 *  height: alto temporal de la ventana, para páginas largas
 *  fijo: no cambiar el tamaño de la ventana (los desplegables de Radix se cierran al redimensionar)
 */
export async function snap(page, nombre, { marks = [], clip, height, scroll, delay = 500, margen = 28, minAncho = 0, minAlto = 0, fijo = false } = {}) {
  const vp = page.viewport();
  // Si la página es más alta que la ventana se agranda la ventana: así toda la página queda a la vista y las coordenadas
  // de los recuadros son las del documento.
  let alto = height;
  if (!alto && !scroll && !fijo) {
    const total = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    if (total > vp.height) alto = Math.min(total + 40, 6000);
  }
  if (alto) await page.setViewport({ ...vp, height: alto });
  await page.evaluate((s) => {
    window.scrollTo(0, s || 0);
    // Al cerrar un menú el foco vuelve a su botón y puede desplazar una tabla de lado: se regresa al inicio.
    document.querySelectorAll('div, section, main').forEach((e) => { if (e.scrollLeft > 0) e.scrollLeft = 0; });
  }, scroll || 0);
  await sleep(delay);
  const r = await page.evaluate((marks, clip, color, margen) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const vis = (e) => {
      const b = e.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) return false;
      const cs = getComputedStyle(e);
      return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
    };
    const area = (e) => { const b = e.getBoundingClientRect(); return b.width * b.height; };
    const TAGS = 'button, a, [role=tab], [role=menuitem], [role=option], [role=combobox], label, h1, h2, h3, h4, p, span, li, th, td, div';
    function resolver(s) {
      if (s.box) { const [x, y, w, h] = s.box; return { left: x, top: y, width: w, height: h }; }
      let scope = document;
      if (s.within) scope = [...document.querySelectorAll(s.within)].filter(vis).pop() || document;
      // card: texto que identifica la tarjeta (Card) donde se busca el objetivo, p. ej. el título de una vacante
      if (s.card) {
        const t = [...document.querySelectorAll(s.contenedor || 'div.rounded-2xl')].filter((c) => vis(c) && norm(c.textContent).includes(s.card));
        scope = t.sort((x, y) => area(x) - area(y))[0] || null;
        if (!scope) throw new Error('No se encontró la tarjeta ' + s.card);
      }
      // fila: texto que identifica una fila (tr) de una tabla
      if (s.fila) {
        const t = [...document.querySelectorAll('tr')].filter((c) => vis(c) && norm(c.textContent).includes(s.fila));
        scope = t.sort((x, y) => area(x) - area(y))[0] || null;
        if (!scope) throw new Error('No se encontró la fila ' + s.fila);
      }
      const soloContenedor = (s.card || s.fila) && !s.css && !s.text && !s.re && !s.label && !s.placeholder && !s.aria;
      let el = null;
      if (soloContenedor) el = scope;
      else if (s.css) el = [...scope.querySelectorAll(s.css)].filter(vis)[s.nth || 0];
      else if (s.placeholder) el = [...scope.querySelectorAll(`[placeholder="${s.placeholder}"]`)].filter(vis)[s.nth || 0];
      else if (s.aria) el = [...scope.querySelectorAll(`[aria-label="${s.aria}"]`)].filter(vis)[s.nth || 0];
      else if (s.label) {
        const labs = [...scope.querySelectorAll('label')].filter((l) => vis(l) && norm(l.textContent).startsWith(s.label));
        const l = labs[s.nth || 0];
        if (l) el = (l.htmlFor && document.getElementById(l.htmlFor)) || l.parentElement.querySelector('input, textarea, button[role=combobox]');
      } else if (s.text || s.re) {
        const els = [...scope.querySelectorAll(s.tag || TAGS)].filter(vis);
        const rx = s.re ? new RegExp(s.re) : null;
        const exact = rx ? els.filter((e) => rx.test(norm(e.textContent))) : els.filter((e) => norm(e.textContent) === s.text);
        const part = rx ? exact : els.filter((e) => norm(e.textContent).includes(s.text));
        const pool = (exact.length ? exact : part).sort((a, b) => area(a) - area(b));
        el = pool[s.nth || 0];
      }
      if (!el) throw new Error('No se encontró el objetivo ' + JSON.stringify(s));
      for (let i = 0; i < (s.parent || 0); i++) el = el.parentElement;
      if (s.closest) el = el.closest(s.closest) || el;
      return el.getBoundingClientRect();
    }
    document.querySelectorAll('[data-manual]').forEach((e) => e.remove());
    const hechos = [];
    let u = null; // unión de lo que debe verse
    const unir = (x, y, w, h) => {
      if (!u) u = { x1: x, y1: y, x2: x + w, y2: y + h };
      else { u.x1 = Math.min(u.x1, x); u.y1 = Math.min(u.y1, y); u.x2 = Math.max(u.x2, x + w); u.y2 = Math.max(u.y2, y + h); }
    };
    for (const m of marks) {
      const b = resolver(m);
      const pad = m.pad ?? 4;
      const x = b.left - pad, y = b.top - pad, w = b.width + 2 * pad, h = b.height + 2 * pad;
      const caja = document.createElement('div');
      caja.setAttribute('data-manual', '1');
      caja.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border:3px solid ${color};border-radius:8px;box-shadow:0 0 0 2px rgba(255,255,255,.9);pointer-events:none;z-index:2147483000;box-sizing:border-box`;
      document.body.appendChild(caja);
      const D = 28;
      const pos = m.pos || 'tl';
      let bx = x - D / 2, by = y - D / 2;
      if (pos === 'tr') { bx = x + w - D / 2; by = y - D / 2; }
      if (pos === 'bl') { bx = x - D / 2; by = y + h - D / 2; }
      if (pos === 'br') { bx = x + w - D / 2; by = y + h - D / 2; }
      if (pos === 'l') { bx = x - D - 2; by = y + h / 2 - D / 2; }
      if (pos === 'r') { bx = x + w + 2; by = y + h / 2 - D / 2; }
      if (pos === 't') { bx = x + w / 2 - D / 2; by = y - D - 2; }
      if (pos === 'b') { bx = x + w / 2 - D / 2; by = y + h + 2; }
      const ins = document.createElement('div');
      ins.setAttribute('data-manual', '1');
      ins.textContent = String(m.n);
      ins.style.cssText = `position:fixed;left:${bx}px;top:${by}px;width:${D}px;height:${D}px;border-radius:50%;background:${color};color:#fff;font:700 16px/${D - 4}px Arial,sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4);pointer-events:none;z-index:2147483001;box-sizing:border-box`;
      document.body.appendChild(ins);
      unir(Math.min(x, bx), Math.min(y, by), Math.max(x + w, bx + D) - Math.min(x, bx), Math.max(y + h, by + D) - Math.min(y, by));
      hechos.push({ n: m.n, x, y, w, h });
    }
    let zona;
    if (clip === 'vista') zona = { x1: 0, y1: 0, x2: innerWidth, y2: innerHeight };
    else if (clip && clip.x !== undefined) zona = { x1: clip.x, y1: clip.y, x2: clip.x + clip.w, y2: clip.y + clip.h };
    else if (clip) { const b = resolver(clip); const p = clip.margen ?? 16; zona = { x1: b.left - p, y1: b.top - p, x2: b.left + b.width + p, y2: b.top + b.height + p }; }
    if (u) {
      const mu = { x1: u.x1 - margen, y1: u.y1 - margen, x2: u.x2 + margen, y2: u.y2 + margen };
      zona = zona && clip ? { x1: Math.min(zona.x1, mu.x1), y1: Math.min(zona.y1, mu.y1), x2: Math.max(zona.x2, mu.x2), y2: Math.max(zona.y2, mu.y2) } : (zona || mu);
    }
    if (!zona) zona = { x1: 0, y1: 0, x2: innerWidth, y2: innerHeight };
    return { zona, hechos, ancho: innerWidth, alto: innerHeight };
  }, marks, clip ?? null, COLOR, margen);

  let { x1, y1, x2, y2 } = r.zona;
  x1 = Math.max(0, Math.floor(x1)); y1 = Math.max(0, Math.floor(y1));
  x2 = Math.min(r.ancho, Math.ceil(x2)); y2 = Math.min(r.alto, Math.ceil(y2));
  if (minAncho && x2 - x1 < minAncho) { const falta = minAncho - (x2 - x1); x1 = Math.max(0, x1 - Math.floor(falta / 2)); x2 = Math.min(r.ancho, x1 + minAncho); }
  if (minAlto && y2 - y1 < minAlto) { y2 = Math.min(r.alto, y1 + minAlto); }
  const archivo = path.join(OUT, nombre + '.png');
  await page.screenshot({ path: archivo, clip: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }, captureBeyondViewport: false });
  await page.evaluate(() => document.querySelectorAll('[data-manual]').forEach((e) => e.remove()));
  if (alto) await page.setViewport(vp);
  const describir = (m) => m.text ?? m.re ?? m.aria ?? m.label ?? m.placeholder ?? m.css ?? m.card ?? m.fila ?? '(zona)';
  catalogo.push({ nombre, ancho: x2 - x1, alto: y2 - y1, marcas: marks.map((m) => ({ n: m.n, objetivo: String(describir(m)).slice(0, 70) })) });
  console.log(`  captura ${nombre}  (${x2 - x1}x${y2 - y1})`);
  return archivo;
}

// Escribe en el campo asociado a una etiqueta (Radix/react-hook-form enlaza label.htmlFor con el campo).
export async function escribir(page, etiqueta, texto, { nth = 0, limpiar = true } = {}) {
  const id = await page.evaluate((et, n) => {
    const l = [...document.querySelectorAll('label')].filter((x) => x.textContent.replace(/\s+/g, ' ').trim().startsWith(et))[n];
    return l ? l.htmlFor : null;
  }, etiqueta, nth);
  if (!id) throw new Error('No hay etiqueta ' + etiqueta);
  const sel = '#' + (/^[0-9]/.test(id) ? '\\3' + id[0] + ' ' + id.slice(1) : id).replace(/:/g, '\\:');
  if (limpiar) await llenar(page, sel, texto);
  else { await page.click(sel); await page.type(sel, texto, { delay: 8 }); }
}

// Borra lo que haya en un campo (Ctrl+A y Borrar: el triple clic no siempre selecciona todo) y escribe el texto.
export async function llenar(page, selector, texto, { retraso = 8 } = {}) {
  await page.click(selector);
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  if (texto) await page.type(selector, texto, { delay: retraso });
}

// Saca el puntero de la zona de trabajo. Un aviso emergente (toast) se pausa mientras el puntero está encima, y aparece justo donde
// se acaba de pulsar (arriba a la derecha): si el puntero se queda ahí, el aviso no se va y tapa el siguiente botón.
export async function alejarRaton(page) {
  const v = page.viewport();
  await page.mouse.move(Math.round(v.width / 2), Math.max(4, v.height - 6));
}

// Pulsa un botón por su texto exacto (Radix responde a mousedown, no a .click()).
export async function pulsar(page, texto, tag = 'button', root = 'document') {
  await clickText(page, texto, tag, root);
  await alejarRaton(page);
}

export async function cerrarSesion(page) {
  await clickText(page, 'Cerrar Sesión', 'button').catch(() => clickText(page, 'Cerrar Sesión', 'a'));
  await sleep(1500);
}

export function guardarCatalogo() {
  const f = path.join(OUT, 'catalogo.json');
  let previo = [];
  try { previo = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* primera ejecución */ }
  const mapa = new Map(previo.map((c) => [c.nombre, c]));
  for (const c of catalogo) mapa.set(c.nombre, c);
  fs.writeFileSync(f, JSON.stringify([...mapa.values()], null, 1));
}


// Elimina una cuenta de ejemplo y lo que dejó en la auditoría.
export async function limpiarCuenta(c) {
  const logs = await db.collection('auditLogs').where('actorEmail', '==', c.email).get();
  for (const d of logs.docs) await d.ref.delete();
  const existia = await deleteAccountCascade(c.email);
  console.log(`  ${c.email}: ${existia ? 'eliminada' : 'no existía'} (${logs.size} registros de auditoría)`);
}

// Elimina las cuentas de ejemplo del manual y lo que dejaron (auditoría y avisos), para que staging quede como estaba.
export async function limpiarCuentas() {
  // Lo que dejan las cuentas de ejemplo en datos de otras personas: avisos, auditoría de quien las administró y topes de uso.
  const huellas = [CANDIDATA.email, RECLUTADOR.email, CANDIDATA.nombre, RECLUTADOR.nombre, RECLUTADOR.empresa, 'Daniela Ruiz', 'Andrés Mejía', 'Desarrollador Front-End React'];
  const uids = [];
  for (const c of [CANDIDATA, RECLUTADOR]) {
    const uid = await tryUid(c.email);
    if (uid) uids.push(uid);
    await limpiarCuenta(c);
  }
  let avisos = 0;
  for (const n of (await db.collectionGroup('notifications').get()).docs) {
    if (huellas.some((h) => JSON.stringify(n.data()).includes(h))) { await n.ref.delete(); avisos++; }
  }
  let auditoria = 0;
  for (const l of (await db.collection('auditLogs').orderBy('createdAt', 'desc').limit(400).get()).docs) {
    if (huellas.some((h) => JSON.stringify(l.data()).includes(h))) { await l.ref.delete(); auditoria++; }
  }
  let topes = 0;
  for (const ref of await db.collection('rateLimits').listDocuments()) {
    if (uids.some((u) => ref.id.startsWith(u + '_'))) { await ref.delete(); topes++; }
  }
  console.log(`  avisos eliminados: ${avisos} | auditoría de otras cuentas: ${auditoria} | topes de uso: ${topes}`);
}






// Los avisos emergentes (toasts) se dibujan arriba a la derecha, encima de botones como «Crear Vacante»: se espera a que se vayan.
export async function esperarSinAvisos(page, ms = 15000) {
  await alejarRaton(page);
  try {
    await page.waitForFunction(() => !document.querySelector('li[data-swipe-direction][data-state="open"]'), { timeout: ms });
  } catch { /* si el aviso no se va, se sigue igual */ }
  await sleep(700);
}


// Pulsa un botón o enlace que está dentro de la tarjeta (Card) que contiene cierto texto, p. ej. el título de una vacante.
export async function pulsarEnCard(page, card, texto, tag = 'a, button', contenedor = 'div.rounded-2xl') {
  const h = await page.evaluateHandle((card, texto, tag, contenedor) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const area = (e) => { const b = e.getBoundingClientRect(); return b.width * b.height; };
    const cards = [...document.querySelectorAll(contenedor)].filter((c) => norm(c.textContent).includes(card)).sort((a, b) => area(a) - area(b));
    const c = cards[0];
    if (!c) return null;
    const els = [...c.querySelectorAll(tag)];
    return els.find((e) => norm(e.textContent) === texto) || els.find((e) => norm(e.textContent).includes(texto)) || null;
  }, card, texto, tag, contenedor);
  const el = h.asElement();
  if (!el) throw new Error(`No se encontró «${texto}» en la tarjeta «${card}»`);
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await sleep(300);
  await el.click();
  await alejarRaton(page);
}



// Cambia el alto de la ventana (p. ej. para que un cuadro de diálogo con mucho contenido quepa entero).
export const altura = (page, alto) => page.setViewport({ ...page.viewport(), height: alto });


// Pulsa una pestaña (role=tab) por su texto, p. ej. «Candidatos» para «Candidatos (3)».
export async function pulsarTab(page, texto) {
  await clickText(page, texto, '[role=tab]');
  await alejarRaton(page);
}

// Pulsa un día del calendario a partir de una fecha AAAA-MM-DD. El calendario abre en el mes actual: si la fecha cae en otro
// mes se avanza con el botón «Go to next month». Se toma el último botón con ese número para saltar los días del mes anterior
// que se muestran antes del 1.
export async function pulsarDia(page, iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const hoy = new Date();
  const meses = (y - hoy.getFullYear()) * 12 + (m - 1 - hoy.getMonth());
  for (let i = 0; i < meses; i++) {
    await page.click('button[aria-label="Go to next month"]');
    await sleep(500);
  }
  const h = await page.evaluateHandle((n) => {
    const dias = [...document.querySelectorAll('[role=grid] button, table button')].filter((b) => b.textContent.trim() === String(n) && !b.disabled);
    return dias[dias.length - 1] || null;
  }, d);
  const el = h.asElement();
  if (!el) throw new Error('No se encontró el día ' + iso);
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await el.click();
  await alejarRaton(page);
  await sleep(600);
}
// Fecha dentro de n días en formato AAAA-MM-DD (el que usa un campo de fecha).
export const enDias = (n) => { const d = new Date(Date.now() + n * 86400000); return d.toLocaleDateString('en-CA'); };

