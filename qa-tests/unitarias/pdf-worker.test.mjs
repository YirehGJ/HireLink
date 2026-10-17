// El worker de pdf.js que se sirve desde public/ debe ser de la misma versión que `pdfjs-dist`: si no, el análisis de CV
// falla con «The API version does not match the Worker version». Para corregirlo: `npm run worker:pdf`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { version } = JSON.parse(fs.readFileSync(path.join(raiz, 'node_modules', 'pdfjs-dist', 'package.json'), 'utf8'));
const publicado = path.join(raiz, 'public', `pdf.worker.${version}.min.mjs`);

test(`public/ tiene el worker de pdf.js ${version}`, () => {
  assert.ok(fs.existsSync(publicado), `falta ${path.relative(raiz, publicado)}: ejecuta npm run worker:pdf`);
});

test('el worker de public/ es idéntico al de node_modules', () => {
  const instalado = fs.readFileSync(path.join(raiz, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'));
  assert.ok(instalado.equals(fs.readFileSync(publicado)), 'el archivo de public/ no coincide con el instalado: ejecuta npm run worker:pdf');
});

test('solo hay un worker de pdf.js en public/ (sin versiones viejas)', () => {
  const todos = fs.readdirSync(path.join(raiz, 'public')).filter((f) => /^pdf\.worker\..+\.min\.mjs$/.test(f));
  assert.deepEqual(todos, [`pdf.worker.${version}.min.mjs`]);
});