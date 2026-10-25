// Utilidades compartidas de los scripts de mantenimiento que usan el SDK de administración
// (aprobar-reclutadoras, migrar-notas, publicar-reglas, respaldar-datos). seed.mjs y limpiar-huerfanos.mjs
// traen su propia copia y no dependen de este archivo.
import fs from "fs";
import path from "path";
import { initializeApp, cert } from "firebase-admin/app";

export const PRODUCTION_PROJECT_IDS = ["hirelink-fd1fe"];

export function parseArgs(argv = process.argv.slice(2)) {
  const flag = (n) => argv.includes(n);
  const opt = (n, def) => {
    const i = argv.indexOf(n);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : def;
  };
  return { flag, opt };
}

/** Lee un archivo de variables (KEY=valor por línea) sin cargarlo en el entorno del proceso. */
export function loadEnvFile(file) {
  const full = path.resolve(file);
  if (!fs.existsSync(full)) {
    console.error(`No existe el archivo de variables: ${full}`);
    process.exit(1);
  }
  const out = {};
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

/**
 * Inicia el SDK de administración con el archivo de variables elegido. Si el proyecto es el de producción y la
 * operación escribe (`writes: true`), se niega a continuar sin `--allow-production`.
 */
export function initAdmin({ envFile, writes, allowProduction }) {
  const env = loadEnvFile(envFile);
  for (const k of ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]) {
    if (!env[k]) {
      console.error(`Falta ${k} en ${envFile}`);
      process.exit(1);
    }
  }
  const projectId = env.FIREBASE_PROJECT_ID;
  const isProduction = PRODUCTION_PROJECT_IDS.includes(projectId);
  console.log(`Proyecto: ${projectId}${isProduction ? "  (PRODUCCIÓN)" : ""}  [${envFile}]`);
  if (writes && isProduction && !allowProduction) {
    console.error("\nBloqueado: es el proyecto de PRODUCCIÓN. Agrega --allow-production si de verdad quieres escribir ahí.");
    process.exit(2);
  }
  const app = initializeApp({
    credential: cert({ projectId, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") }),
  });
  return { app, env, projectId, isProduction };
}
