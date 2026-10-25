#!/usr/bin/env node
// Aprueba (o revoca) a las reclutadoras sin pasar por la pantalla de administración.
//
// Una reclutadora solo ve candidatas y publica vacantes cuando `recruiterApproved` es verdadero. Desde la 1.1 las
// cuentas nuevas empiezan sin aprobar; este script sirve sobre todo para aprobar de una vez a las que ya existían
// (por ejemplo, las cuentas de demostración de staging) o a una lista de correos.
//
//   node scripts/aprobar-reclutadoras.mjs --env .env.staging                      Simulación: lista y no escribe
//   node scripts/aprobar-reclutadoras.mjs --env .env.staging --all --apply        Aprueba a todas las que faltan
//   node scripts/aprobar-reclutadoras.mjs --env .env.local --email a@x.com,b@y.com --apply --allow-production
//   node scripts/aprobar-reclutadoras.mjs --env .env.staging --email a@x.com --revoke --apply
//
// Deja constancia en la auditoría. Se niega a escribir en producción sin --allow-production.
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initAdmin, parseArgs } from "./comun.mjs";

const { flag, opt } = parseArgs();
const APPLY = flag("--apply");
const REVOKE = flag("--revoke");
const ALL = flag("--all");
const emails = (opt("--email", "") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

initAdmin({ envFile: opt("--env", ".env.staging"), writes: APPLY, allowProduction: flag("--allow-production") });
const db = getFirestore();

if (APPLY && !ALL && emails.length === 0) {
  console.error("\nIndica a quién: --all (todas las reclutadoras) o --email correo1,correo2.");
  process.exit(1);
}

const snap = await db.collection("users").where("role", "==", "recruiter").get();
const target = snap.docs.filter((d) => {
  const approved = d.data().recruiterApproved === true;
  if (emails.length && !emails.includes(String(d.data().email ?? "").toLowerCase())) return false;
  if (!ALL && emails.length === 0) return true; // simulación sin filtro: se listan todas
  return REVOKE ? approved : !approved;
});

console.log(`\nReclutadoras: ${snap.size} (${snap.docs.filter((d) => d.data().recruiterApproved === true).length} aprobadas)`);
for (const d of snap.docs) {
  const u = d.data();
  console.log(`  ${u.recruiterApproved === true ? "aprobada " : "sin aprobar"}  ${String(u.email).padEnd(36)} ${u.fullName ?? ""}`);
}

if (!APPLY) {
  console.log(`\nSimulación terminada: ${REVOKE ? "se revocaría a" : "se aprobaría a"} ${target.length} reclutadora(s). Agrega --apply para ejecutarlo.`);
  process.exit(0);
}

for (const d of target) {
  await d.ref.update({ recruiterApproved: !REVOKE });
  await db.collection("auditLogs").add({
    actorUid: "script",
    actorEmail: "scripts/aprobar-reclutadoras.mjs",
    actorRole: "admin",
    action: "user_recruiter_approved",
    targetType: "user",
    targetId: d.id,
    details: `${d.data().email} → ${REVOKE ? "aprobación revocada" : "aprobada"}`,
    createdAt: FieldValue.serverTimestamp(),
  });
}
console.log(`\nListo: ${target.length} reclutadora(s) ${REVOKE ? "con la aprobación revocada" : "aprobadas"}.`);
process.exit(0);
