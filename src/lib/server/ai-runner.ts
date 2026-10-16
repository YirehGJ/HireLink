import { HttpError } from "@/lib/server/guard";

/**
 * Ejecuta llamadas a la IA con dos protecciones para soportar muchos usuarios a la vez:
 *  1) un semáforo por instancia (máx. N llamadas simultáneas) para no saturar el
 *     límite de peticiones del proveedor;
 *  2) reintentos ante 429 / 5xx / timeouts transitorios: si el proveedor dice cuánto esperar (límite por minuto)
 *     se espera eso, y si no, espera exponencial. Una salida malformada del modelo (JSON inválido) se reintenta
 *     una sola vez.
 *
 * Si el proveedor indica que el cupo del día se agotó, no se reintenta: se responde de inmediato con un
 * 503 y un mensaje claro (antes se reintentaba en vano y el usuario veía «Error interno», además de
 * llenar Sentry con un error que no es un bug).
 */
const MAX_CONCURRENT_AI_CALLS = 6;
const MAX_ATTEMPTS = 4;

/** Tope de la espera entre reintentos: las rutas de recomendaciones tienen 30 s de presupuesto y Vercel corta a los 60 s. */
const MAX_RETRY_WAIT_MS = 12_000;
/** Un JSON malformado del modelo suele ser un fallo aislado; cada intento cuesta tokens, así que se reintenta una vez. */
const MAX_MALFORMED_RETRIES = 1;

/** Si el proveedor pide esperar más que esto tras un 429, el límite no es por minuto sino por día. */
const QUOTA_WAIT_MS = 20_000;
export const AI_QUOTA_MESSAGE = "La IA alcanzó su límite de uso gratuito por hoy. Inténtalo de nuevo más tarde.";

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

function isTransient(e: any) {
  const status = e?.status ?? e?.code ?? e?.cause?.status;
  const msg = String(e?.message ?? "");
  return (
    [408, 409, 425, 429, 500, 502, 503, 504].includes(Number(status)) ||
    /rate limit|too many requests|overloaded|timeout|ECONNRESET|temporar/i.test(msg)
  );
}

/** El modelo respondió algo que no es el JSON esperado (p. ej. «JSON5: invalid character '}'»). */
function isMalformedOutput(e: any) {
  return e instanceof SyntaxError || /JSON5?:|invalid character|Unexpected token|no pudo generar/i.test(String(e?.message ?? ""));
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
  return /per day|\((?:TPD|RPD)\)/i.test(msg) || providerWaitMs(e) > QUOTA_WAIT_MS;
}

export async function runAi<T>(fn: () => Promise<T>): Promise<T> {
  await acquire();
  try {
    let attempt = 0;
    for (;;) {
      try {
        return await fn();
      } catch (e) {
        if (isQuotaExhausted(e)) {
          console.warn("Cupo de la IA agotado:", String((e as any)?.originalMessage ?? (e as any)?.message ?? e).slice(0, 220));
          throw new HttpError(503, AI_QUOTA_MESSAGE);
        }
        attempt++;
        const retriable = isTransient(e) || (isMalformedOutput(e) && attempt <= MAX_MALFORMED_RETRIES);
        if (attempt >= MAX_ATTEMPTS || !retriable) throw e;
        // Con el límite por minuto el proveedor dice cuánto esperar: se espera eso (antes se esperaba 1, 2 y 4 s
        // y la evaluación fallaba cuando el proveedor pedía 7 s).
        const asked = providerWaitMs(e);
        // Una salida malformada no es un problema de ritmo: se reintenta de inmediato.
        const base = asked > 0 ? Math.min(MAX_RETRY_WAIT_MS, asked + 250) : isTransient(e) ? Math.min(8000, 500 * 2 ** attempt) : 0;
        if (base > 0) await new Promise((r) => setTimeout(r, base + Math.random() * 300));
      }
    }
  } finally {
    release();
  }
}
