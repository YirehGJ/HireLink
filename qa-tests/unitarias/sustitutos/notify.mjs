// Sustituto de src/lib/server/notify.ts: en lugar de escribir avisos, los anota para que la prueba los revise.
export async function notifyUser(_db, uid, payload) {
  globalThis.__avisos.push({ uid, ...payload });
}
