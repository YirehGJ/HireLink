// Copia el worker de pdf.js a public/ con la versión en el nombre (pdf.worker.<versión>.min.mjs).
//
// El worker se sirve como archivo estático y no pasa por webpack porque el minificador de Next 14 lo rechaza
// («'import.meta' cannot be used outside of module code»). Debe ser EXACTAMENTE de la misma versión que `pdfjs-dist`;
// por eso el nombre lleva la versión y hay una prueba unitaria (qa-tests/unitarias/pdf-worker.test.mjs) que falla si
// el archivo de public/ no coincide con el instalado. Ejecuta `npm run worker:pdf` después de cambiar `pdfjs-dist`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const paquete = path.join(raiz, 'node_modules', 'pdfjs-dist');
const { version } = JSON.parse(fs.readFileSync(path.join(paquete, 'package.json'), 'utf8'));
const destino = path.join(raiz, 'public', `pdf.worker.${version}.min.mjs`);

for (const f of fs.readdirSync(path.join(raiz, 'public'))) {
  if (/^pdf\.worker\..+\.min\.mjs$/.test(f) && f !== path.basename(destino)) {
    fs.unlinkSync(path.join(raiz, 'public', f));
    console.log('eliminado', f);
  }
}
fs.copyFileSync(path.join(paquete, 'build', 'pdf.worker.min.mjs'), destino);
console.log('copiado', path.relative(raiz, destino), `(${Math.round(fs.statSync(destino).size / 1024)} kB)`);