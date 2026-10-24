// Escena del celular: la misma aplicación en una pantalla de 390 x 844 (menú que se abre con un botón y tablas apiladas).
import {
  BASE, PASS, CANDIDATA, RECLUTADOR, sleep, session, preparar, snap, escribir, pulsar, waitText, go, esperarSinAvisos,
} from './ayudas.mjs';
import { VACANTE } from './reclutador.mjs';

const MOVIL = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

export async function escenaMovil() {
  // --- página principal y acceso, sin sesión
  const s = await session(null);
  const { page } = s;
  await preparar(page, MOVIL);
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await sleep(1800);
  await snap(page, 'mov-01-principal', {
    marks: [
      { n: 1, text: 'Iniciar Sesión', tag: 'a', pad: 3, pos: 'b' },
      { n: 2, text: 'Registrarse', tag: 'a', pad: 3, pos: 'b' },
    ],
    clip: 'vista',
    fijo: true,
  });
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await sleep(1500);
  await escribir(page, 'Email', CANDIDATA.email);
  await escribir(page, 'Contraseña', PASS);
  await pulsar(page, 'Entrar', 'button');
  await page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 });
  await sleep(4000);
  await esperarSinAvisos(page);

  // --- inicio en el celular: barra superior con el botón del menú
  await snap(page, 'mov-02-inicio', {
    marks: [
      { n: 1, css: 'header button', nth: 0, pad: 3, pos: 'br' },
      { n: 2, css: 'header a[href="/dashboard"]', pad: 3, pos: 'b' },
      { n: 3, text: 'Notificaciones', tag: 'button', pad: 3, pos: 'bl' },
    ],
    clip: 'vista',
    fijo: true,
  });

  // --- el menú se abre desde el botón de la esquina superior izquierda
  await page.click('header button');
  await sleep(1200);
  await snap(page, 'mov-03-menu', {
    marks: [
      { n: 1, css: '[role="dialog"] nav a[href="/dashboard/applications"], [role="dialog"] a[href="/dashboard/applications"]', pad: 4, pos: 'r' },
      { n: 2, text: 'Cerrar Sesión', pad: 4, pos: 'r' },
    ],
    clip: 'vista',
    fijo: true,
  });
  await page.click('[role="dialog"] a[href="/dashboard/applications"]');
  await page.waitForFunction(() => location.pathname === '/dashboard/applications', { timeout: 30000 });
  await sleep(3500);
  await snap(page, 'mov-04-postulaciones', { clip: 'vista', fijo: true });
  await s.ctx.close();

  // --- el reclutador en el celular: los postulantes se apilan en tarjetas
  const t = await session(null);
  await preparar(t.page, MOVIL);
  await t.page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await sleep(1500);
  await escribir(t.page, 'Email', RECLUTADOR.email);
  await escribir(t.page, 'Contraseña', PASS);
  await pulsar(t.page, 'Entrar', 'button');
  await t.page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 });
  await sleep(4000);
  const href = await t.page.$eval('a[href*="/dashboard/jobs/"]:not([href$="/new"])', (a) => a.getAttribute('href'));
  await t.page.goto(BASE + href, { waitUntil: 'networkidle2' });
  await sleep(4000);
  await snap(t.page, 'mov-05-postulantes', { clip: 'vista', fijo: true });
  await t.ctx.close();
}
