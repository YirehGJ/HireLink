// Cargador de módulos para los scripts de evaluación: resuelve el alias `@/` hacia `src/` y deja los flujos de IA reales.
// Solo se sustituyen por versiones de prueba los módulos que hablarían con Firebase (guardia de sesión y avisos), que estos
// scripts no usan; los flujos de Genkit y el modelo se ejecutan tal como corren en la aplicación.
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(AQUI, '..', '..', 'src');
const SUSTITUTOS = path.resolve(AQUI, '..', '..', 'qa-tests', 'unitarias', 'sustitutos');

const SUSTITUIDOS = {
  '@/lib/server/guard': 'guard.mjs',
  '@/lib/server/notify': 'notify.mjs',
};

export async function resolve(specifier, context, next) {
  if (SUSTITUIDOS[specifier]) {
    return { url: pathToFileURL(path.join(SUSTITUTOS, SUSTITUIDOS[specifier])).href, shortCircuit: true };
  }
  if (specifier.startsWith('@/')) {
    const base = path.join(SRC, specifier.slice(2));
    for (const file of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
      if (fs.existsSync(file)) return { url: pathToFileURL(file).href, shortCircuit: true };
    }
  }
  // Importaciones relativas sin extensión dentro de src/ (por ejemplo `./model` en src/ai/genkit.ts): Next las resuelve al
  // compilar; Node necesita que se le diga que son archivos .ts.
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith(pathToFileURL(SRC).href)) {
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    if (!path.extname(base)) {
      for (const file of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
        if (fs.existsSync(file)) return { url: pathToFileURL(file).href, shortCircuit: true };
      }
    }
  }
  return next(specifier, context);
}
