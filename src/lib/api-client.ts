import type { Auth } from "firebase/auth";

/** Error de una llamada a la API propia; conserva el código HTTP para que la pantalla decida qué mostrar. */
export class ApiError extends Error {
  status: number;
  // Sin «parameter property» (`public status`): así Node puede cargar este archivo en las pruebas unitarias.
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Si la IA no pudo responder, el servidor lo explica con un mensaje claro: 503 cuando se agotó su cupo del día y 502 cuando
 * su respuesta siguió incompleta después de reintentar. Devuelve ese mensaje para mostrarlo al usuario; en cualquier otro
 * error (incluido un 502 de la plataforma, que no trae mensaje propio y llega como «Error 502») devuelve `undefined`.
 */
export function aiUnavailableMessage(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  if (error.status === 503) return error.message;
  if (error.status === 502 && error.message !== `Error ${error.status}`) return error.message;
  return undefined;
}

/**
 * Llama a un Route Handler propio adjuntando el ID token del usuario actual,
 * para que el backend (Admin SDK) pueda verificar quién hace la solicitud.
 */
export async function callAuthedApi(auth: Auth, path: string, body?: unknown) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No hay sesión activa.");

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error || `Error ${res.status}`, res.status);
  }

  return res.json();
}
