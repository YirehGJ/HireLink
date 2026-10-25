/**
 * Modelo de IA que se usa en Groq. Por defecto `openai/gpt-oss-120b`.
 *
 * En el plan gratuito cada modelo tiene su propio cupo diario (200 000 tokens al día para este). Cuando el cupo del
 * modelo principal se agota, la aplicación pasa sola al modelo de respaldo (`openai/gpt-oss-20b`, con cupo propio) y
 * vuelve al principal cuando pasa el tiempo que indicó el proveedor (ver `runAi`). El modelo principal se puede
 * cambiar con `GROQ_MODEL_ID` y el de respaldo con `GROQ_FALLBACK_MODEL_ID`; las pruebas automáticas contra staging
 * usan el de respaldo como principal para no consumir el cupo que comparte producción.
 */
export const GROQ_MODEL_ID = process.env.GROQ_MODEL_ID?.trim() || "openai/gpt-oss-120b";

/** Modelo al que se pasa cuando se agota el cupo diario del principal. */
export const GROQ_FALLBACK_MODEL_ID = process.env.GROQ_FALLBACK_MODEL_ID?.trim() || "openai/gpt-oss-20b";

/** Referencia del modelo principal para Genkit (prefijo del plugin + id de Groq); es el modelo por defecto del cliente. */
export const GROQ_MODEL = `groq/${GROQ_MODEL_ID}`;

// Hasta cuándo se evita el modelo principal. Es memoria de esta instancia: cada instancia serverless lo aprende con su
// primer fallo por cupo (una llamada perdida), sin necesidad de coordinarse por la base de datos.
let primaryBlockedUntil = 0;

const MIN_BLOCK_MS = 60_000;
const MAX_BLOCK_MS = 6 * 3600_000;

/** Id del modelo que se debe usar ahora: el de respaldo mientras el principal está sin cupo. */
export function activeModelId(now = Date.now()): string {
  return now < primaryBlockedUntil && GROQ_FALLBACK_MODEL_ID !== GROQ_MODEL_ID ? GROQ_FALLBACK_MODEL_ID : GROQ_MODEL_ID;
}

/** Referencia para Genkit del modelo que se debe usar ahora (los flujos la piden en cada llamada). */
export const activeModel = (): string => `groq/${activeModelId()}`;

/** Etiqueta que se guarda en cada recomendación y entra en su huella: al cambiar de modelo se recalcula. */
export const engineVersion = (): string => `groq-${activeModelId().split("/").pop()}`;

/** ¿Hay un modelo de respaldo al que pasar? No si ya se está usando o si es el mismo que el principal. */
export function canUseFallback(now = Date.now()): boolean {
  return activeModelId(now) === GROQ_MODEL_ID && GROQ_FALLBACK_MODEL_ID !== GROQ_MODEL_ID;
}

/** El principal se quedó sin cupo: se usa el de respaldo durante `forMs` (entre 1 minuto y 6 horas). */
export function markPrimaryExhausted(forMs: number, now = Date.now()) {
  primaryBlockedUntil = now + Math.min(Math.max(forMs, MIN_BLOCK_MS), MAX_BLOCK_MS);
}

/** Vuelve a usar el modelo principal (para las pruebas). */
export function resetModelState() {
  primaryBlockedUntil = 0;
}
