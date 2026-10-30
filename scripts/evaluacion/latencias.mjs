// Mide la latencia de lectura de las vacantes publicadas (consulta con filtro, orden y límite) como la hace el navegador:
// con el ID token de una cuenta de prueba y pasando por las reglas de seguridad de Firestore (API REST). Son 3 lecturas de
// calentamiento y 30 medidas, una tras otra, desde el equipo donde se ejecuta (incluye la red hasta Google Cloud).
// Sustituye a la afirmación «menos de 250 ms» de la primera versión del informe, que no tenía método.
//   node scripts/evaluacion/latencias.mjs
import { cargarEntorno } from './entorno.mjs';
import { escribirResultado, media, mediana, percentil, redondear, ahora } from './comun.mjs';

const env = cargarEntorno();
const CUENTA = 'candidato@example.com'; // cuenta de demostración de staging (docs/CUENTAS_DEMO.md)
const CLAVE = 'TestPass1234';

const acceso = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.NEXT_PUBLIC_FB_API_KEY}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: CUENTA, password: CLAVE, returnSecureToken: true }),
}).then((r) => r.json());
if (!acceso.idToken) throw new Error('No se pudo iniciar sesión en staging con la cuenta de demostración');

const url = `https://firestore.googleapis.com/v1/projects/${env.NEXT_PUBLIC_FB_PROJECT_ID}/databases/(default)/documents:runQuery`;
const consulta = {
  structuredQuery: {
    from: [{ collectionId: 'jobs' }],
    where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'published' } } },
    limit: 20,
  },
};
async function una() {
  const t0 = performance.now();
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${acceso.idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(consulta) });
  const cuerpo = await r.json();
  return { ms: performance.now() - t0, estado: r.status, documentos: Array.isArray(cuerpo) ? cuerpo.filter((x) => x.document).length : 0 };
}
for (let i = 0; i < 3; i++) await una();
const medidas = [];
for (let i = 0; i < 30; i++) medidas.push(await una());
const ms = medidas.map((m) => m.ms);
const resumen = {
  fecha: ahora(), proyecto: env.NEXT_PUBLIC_FB_PROJECT_ID, consulta: 'jobs con status == published, límite 20 (reglas de seguridad aplicadas)',
  repeticiones: medidas.length, respuestas_ok: medidas.filter((m) => m.estado === 200).length, documentos_por_consulta: medidas[0].documentos,
  latencia_ms: { minimo: Math.round(Math.min(...ms)), mediana: Math.round(mediana(ms)), media: Math.round(media(ms)), p95: Math.round(percentil(ms, 95)), maximo: Math.round(Math.max(...ms)) },
  proporcion_bajo_250_ms: redondear(ms.filter((x) => x < 250).length / ms.length),
  nota: 'Medido desde el equipo del desarrollador hacia Firestore (Google Cloud), con red doméstica; no incluye el renderizado del navegador.',
};
escribirResultado('latencia_lectura_vacantes.json', { resumen, medidas });
console.log(JSON.stringify(resumen, null, 2));
process.exit(0);
