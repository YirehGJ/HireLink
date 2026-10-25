#!/usr/bin/env node
// Guarda una copia de los datos de Firestore en un archivo JSON local.
//
// El plan gratuito de Firebase (Spark) no hace respaldos automáticos; este script es el respaldo manual para antes y
// después del piloto, o antes de una operación riesgosa. Solo lee: no modifica nada, así que se puede usar también
// contra producción. Cada documento leído cuenta contra el cupo diario de lecturas (50 000 en Spark).
//
//   node scripts/respaldar-datos.mjs --env .env.staging
//   node scripts/respaldar-datos.mjs --env .env.local            Producción (solo lectura)
//
// Guarda scripts/respaldos/datos_<proyecto>_<fecha>.json (carpeta ignorada por Git). El archivo contiene datos
// personales (correos, textos de CV): guárdalo en un lugar privado y bórralo cuando ya no haga falta.
import fs from "fs";
import path from "path";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin, parseArgs } from "./comun.mjs";

const { opt } = parseArgs();
const { projectId } = initAdmin({ envFile: opt("--env", ".env.staging"), writes: false });
const db = getFirestore();

// Colecciones de primer nivel y subcolecciones con datos de personas. Los avisos y los contadores de uso
// (notifications, rateLimits) se omiten: se regeneran y harían el archivo mucho más grande.
const TOP = ["users", "candidates", "organizations", "jobs", "recommendations", "interviews", "auditLogs"];
const GROUPS = ["applications", "applicantNotes"];

const toPlain = (v) => {
  if (v && typeof v.toDate === "function") return { __timestamp: v.toDate().toISOString() };
  if (Array.isArray(v)) return v.map(toPlain);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toPlain(x)]));
  return v;
};

const out = { projectId, creado: new Date().toISOString(), colecciones: {} };
let total = 0;
for (const name of TOP) {
  const snap = await db.collection(name).get();
  out.colecciones[name] = snap.docs.map((d) => ({ path: d.ref.path, data: toPlain(d.data()) }));
  total += snap.size;
  console.log(`  ${name.padEnd(16)} ${snap.size}`);
}
for (const name of GROUPS) {
  const snap = await db.collectionGroup(name).get();
  out.colecciones[`*/${name}`] = snap.docs.map((d) => ({ path: d.ref.path, data: toPlain(d.data()) }));
  total += snap.size;
  console.log(`  ${("*/" + name).padEnd(16)} ${snap.size}`);
}

const dir = path.resolve("scripts/respaldos");
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = path.join(dir, `datos_${projectId}_${stamp}.json`);
fs.writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`\nRespaldo de ${total} documentos guardado en ${file} (${(fs.statSync(file).size / 1024).toFixed(0)} kB).`);
console.log("Contiene datos personales: guárdalo en un lugar privado.");
process.exit(0);
