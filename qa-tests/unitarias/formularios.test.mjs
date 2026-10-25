// Pruebas unitarias de los esquemas compartidos de los formularios de acceso (src/lib/auth-schemas.ts). No usan red.
//   npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { emailField } = await import('../../src/lib/auth-schemas.ts');
const { safeNextPath } = await import('../../src/lib/auth-flags.ts');

test('safeNextPath solo acepta rutas internas del dashboard (sin «..», dobles barras ni direcciones externas)', () => {
  assert.equal(safeNextPath('/dashboard'), '/dashboard');
  assert.equal(safeNextPath('/dashboard/jobs/abc-123'), '/dashboard/jobs/abc-123');
  for (const malo of [null, undefined, '', '/login', 'https://x.com', '//evil.com', '/dashboard//x', '/dashboard/../login', '/dashboardx', '/dashboard/%2e%2e']) {
    assert.equal(safeNextPath(malo), null, String(malo));
  }
});

test('emailField acepta un correo con espacios al inicio o al final y lo devuelve recortado', () => {
  assert.equal(emailField().parse('ana@correo.com '), 'ana@correo.com');
  assert.equal(emailField().parse('  ana@correo.com'), 'ana@correo.com');
});

test('emailField rechaza un correo mal formado con el mensaje indicado', () => {
  const r = emailField('Formato de email inválido.').safeParse('ana@');
  assert.equal(r.success, false);
  assert.equal(r.error.issues[0].message, 'Formato de email inválido.');
});

test('emailField rechaza espacios dentro del correo', () => {
  assert.equal(emailField().safeParse('ana @correo.com').success, false);
});

test('emailField distingue «requerido» de «inválido» solo si se da el mensaje de requerido', () => {
  const conMensaje = emailField('Email inválido', 'El email es requerido').safeParse('   ');
  assert.equal(conMensaje.error.issues[0].message, 'El email es requerido');
  const sinMensaje = emailField().safeParse('   ');
  assert.equal(sinMensaje.error.issues[0].message, 'Email inválido');
});
