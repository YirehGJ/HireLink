// Congela en un archivo las 10 vacantes de prueba (las que crean las suites con navegador en staging, cinco de ellas con la
// descripción generada por la IA) para que la evaluación se pueda repetir sin depender del estado de la base de datos.
//   node scripts/evaluacion/exportar-vacantes.mjs
import fs from 'fs';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { RAIZ, cargarEntorno } from './entorno.mjs';

const TITULOS = [
  'Analista de Datos Clínicos',
  'Desarrollador Móvil iOS',
  'Ingeniero de Calidad de Software (QA Automation)',
  'Administrador de Sistemas Linux',
  'Desarrollador .NET Senior',
  'Arquitecto de Software',
  'Desarrollador Frontend Junior (React)',
  'Diseñador UI para Plataformas Educativas',
  'Analista de Producto Digital',
  'Ingeniero de Machine Learning',
];

const env = cargarEntorno();
initializeApp({ credential: cert({ projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) });
const db = getFirestore();

const salida = [];
for (const titulo of TITULOS) {
  const snap = await db.collection('jobs').where('title', '==', titulo).get();
  const candidatas = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((j) => j.status === 'published' && (j.descriptionMd || '').length >= 50)
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  const j = candidatas[0];
  if (!j) { console.log(`SIN VACANTE: ${titulo}`); continue; }
  salida.push({ titulo: j.title, seniority: j.seniority, ubicacion: j.location, remoto: !!j.remoteAllowed, etiquetas: j.searchTags ?? [], descripcionMd: j.descriptionMd });
  console.log(`${titulo.padEnd(52)} ${String((j.descriptionMd || '').length).padStart(5)} caracteres, etiquetas: ${(j.searchTags ?? []).join(', ')}`);
}
const destino = path.join(RAIZ, 'docs', 'evidencias', 'ia', 'fixtures', 'vacantes.json');
fs.writeFileSync(destino, JSON.stringify(salida, null, 2));
console.log(`\n${salida.length} vacantes guardadas en ${path.relative(RAIZ, destino)}`);
process.exit(0);
