#!/usr/bin/env node
// Mueve las notas privadas y la shortlist de las reclutadoras al lugar nuevo.
//
// Hasta la 1.0 se guardaban en el documento de la postulación (/jobs/{jobId}/applications/{uid}), que lee la propia
// candidata. Desde la 1.1 viven en /jobs/{jobId}/applicantNotes/{uid}, que solo lee la empresa. Este script copia
// los datos viejos al lugar nuevo y quita los campos del documento de la postulación. Es seguro repetirlo.
//
//   node scripts/migrar-notas.mjs --env .env.staging            Simulación: cuenta lo que movería, no escribe
//   node scripts/migrar-notas.mjs --env .env.staging --apply    Mueve (antes guarda un respaldo en JSON)
//   node scripts/migrar-notas.mjs --env .env.local --apply --allow-production    Producción (explícito)
//
// Se niega a escribir en producción sin --allow-production. El respaldo queda en scripts/respaldos/ (ignorada por Git).
import fs from "fs";
import path from "path";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initAdmin, parseArgs } from "./comun.mjs";

const { flag, opt } = parseArgs();
const APPLY = flag("--apply");
const { projectId } = initAdmin({ envFile: opt("--env", ".env.staging"), writes: APPLY, allowProduction: flag("--allow-production") });
console.log(`Modo: ${APPLY ? "MOVER (con respaldo)" : "simulación (no escribe nada)"}`);
const db = getFirestore();

// Todas las postulaciones (collection group sin filtros: no requiere índices); las copias de las candidatas
// (/users/{uid}/applications) no tienen notas, así que solo interesan las que cuelgan de una vacante.
const legacy = (await db.collectionGroup("applications").get()).docs.filter((d) => {
  const data = d.data();
  return d.ref.path.startsWith("jobs/") && (data.recruiterNotes !== undefined || data.shortlisted !== undefined);
});

console.log(`\nPostulaciones con notas o shortlist en el lugar viejo: ${legacy.length}`);
for (const d of legacy.slice(0, 20)) {
  const x = d.data();
  console.log(`  ${d.ref.path}  shortlist=${x.shortlisted === true ? "sí" : "no"}  notas=${(x.recruiterNotes ?? "").length} caracteres`);
}
if (legacy.length > 20) console.log(`  ... y ${legacy.length - 20} más`);

if (!APPLY) {
  console.log("\nSimulación terminada: no se escribió nada. Agrega --apply para moverlas.");
  process.exit(0);
}
if (legacy.length === 0) {
  console.log("\nNada que mover.");
  process.exit(0);
}

const dir = path.resolve("scripts/respaldos");
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(dir, `notas_${projectId}_${stamp}.json`);
fs.writeFileSync(
  backup,
  JSON.stringify(legacy.map((d) => ({ path: d.ref.path, shortlisted: d.data().shortlisted ?? null, recruiterNotes: d.data().recruiterNotes ?? null })), null, 2)
);
console.log(`\nRespaldo guardado en ${backup}`);

for (let i = 0; i < legacy.length; i += 200) {
  const batch = db.batch();
  for (const d of legacy.slice(i, i + 200)) {
    const x = d.data();
    const jobId = d.ref.parent.parent.id;
    const note = { updatedAt: FieldValue.serverTimestamp() };
    if (x.shortlisted !== undefined) note.shortlisted = x.shortlisted === true;
    if (typeof x.recruiterNotes === "string") note.recruiterNotes = x.recruiterNotes;
    // merge: si la reclutadora ya escribió algo en el lugar nuevo con la versión 1.1, no se pisa lo más reciente.
    const target = db.doc(`jobs/${jobId}/applicantNotes/${d.id}`);
    const existing = await target.get();
    if (!existing.exists) batch.set(target, note);
    batch.update(d.ref, { shortlisted: FieldValue.delete(), recruiterNotes: FieldValue.delete() });
  }
  await batch.commit();
}
console.log(`Listo: ${legacy.length} postulaciones migradas; los campos viejos ya no están en el documento que lee la candidata.`);
process.exit(0);
