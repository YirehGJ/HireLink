/**
 * Marca de "cerré sesión yo". El guard del dashboard redirige a /login cuando no hay sesión,
 * pero al cerrar sesión a propósito la navegación la decide quien cierra (normalmente la
 * portada). La marca vive en memoria del navegador y se reinicia al recargar o al iniciar sesión.
 */
let intentionalSignOut = false;

export const markIntentionalSignOut = () => {
  intentionalSignOut = true;
};
export const clearIntentionalSignOut = () => {
  intentionalSignOut = false;
};
export const wasIntentionalSignOut = () => intentionalSignOut;

/** Solo se aceptan rutas internas del dashboard como destino posterior al inicio de sesión. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  return /^\/dashboard(\/[A-Za-z0-9_\-./]*)?$/.test(value) && !value.includes("//") ? value : null;
}
