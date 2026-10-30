// Evalúa la extracción de datos de CV: lee cada PDF con pdf.js (como el navegador), pide los datos al modelo con el mismo flujo
// de la aplicación y los compara con la verdad conocida (los CV se generaron a partir de datos fijos: fixtures/verdad-cv.json).
//   node scripts/evaluacion/extraccion.mjs --modelo openai/gpt-oss-120b
import fs from 'fs';
import path from 'path';
import {
  FIXTURES, argumentos, prepararIA, leerFixture, escribirResultado, norm, coincide, media, mediana, percentil, redondear, enParalelo, ahora,
} from './comun.mjs';

const { modelo, corto, simultaneas, solo } = argumentos();
prepararIA(modelo);
const { extractCvData } = await import('../../src/ai/flows/extract-cv-data-flow.ts');
const { runAi } = await import('../../src/lib/server/ai-runner.ts');
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

/** Misma lectura que src/lib/pdf-text.ts, pero desde un archivo del disco. */
async function textoDePdf(ruta) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(ruta)), useSystemFonts: true, disableFontFace: true, verbosity: 0 }).promise;
  let texto = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const contenido = await (await doc.getPage(i)).getTextContent();
    texto += contenido.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
  }
  return texto.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
}

function evaluar(v, s) {
  const verdad = v.habilidades.map(norm);
  const extraidas = (s.skills ?? []).map((x) => norm(x.name));
  const halladas = verdad.filter((h) => extraidas.some((e) => coincide(h, e))).length;
  const utiles = extraidas.filter((e) => verdad.some((h) => coincide(h, e))).length;
  const recall = halladas / verdad.length;
  const precision = extraidas.length ? utiles / extraidas.length : 0;
  const empresasE = (s.experience ?? []).map((x) => norm(x.company));
  const puestosE = (s.experience ?? []).map((x) => norm(x.title));
  const expEmpresa = v.experiencia.filter((x) => empresasE.some((e) => coincide(norm(x.empresa), e))).length / v.experiencia.length;
  const expPuesto = v.experiencia.filter((x) => puestosE.some((e) => coincide(norm(x.puesto), e))).length / v.experiencia.length;
  const instE = (s.education ?? []).map((x) => norm(x.institution));
  const edu = v.educacion.filter((x) => instE.some((e) => coincide(norm(x.institucion), e))).length / v.educacion.length;
  const titular = coincide(norm(s.headline), norm(v.titular)) ? 1 : 0;
  const anios = Number((v.resumen.match(/(\d+)\s+a[ñn]os?/) || [])[1]);
  return {
    habilidades_esperadas: verdad.length, habilidades_extraidas: extraidas.length, habilidades_halladas: halladas,
    recall_habilidades: redondear(recall), precision_habilidades: redondear(precision),
    experiencia_empresas: redondear(expEmpresa), experiencia_puestos: redondear(expPuesto), formacion_instituciones: redondear(edu),
    entradas_experiencia: { esperadas: v.experiencia.length, extraidas: (s.experience ?? []).length },
    entradas_formacion: { esperadas: v.educacion.length, extraidas: (s.education ?? []).length },
    titular_coincide: titular, anios_verdad: anios, anios_extraidos: s.yearsOfExperience, error_anios: Math.abs((s.yearsOfExperience ?? 0) - anios),
  };
}

const verdad = leerFixture('verdad-cv.json').filter((v) => !solo || v.archivo.includes(solo));
console.log(`Extracción de ${verdad.length} CV con ${modelo} (${simultaneas} a la vez)`);
const filas = await enParalelo(verdad, simultaneas, async (v) => {
  const texto = await textoDePdf(path.join(FIXTURES, 'cvs', v.archivo));
  const t0 = Date.now();
  let salida, error;
  try { salida = await runAi(() => extractCvData({ cvText: texto }), { budgetMs: 90_000 }); } catch (e) { error = String(e?.message ?? e).slice(0, 300); }
  const ms = Date.now() - t0;
  const m = salida ? evaluar(v, salida) : null;
  console.log(`${v.archivo.padEnd(26)} ${String(ms).padStart(6)} ms  ${error ? 'ERROR ' + error : `habilidades ${m.habilidades_halladas}/${m.habilidades_esperadas} (precisión ${m.precision_habilidades})`}`);
  return { archivo: v.archivo, nombre: v.nombre, caracteres: texto.length, ms, error: error ?? null, texto, salida: salida ?? null, metricas: m };
});

const ok = filas.filter((f) => f.metricas);
const f1 = (p, r) => (p + r ? (2 * p * r) / (p + r) : 0);
const resumen = {
  modelo, fecha: ahora(), cvs: filas.length, con_respuesta: ok.length, con_error: filas.length - ok.length,
  habilidades: {
    precision_media: redondear(media(ok.map((f) => f.metricas.precision_habilidades))),
    recall_medio: redondear(media(ok.map((f) => f.metricas.recall_habilidades))),
    f1_medio: redondear(media(ok.map((f) => f1(f.metricas.precision_habilidades, f.metricas.recall_habilidades)))),
  },
  experiencia: { empresas_halladas: redondear(media(ok.map((f) => f.metricas.experiencia_empresas))), puestos_hallados: redondear(media(ok.map((f) => f.metricas.experiencia_puestos))) },
  formacion: { instituciones_halladas: redondear(media(ok.map((f) => f.metricas.formacion_instituciones))) },
  titular_coincide: redondear(media(ok.map((f) => f.metricas.titular_coincide))),
  error_medio_anios: redondear(media(ok.map((f) => f.metricas.error_anios)), 2),
  latencia_ms: { mediana: mediana(filas.map((f) => f.ms)), p95: percentil(filas.map((f) => f.ms), 95), media: Math.round(media(filas.map((f) => f.ms))) },
  criterio: 'Coincidencia por igualdad, contención o mitad de las palabras en común, sin acentos ni mayúsculas. La precisión de habilidades se mide contra la sección «Habilidades» del CV: es una cota inferior, porque el modelo puede extraer tecnologías que el CV menciona en la experiencia.',
};
escribirResultado(`extraccion_${corto}.json`, { resumen, filas });
console.log('\n' + JSON.stringify(resumen, null, 2));
process.exit(0);
