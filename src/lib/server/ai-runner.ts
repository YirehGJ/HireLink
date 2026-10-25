import { HttpError } from "@/lib/server/guard";
import { canUseFallback, markPrimaryExhausted } from "@/ai/model";

/**
 * Ejecuta llamadas a la IA con tres protecciones para soportar muchos usuarios a la vez:
 *  1) un semáforo por instancia (máx. N llamadas simultáneas) para no saturar el
 *     límite de peticiones del proveedor;
 *  2) reintentos ante 429 / 5xx / timeouts transitorios: si el proveedor dice cuánto esperar (límite por minuto)
 *     se espera eso, y si no, espera exponencial. Una salida malformada del modelo (JSON inválido o que no cumple
 *     el esquema) se reintenta de inmediato, hasta dos veces;
 *  3) un tope de tiempo por operación (50 s por defecto): Vercel corta la función a los 60 s y la persona veía
 *     «Error 504»; ahora se le explica que la IA está ocupada.
 *
 * Si el proveedor indica que el cupo DIARIO del modelo principal se agotó, se pasa al modelo de respaldo (tiene
 * cupo propio) y se repite la llamada; si el de respaldo también se agotó, se responde de inmediato con un 503 y un
 * mensaje claro (antes se reintentaba en vano y la persona veía «Error interno», además de llenar Sentry con un error
 * que no es un bug). Si la salida del modelo sigue sin servir después de los reintentos se responde un 502 con un
 * mensaje claro, y si un límite por minuto o un fallo de red no cede tras los reintentos, un 503 «la IA está ocupada».
 * Las rutas de recomendaciones tratan cualquier 503 como «la IA no está disponible»: se detienen y lo explican;
 * un 502 de una evaluación se registra y se sigue con las demás.
 */
const MAX_CONCURRENT_AI_CALLS = 6;
const MAX_ATTEMPTS = 4;

/** Tiempo máximo de una operación completa (intentos y esperas incluidos): Vercel corta a los 60 s. */
const DEFAULT_BUDGET_MS = 50_000;

/** Tope de la espera entre reintentos: las rutas de recomendaciones tienen 30 s de presupuesto y Vercel corta a los 60 s. */
const MAX_RETRY_WAIT_MS = 12_000;
/**
 * Una salida del modelo que no sirve (JSON roto, o JSON al que le falta una propiedad del esquema) suele ser un fallo
 * aislado, pero con el modelo de respaldo ocurría en cerca de 1 de cada 3 análisis de CV. Cada intento cuesta tokens
 * (de 1 200 a 2 500), así que se reintenta dos veces como máximo.
 */
const MAX_MALFORMED_RETRIES = 2;

/** Si el proveedor pide esperar más que esto tras un 429 sin decir «por minuto», el límite no es por minuto sino por día. */
const QUOTA_WAIT_MS = 20_000;
/** Si el proveedor no dice cuánto tarda en liberarse el cupo diario, se evita el modelo principal este tiempo. */
const DEFAULT_PRIMARY_BLOCK_MS = 30 * 60_000;

export const AI_QUOTA_MESSAGE = "La IA alcanzó su límite de uso gratuito por hoy. Inténtalo de nuevo más tarde.";
export const AI_INCOMPLETE_MESSAGE = "La IA devolvió una respuesta incompleta. Inténtalo de nuevo.";
export const AI_BUSY_MESSAGE = "La IA está muy ocupada en este momento. Inténtalo de nuevo en un minuto.";

let active = 0;
const waiting: Array<() => void> = [];

async function acquire() {
  if (active < MAX_CONCURRENT_AI_CALLS) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
}

function release() {
  active--;
  waiting.shift()?.();
}

// Genkit pone en `status` un texto («UNAVAILABLE», «RESOURCE_EXHAUSTED»…) y el cliente HTTP uno numérico (429, 503…).
const TRANSIENT_STATUS_TEXT = ["UNAVAILABLE", "RESOURCE_EXHAUSTED", "DEADLINE_EXCEEDED", "ABORTED"];

function isTransient(e: any) {
  const status = e?.status ?? e?.code ?? e?.cause?.status;
  const msg = `${e?.message ?? ""} ${e?.originalMessage ?? ""}`;
  return (
    [408, 409, 425, 429, 500, 502, 503, 504].includes(Number(status)) ||
    (typeof status === "string" && TRANSIENT_STATUS_TEXT.includes(status.toUpperCase())) ||
    /rate limit|too many requests|overloaded|timed? ?out|ECONNRESET|ETIMEDOUT|ECONNREFUSED|socket hang up|connection error|fetch failed|temporar/i.test(msg)
  );
}

/**
 * El modelo respondió algo que no es el JSON esperado: roto (p. ej. «JSON5: invalid character '}'») o válido pero que no
 * cumple el esquema (Genkit lanza «INVALID_ARGUMENT: Schema validation failed ... must have required property 'education'»).
 * Se reconoce por el texto de la validación de esquema y no por INVALID_ARGUMENT a secas: ese estado también lo usa el proveedor
 * para una petición mal hecha (p. ej. demasiado grande), que no se arregla repitiéndola.
 */
function isMalformedOutput(e: any) {
  const text = `${e?.message ?? ""} ${e?.originalMessage ?? ""}`;
  return e instanceof SyntaxError || /JSON5?:|invalid character|Unexpected token|no pudo generar|Schema validation failed/i.test(text);
}

/** Espera (ms) que pide el proveedor: del metadato del error o del texto «try again in 5m40.8s» / «397ms». 0 si no la informa. */
function providerWaitMs(e: any): number {
  const meta = Number(e?.responseMetadata?.retryAfterMs ?? e?.cause?.responseMetadata?.retryAfterMs);
  if (Number.isFinite(meta) && meta > 0) return meta;
  const m = String(e?.originalMessage ?? e?.message ?? "").match(
    /try again in\s+(?:(\d+)h)?(?:(\d+)m(?!s))?(?:([\d.]+)s)?(?:([\d.]+)ms)?/i
  );
  if (!m) return 0;
  return (Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)) * 1000 + Number(m[4] ?? 0);
}

/** El proveedor rechazó la llamada porque se agotó el cupo diario (tokens o solicitudes por día). */
export function isQuotaExhausted(e: any): boolean {
  if (!isTransient(e)) return false;
  const msg = String(e?.originalMessage ?? e?.message ?? "");
  if (/per day|\((?:TPD|RPD)\)/i.test(msg)) return true;
  // Un límite por minuto siempre es pasajero, aunque pida esperar bastante: no es el cupo del día.
  if (/per minute|\((?:TPM|RPM)\)/i.test(msg)) return false;
  return providerWaitMs(e) > QUOTA_WAIT_MS;
}

class AiTimeout extends Error {}

/** Rechaza con `AiTimeout` si la promesa no termina a tiempo (la llamada original se deja correr y se ignora). */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  promise.catch(() => {}); // si pierde la carrera y falla después, no debe quedar sin atender
  if (ms <= 0) return Promise.reject(new AiTimeout());
  let timer: ReturnType<typeof setTimeout>;
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AiTimeout()), ms);
  });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}

export interface RunAiOptions {
  /** Tiempo máximo de toda la operación, reintentos y esperas incluidos (por defecto 50 s). */
  budgetMs?: number;
}

export async function runAi<T>(fn: () => Promise<T>, options: RunAiOptions = {}): Promise<T> {
  const budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS;
  await acquire();
  const started = Date.now(); // el tiempo en la cola de espera no cuenta contra el tope
  const timeLeft = () => budgetMs - (Date.now() - started);
  try {
    let attempt = 0;
    for (;;) {
      try {
        return await withTimeout(fn(), timeLeft());
      } catch (e) {
        if (e instanceof AiTimeout) {
          console.warn(`La IA no respondió en ${Math.round(budgetMs / 1000)} s.`);
          throw new HttpError(503, AI_BUSY_MESSAGE);
        }
        const detail = String((e as any)?.originalMessage ?? (e as any)?.message ?? e).slice(0, 220);
        if (isQuotaExhausted(e)) {
          // El cupo diario del modelo principal se agotó: se pasa al de respaldo (tiene cupo propio) y se repite la
          // llamada. Si ya se usaba el de respaldo (o no hay), no queda a dónde ir.
          if (canUseFallback()) {
            markPrimaryExhausted(providerWaitMs(e) || DEFAULT_PRIMARY_BLOCK_MS);
            console.warn("Cupo diario del modelo principal agotado; se usa el de respaldo:", detail);
            continue;
          }
          console.warn("Cupo de la IA agotado:", detail);
          throw new HttpError(503, AI_QUOTA_MESSAGE);
        }
        attempt++;
        const malformed = isMalformedOutput(e);
        const transient = !malformed && isTransient(e);
        const retriable = transient || (malformed && attempt <= MAX_MALFORMED_RETRIES);
        if (attempt >= MAX_ATTEMPTS || !retriable) {
          // La salida del modelo siguió sin servir después de reintentar: no es un fallo de la aplicación, así que se explica
          // (antes la persona veía «Error interno» y Sentry recibía un error que no es un bug). Queda una línea en el registro.
          if (malformed) {
            console.warn("La IA no devolvió una respuesta válida tras reintentar:", detail);
            throw new HttpError(502, AI_INCOMPLETE_MESSAGE);
          }
          // Un límite por minuto o un fallo de red que no cedió tras los reintentos: tampoco es un bug de la aplicación.
          if (transient) {
            console.warn("La IA no respondió tras reintentar:", detail);
            throw new HttpError(503, AI_BUSY_MESSAGE);
          }
          throw e;
        }
        // Con el límite por minuto el proveedor dice cuánto esperar: se espera eso (antes se esperaba 1, 2 y 4 s
        // y la evaluación fallaba cuando el proveedor pedía 7 s).
        const asked = providerWaitMs(e);
        // Una salida malformada no es un problema de ritmo: se reintenta de inmediato.
        const base = asked > 0 ? Math.min(MAX_RETRY_WAIT_MS, asked + 250) : transient ? Math.min(8000, 500 * 2 ** attempt) : 0;
        // Si no alcanza el tiempo para esperar y volver a intentar, se responde ya en lugar de dejar que Vercel corte.
        if (base >= timeLeft()) {
          console.warn("La IA no respondió y no queda tiempo para reintentar:", detail);
          throw new HttpError(503, AI_BUSY_MESSAGE);
        }
        if (base > 0) await new Promise((r) => setTimeout(r, base + Math.random() * 300));
      }
    }
  } finally {
    release();
  }
}
