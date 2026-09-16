import type { Auth } from "firebase/auth";

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
    throw new Error(err.error || `Error ${res.status}`);
  }

  return res.json();
}
