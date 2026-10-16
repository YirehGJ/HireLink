// Cargador de módulos para las pruebas unitarias: resuelve el alias `@/` hacia `src/` y sustituye por
// versiones de prueba los módulos que hablarían con servicios externos (IA, avisos, Sentry/Firebase Admin).
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, '..', '..', 'src');

const SUSTITUTOS = {
  '@/lib/server/guard': 'sustitutos/guard.mjs',
  '@/lib/server/notify': 'sustitutos/notify.mjs',
  '@/ai/flows/match-candidate-job-flow': 'sustitutos/flujo-match.mjs',
};

export async function resolve(specifier, context, next) {
  if (SUSTITUTOS[specifier]) {
    return { url: pathToFileURL(path.join(HERE, SUSTITUTOS[specifier])).href, shortCircuit: true };
  }
  if (specifier.startsWith('@/')) {
    const base = path.join(SRC, specifier.slice(2));
    for (const file of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
      if (fs.existsSync(file)) return { url: pathToFileURL(file).href, shortCircuit: true };
    }
  }
  return next(specifier, context);
}
