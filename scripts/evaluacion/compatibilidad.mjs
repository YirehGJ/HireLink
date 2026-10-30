// Evalúa la compatibilidad candidato-vacante: 10 perfiles (los que salen de extraccion.mjs) contra 5 vacantes, 50 pares.
// La relevancia de referencia se definió ANTES de ejecutar (ver IDEAL y RELACIONADOS): 2 = el perfil que se diseñó para esa
// vacante, 1 = perfil de una especialidad afín, 0 = el resto. Se comparan el puntaje del modelo y una línea base determinista
// (fracción de etiquetas de la vacante que aparecen en el perfil, overlapScore de src/lib/server/matching.ts).
//   node scripts/evaluacion/extraccion.mjs --modelo openai/gpt-oss-120b      (primero, para tener los perfiles)
//   node scripts/evaluacion/compatibilidad.mjs --modelo openai/gpt-oss-120b
import {
  argumentos, prepararIA, leerFixture, leerResultado, escribirResultado, media, mediana, percentil, auc, spearman, redondear, enParalelo, ahora,
} from './comun.mjs';
import { CANDIDATES } from '../../qa-tests/datos.mjs';

const { modelo, corto, simultaneas } = argumentos();
prepararIA(modelo);
const { matchCandidateToJob } = await import('../../src/ai/flows/match-candidate-job-flow.ts');
const { matchInput, overlapScore } = await import('../../src/lib/server/matching.ts');
const { runAi } = await import('../../src/lib/server/ai-runner.ts');
const { MATCH_THRESHOLD } = await import('../../src/lib/constants.ts');

const VACANTES = [
  'Desarrollador Frontend Junior (React)',
  'Desarrollador .NET Senior',
  'Analista de Datos Clínicos',
  'Desarrollador Móvil iOS',
  'Administrador de Sistemas Linux',
];
// Perfiles de una especialidad afín a la vacante (relevancia 1), fijados antes de ver los resultados.
const RELACIONADOS = {
  'Desarrollador Frontend Junior (React)': ['daniela.ochoa', 'valentina.cruz'],   // interfaces y desarrollo móvil
  'Desarrollador .NET Senior': ['alejandro.quiroz'],                               // arquitectura de software
  'Analista de Datos Clínicos': ['sebastian.arellano', 'jimena.salgado'],          // machine learning y analítica de producto
  'Desarrollador Móvil iOS': ['regina.palacios'],                                  // desarrollo frontend
  'Administrador de Sistemas Linux': [],
};
const IDEAL = Object.fromEntries(CANDIDATES.map((c) => [c.job, c.cv])); // vacante -> perfil diseñado para ella

const extraccion = leerResultado(`extraccion_${corto}.json`);
const candidatos = extraccion.filas.filter((f) => f.salida).map((f) => ({
  id: f.archivo.replace('.pdf', ''),
  doc: {
    headline: f.salida.headline,
    skills: (f.salida.skills ?? []).map(({ name, level, years }) => ({ name, level, years })),
    yearsOfExperience: f.salida.yearsOfExperience,
    cvSummary: f.salida.summary,
    cvText: f.texto,
  },
}));
const vacantes = leerFixture('vacantes.json').filter((v) => VACANTES.includes(v.titulo))
  .map((v) => ({ titulo: v.titulo, doc: { title: v.titulo, descriptionMd: v.descripcionMd, searchTags: v.etiquetas, seniority: v.seniority } }));

const pares = vacantes.flatMap((v) => candidatos.map((c) => ({ v, c })));
// --reanudar: conserva los pares que ya tienen puntaje en el archivo de resultados y vuelve a pedir solo los que fallaron
// (por ejemplo, por el límite de tokens por minuto del proveedor).
const previos = new Map();
if (process.argv.includes('--reanudar')) {
  try { for (const f of leerResultado(`compatibilidad_${corto}.json`).filas) if (f.puntaje !== null) previos.set(`${f.vacante}|${f.candidato}`, f); } catch { /* sin archivo previo */ }
}
console.log(`Compatibilidad con ${modelo}: ${vacantes.length} vacantes x ${candidatos.length} perfiles = ${pares.length} pares (${simultaneas} a la vez)${previos.size ? `; se conservan ${previos.size} ya evaluados` : ''}`);
let hechos = 0;
const filas = await enParalelo(pares, simultaneas, async ({ v, c }) => {
  const anterior = previos.get(`${v.titulo}|${c.id}`);
  if (anterior) return anterior;
  const relevancia = IDEAL[v.titulo] === c.id ? 2 : (RELACIONADOS[v.titulo] ?? []).includes(c.id) ? 1 : 0;
  const t0 = Date.now();
  let r, error;
  try { r = await runAi(() => matchCandidateToJob(matchInput(c.doc, v.doc)), { budgetMs: 90_000 }); } catch (e) { error = String(e?.message ?? e).slice(0, 300); }
  hechos++;
  if (hechos % 10 === 0) console.log(`  ${hechos}/${pares.length}`);
  return { vacante: v.titulo, candidato: c.id, relevancia, puntaje: r?.score ?? null, razones: r?.reasons ?? null,
    base_coincidencia: redondear(overlapScore(v.doc, c.doc)), ms: Date.now() - t0, error: error ?? null };
});

// ------------------------------------------------------------------ métricas
const validas = filas.filter((f) => f.puntaje !== null);
const rango = (grupo, campo, ideal) => 1 + grupo.filter((f) => f[campo] > ideal[campo]).length + grupo.filter((f) => f !== ideal && f[campo] === ideal[campo]).length / 2;
const ndcg = (grupo, campo) => {
  const dcg = (xs) => xs.reduce((s, g, i) => s + g / Math.log2(i + 2), 0);
  const ordenados = [...grupo].sort((a, b) => b[campo] - a[campo]).slice(0, 5).map((f) => f.relevancia);
  const ideales = [...grupo].map((f) => f.relevancia).sort((a, b) => b - a).slice(0, 5);
  return dcg(ideales) ? dcg(ordenados) / dcg(ideales) : NaN;
};
const porVacante = vacantes.map((v) => {
  const g = validas.filter((f) => f.vacante === v.titulo);
  const ideal = g.find((f) => f.relevancia === 2);
  const mejores = [...g].sort((a, b) => b.puntaje - a.puntaje).slice(0, 3).map((f) => `${f.candidato} (${f.puntaje})`);
  return {
    vacante: v.titulo, evaluados: g.length, ideal: ideal?.candidato ?? null, puntaje_ideal: ideal?.puntaje ?? null,
    rango_modelo: ideal ? rango(g, 'puntaje', ideal) : null, rango_linea_base: ideal ? rango(g, 'base_coincidencia', ideal) : null,
    ndcg5_modelo: redondear(ndcg(g, 'puntaje')), ndcg5_linea_base: redondear(ndcg(g, 'base_coincidencia')), tres_primeros: mejores,
  };
});
const rangosM = porVacante.map((p) => p.rango_modelo).filter((x) => x !== null);
const rangosB = porVacante.map((p) => p.rango_linea_base).filter((x) => x !== null);
const pos = validas.filter((f) => f.relevancia === 2), neg = validas.filter((f) => f.relevancia !== 2);
const resumen = {
  modelo, fecha: ahora(), pares: filas.length, con_respuesta: validas.length, con_error: filas.length - validas.length, vacantes: vacantes.length, perfiles: candidatos.length,
  umbral_de_aviso: MATCH_THRESHOLD,
  modelo_ia: {
    acierto_primer_lugar: redondear(rangosM.filter((r) => r === 1).length / rangosM.length),
    entre_los_tres_primeros: redondear(rangosM.filter((r) => r <= 3).length / rangosM.length),
    rango_medio_del_ideal: redondear(media(rangosM), 2),
    mrr: redondear(media(rangosM.map((r) => 1 / r))),
    auc_ideal_contra_resto: redondear(auc(pos.map((f) => f.puntaje), neg.map((f) => f.puntaje))),
    ndcg5: redondear(media(porVacante.map((p) => p.ndcg5_modelo))),
    puntaje_medio: { ideal: redondear(media(pos.map((f) => f.puntaje))), afin: redondear(media(validas.filter((f) => f.relevancia === 1).map((f) => f.puntaje))), resto: redondear(media(validas.filter((f) => f.relevancia === 0).map((f) => f.puntaje))) },
    ideal_sobre_el_umbral: redondear(pos.filter((f) => f.puntaje >= MATCH_THRESHOLD).length / pos.length),
    resto_sobre_el_umbral: redondear(validas.filter((f) => f.relevancia === 0 && f.puntaje >= MATCH_THRESHOLD).length / validas.filter((f) => f.relevancia === 0).length),
  },
  linea_base: {
    acierto_primer_lugar: redondear(rangosB.filter((r) => r === 1).length / rangosB.length),
    entre_los_tres_primeros: redondear(rangosB.filter((r) => r <= 3).length / rangosB.length),
    rango_medio_del_ideal: redondear(media(rangosB), 2),
    mrr: redondear(media(rangosB.map((r) => 1 / r))),
    auc_ideal_contra_resto: redondear(auc(pos.map((f) => f.base_coincidencia), neg.map((f) => f.base_coincidencia))),
    ndcg5: redondear(media(porVacante.map((p) => p.ndcg5_linea_base))),
  },
  correlacion_spearman_modelo_linea_base: redondear(spearman(validas.map((f) => f.puntaje), validas.map((f) => f.base_coincidencia))),
  latencia_ms: { mediana: mediana(filas.map((f) => f.ms)), p95: percentil(filas.map((f) => f.ms), 95) },
  criterio: 'Rango 1 = el perfil diseñado para la vacante obtuvo el puntaje más alto de los 10 (los empates cuentan el promedio de sus lugares). AUC: probabilidad de que el perfil ideal supere en puntaje a uno que no lo es. La relevancia afín se fijó antes de ejecutar.',
};
escribirResultado(`compatibilidad_${corto}.json`, { resumen, por_vacante: porVacante, filas });
console.log('\n' + JSON.stringify({ resumen, por_vacante: porVacante }, null, 2));
process.exit(0);
