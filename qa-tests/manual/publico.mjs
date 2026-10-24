// Escena «publico»: páginas que ve cualquier persona antes de entrar (principal, registro, inicio de sesión, recuperar contraseña).
import { BASE, PASS, CANDIDATA, TARJETA, sleep, session, preparar, snap, escribir, pulsar, waitText } from './ayudas.mjs';

export async function escenaPublico() {
  const s = await session(null);
  const { page } = s;
  await preparar(page);

  // --- página principal
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await sleep(1500);
  await snap(page, 'pub-01-principal', {
    marks: [
      { n: 1, css: '#theme-switch', pad: 10, pos: 'b' },
      { n: 2, text: 'Iniciar Sesión', tag: 'a', pad: 3, pos: 'b' },
      { n: 3, text: 'Registrarse', tag: 'a', pad: 3, pos: 'b' },
      { n: 4, text: 'Encontrar mi próximo empleo', tag: 'a', pad: 6, pos: 'b' },
      { n: 5, text: 'Contratar al mejor talento', tag: 'a', pad: 6, pos: 'b' },
    ],
    clip: { x: 0, y: 0, w: 1280, h: 720 },
  });

  // --- registro: formulario lleno
  await page.goto(BASE + '/register', { waitUntil: 'networkidle2' });
  await sleep(1500);
  await escribir(page, 'Nombre completo', CANDIDATA.nombre);
  await escribir(page, 'Email', CANDIDATA.email);
  await escribir(page, 'Contraseña', PASS);
  await snap(page, 'pub-02-registro', {
    marks: [
      { n: 1, label: 'Nombre completo', pos: 'l' },
      { n: 2, label: 'Email', pos: 'l' },
      { n: 3, label: 'Contraseña', pos: 'l' },
      { n: 4, aria: 'Mostrar contraseña', pad: 2, pos: 'r' },
      { n: 5, label: 'Tipo de cuenta', pos: 'l' },
      { n: 6, text: 'Crear cuenta', tag: 'button', pos: 'l' },
    ],
    clip: { css: TARJETA, margen: 60 },
  });

  // --- registro: lista del tipo de cuenta
  await page.click('button[role="combobox"]');
  await sleep(700);
  await snap(page, 'pub-03-tipo-cuenta', {
    marks: [
      { n: 1, text: 'Candidato (Busco empleo)', tag: '[role=option]', pos: 'l' },
      { n: 2, text: 'Reclutador (Busco talento)', tag: '[role=option]', pos: 'l' },
    ],
    clip: { css: TARJETA, margen: 50 },
  });
  await page.keyboard.press('Escape');

  // --- registro: mensajes cuando falta algo
  await page.goto(BASE + '/register', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await pulsar(page, 'Crear cuenta');
  await sleep(900);
  await snap(page, 'pub-04-registro-errores', {
    marks: [
      { n: 1, text: 'Mínimo 2 caracteres', tag: 'p', pad: 3, pos: 'l' },
      { n: 2, text: 'Email inválido', tag: 'p', pad: 3, pos: 'l' },
      { n: 3, text: 'Mínimo 8 caracteres', tag: 'p', pad: 3, pos: 'l' },
    ],
    clip: { css: TARJETA, margen: 50 },
  });

  // --- inicio de sesión
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await escribir(page, 'Email', CANDIDATA.email);
  await escribir(page, 'Contraseña', PASS);
  await snap(page, 'pub-05-login', {
    marks: [
      { n: 1, label: 'Email', pos: 'l' },
      { n: 2, label: 'Contraseña', pos: 'l' },
      { n: 3, aria: 'Mostrar contraseña', pad: 2, pos: 'r' },
      { n: 4, text: 'Recuérdame', tag: 'label', pad: 6, pos: 'l' },
      { n: 5, text: '¿Olvidaste tu contraseña?', tag: 'a', pad: 4, pos: 'r' },
      { n: 6, text: 'Entrar', tag: 'button', pos: 'l' },
      { n: 7, text: 'Google', tag: 'button', pos: 'l' },
      { n: 8, text: 'Regístrate', tag: 'a', pad: 4, pos: 'b' },
    ],
    clip: { css: TARJETA, margen: 70 },
  });

  // --- contraseña incorrecta (con una cuenta que no existe: no afecta a nadie)
  await escribir(page, 'Email', 'persona.ejemplo@example.com');
  await escribir(page, 'Contraseña', 'ClaveIncorrecta1');
  await pulsar(page, 'Entrar', 'button');
  await waitText(page, 'Error de acceso', 30000);
  await sleep(500);
  await snap(page, 'pub-08-login-error', {
    marks: [{ n: 1, text: 'Error de acceso', tag: 'div', closest: 'li', pad: 4, pos: 'l' }],
    clip: { x: 760, y: 0, w: 520, h: 150 },
  });

  // --- recuperar contraseña (se intercepta el envío: no sale ningún correo)
  await page.setRequestInterception(true);
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' };
  page.on('request', (r) => {
    if (r.url().includes('accounts:sendOobCode')) {
      if (r.method() === 'OPTIONS') r.respond({ status: 204, headers: cors });
      else r.respond({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ email: CANDIDATA.email }) });
    } else r.continue();
  });
  await page.goto(BASE + '/forgot-password', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await escribir(page, 'Email', CANDIDATA.email);
  await snap(page, 'pub-06-recuperar', {
    marks: [
      { n: 1, label: 'Email', pos: 'l' },
      { n: 2, text: 'Enviar correo', tag: 'button', pos: 'l' },
      { n: 3, text: 'Volver a inicio de sesión', tag: 'a', pad: 4, pos: 'b' },
    ],
    clip: { css: TARJETA, margen: 60 },
  });
  await pulsar(page, 'Enviar correo');
  await sleep(1500);
  await snap(page, 'pub-07-recuperar-enviado', { clip: { css: TARJETA, margen: 60 } });

  await s.ctx.close();
}


