// Dos casos que una coincidencia de palabras clave resuelve mal y que sirven para ver si el modelo aporta algo más que ella:
//  1) «relleno de palabras»: un perfil de diseño gráfico que escribe en su lista de habilidades las etiquetas de la vacante
//     (React, JavaScript, CSS, Git) sin experiencia de desarrollo. La línea base lo ve como coincidencia total.
//  2) «sinónimos»: una desarrolladora con experiencia real que nombra las tecnologías de otra forma (ReactJS, JS ES6, Sass,
//     GitHub). La línea base la ve como coincidencia parcial.
// Cada caso se evalúa tres veces contra la vacante «Desarrollador Frontend Junior (React)». Los perfiles son ficticios.
//   node scripts/evaluacion/casos-dificiles.mjs --modelo openai/gpt-oss-120b
import {
  argumentos, prepararIA, leerFixture, escribirResultado, media, redondear, enParalelo, ahora,
} from './comun.mjs';

const { modelo, corto, simultaneas } = argumentos();
prepararIA(modelo);
const { matchCandidateToJob } = await import('../../src/ai/flows/match-candidate-job-flow.ts');
const { matchInput, overlapScore } = await import('../../src/lib/server/matching.ts');
const { runAi } = await import('../../src/lib/server/ai-runner.ts');

const TITULO = 'Desarrollador Frontend Junior (React)';
const v = leerFixture('vacantes.json').find((x) => x.titulo === TITULO);
const vacante = { title: v.titulo, descriptionMd: v.descripcionMd, searchTags: v.etiquetas, seniority: v.seniority };
const REPETICIONES = 3;

const habilidad = (name, level, years) => ({ name, level, years });
const CASOS = [
  {
    id: 'relleno_de_palabras',
    descripcion: 'Diseñadora gráfica que enumera React, JavaScript, CSS y Git como habilidades sin experiencia de desarrollo',
    esperado: 'puntaje bajo (no cumple el perfil)',
    perfil: {
      headline: 'Diseñadora Gráfica',
      skills: [habilidad('Photoshop', 4, 3), habilidad('Illustrator', 4, 3), habilidad('Branding', 3, 2), habilidad('React', 3, 1), habilidad('JavaScript', 3, 1), habilidad('CSS', 3, 1), habilidad('Git', 3, 1)],
      yearsOfExperience: 3,
      cvSummary: 'Diseñadora gráfica con 3 años de experiencia en identidad visual, redes sociales y material impreso para comercios locales.',
      cvText: [
        'Mariana Solís Ortega', 'Diseñadora Gráfica | Puebla, Puebla, México | mariana.solis@example.com', 'RESUMEN PROFESIONAL',
        'Diseñadora gráfica con 3 años de experiencia en identidad visual, redes sociales y material impreso para comercios locales.',
        'EXPERIENCIA LABORAL', 'Diseñadora Gráfica - Agencia Creativa Angelópolis (Enero 2023 - Presente)',
        'Identidad visual, redes sociales y piezas impresas para 20 clientes.', 'Auxiliar de Diseño - Imprenta Central (Enero 2021 - Diciembre 2022)',
        'Preparación de archivos para impresión y retoque de imágenes.', 'EDUCACIÓN',
        'Licenciatura en Diseño Gráfico - Benemérita Universidad Autónoma de Puebla (2017 - 2021)', 'HABILIDADES',
        'React, JavaScript, CSS, Git, HTML, Photoshop, Illustrator, Branding',
      ].join('\n'),
    },
  },
  {
    id: 'sinonimos',
    descripcion: 'Desarrolladora de interfaces que nombra las tecnologías como ReactJS, JS (ES6), Sass y GitHub',
    esperado: 'puntaje alto (cumple el perfil con otras palabras)',
    perfil: {
      headline: 'Desarrolladora de Interfaces Web',
      skills: [habilidad('ReactJS', 3, 1), habilidad('JS (ES6)', 3, 1), habilidad('Sass', 3, 1), habilidad('GitHub', 3, 1), habilidad('Maquetación responsiva', 3, 1)],
      yearsOfExperience: 1,
      cvSummary: 'Desarrolladora de interfaces web con 1 año de experiencia construyendo componentes reutilizables y vistas adaptables a celular.',
      cvText: [
        'Camila Herrera Luna', 'Desarrolladora de Interfaces Web | Toluca, Estado de México | camila.herrera@example.com', 'RESUMEN PROFESIONAL',
        'Desarrolladora de interfaces web con 1 año de experiencia construyendo componentes reutilizables y vistas adaptables a celular.',
        'EXPERIENCIA LABORAL', 'Desarrolladora de Interfaces - Estudio Nevado (Marzo 2025 - Presente)',
        'Construye componentes reutilizables con ReactJS y JS (ES6), da estilo con Sass y colabora en ramas de GitHub; corrige errores de interfaz y escribe pruebas de componentes.',
        'EDUCACIÓN', 'Ingeniería en Computación - Universidad Autónoma del Estado de México (2020 - 2024)', 'HABILIDADES',
        'ReactJS, JS (ES6), Sass, GitHub, Maquetación responsiva',
      ].join('\n'),
    },
  },
];

const tareas = CASOS.flatMap((c) => Array.from({ length: REPETICIONES }, (_, i) => ({ c, i: i + 1 })));
console.log(`Casos difíciles con ${modelo}: ${tareas.length} evaluaciones`);
const filas = await enParalelo(tareas, simultaneas, async ({ c, i }) => {
  const t0 = Date.now();
  let r, error;
  try { r = await runAi(() => matchCandidateToJob(matchInput(c.perfil, vacante)), { budgetMs: 90_000 }); } catch (e) { error = String(e?.message ?? e).slice(0, 300); }
  return { caso: c.id, repeticion: i, puntaje: r?.score ?? null, razones: r?.reasons ?? null, ms: Date.now() - t0, error: error ?? null };
});

const resumen = CASOS.map((c) => {
  const mias = filas.filter((f) => f.caso === c.id && f.puntaje !== null);
  return {
    caso: c.id, descripcion: c.descripcion, esperado: c.esperado, evaluaciones: mias.length,
    puntaje_medio: redondear(media(mias.map((f) => f.puntaje))), puntajes: mias.map((f) => f.puntaje),
    linea_base_coincidencia: redondear(overlapScore(vacante, c.perfil)),
    razones_de_ejemplo: mias[0]?.razones ?? null,
  };
});
escribirResultado(`casos-dificiles_${corto}.json`, { modelo, fecha: ahora(), vacante: TITULO, resumen, filas });
console.log(JSON.stringify(resumen, null, 2));
process.exit(0);
