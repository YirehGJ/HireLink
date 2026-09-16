import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * @fileOverview Firebase Admin SDK — SOLO para uso server-side (Route Handlers).
 * Se autentica con una cuenta de servicio y por lo tanto ignora las Firestore
 * Security Rules; úsalo únicamente detrás de una verificación de ID token.
 *
 * Requiere las variables de entorno (Project Settings > Service accounts >
 * Generate new private key en la consola de Firebase):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY  (con los `\n` literales del JSON descargado)
 */
function getAdminApp(): App {
  const apps = getApps();
  if (apps.length) return apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Faltan las credenciales de Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).'
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());

/**
 * Extrae y verifica el ID token del header Authorization: Bearer <token>.
 * Lanza si falta o es inválido.
 */
export async function verifyRequestUser(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    throw new Error('UNAUTHENTICATED');
  }
  return adminAuth().verifyIdToken(token);
}
