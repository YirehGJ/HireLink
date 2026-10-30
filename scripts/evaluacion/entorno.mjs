// Carga las variables de .env.staging (nunca las de producción) para los scripts de evaluación de la IA.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PRODUCCION = ['hirelink-fd1fe'];

export function cargarEntorno(archivo = '.env.staging') {
  const ruta = path.resolve(RAIZ, archivo);
  if (!fs.existsSync(ruta)) throw new Error(`No existe ${ruta}. Crea .env.staging siguiendo docs/ENTORNOS.md.`);
  const env = {};
  for (const linea of fs.readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  if (PRODUCCION.includes(env.FIREBASE_PROJECT_ID)) {
    throw new Error('Bloqueado: estos scripts no se ejecutan contra el proyecto de producción.');
  }
  return env;
}
