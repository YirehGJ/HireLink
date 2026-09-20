/**
 * Ejecuta llamadas a la IA con dos protecciones para soportar muchos usuarios a la vez:
 *  1) un semáforo por instancia (máx. N llamadas simultáneas) para no saturar el
 *     límite de peticiones del proveedor;
 *  2) reintentos con espera exponencial ante 429 / 5xx / timeouts transitorios.
 */
const MAX_CONCURRENT_AI_CALLS = 6;
const MAX_ATTEMPTS = 4;

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

export async function runAi<T>(fn: () => Promise<T>): Promise<T> {
  await acquire();
  try {
    let attempt = 0;
    for (;;) {
      try {
        return await fn();
      } catch (e) {
        attempt++;
        if (attempt >= MAX_ATTEMPTS || !isTransient(e)) throw e;
        const delay = Math.min(8000, 500 * 2 ** attempt) + Math.random() * 300;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  } finally {
    release();
  }
}
