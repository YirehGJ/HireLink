import type { Auth } from "firebase/auth";

/** Error de una llamada a la API propia; conserva el código HTTP para que la pantalla decida qué mostrar. */
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Si la IA no está disponible porque se agotó su cupo (el servidor responde 503 con un mensaje claro),
 * devuelve ese mensaje para mostrarlo al usuario; en cualquier otro error devuelve `undefined`.
 */
export function aiUnavailableMessage(error: unknown): string | undefined {
  return error instanceof ApiError && error.status === 503 ? error.message : undefined;
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
