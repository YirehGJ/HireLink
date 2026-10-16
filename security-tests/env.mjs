// Selección del proyecto de Firebase sobre el que corren las pruebas de seguridad.
//
//   node security-tests/sec-test.mjs                       usa .env.local (por defecto)
//   node security-tests/sec-test.mjs --env .env.staging    usa el entorno de staging
//   ENV_FILE=.env.staging node security-tests/sec-test.mjs equivale a la opción anterior
//
// Las pruebas crean y borran cuentas y documentos desechables (sec.*, flow.*, secload*) en el proyecto
// elegido. Como .env.local suele apuntar a PRODUCCIÓN, el script se niega a continuar contra el proyecto
// de producción salvo que se agregue --allow-production de forma explícita.
import fs from 'fs';

const PRODUCTION_PROJECT_IDS = ['hirelink-fd1fe'];

const argv = process.argv.slice(2);
const envIndex = argv.indexOf('--env');

/** Argumentos que no son opciones ni el valor de --env (por ejemplo, la URL base del servidor). */
export const positionalArgs = argv.filter((a, i) => !a.startsWith('--') && !(envIndex >= 0 && i === envIndex + 1));

export function loadEnv() {
  const file = envIndex >= 0 && argv[envIndex + 1] ? argv[envIndex + 1] : process.env.ENV_FILE || '.env.local';
  if (!fs.existsSync(file)) {
    console.error(`No existe el archivo de variables: ${file}`);
    process.exit(1);
  }
  const text = fs.readFileSync(file, 'utf8');
  const get = (k) => (text.match(new RegExp('^' + k + '=(.+)$', 'm')) || [])[1]?.trim().replace(/^"|"$/g, '');
  const projectId = get('FIREBASE_PROJECT_ID');
  const isProduction = PRODUCTION_PROJECT_IDS.includes(projectId);
  console.log(`Proyecto de pruebas: ${projectId}${isProduction ? '  (PRODUCCIÓN)' : ''}  [${file}]`);
  if (isProduction && !argv.includes('--allow-production')) {
    console.error(
      '\nBloqueado: estas pruebas crean y eliminan cuentas desechables y apuntan al proyecto de PRODUCCIÓN.\n' +
        'Usa el entorno de staging (--env .env.staging) o agrega --allow-production si de verdad es lo que quieres.'
    );
    process.exit(2);
  }
  return { get, file, projectId, isProduction };
}
