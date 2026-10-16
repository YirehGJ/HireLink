#!/usr/bin/env node
// Revisa (y opcionalmente repara) datos huérfanos que deja una vacante eliminada con la versión anterior de
// la aplicación, que borraba solo el documento de la vacante:
//
//   - postulaciones /jobs/{jobId}/applications/* de vacantes que ya no existen
//   - copias /users/{uid}/applications/{jobId} de esas vacantes
//   - recomendaciones y entrevistas de vacantes que ya no existen
//   - postulaciones de vacantes que sí existen pero cuya copia del candidato falta (se reconstruye)
//
//   node scripts/limpiar-huerfanos.mjs --env .env.staging                 Simulación: solo informa, no escribe
//   node scripts/limpiar-huerfanos.mjs --env .env.staging --apply         Repara (antes guarda un respaldo en JSON)
//   node scripts/limpiar-huerfanos.mjs --env .env.local --allow-production [--apply]    Producción (explícito)
//
// Antes de borrar siempre se escribe un respaldo en scripts/respaldos/ (carpeta ignorada por Git).
import fs from "fs";
import path from "path";
import admin from "firebase-admin";

const PRODUCTION_PROJECT_IDS = ["hirelink-fd1fe"];
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, def) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : def; };
const APPLY = flag("--apply");
const ALLOW_PROD = flag("--allow-production");
const ENV_FILE = opt("--env", ".env.staging");

const file = path.resolve(ENV_FILE);
if (!fs.existsSync(file)) { console.error(`No existe ${file}`); process.exit(1); }
const env = {};
for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const projectId = env.FIREBASE_PROJECT_ID;
const isProd = PRODUCTION_PROJECT_IDS.includes(projectId);
console.log(`Proyecto: ${projectId}${isProd ? "  (PRODUCCIÓN)" : ""}`);
console.log(`Modo: ${APPLY ? "REPARAR (con respaldo)" : "simulación (no escribe nada)"}`);
if (isProd && !ALLOW_PROD) {
  console.error("\nBloqueado: es el proyecto de PRODUCCIÓN. Agrega --allow-production si de verdad quieres revisarlo o repararlo.");
  process.exit(2);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") }),
});
const db = admin.firestore();

const jobsSnap = await db.collection("jobs").get();
const jobIds = new Set(jobsSnap.docs.map((d) => d.id));

const orphanApps = [];
const orphanMirrors = [];
const missingMirrors = [];

// Postulaciones y copias de los candidatos (collection group: sin filtros, no requiere índices)
for (const d of (await db.collectionGroup("applications").get()).docs) {
  const parts = d.ref.path.split("/");
  if (parts[0] === "jobs") {
    const jobId = parts[1];
    const uid = d.data().candidateRef || parts[3];
    if (!jobIds.has(jobId)) orphanApps.push(d);
    else if (!(await db.doc(`users/${uid}/applications/${jobId}`).get()).exists) missingMirrors.push({ jobId, uid, data: d.data() });
  } else if (parts[0] === "users") {
    if (!jobIds.has(parts[3])) orphanMirrors.push(d);
  }
}
const orphanRecs = (await db.collection("recommendations").get()).docs.filter((d) => !jobIds.has(d.data().jobRef));
const orphanInterviews = (await db.collection("interviews").get()).docs.filter((d) => !jobIds.has(d.data().jobRef));

console.log("\nResultado de la revisión:");
console.log(`  vacantes existentes ............................ ${jobIds.size}`);
console.log(`  postulaciones de vacantes eliminadas ........... ${orphanApps.length}`);
console.log(`  copias de candidato de vacantes eliminadas ..... ${orphanMirrors.length}`);
console.log(`  recomendaciones de vacantes eliminadas ......... ${orphanRecs.length}`);
console.log(`  entrevistas de vacantes eliminadas ............. ${orphanInterviews.length}`);
console.log(`  postulaciones vigentes sin copia del candidato . ${missingMirrors.length}`);
for (const m of missingMirrors) console.log(`    - jobs/${m.jobId}/applications/${m.uid} (${m.data.status})`);

const toDelete = [...orphanApps, ...orphanMirrors, ...orphanRecs, ...orphanInterviews];
if (!APPLY) {
  console.log(`\nSimulación terminada: se borrarían ${toDelete.length} documentos y se reconstruirían ${missingMirrors.length} copias. Agrega --apply para ejecutarlo.`);
  process.exit(0);
}

// Respaldo antes de tocar nada
const dir = path.resolve("scripts/respaldos");
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(dir, `huerfanos_${projectId}_${stamp}.json`);
fs.writeFileSync(
  backup,
  JSON.stringify({ projectId, creado: new Date().toISOString(), documentos: toDelete.map((d) => ({ path: d.ref.path, data: d.data() })) }, (k, v) => (v && typeof v === "object" && "_seconds" in v ? { _seconds: v._seconds, _nanoseconds: v._nanoseconds } : v), 2)
);
console.log(`\nRespaldo guardado en ${backup}`);

for (let i = 0; i < toDelete.length; i += 400) {
  const batch = db.batch();
  toDelete.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
for (const m of missingMirrors) {
  const { notifiedAt, recruiterNotes, shortlisted, ...base } = m.data; // la copia solo lleva los campos públicos de la postulación
  await db.doc(`users/${m.uid}/applications/${m.jobId}`).set(base);
}
console.log(`Listo: ${toDelete.length} documentos eliminados y ${missingMirrors.length} copias reconstruidas.`);
process.exit(0);
