// Pruebas unitarias del motor de recomendaciones y del manejo del cupo de la IA.
// No usan red, Firebase ni IA: la base de datos y el modelo son sustitutos en memoria, así que se pueden
// ejecutar en cualquier momento sin gastar tokens.
//   node --import ./qa-tests/unitarias/registrar.mjs --test qa-tests/unitarias/
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.__ia = { llamadas: [], responder: async () => ({ score: 0.8, reasons: ['Experiencia sólida en React'] }) };
globalThis.__avisos = [];

const { evaluateMatch, overlapScore, matchHash, isUpToDate } = await import('../../src/lib/server/matching.ts');
const { runAi, isQuotaExhausted, AI_QUOTA_MESSAGE, AI_INCOMPLETE_MESSAGE } = await import('../../src/lib/server/ai-runner.ts');
const { ApiError, aiUnavailableMessage } = await import('../../src/lib/api-client.ts');

// ------------------------------------------------------------------ base de datos en memoria
function crearDb(inicial = {}) {
  const almacen = new Map(Object.entries(inicial));
  const ref = (ruta) => ({
    async get() {
      const d = almacen.get(ruta);
      return { exists: d !== undefined, data: () => (d === undefined ? undefined : { ...d }) };
    },
    async set(d) { almacen.set(ruta, { ...d }); },
    async update(d) { almacen.set(ruta, { ...almacen.get(ruta), ...d }); },
  });
  return {
    almacen,
    collection: (nombre) => ({
      doc: (id) => ref(`${nombre}/${id}`),
      where() { return this; },
      async get() { return { docs: [] }; },
    }),
  };
}

const candidato = () => ({
  headline: 'Desarrolladora Frontend',
  skills: [{ name: 'React', level: 4, years: 3, source: 'ai' }, { name: 'TypeScript', level: 3, years: 2 }],
  yearsOfExperience: 4,
  cvSummary: 'Frontend con 4 años de experiencia.',
  cvText: 'Desarrolló interfaces en React y TypeScript.',
});
const vacante = () => ({
  title: 'Desarrollador Frontend',
  descriptionMd: '## Sobre el puesto\nConstruye interfaces con React.',
  searchTags: ['React', 'TypeScript', 'Node.js'],
  seniority: 'mid',
  organizationRef: 'org1',
});
const nuevaPrueba = () => {
  globalThis.__ia.llamadas = [];
  globalThis.__ia.responder = async () => ({ score: 0.8, reasons: ['Experiencia sólida en React'] });
  globalThis.__avisos = [];
  return crearDb({ 'jobs/j1': vacante() });
};

// ------------------------------------------------------------------ overlapScore
test('overlapScore: fracción de habilidades de la vacante que aparecen en el perfil, sin distinguir acentos', () => {
  const job = { searchTags: ['React', 'Diseño', 'Node.js', 'Docker'] };
  const cand = { headline: 'Diseno de interfaces', skills: [{ name: 'React' }, { name: 'Docker' }], cvText: '' };
  assert.equal(overlapScore(job, cand), 0.75); // React, Diseño (aunque el perfil lo escriba sin eñe) y Docker; falta Node.js
  assert.equal(overlapScore({ searchTags: [] }, cand), 0);
  assert.equal(overlapScore({}, cand), 0);
});

// ------------------------------------------------------------------ evaluateMatch: caché por huella
test('primera evaluación: llama a la IA, guarda la recomendación con su huella y avisa', async () => {
  const db = nuevaPrueba();
  const r = await evaluateMatch(db, 'c1', candidato(), 'j1', vacante());
  assert.equal(r.cached, false);
  assert.equal(r.score, 0.8);
  assert.equal(globalThis.__ia.llamadas.length, 1);
  const rec = db.almacen.get('recommendations/c1_j1');
  assert.equal(rec.status, 'pending');
  assert.match(rec.inputHash, /^[0-9a-f]{24}$/);
  assert.equal(globalThis.__avisos.filter((a) => a.uid === 'c1' && a.type === 'new_recommendation').length, 1);
});

test('sin cambios en el perfil ni en la vacante: reutiliza el puntaje guardado y NO llama a la IA', async () => {
  const db = nuevaPrueba();
  await evaluateMatch(db, 'c1', candidato(), 'j1', vacante());
  globalThis.__avisos = [];
  const otra = await evaluateMatch(db, 'c1', candidato(), 'j1', vacante());
  assert.equal(globalThis.__ia.llamadas.length, 1, 'la segunda evaluación no debe gastar tokens');
  assert.equal(otra.cached, true);
  assert.equal(otra.score, 0.8);
  assert.deepEqual(otra.reasons, ['Experiencia sólida en React']);
  assert.equal(globalThis.__avisos.length, 0, 'no se vuelve a avisar');
});

test('un cambio que el modelo no ve (origen de la habilidad, disponibilidad, ubicación) no invalida el caché', async () => {
  const db = nuevaPrueba();
  await evaluateMatch(db, 'c1', candidato(), 'j1', vacante());
  const c = candidato();
  c.skills[0].source = 'manual';
  c.available = false;
  c.location = 'Puebla';
  const r = await evaluateMatch(db, 'c1', c, 'j1', vacante());
  assert.equal(r.cached, true);
  assert.equal(globalThis.__ia.llamadas.length, 1);
});

test('si cambia el perfil (una habilidad nueva) se vuelve a evaluar, sin pisar la decisión del reclutador', async () => {
  const db = nuevaPrueba();
  await evaluateMatch(db, 'c1', candidato(), 'j1', vacante());
  db.almacen.set('recommendations/c1_j1', { ...db.almacen.get('recommendations/c1_j1'), status: 'accepted' });
  globalThis.__ia.responder = async () => ({ score: 0.9, reasons: ['Ahora domina Node.js'] });
  const c = candidato();
  c.skills.push({ name: 'Node.js', level: 3, years: 1 });
  const r = await evaluateMatch(db, 'c1', c, 'j1', vacante());
  assert.equal(r.cached, false);
  assert.equal(r.score, 0.9);
  assert.equal(globalThis.__ia.llamadas.length, 2);
  const rec = db.almacen.get('recommendations/c1_j1');
  assert.equal(rec.score, 0.9);
  assert.equal(rec.status, 'accepted');
});

test('si cambia la descripción de la vacante se vuelve a evaluar', async () => {
  const db = nuevaPrueba();
  await evaluateMatch(db, 'c1', candidato(), 'j1', vacante());
  const j = vacante();
  j.descriptionMd += '\n- Experiencia con GraphQL.';
  const r = await evaluateMatch(db, 'c1', candidato(), 'j1', j);
  assert.equal(r.cached, false);
  assert.equal(globalThis.__ia.llamadas.length, 2);
});

test('las recomendaciones anteriores a la huella (sin inputHash) se evalúan una vez y la guardan', async () => {
  const db = nuevaPrueba();
  db.almacen.set('recommendations/c1_j1', { candidateRef: 'c1', jobRef: 'j1', score: 0.5, reasons: ['Antigua'], status: 'pending' });
  const r = await evaluateMatch(db, 'c1', candidato(), 'j1', vacante());
  assert.equal(r.cached, false);
  assert.match(db.almacen.get('recommendations/c1_j1').inputHash, /^[0-9a-f]{24}$/);
  const de_nuevo = await evaluateMatch(db, 'c1', candidato(), 'j1', vacante());
  assert.equal(de_nuevo.cached, true);
});

test('si la vacante se elimina mientras la IA trabaja, no se guarda una recomendación huérfana', async () => {
  const db = nuevaPrueba();
  globalThis.__ia.responder = async () => {
    db.almacen.delete('jobs/j1'); // el reclutador la elimina durante la evaluación
    return { score: 0.9, reasons: ['x'] };
  };
  const r = await evaluateMatch(db, 'c1', candidato(), 'j1', vacante());
  assert.equal(r.score, 0.9);
  assert.equal(db.almacen.has('recommendations/c1_j1'), false);
});

test('matchHash y isUpToDate: la huella solo cambia con lo que ve el modelo', () => {
  const base = matchHash(candidato(), vacante());
  assert.match(base, /^[0-9a-f]{24}$/);
  assert.equal(matchHash(candidato(), vacante()), base, 'es estable');
  const sinOrigen = candidato();
  sinOrigen.skills[0].source = 'manual';
  sinOrigen.available = false;
  assert.equal(matchHash(sinOrigen, vacante()), base, 'ignora lo que el modelo no ve');
  const conSkill = candidato();
  conSkill.skills.push({ name: 'Docker', level: 2, years: 1 });
  assert.notEqual(matchHash(conSkill, vacante()), base);
  const otraVacante = vacante();
  otraVacante.searchTags = ['Vue'];
  assert.notEqual(matchHash(candidato(), otraVacante), base);

  assert.equal(isUpToDate({ inputHash: base, score: 0.7 }, base), true);
  assert.equal(isUpToDate({ inputHash: base, score: 0.7 }, 'otra'), false);
  assert.equal(isUpToDate({ inputHash: base }, base), false, 'sin puntaje no sirve');
  assert.equal(isUpToDate({ score: 0.7 }, base), false, 'las recomendaciones anteriores a la huella se recalculan una vez');
  assert.equal(isUpToDate(undefined, base), false);
});

// ------------------------------------------------------------------ cupo de la IA
const errorGroqDiario = () => Object.assign(new Error('429 Rate limit reached for model `openai/gpt-oss-120b` on tokens per day (TPD): Limit 200000, Used 199712, Requested 1077. Please try again in 5m40.8s.'), {
  status: 'RESOURCE_EXHAUSTED', code: 429, responseMetadata: { retryAfterMs: 341000 },
});
const errorGroqPorMinuto = () => Object.assign(new Error('429 Rate limit reached for model `openai/gpt-oss-120b` on tokens per minute (TPM): Limit 8000, Used 7600, Requested 900. Please try again in 1.2s.'), {
  status: 'RESOURCE_EXHAUSTED', code: 429, responseMetadata: { retryAfterMs: 1200 },
});

test('isQuotaExhausted distingue el límite diario del límite por minuto y de otros errores', () => {
  assert.equal(isQuotaExhausted(errorGroqDiario()), true);
  assert.equal(isQuotaExhausted(errorGroqPorMinuto()), false);
  assert.equal(isQuotaExhausted(Object.assign(new Error('boom'), { status: 500 })), false);
  assert.equal(isQuotaExhausted(new Error('La IA no pudo generar una respuesta estructurada.')), false);
  // sin metadato: se lee la espera del texto del error (5 minutos)
  assert.equal(isQuotaExhausted(new Error('429 Rate limit reached. Please try again in 5m40.8s.')), true);
  assert.equal(isQuotaExhausted(new Error('429 Rate limit reached. Please try again in 3.5s.')), false);
  assert.equal(isQuotaExhausted(new Error('429 Rate limit reached. Please try again in 397.4ms.')), false, 'la espera en milisegundos se lee bien');
  assert.equal(isQuotaExhausted(new Error('429 Rate limit reached. Please try again in 1h2m3.4s.')), true);
});

test('runAi con el cupo diario agotado responde de inmediato con un 503 claro y no reintenta', async () => {
  let intentos = 0;
  const inicio = Date.now();
  const warn = console.warn;
  console.warn = () => {}; // runAi deja una línea en el registro del servidor; aquí no hace falta verla
  try {
    await assert.rejects(
      runAi(async () => { intentos++; throw errorGroqDiario(); }),
      (e) => e.status === 503 && e.message === AI_QUOTA_MESSAGE,
    );
  } finally {
    console.warn = warn;
  }
  assert.equal(intentos, 1);
  assert.ok(Date.now() - inicio < 500, 'no debe esperar entre reintentos');
});

test('runAi sí reintenta el límite por minuto y se recupera', async () => {
  let intentos = 0;
  const r = await runAi(async () => {
    intentos++;
    if (intentos === 1) throw errorGroqPorMinuto();
    return 'ok';
  });
  assert.equal(r, 'ok');
  assert.equal(intentos, 2);
});

test('runAi espera lo que pide el proveedor en el límite por minuto (antes esperaba 1, 2 y 4 s)', async () => {
  let intentos = 0;
  const inicio = Date.now();
  const r = await runAi(async () => {
    intentos++;
    if (intentos === 1) {
      throw Object.assign(new Error('429 Rate limit reached on tokens per minute (TPM): Limit 8000, Used 6952, Requested 2020. Please try again in 2.2s.'), { status: 'RESOURCE_EXHAUSTED', code: 429 });
    }
    return 'ok';
  });
  assert.equal(r, 'ok');
  assert.equal(intentos, 2);
  assert.ok(Date.now() - inicio >= 2200, 'espera al menos lo que pidió el proveedor');
});

// Lo que lanza Genkit cuando el modelo contesta un JSON válido al que le falta una propiedad del esquema (visto con
// openai/gpt-oss-20b al analizar un CV: faltaba `education`). Antes de la corrección no se reintentaba y la persona veía «Error interno».
const errorEsquema = (campo = 'education') => Object.assign(
  new Error(`INVALID_ARGUMENT: Schema validation failed. Parse Errors:\n\n- (root): must have required property '${campo}'\n\nProvided data:\n\n{\n  "headline": "Desarrolladora Front-End",\n  "skills": []\n}`),
  { status: 'INVALID_ARGUMENT', code: 400, originalMessage: `Schema validation failed. Parse Errors:\n\n- (root): must have required property '${campo}'` },
);
const sinAvisos = async (fn) => {
  const warn = console.warn;
  console.warn = () => {}; // runAi deja una línea en el registro del servidor; aquí no hace falta verla
  try { return await fn(); } finally { console.warn = warn; }
};

test('runAi reintenta, sin esperar, una salida malformada del modelo y se recupera', async () => {
  let intentos = 0;
  const inicio = Date.now();
  const r = await runAi(async () => {
    intentos++;
    if (intentos === 1) throw new SyntaxError("JSON5: invalid character '}' at 1:95");
    return 'ok';
  });
  assert.equal(r, 'ok');
  assert.equal(intentos, 2);
  assert.ok(Date.now() - inicio < 500, 'el reintento es inmediato');

  // Se aceptan hasta dos reintentos (tres intentos en total): con el modelo de respaldo fallaba alrededor de 1 de cada 3 veces.
  intentos = 0;
  const r2 = await runAi(async () => {
    intentos++;
    if (intentos < 3) throw new SyntaxError("JSON5: invalid character '}' at 1:95");
    return 'ok';
  });
  assert.equal(r2, 'ok');
  assert.equal(intentos, 3);
});

test('si la salida sigue malformada tras los reintentos, runAi responde un 502 claro (ya no «Error interno»)', async () => {
  let intentos = 0;
  await sinAvisos(() => assert.rejects(
    runAi(async () => { intentos++; throw new SyntaxError("JSON5: invalid character '}' at 1:95"); }),
    (e) => e.status === 502 && e.message === AI_INCOMPLETE_MESSAGE,
  ));
  assert.equal(intentos, 3, 'se rinde en el tercer intento (cada intento cuesta tokens)');
});

test('runAi reintenta un JSON que no cumple el esquema («Schema validation failed») y se recupera', async () => {
  let intentos = 0;
  const inicio = Date.now();
  const r = await runAi(async () => {
    intentos++;
    if (intentos === 1) throw errorEsquema();
    return { headline: 'Desarrolladora Front-End', education: [] };
  });
  assert.equal(intentos, 2);
  assert.deepEqual(r.education, []);
  assert.ok(Date.now() - inicio < 500, 'el reintento es inmediato');
});

test('si el JSON sigue sin cumplir el esquema, runAi responde un 502 claro y no repite sin fin', async () => {
  let intentos = 0;
  await sinAvisos(() => assert.rejects(
    runAi(async () => { intentos++; throw errorEsquema('experience'); }),
    (e) => e.status === 502 && e.message === AI_INCOMPLETE_MESSAGE,
  ));
  assert.equal(intentos, 3);
});

test('el mensaje del error de esquema se reconoce aunque Genkit solo conserve el texto original', async () => {
  let intentos = 0;
  const soloOriginal = () => Object.assign(new Error('fallo del modelo'), { originalMessage: "Schema validation failed. Parse Errors:\n\n- (root): must have required property 'summary'" });
  const r = await runAi(async () => { intentos++; if (intentos === 1) throw soloOriginal(); return 'ok'; });
  assert.equal(r, 'ok');
  assert.equal(intentos, 2);
});

test('un INVALID_ARGUMENT que no es de esquema (p. ej. la petición es demasiado grande) no se reintenta ni se disfraza', async () => {
  let intentos = 0;
  const demasiadoGrande = Object.assign(new Error('INVALID_ARGUMENT: Request too large for model on tokens per minute (TPM): Limit 8000, Requested 12000.'), { status: 'INVALID_ARGUMENT', code: 400 });
  await assert.rejects(runAi(async () => { intentos++; throw demasiadoGrande; }), (e) => e === demasiadoGrande);
  assert.equal(intentos, 1);
});

test('el mensaje del 502 llega a la pantalla: aiUnavailableMessage lo muestra y no confunde una página de error de la plataforma', () => {
  assert.match(AI_INCOMPLETE_MESSAGE, /incompleta/, 'el mensaje existe y explica qué pasó');
  assert.equal(aiUnavailableMessage(new ApiError(AI_INCOMPLETE_MESSAGE, 502)), AI_INCOMPLETE_MESSAGE);
  assert.equal(aiUnavailableMessage(new ApiError(AI_QUOTA_MESSAGE, 503)), AI_QUOTA_MESSAGE);
  assert.equal(aiUnavailableMessage(new ApiError('Error 502', 502)), undefined, 'un 502 genérico (sin mensaje propio) no se muestra tal cual');
  assert.equal(aiUnavailableMessage(new ApiError('Error interno', 500)), undefined);
  assert.equal(aiUnavailableMessage(new Error('x')), undefined);
});

test('runAi no reintenta errores que no son transitorios', async () => {
  let intentos = 0;
  await assert.rejects(runAi(async () => { intentos++; throw new Error('esquema inválido'); }), /esquema inválido/);
  assert.equal(intentos, 1);
});
