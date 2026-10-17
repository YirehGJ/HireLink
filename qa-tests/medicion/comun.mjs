// Utilidades compartidas de las mediciones de rendimiento (Lighthouse) y accesibilidad (axe-core).
//
// Requisitos: la aplicación corriendo contra STAGING (npm run build:staging && npm run start:staging), un navegador
// Chromium/Edge/Chrome y, sin tocar package.json:  npm i --no-save puppeteer-core lighthouse axe-core
// Variables opcionales: BASE_URL (por defecto http://localhost:3100) y CHROME_PATH.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const OUT_DIR = path.join(HERE, '..', 'resultados', 'medicion');
fs.mkdirSync(OUT_DIR, { recursive: true });

export const BASE = process.env.BASE_URL || 'http://localhost:3100';
export const PASS = 'TestPass1234'; // contraseña de las cuentas de demostración (docs/CUENTAS_DEMO.md)
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Páginas clave por rol (cuentas de demostración de staging).
export const TARGETS = [
  { rol: 'publico', id: 'inicio', path: '/' },
  { rol: 'publico', id: 'login', path: '/login' },
  { rol: 'publico', id: 'registro', path: '/register' },
  { rol: 'candidato', email: 'candidato@example.com', id: 'cand_inicio', path: '/dashboard', espera: 'Inicio' },
  { rol: 'candidato', email: 'candidato@example.com', id: 'cand_explorar', path: '/dashboard/explore', espera: 'vacantes' },
  { rol: 'candidato', email: 'candidato@example.com', id: 'cand_perfil', path: '/dashboard/profile', espera: 'Información Principal' },
  { rol: 'candidato', email: 'candidato@example.com', id: 'cand_vacante', path: '/dashboard/jobs/seed_job_bi', espera: 'Habilidades Requeridas' },
  { rol: 'candidato', email: 'candidato@example.com', id: 'cand_postulaciones', path: '/dashboard/applications', espera: 'Postulaciones' },
  { rol: 'reclutador', email: 'reclutar@example.com', id: 'rec_vacantes', path: '/dashboard/jobs', espera: 'Vacantes' },
  { rol: 'reclutador', email: 'reclutar@example.com', id: 'rec_detalle', path: '/dashboard/jobs/seed_job_frontend_jr', espera: 'Candidatos Postulados' },
  { rol: 'reclutador', email: 'reclutar@example.com', id: 'rec_candidatos', path: '/dashboard/candidates', espera: 'Candidatos' },
  { rol: 'admin', email: 'admin@example.com', id: 'adm_panel', path: '/dashboard/admin/overview', espera: 'Panel' },
  { rol: 'admin', email: 'admin@example.com', id: 'adm_usuarios', path: '/dashboard/admin/users', espera: 'Usuarios' },
];

function navegador() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidatos = process.platform === 'win32'
    ? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidatos.find((p) => fs.existsSync(p));
}

export async function launch() {
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer-core')).default;
  } catch {
    console.error('Falta puppeteer-core. Instálalo sin tocar package.json: npm i --no-save puppeteer-core lighthouse axe-core');
    process.exit(1);
  }
  const executablePath = navegador();
  if (!executablePath) {
    console.error('No se encontró un navegador. Define CHROME_PATH con la ruta de Chrome, Edge o Chromium.');
    process.exit(1);
  }
  return puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--remote-debugging-port=0'],
    defaultViewport: { width: 1366, height: 900, deviceScaleFactor: 1 },
  });
}

export async function login(page, email) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForSelector('input[type="password"]', { timeout: 60000 });
  await page.type('input[placeholder="tu@email.com"]', email);
  await page.type('input[type="password"]', PASS);
  await Promise.all([
    page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 120000 }),
    page.click('button[type="submit"]'),
  ]);
  await sleep(2500);
}

// Agrupa los destinos por rol para iniciar sesión una sola vez por rol.
export function porRol() {
  const m = new Map();
  for (const t of TARGETS) {
    const k = t.email || 'publico';
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(t);
  }
  return m;
}
