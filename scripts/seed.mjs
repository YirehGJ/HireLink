#!/usr/bin/env node
// Carga (o elimina) datos de ejemplo de HireLink en un proyecto de Firebase.
//
//   node scripts/seed.mjs                       Simulación: valida y muestra qué crearía (no escribe nada)
//   node scripts/seed.mjs --apply               Crea los datos
//   node scripts/seed.mjs --reset --apply       Elimina SOLO lo que creó este script
//
// Opciones:  --env <archivo>        Variables del proyecto destino (por defecto .env.local)
//            --password <valor>     Contraseña de las cuentas demo (por defecto la documentada)
//            --allow-production     Necesario para escribir en el proyecto de producción
//
// Seguridad: el script se niega a escribir en producción sin --allow-production, nunca pisa los
// documentos de cuentas que ya existían y marca con `seed: true` todo lo que crea.
import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import * as D from "./seed-data.mjs";

const PRODUCTION_PROJECT_IDS = ["hirelink-fd1fe"];

// ------------------------------------------------------------------ argumentos
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, def) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const APPLY = flag("--apply");
const RESET = flag("--reset");
const ALLOW_PROD = flag("--allow-production");
const ENV_FILE = opt("--env", ".env.local");
const PASSWORD = opt("--password", D.DEMO_PASSWORD);

function loadEnv(file) {
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

const env = loadEnv(ENV_FILE);
for (const k of ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]) {
  if (!env[k]) {
    console.error(`Falta ${k} en ${ENV_FILE}`);
    process.exit(1);
  }
}
const projectId = env.FIREBASE_PROJECT_ID;
const isProduction = PRODUCTION_PROJECT_IDS.includes(projectId);

console.log(`Proyecto destino: ${projectId}${isProduction ? "  (PRODUCCIÓN)" : ""}`);
console.log(`Modo: ${APPLY ? (RESET ? "ELIMINAR datos de ejemplo" : "CREAR datos de ejemplo") : "simulación (no escribe nada)"}`);

if (APPLY && isProduction && !ALLOW_PROD) {
  console.error(
    "\nBloqueado: este es el proyecto de PRODUCCIÓN. Para escribir ahí agrega --allow-production.\n" +
      "Lo recomendado es apuntar --env al archivo del entorno de staging (ver docs/ENTORNOS.md)."
  );
  process.exit(2);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = admin.firestore();
const auth = admin.auth();
const TS = admin.firestore.Timestamp;
const ts = (d) => TS.fromDate(d);
const NOW = Date.now();

// ------------------------------------------------------------------ cuentas
// Todas las personas del conjunto de datos, con su rol.
const people = [
  ...D.admins.map((a) => ({ ...a, role: "admin" })),
  ...D.recruiters.map((r) => ({ ...r, role: "recruiter" })),
  ...D.candidates.map((c) => ({ ...c, role: "candidate" })),
];

const uidOf = {}; // key -> uid
const existed = {}; // key -> true si la cuenta ya estaba creada antes del seed

async function resolveAccounts() {
  for (const p of people) {
    if (!APPLY) {
      // En simulación no se toca Auth: solo se lee si existe para informar.
      try {
        const u = await auth.getUserByEmail(p.email);
        uidOf[p.key] = u.uid;
        existed[p.key] = true;
      } catch {
        uidOf[p.key] = `seed_uid_${p.key}`;
        existed[p.key] = false;
      }
      continue;
    }
    try {
      const u = await auth.getUserByEmail(p.email);
      uidOf[p.key] = u.uid;
      existed[p.key] = true;
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw e;
      if (RESET) {
        existed[p.key] = false;
        uidOf[p.key] = null;
        continue;
      }
      const u = await auth.createUser({ email: p.email, password: PASSWORD, displayName: p.fullName, emailVerified: true });
      await auth.setCustomUserClaims(u.uid, { seed: true });
      uidOf[p.key] = u.uid;
      existed[p.key] = false;
    }
  }
}

// ------------------------------------------------------------------ plan de escritura
const ops = []; // { path, data }

function buildPlan() {
  const orgOf = Object.fromEntries(D.organizations.map((o) => [o.key, o]));
  const recOfOrg = Object.fromEntries(D.recruiters.map((r) => [r.org, r]));
  const jobId = (k) => `seed_job_${k}`;
  const candOf = Object.fromEntries(D.candidates.map((c) => [c.key, c]));
  const jobOf = Object.fromEntries(D.jobs.map((j) => [j.key, j]));
  const add = (p, data) => ops.push({ path: p, data });

  // Organizaciones
  for (const o of D.organizations) {
    const owner = recOfOrg[o.key];
    add(`organizations/${o.id}`, {
      name: o.name, website: o.website, description: o.description, logoUrl: "",
      ownerUid: uidOf[owner.key], createdAt: ts(D.daysAgo(60, NOW)), seed: true,
    });
  }

  // Usuarios (solo cuentas nuevas: nunca se pisa el documento de una cuenta existente)
  for (const p of people) {
    if (existed[p.key]) continue;
    const base = { id: uidOf[p.key], email: p.email, fullName: p.fullName, role: p.role, status: "active", seed: true };
    if (p.phone) base.phone = p.phone;
    if (p.role === "recruiter") base.organizationRef = orgOf[p.org].id;
    add(`users/${uidOf[p.key]}`, base);
  }

  // Perfiles de candidato (se omiten para cuentas existentes: se respeta su perfil)
  for (const c of D.candidates) {
    if (existed[c.key]) continue;
    const text = [
      c.fullName, c.headline, c.location, "", "RESUMEN", c.summary, "", "EXPERIENCIA",
      ...c.experience.map((e) => `${e.title} en ${e.company} (${e.startDate} - ${e.endDate}). ${e.description}`),
      "", "EDUCACIÓN",
      ...c.education.map((e) => `${e.degree}, ${e.institution} (${e.startDate} - ${e.endDate})`),
      "", "HABILIDADES", c.skills.map((s) => s.name).join(", "),
    ].join("\n");
    add(`candidates/${uidOf[c.key]}`, {
      userRef: uidOf[c.key], fullName: c.fullName, email: c.email, headline: c.headline, location: c.location,
      yearsOfExperience: c.yearsOfExperience, available: c.available, targetSeniority: c.targetSeniority,
      skills: c.skills.map((s) => ({ ...s, source: "seed" })), experience: c.experience, education: c.education,
      cvSummary: c.summary, cvText: text.slice(0, 9000), updatedAt: ts(D.daysAgo(3, NOW)), seed: true,
    });
  }

  // Vacantes
  for (const j of D.jobs) {
    add(`jobs/${jobId(j.key)}`, {
      organizationRef: orgOf[j.org].id, title: j.title, descriptionMd: j.descriptionMd, location: j.location,
      remoteAllowed: j.remoteAllowed, contractType: j.contractType, seniority: j.seniority,
      status: j.status ?? "published", salaryMin: j.salaryMin, salaryMax: j.salaryMax, currency: "MXN",
      searchTags: j.searchTags, createdAt: ts(D.daysAgo(j.ago, NOW)), seed: true,
    });
  }

  // Postulaciones (documento bajo la vacante + copia espejo del candidato)
  for (const a of D.applications) {
    const when = ts(D.daysAgo(a.ago, NOW));
    const base = {
      candidateRef: uidOf[a.cand], jobRef: jobId(a.job), status: a.status, source: a.source, cvRef: "",
      appliedAt: when, updatedAt: when, notifiedAt: when, seed: true,
    };
    const full = { ...base };
    if (a.shortlisted) full.shortlisted = true;
    if (a.notes) full.recruiterNotes = a.notes;
    add(`jobs/${jobId(a.job)}/applications/${uidOf[a.cand]}`, full);
    add(`users/${uidOf[a.cand]}/applications/${jobId(a.job)}`, base);
  }

  // Recomendaciones de la IA (valores fijos; engineVersion = "seed")
  for (const r of D.recommendations) {
    const when = ts(D.daysAgo(2, NOW));
    add(`recommendations/${uidOf[r.cand]}_${jobId(r.job)}`, {
      candidateRef: uidOf[r.cand], jobRef: jobId(r.job), score: r.score, reasons: r.reasons, status: r.status,
      engineVersion: "seed", createdAt: when, updatedAt: when, seed: true,
    });
  }

  // Entrevistas
  D.interviews.forEach((iv, i) => {
    const job = jobOf[iv.job];
    const interviewer = recOfOrg[job.org];
    add(`interviews/seed_interview_${i + 1}`, {
      jobRef: jobId(iv.job), jobTitle: job.title, organizationRef: orgOf[job.org].id,
      candidateRef: uidOf[iv.cand], candidateName: candOf[iv.cand].fullName, interviewerRef: uidOf[interviewer.key],
      type: iv.type, scheduledStart: ts(D.inDays(iv.inDays, iv.hour, NOW)), location: iv.location,
      notes: iv.notes, createdAt: ts(D.daysAgo(1, NOW)), seed: true,
    });
  });

  // Avisos dentro de la aplicación
  D.notifications.forEach((n, i) => {
    add(`users/${uidOf[n.to]}/notifications/seed_notif_${i + 1}`, {
      type: n.type, title: n.title, body: n.body, href: n.href, read: n.read, createdAt: ts(D.daysAgo(n.ago, NOW)), seed: true,
    });
  });

  // Auditoría
  const byKey = Object.fromEntries(people.map((p) => [p.key, p]));
  D.auditLogs.forEach((l, i) => {
    const actor = byKey[l.actor];
    const target = l.targetType === "job" ? jobId(l.targetKey) : l.targetType === "user" ? uidOf[l.targetKey] : `${jobId(l.targetKey)}`;
    add(`auditLogs/seed_audit_${i + 1}`, {
      actorUid: uidOf[l.actor], actorEmail: actor.email, actorRole: actor.role, action: l.action,
      targetType: l.targetType, targetId: target, details: l.details, createdAt: ts(D.daysAgo(l.ago, NOW)), seed: true,
    });
  });
}

// ------------------------------------------------------------------ validación (espeja firestore.rules)
function validate() {
  const errors = [];
  const SENIORITY = ["", "intern", "junior", "mid", "senior", "lead"];
  const JOB_STATUS = ["published", "draft", "closed"];
  const APP_STATUS = ["applied", "screening", "assessment", "interview", "offer", "hired", "rejected", "withdrawn"];
  const MATCH_STATUS = ["pending", "accepted", "rejected_by_recruiter", "rejected_by_candidate"];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };
  // Firestore rechaza valores `undefined`; se detectan antes de escribir.
  const hasUndefined = (v) =>
    v === undefined ||
    (Array.isArray(v) && v.some(hasUndefined)) ||
    (v && typeof v === "object" && !(v instanceof TS) && Object.values(v).some(hasUndefined));

  for (const { path: p, data: d } of ops) {
    need(!hasUndefined(d), `${p}: tiene un campo sin valor (undefined)`);
    const root = p.split("/")[0];
    if (root === "candidates") {
      need((d.headline || "").length <= 200, `${p}: headline > 200`);
      need((d.location || "").length <= 200, `${p}: location > 200`);
      need((d.fullName || "").length <= 120, `${p}: fullName > 120`);
      need((d.skills || []).length <= 60, `${p}: skills > 60`);
      need((d.experience || []).length <= 20, `${p}: experience > 20`);
      need((d.education || []).length <= 15, `${p}: education > 15`);
      need((d.cvSummary || "").length <= 2500, `${p}: cvSummary > 2500`);
      need((d.cvText || "").length <= 9000, `${p}: cvText > 9000`);
      need(SENIORITY.includes(d.targetSeniority ?? ""), `${p}: targetSeniority inválido`);
    } else if (root === "jobs" && p.split("/").length === 2) {
      need(typeof d.title === "string" && d.title.length <= 200, `${p}: title inválido`);
      need(d.descriptionMd.length <= 10000, `${p}: descriptionMd > 10000`);
      need((d.searchTags || []).length <= 40, `${p}: searchTags > 40`);
      need(JOB_STATUS.includes(d.status), `${p}: status inválido`);
      need(SENIORITY.includes(d.seniority), `${p}: seniority inválido`);
    } else if (root === "organizations") {
      need(d.name.length <= 200 && (d.description || "").length <= 3000, `${p}: organización inválida`);
    } else if (p.includes("/applications/")) {
      need(APP_STATUS.includes(d.status), `${p}: estado de postulación inválido`);
      need((d.recruiterNotes || "").length <= 5000, `${p}: recruiterNotes > 5000`);
    } else if (root === "recommendations") {
      need(d.score >= 0 && d.score <= 1, `${p}: score fuera de 0 a 1`);
      need(MATCH_STATUS.includes(d.status), `${p}: estado de match inválido`);
      need(d.reasons.length <= 5, `${p}: más de 5 razones`);
    } else if (root === "interviews") {
      need((d.location || "").length <= 500, `${p}: location > 500`);
    }
  }
  return errors;
}

// ------------------------------------------------------------------ escritura / borrado
async function commit(list, kind) {
  for (let i = 0; i < list.length; i += 400) {
    const batch = db.batch();
    for (const op of list.slice(i, i + 400)) {
      const ref = db.doc(op.path);
      if (kind === "delete") batch.delete(ref);
      else batch.set(ref, op.data, { merge: true });
    }
    await batch.commit();
  }
}

function summary(list) {
  const c = {};
  for (const { path: p } of list) {
    const parts = p.split("/");
    const name = parts.length === 4 ? `${parts[0]}/*/${parts[2]}` : parts[0];
    c[name] = (c[name] || 0) + 1;
  }
  return c;
}

// ------------------------------------------------------------------ principal
await resolveAccounts();
buildPlan();

const errors = validate();
if (errors.length) {
  console.error("\nLos datos no cumplen los límites de las reglas de seguridad:");
  errors.forEach((e) => console.error(" - " + e));
  process.exit(3);
}

const reusable = people.filter((p) => existed[p.key]).map((p) => p.email);
console.log(`\nCuentas: ${people.length} (${people.length - reusable.length} nuevas, ${reusable.length} ya existían y no se modifican)`);
if (reusable.length) console.log("  Ya existían: " + reusable.join(", "));
console.log("\nDocumentos del conjunto de datos:");
for (const [k, v] of Object.entries(summary(ops))) console.log(`  ${k.padEnd(28)} ${v}`);
console.log(`  ${"TOTAL".padEnd(28)} ${ops.length}`);

if (!APPLY) {
  console.log("\nSimulación terminada: no se escribió nada. Agrega --apply para ejecutarlo.");
  process.exit(0);
}

if (RESET) {
  // Documentos de cuentas existentes no se marcaron como seed, así que no se borran.
  const toDelete = ops.filter((o) => o.data.seed === true);
  await commit(toDelete, "delete");
  // Cuentas de Auth creadas por el seed (llevan el claim seed:true)
  let removed = 0;
  for (const p of people) {
    if (!uidOf[p.key]) continue;
    const u = await auth.getUser(uidOf[p.key]);
    if (u.customClaims?.seed === true) {
      await auth.deleteUser(u.uid);
      removed++;
    }
  }
  console.log(`\nEliminados ${toDelete.length} documentos y ${removed} cuentas creadas por el seed.`);
} else {
  await commit(ops, "set");
  console.log(`\nListo: ${ops.length} documentos escritos en ${projectId}.`);
  console.log("\nCuentas demo (contraseña común: " + PASSWORD + "):");
  for (const p of people) console.log(`  ${p.role.padEnd(10)} ${p.email}`);
}
process.exit(0);
