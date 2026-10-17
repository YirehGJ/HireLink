// Mide con Lighthouse (rendimiento, accesibilidad, buenas prácticas y SEO) las páginas clave, en celular y escritorio.
//   node qa-tests/medicion/rendimiento.mjs <etiqueta> [id1 id2 ...]
// Variables: LH_MODOS=celular,escritorio (por defecto los dos), LH_FULL=1 guarda el informe completo de cada medición.
//
// Lighthouse simula la red y la CPU de un celular de gama media y varía de una corrida a otra (±5 a ±10 puntos), así
// que para comparar se repite la medición y se usa la mediana (ver comparar.py). Antes de cada medición se vacía la
// caché HTTP para contar los bytes que de verdad se transfieren.
import fs from 'fs';
import path from 'path';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { BASE, OUT_DIR, launch, login, porRol, sleep } from './comun.mjs';

const TAG = process.argv[2] || 'corrida';
const SOLO = process.argv.slice(3);
const OUT = path.join(OUT_DIR, `lh_${TAG}.json`);
const resultados = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
const guardar = () => fs.writeFileSync(OUT, JSON.stringify(resultados, null, 2));

const num = (a, id) => a[id]?.numericValue;
async function medir(browser, t, modo) {
  const limpia = await browser.newPage();
  const cdp = await limpia.createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Network.clearBrowserCache');
  await limpia.close();
  const port = Number(new URL(browser.wsEndpoint()).port);
  const flags = { port, output: 'json', logLevel: 'error', disableStorageReset: true, onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] };
  const config = modo === 'escritorio' ? desktopConfig : undefined;
  if (modo === 'celular') flags.formFactor = 'mobile';
  const run = await lighthouse(BASE + t.path, flags, config);
  const l = run.lhr;
  if (process.env.LH_FULL) fs.writeFileSync(path.join(OUT_DIR, `lhr_${TAG}_${t.id}_${modo}.json`), JSON.stringify(l));
  const a = l.audits;
  const items = a['resource-summary']?.details?.items || [];
  const peso = (tipo) => items.find((i) => i.resourceType === tipo)?.transferSize;
  return {
    id: t.id, rol: t.rol, ruta: t.path, modo,
    puntajes: Object.fromEntries(Object.entries(l.categories).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)])),
    metricas: { fcp: num(a, 'first-contentful-paint'), lcp: num(a, 'largest-contentful-paint'), tbt: num(a, 'total-blocking-time'), cls: num(a, 'cumulative-layout-shift'), si: num(a, 'speed-index'), tti: num(a, 'interactive') },
    peso: { total: peso('total'), script: peso('script'), imagen: peso('image'), solicitudes: items.find((i) => i.resourceType === 'total')?.requestCount },
    jsSinUsar: num(a, 'unused-javascript'),
    urlFinal: l.finalDisplayedUrl,
    advertencias: (l.runWarnings || []).slice(0, 2),
  };
}

for (const [email, destinos] of porRol()) {
  const browser = await launch();
  try {
    if (email !== 'publico') {
      const page = await browser.newPage();
      await login(page, email);
      await page.close();
    }
    for (const t of destinos) {
      if (SOLO.length && !SOLO.includes(t.id)) continue;
      for (const modo of (process.env.LH_MODOS || 'celular,escritorio').split(',')) {
        if (resultados.some((r) => r.id === t.id && r.modo === modo)) continue; // permite reanudar una corrida
        try {
          const r = await medir(browser, t, modo);
          resultados.push(r);
          guardar();
          console.log(`${t.id.padEnd(20)} ${modo.padEnd(10)} rend ${String(r.puntajes.performance).padStart(3)}  acces ${String(r.puntajes.accessibility).padStart(3)}  prác ${String(r.puntajes['best-practices']).padStart(3)}  seo ${String(r.puntajes.seo).padStart(3)}  LCP ${Math.round(r.metricas.lcp)} ms  TBT ${Math.round(r.metricas.tbt)} ms  js ${Math.round((r.peso.script || 0) / 1024)} kB`);
        } catch (e) {
          console.log(`${t.id.padEnd(20)} ${modo.padEnd(10)} ERROR ${String(e.message).slice(0, 140)}`);
        }
        await sleep(500);
      }
    }
  } finally {
    await browser.close();
  }
}
console.log('listo:', resultados.length, 'mediciones en', OUT);
process.exit(0);
