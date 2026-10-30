// Utilidades comunes de los scripts de evaluación de la IA (extracción de CV, compatibilidad y sesgo).
// Los scripts usan los mismos flujos de Genkit y el mismo corredor de reintentos que la aplicación (src/ai y src/lib/server).
import fs from 'fs';
import path from 'path';
import { register } from 'node:module';
import { RAIZ, cargarEntorno } from './entorno.mjs';

// Permite importar los archivos TypeScript de src/ con el alias `@/` (ver cargador.mjs).
register('./cargador.mjs', import.meta.url);

export const FIXTURES = path.join(RAIZ, 'docs', 'evidencias', 'ia', 'fixtures');
export const RESULTADOS = path.join(RAIZ, 'docs', 'evidencias', 'ia', 'resultados');
fs.mkdirSync(RESULTADOS, { recursive: true });

export const leerFixture = (nombre) => JSON.parse(fs.readFileSync(path.join(FIXTURES, nombre), 'utf8'));
export const leerResultado = (nombre) => JSON.parse(fs.readFileSync(path.join(RESULTADOS, nombre), 'utf8'));
export const escribirResultado = (nombre, contenido) =>
  fs.writeFileSync(path.join(RESULTADOS, nombre), typeof contenido === 'string' ? contenido : JSON.stringify(contenido, null, 2));

/** Argumentos: --modelo openai/gpt-oss-120b  --simultaneas 2  --solo texto (filtra casos para pruebas rápidas). */
export function argumentos() {
  const a = process.argv.slice(2);
  const opt = (nombre, def) => { const i = a.indexOf(nombre); return i >= 0 ? a[i + 1] : def; };
  const modelo = opt('--modelo', 'openai/gpt-oss-120b');
  return { modelo, corto: modelo.split('/').pop(), simultaneas: Number(opt('--simultaneas', '2')), solo: opt('--solo', '') };
}

/** La clave de Groq sale de .env.staging (no se imprime); cada experimento mide un solo modelo (sin cambio automático). */
export function prepararIA(modelo) {
  const env = cargarEntorno();
  process.env.GROQ_API_KEY = env.GROQ_API_KEY;
  process.env.GROQ_MODEL_ID = modelo;
  process.env.GROQ_FALLBACK_MODEL_ID = modelo;
}

// ------------------------------------------------------------------ texto
export const norm = (s) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9+#. ]/g, ' ').replace(/\s+/g, ' ').trim();

/** ¿Dos textos normalizados se refieren a lo mismo? Igualdad, uno contenido en el otro o mitad de las palabras en común. */
export function coincide(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const [corto, largo] = a.length <= b.length ? [a, b] : [b, a];
  if (corto.length >= 3 && largo.includes(corto)) return true;
  const ta = new Set(a.split(' ')), tb = new Set(b.split(' '));
  const comunes = [...ta].filter((t) => tb.has(t)).length;
  return comunes / new Set([...ta, ...tb]).size >= 0.5;
}

// ------------------------------------------------------------------ estadística
export const media = (x) => (x.length ? x.reduce((a, b) => a + b, 0) / x.length : NaN);
export const desviacion = (x) => { const m = media(x); return x.length > 1 ? Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1)) : 0; };
export const mediana = (x) => { const s = [...x].sort((a, b) => a - b); const k = Math.floor(s.length / 2); return s.length ? (s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2) : NaN; };
export const percentil = (x, p) => { const s = [...x].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))] : NaN; };
export const redondear = (n, d = 3) => (Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : null);

/** Área bajo la curva ROC: probabilidad de que un positivo tenga más puntaje que un negativo (empates cuentan la mitad). */
export function auc(positivos, negativos) {
  let g = 0;
  for (const p of positivos) for (const n of negativos) g += p > n ? 1 : p === n ? 0.5 : 0;
  return g / (positivos.length * negativos.length);
}

function rangos(x) {
  const orden = x.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const r = new Array(x.length);
  for (let i = 0; i < orden.length;) {
    let j = i;
    while (j + 1 < orden.length && orden[j + 1][0] === orden[i][0]) j++;
    for (let k = i; k <= j; k++) r[orden[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return r;
}
/** Correlación de Spearman (de rangos) entre dos listas del mismo largo. */
export function spearman(x, y) {
  const a = rangos(x), b = rangos(y), ma = media(a), mb = media(b);
  const num = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0);
  const den = Math.sqrt(a.reduce((s, v) => s + (v - ma) ** 2, 0) * b.reduce((s, v) => s + (v - mb) ** 2, 0));
  return den ? num / den : NaN;
}

/** Ejecuta fn sobre cada elemento con `n` tareas a la vez (la aplicación evalúa 2 pares en paralelo). */
export async function enParalelo(items, n, fn) {
  const salida = new Array(items.length);
  let siguiente = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (siguiente < items.length) { const k = siguiente++; salida[k] = await fn(items[k], k); }
  }));
  return salida;
}

export const ahora = () => new Date().toISOString();
