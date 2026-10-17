// Auditoría de accesibilidad (axe-core, WCAG 2.2 AA) y de uso en celular de las páginas clave.
//   node qa-tests/medicion/accesibilidad-axe.mjs <etiqueta> [id1 id2 ...]
// Variable: A11Y_ESQUEMA=dark|light elige el tema (la aplicación sigue el del sistema; por defecto dark).
//
// Además de axe, comprueba en celular (375 px) el desbordamiento horizontal y los controles más chicos que 24 x 24 px
// (WCAG 2.5.8). El navegador amplía la ventana si el contenido es más ancho que la pantalla, por eso el ancho de la
// página se compara contra el de la vista emulada y no contra window.innerWidth.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { BASE, OUT_DIR, launch, login, porRol, sleep } from './comun.mjs';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TAG = process.argv[2] || 'corrida';
const SOLO = process.argv.slice(3);
const OUT = path.join(OUT_DIR, `axe_${TAG}.json`);
const SHOTS = path.join(OUT_DIR, `capturas_${TAG}`);
fs.mkdirSync(SHOTS, { recursive: true });
const resultados = [];

const VISTAS = {
  escritorio: { width: 1366, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  celular: { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

async function auditar(page, t, vista) {
  await page.setViewport(VISTAS[vista]);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: process.env.A11Y_ESQUEMA || 'dark' }]);
  await page.goto(BASE + t.path, { waitUntil: 'networkidle2', timeout: 120000 });
  if (t.espera) await page.waitForFunction((x) => document.body.innerText.includes(x), { timeout: 45000 }, t.espera).catch(() => {});
  await sleep(2200);
  await page.evaluate(axeSource);
  const axe = await page.evaluate(async () => {
    const r = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      resultTypes: ['violations'],
    });
    return r.violations.map((v) => ({
      id: v.id, impacto: v.impact, ayuda: v.help, url: v.helpUrl, etiquetas: v.tags.filter((x) => /^wcag\d/.test(x)).slice(0, 3),
      nodos: v.nodes.length,
      ejemplos: v.nodes.slice(0, 3).map((n) => ({ selector: (n.target || []).join(' '), html: (n.html || '').slice(0, 140), detalle: (n.any?.[0]?.message || n.all?.[0]?.message || n.none?.[0]?.message || '').slice(0, 160) })),
    }));
  });
  const resumen = { critical: 0, serious: 0, moderate: 0, minor: 0, reglas: axe.length, nodos: 0 };
  for (const v of axe) { resumen[v.impacto] = (resumen[v.impacto] || 0) + 1; resumen.nodos += v.nodos; }

  const extra = await page.evaluate((anchoVista) => {
    const iw = anchoVista;
    const anchoPagina = Math.max(document.documentElement.scrollWidth, window.innerWidth);
    const fuera = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const st = getComputedStyle(el);
      if (st.position === 'fixed' || st.visibility === 'hidden' || st.display === 'none') continue;
      if (r.right > iw + 1 && r.left < iw) fuera.push({ tag: el.tagName.toLowerCase(), clase: String(el.className || '').slice(0, 60), exceso: Math.round(r.right - iw) });
    }
    fuera.sort((a, b) => b.exceso - a.exceso);
    const interactivos = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=switch], [role=checkbox]')];
    let pequenos = 0;
    const ejemplos = [];
    for (const el of interactivos) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (el.tagName === 'A' && el.closest('p, li') && !el.closest('nav')) continue; // enlaces dentro de texto
      if (el.tagName === 'A' && el.getAttribute('href') === '#contenido') continue; // enlace de salto: se muestra al recibir el foco
      if (el.tagName === 'SELECT' && r.width <= 1) continue; // <select> nativo oculto de Radix
      if (r.width < 24 || r.height < 24) { pequenos++; if (ejemplos.length < 3) ejemplos.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} «${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}»`); }
    }
    return { desborda: anchoPagina > iw + 1, anchoPagina, anchoVentana: iw, elementosFuera: fuera.slice(0, 3), pequenos, ejemplosPequenos: ejemplos };
  }, VISTAS[vista].width);
  if (vista === 'celular') await page.screenshot({ path: path.join(SHOTS, `${t.id}_celular.png`) }).catch(() => {});
  return { id: t.id, rol: t.rol, ruta: t.path, vista, resumen, violaciones: axe, ...extra };
}

for (const [email, destinos] of porRol()) {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    if (email !== 'publico') await login(page, email);
    for (const t of destinos) {
      if (SOLO.length && !SOLO.includes(t.id)) continue;
      for (const vista of ['escritorio', 'celular']) {
        try {
          const r = await auditar(page, t, vista);
          resultados.push(r);
          console.log(`${t.id.padEnd(20)} ${vista.padEnd(10)} reglas ${String(r.resumen.reglas).padStart(2)} (graves ${r.resumen.critical + r.resumen.serious}, moderadas ${r.resumen.moderate}, leves ${r.resumen.minor})  nodos ${String(r.resumen.nodos).padStart(3)}  ${vista === 'celular' ? `desborda ${r.desborda ? 'SÍ' : 'no'}  pequeños ${r.pequenos}` : ''}`);
        } catch (e) {
          console.log(`${t.id.padEnd(20)} ${vista.padEnd(10)} ERROR ${String(e.message).slice(0, 140)}`);
        }
        fs.writeFileSync(OUT, JSON.stringify(resultados, null, 2));
      }
    }
  } finally {
    await browser.close();
  }
}
console.log('listo:', resultados.length, 'auditorías en', OUT);
process.exit(0);
