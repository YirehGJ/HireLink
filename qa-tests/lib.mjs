// Utilidades compartidas de las pruebas funcionales con navegador (qa-tests/).
//
// Requisitos: la aplicación corriendo contra STAGING (npm run build:staging && npm run start:staging), un
// navegador Chromium/Edge/Chrome instalado y `puppeteer-core` (npm i --no-save puppeteer-core).
// Variables opcionales: BASE_URL (por defecto http://localhost:3100), CHROME_PATH, ENV_FILE (.env.staging).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');
export const BASE = process.env.BASE_URL || 'http://localhost:3100';
export const PASS = 'TestPass1234'; // contraseña de las cuentas de demostración (docs/CUENTAS_DEMO.md)
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const OUT_DIR = path.join(HERE, 'resultados');
export const CV_DIR = path.join(HERE, 'cvs');
export const STATE_FILE = path.join(HERE, '.estado.json');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ------------------------------------------------------------------ entorno: SOLO staging
const PRODUCTION_PROJECT_IDS = ['hirelink-fd1fe'];
const envFile = path.resolve(ROOT, process.env.ENV_FILE || '.env.staging');
if (!fs.existsSync(envFile)) {
  console.error(`No existe ${envFile}. Crea .env.staging siguiendo docs/ENTORNOS.md.`);
  process.exit(1);
}
export const ENV = {};
for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) ENV[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
if (PRODUCTION_PROJECT_IDS.includes(ENV.FIREBASE_PROJECT_ID)) {
  console.error('Bloqueado: estas pruebas crean y eliminan cuentas, vacantes y postulaciones. Nunca se ejecutan contra producción.');
  process.exit(2);
}
console.log(`Proyecto de pruebas: ${ENV.FIREBASE_PROJECT_ID}  |  aplicación: ${BASE}`);
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: ENV.FIREBASE_PROJECT_ID,
    clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
    privateKey: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
export { admin };
export const db = admin.firestore();
export const auth = admin.auth();
export const TS = admin.firestore.Timestamp;
export const uidOf = async (email) => (await auth.getUserByEmail(email)).uid;
export const tryUid = async (email) => { try { return await uidOf(email); } catch { return null; } };

// ------------------------------------------------------------------ navegador
function defaultBrowserPath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = process.platform === 'win32'
    ? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidates.find((p) => fs.existsSync(p));
}

export let browser;
export async function launch() {
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer-core')).default;
  } catch {
    console.error('Falta puppeteer-core. Instálalo sin tocar package.json: npm i --no-save puppeteer-core');
    process.exit(1);
  }
  const executablePath = defaultBrowserPath();
  if (!executablePath) {
    console.error('No se encontró un navegador. Define CHROME_PATH con la ruta de Chrome, Edge o Chromium.');
    process.exit(1);
  }
  browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1366, height: 900, deviceScaleFactor: 1 },
  });
  return browser;
}
export async function close() { await browser?.close(); }

// ------------------------------------------------------------------ resultados
export const results = [];
export function record(fase, funcion, caso, ok, detalle = '') {
  results.push({ fase, funcion, caso, ok: !!ok, detalle });
  console.log(`${ok ? 'OK ' : 'FALLA'}  [${fase}] ${funcion} | ${caso}${detalle ? '  -> ' + detalle : ''}`);
  return ok;
}
export function saveResults(file) { fs.writeFileSync(file, JSON.stringify(results, null, 2)); }

// ------------------------------------------------------------------ sesiones del navegador
export async function session(email, opts = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const log = { console: [], requests: [], responses: [] };
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/favicon|net::ERR_ABORTED/i.test(t)) return;
    log.console.push(t.slice(0, 300));
  });
  page.on('pageerror', (e) => log.console.push('PAGEERROR ' + String(e).slice(0, 300)));
  page.on('request', (r) => log.requests.push(r.url()));
  page.on('response', (r) => log.responses.push({ url: r.url(), status: r.status() }));
  if (opts.block?.length) {
    await page.setRequestInterception(true);
    page.on('request', (r) => (opts.block.some((b) => r.url().includes(b)) ? r.abort() : r.continue()));
  }
  const s = { page, ctx, log, email };
  if (email) await loginUI(s, email, opts.password || PASS);
  return s;
}

export async function loginUI(s, email, password = PASS) {
  const { page } = s;
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2', timeout: 180000 });
  await page.waitForSelector('input[type="password"]', { timeout: 90000 });
  await page.type('input[placeholder="tu@email.com"]', email);
  await page.type('input[type="password"]', password);
  await Promise.all([
    page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 120000 }),
    page.click('button[type="submit"]'),
  ]);
  await sleep(1800);
}

export async function go(page, route, waitFor, settle = 1500) {
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 180000 });
  if (waitFor) await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout: 60000 }, waitFor);
  await sleep(settle);
}
export const bodyText = (page) => page.evaluate(() => document.body.innerText);
export const hasText = async (page, t) => (await bodyText(page)).includes(t);
export async function waitText(page, text, timeout = 30000) {
  try { await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text); return true; } catch { return false; }
}

// Escribe en un campo controlado por React (útil para <input type=date|time> y para textos largos).
export const setInput = (page, sel, val) =>
  page.evaluate((s, v) => {
    const el = document.querySelector(s);
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, sel, val);

// Clic real con el ratón sobre el primer elemento cuyo texto coincide (Radix responde a mousedown, no a .click()).
export async function clickText(page, text, tag = 'button', root = 'document') {
  const h = await page.evaluateHandle((t, tg, r) => {
    const scope = r === 'document' ? document : document.querySelector(r);
    const els = [...scope.querySelectorAll(tg)].filter((e) => !e.disabled);
    return els.find((e) => e.textContent.trim() === t) || els.find((e) => e.textContent.trim().includes(t)) || null;
  }, text, tag, root);
  const el = h.asElement();
  if (!el) throw new Error(`No se encontró «${text}»`);
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await el.click();
}

// Selecciona una opción en un <Select> de Radix identificado por el texto de su etiqueta (htmlFor) o por aria-label.
export async function pickSelect(page, { label, aria, nth = 0, root = 'document' }, optionText) {
  const h = await page.evaluateHandle((lab, ar, n, r) => {
    const scope = r === 'document' ? document : document.querySelector(r);
    if (ar) return [...scope.querySelectorAll(`button[role="combobox"][aria-label="${ar}"]`)][n] || null;
    if (lab) {
      const l = [...scope.querySelectorAll('label')].find((x) => x.textContent.trim().startsWith(lab));
      return l && l.htmlFor ? document.getElementById(l.htmlFor) : null;
    }
    return [...scope.querySelectorAll('button[role="combobox"]')][n] || null;
  }, label || null, aria || null, nth, root);
  const el = h.asElement();
  if (!el) throw new Error(`No se encontró el selector ${label || aria || nth}`);
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await el.click();
  await sleep(600);
  const opt = await page.evaluateHandle((t) => [...document.querySelectorAll('[role="option"]')].find((o) => o.textContent.trim() === t || o.textContent.trim().includes(t)) || null, optionText);
  if (!opt.asElement()) throw new Error(`No se encontró la opción «${optionText}»`);
  await opt.asElement().click();
  await sleep(500);
}

// ------------------------------------------------------------------ limpieza de datos de prueba
export async function deleteJobCascade(jobId) {
  const jobRef = db.doc(`jobs/${jobId}`);
  const apps = await jobRef.collection('applications').get();
  for (const a of apps.docs) await db.doc(`users/${a.data().candidateRef || a.id}/applications/${jobId}`).delete().catch(() => {});
  for (const r of (await db.collection('recommendations').where('jobRef', '==', jobId).get()).docs) await r.ref.delete();
  for (const r of (await db.collection('interviews').where('jobRef', '==', jobId).get()).docs) await r.ref.delete();
  await db.recursiveDelete(jobRef);
}

export async function deleteAccountCascade(email) {
  const uid = await tryUid(email);
  if (!uid) return false;
  for (const o of (await db.collection('organizations').where('ownerUid', '==', uid).get()).docs) {
    for (const j of (await db.collection('jobs').where('organizationRef', '==', o.id).get()).docs) await deleteJobCascade(j.id);
    await o.ref.delete();
  }
  for (const a of (await db.collectionGroup('applications').get()).docs) {
    if (a.ref.path.startsWith('jobs/') && a.data().candidateRef === uid) await a.ref.delete();
  }
  for (const r of (await db.collection('recommendations').where('candidateRef', '==', uid).get()).docs) await r.ref.delete();
  for (const r of (await db.collection('interviews').where('candidateRef', '==', uid).get()).docs) await r.ref.delete();
  await db.recursiveDelete(db.doc(`users/${uid}`));
  await db.doc(`candidates/${uid}`).delete().catch(() => {});
  await auth.deleteUser(uid).catch(() => {});
  return true;
}
