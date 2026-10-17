// Comprueba con navegador real que el CV en PDF se lee con pdf.js 6 y que pdf.js se carga solo al subir el archivo.
//   node qa-tests/cv-pdf.mjs <etiqueta>
//
// La respuesta de la IA se simula (el endpoint /api/ai/extract-cv se intercepta), así que NO gasta tokens: lo que se
// verifica es el texto que sale del PDF (se compara con el que lleva cada CV de prueba) y el worker. Necesita los CV de
// prueba:  python qa-tests/crear-cvs.py
import path from 'path';
import {
  BASE, CV_DIR, OUT_DIR, sleep, launch, close, session, record, results, saveResults,
} from './lib.mjs';

const TAG = process.argv[2] || 'corrida';
const F = 'CV';
const CASOS = [
  ['carolina.mejia.pdf', ['Carolina Mejía Barrera', 'Cypress', 'Jenkins']],
  ['daniela.ochoa.pdf', ['Daniela Ochoa Fuentes', 'Figma']],
  ['sebastian.arellano.pdf', ['Sebastián Arellano Díaz', 'PyTorch']],
];
const RESPUESTA_IA = {
  headline: 'Prueba', location: 'CDMX', yearsOfExperience: 3, summary: 'Resumen de prueba para la verificación.',
  skills: [{ name: 'X', level: 3, years: 2 }], experience: [], education: [],
};

await launch();
try {
  const s = await session('candidato@example.com');
  const page = s.page;
  const peticiones = [];
  page.on('request', (r) => peticiones.push(r.url()));
  let cuerpo = null;
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (r.url().includes('/api/ai/extract-cv') && r.method() === 'POST') {
      cuerpo = JSON.parse(r.postData() || '{}');
      return r.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(RESPUESTA_IA) });
    }
    return r.continue();
  });
  await page.goto(BASE + '/dashboard/profile', { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.includes('Información Principal'), { timeout: 60000 });
  await sleep(1500);

  const antes = peticiones.filter((u) => /pdf\.worker|pdfjs|pdf\.mjs/.test(u));
  record(F, 'Carga diferida', 'al abrir el perfil no se descarga nada de pdf.js', antes.length === 0, `${antes.length} solicitudes`);

  for (const [archivo, esperado] of CASOS) {
    cuerpo = null;
    await (await page.$('#cv-upload')).uploadFile(path.join(CV_DIR, archivo));
    await page.waitForFunction(() => /Vista previa|Error al procesar CV/.test(document.body.innerText), { timeout: 60000 }).catch(() => {});
    await sleep(800);
    const texto = cuerpo?.cvText || '';
    const faltan = esperado.filter((x) => !texto.includes(x));
    record(F, 'Extracción', `${archivo}: el texto del PDF llega completo`, texto.length > 300 && faltan.length === 0, `${texto.length} caracteres${faltan.length ? '; faltan: ' + faltan.join(', ') : ''}`);
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Descartar')?.click());
    await sleep(500);
  }
  const worker = [...new Set(peticiones.filter((u) => /pdf\.worker\.[\d.]+\.min\.mjs/.test(u)).map((u) => u.replace(BASE, '')))];
  record(F, 'Worker', 'el worker se pide al propio sitio, con la versión en el nombre', worker.length === 1, worker.join(', '));
  const externas = peticiones.filter((u) => /cdnjs|unpkg|jsdelivr/.test(u));
  record(F, 'Terceros', 'no se pide nada a un CDN de terceros', externas.length === 0, `${externas.length} solicitudes`);
  record(F, 'Consola', 'sin errores relacionados con pdf.js o el worker', !s.log.console.some((c) => /worker|pdf/i.test(c)), s.log.console.join(' | ').slice(0, 200));
  await s.ctx.close();
} finally {
  saveResults(path.join(OUT_DIR, `cv-pdf_${TAG}.json`));
  await close();
}
const fallas = results.filter((x) => !x.ok).length;
console.log(`\n${results.length - fallas}/${results.length} correctas, ${fallas} fallas`);
process.exit(fallas ? 1 : 0);
