// Capturas de pantalla del manual de usuario de HireLink (documento Word del manual y docs/MANUAL_USUARIO.md).
//
// Recorre la aplicación en STAGING con las cuentas de demostración (docs/CUENTAS_DEMO.md) y con dos cuentas de ejemplo que
// crea y elimina por sí mismo (una candidata y un reclutador). Guarda una imagen por cada paso del manual, con recuadros
// numerados que marcan lo que se debe pulsar o llenar; los números coinciden con los del texto del manual.
//
// Requisitos: los de qa-tests (ver README.md): la aplicación corriendo contra STAGING y puppeteer-core. Para no gastar el cupo
// de IA de producción (la clave de Groq es la misma en los dos entornos) se arranca el servidor con el modelo de respaldo:
//   $env:TZ='UTC'; $env:GROQ_MODEL_ID='openai/gpt-oss-20b'; npm run start:staging
// Las escenas con IA necesitan además el CV de ejemplo de la candidata (CV_PDF, por defecto ../cv-daniela-ruiz.pdf).
//
// Uso:  node qa-tests/capturas-manual.mjs [escena ...]
//   escenas: publico, candidata1, reclutador1, candidata2, reclutador2, candidata3, admin, movil, limpiar
//   Sin argumentos corre todas, en ese orden. Las imágenes quedan en OUT_DIR (por defecto qa-tests/resultados/capturas-manual).
import { launch, close, guardarCatalogo, limpiarCuentas } from './manual/ayudas.mjs';
import { escenaPublico } from './manual/publico.mjs';
import { escenaCandidata1, escenaCandidata2, escenaCandidata3 } from './manual/candidata.mjs';
import { escenaReclutador1, escenaReclutador2 } from './manual/reclutador.mjs';
import { escenaAdmin } from './manual/admin.mjs';
import { escenaMovil } from './manual/movil.mjs';

const ESCENAS = {
  publico: escenaPublico,
  candidata1: escenaCandidata1,
  reclutador1: escenaReclutador1,
  candidata2: escenaCandidata2,
  reclutador2: escenaReclutador2,
  candidata3: escenaCandidata3,
  admin: escenaAdmin,
  movil: escenaMovil,
  limpiar: limpiarCuentas,
};

const pedidas = process.argv.slice(2);
const orden = pedidas.length ? pedidas : Object.keys(ESCENAS).filter((e) => e !== 'limpiar');
for (const e of orden) {
  if (!ESCENAS[e]) { console.error(`Escena desconocida: ${e}. Disponibles: ${Object.keys(ESCENAS).join(', ')}`); process.exit(1); }
}

await launch();
let fallo = null;
for (const e of orden) {
  console.log(`\n== escena ${e}`);
  try { await ESCENAS[e](); } catch (err) { fallo = err; console.error(`FALLA en ${e}:`, err.message); break; } finally { guardarCatalogo(); }
}
await close();
if (fallo) process.exit(1);
