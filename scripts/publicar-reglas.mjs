#!/usr/bin/env node
// Compara las reglas de Firestore publicadas en un proyecto con las de firestore.rules y, si se pide, las publica.
// Sustituye la comparación a mano de la pestaña «Rules» de la consola de Firebase.
//
//   node scripts/publicar-reglas.mjs --env .env.staging                  Compara (no escribe nada)
//   node scripts/publicar-reglas.mjs --env .env.staging --apply          Publica firestore.rules en staging
//   node scripts/publicar-reglas.mjs --env .env.local                    Compara producción (solo lectura)
//   node scripts/publicar-reglas.mjs --env .env.local --apply --allow-production    Publica en producción
//
// Comparar nunca escribe, así que se puede hacer también contra producción. Publicar en producción exige
// --allow-production. Termina con código 0 si las reglas publicadas son iguales a las del repositorio y 1 si no.
import fs from "fs";
import path from "path";
import { getSecurityRules } from "firebase-admin/security-rules";
import { initAdmin, parseArgs } from "./comun.mjs";

const { flag, opt } = parseArgs();
const APPLY = flag("--apply");
const { app } = initAdmin({ envFile: opt("--env", ".env.staging"), writes: APPLY, allowProduction: flag("--allow-production") });

const file = path.resolve(opt("--file", "firestore.rules"));
const local = fs.readFileSync(file, "utf8");
const norm = (s) => s.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd()).join("\n").trim();

const rules = getSecurityRules(app);
let published = null;
try {
  const ruleset = await rules.getFirestoreRuleset();
  published = ruleset.source.map((f) => f.content).join("\n");
  console.log(`Reglas publicadas desde: ${ruleset.createTime}`);
} catch (e) {
  console.log(`No se pudieron leer las reglas publicadas: ${e.message}`);
}

const same = published !== null && norm(published) === norm(local);
console.log(
  same
    ? `\nRESULTADO: las reglas publicadas SON IGUALES a ${path.basename(file)}.`
    : `\nRESULTADO: las reglas publicadas son DISTINTAS de ${path.basename(file)}.`
);
if (!same && published !== null) {
  const a = norm(published).split("\n");
  const b = norm(local).split("\n");
  const i = a.findIndex((line, n) => line !== b[n]);
  const at = i === -1 ? Math.min(a.length, b.length) : i;
  console.log(`  Publicadas: ${a.length} líneas. Repositorio: ${b.length} líneas. Primera diferencia en la línea ${at + 1}:`);
  console.log(`    publicada:   ${(a[at] ?? "(fin del archivo)").slice(0, 110)}`);
  console.log(`    repositorio: ${(b[at] ?? "(fin del archivo)").slice(0, 110)}`);
}

if (!APPLY) {
  if (!same) console.log("\nAgrega --apply para publicar las reglas del repositorio en este proyecto.");
  process.exit(same ? 0 : 1);
}
if (same) {
  console.log("\nNada que publicar.");
  process.exit(0);
}
const released = await rules.releaseFirestoreRulesetFromSource(local);
console.log(`\nPublicadas: ${released.name} (${released.createTime})`);
process.exit(0);
