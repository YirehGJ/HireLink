// Pruebas unitarias de las funciones de formato compartidas (src/lib/format.ts). No usan red ni IA.
//   npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { fixEscapedNewlines, parseTags, yearsLabel, isHttpUrl, normalizeText, matchesText, seniorityLabel } = await import('../../src/lib/format.ts');

test('fixEscapedNewlines convierte los «\\n» escritos como texto cuando no hay saltos reales', () => {
  const crudo = '# Título\\n\\n## Responsabilidades Principales\\n- Diseñar pruebas\\n- Automatizar';
  const bien = fixEscapedNewlines(crudo);
  assert.equal(bien, '# Título\n\n## Responsabilidades Principales\n- Diseñar pruebas\n- Automatizar');
  assert.equal(bien.split('\n').length, 5);
});

test('fixEscapedNewlines no toca un texto con saltos reales ni uno sin secuencias', () => {
  const real = 'Primera línea\nSegunda línea con la secuencia \\n dentro';
  assert.equal(fixEscapedNewlines(real), real);
  assert.equal(fixEscapedNewlines('Sin saltos'), 'Sin saltos');
  assert.equal(fixEscapedNewlines(undefined), '');
  assert.equal(fixEscapedNewlines(null), '');
});

test('fixEscapedNewlines también convierte «\\r\\n» y «\\t» escritos como texto', () => {
  assert.equal(fixEscapedNewlines('a\\r\\nb\\tc'), 'a\nb  c');
});

test('parseTags quita vacíos y repetidos (sin distinguir mayúsculas) y respeta los límites', () => {
  assert.deepEqual(parseTags('React,, Node.js , ,react,  '), ['React', 'Node.js']);
  assert.equal(parseTags(Array.from({ length: 60 }, (_, i) => `t${i}`).join(',')).length, 40);
  assert.equal(parseTags('x'.repeat(200))[0].length, 60);
});

test('yearsLabel concuerda en singular y plural', () => {
  assert.equal(yearsLabel(1), '1 año');
  assert.equal(yearsLabel(0), '0 años');
  assert.equal(yearsLabel(4), '4 años');
  assert.equal(yearsLabel(undefined), '0 años');
});

test('isHttpUrl solo acepta direcciones http o https con dominio', () => {
  assert.equal(isHttpUrl('https://innovasalud.example.com'), true);
  assert.equal(isHttpUrl('http://empresa.mx/contacto'), true);
  assert.equal(isHttpUrl('javascript:alert(1)'), false);
  assert.equal(isHttpUrl('ftp://empresa.mx'), false);
  assert.equal(isHttpUrl('sin-esquema.com'), false);
  assert.equal(isHttpUrl('http://localhost'), false);
});

test('normalizeText y matchesText buscan sin distinguir acentos ni mayúsculas', () => {
  assert.equal(normalizeText('Diseñador UX'), 'disenador ux');
  assert.equal(matchesText('Diseñador de Producto', normalizeText('DISENADOR')), true);
  assert.equal(matchesText('Ingeniero', normalizeText('diseñador')), false);
});

test('seniorityLabel usa la misma etiqueta en todas las pantallas', () => {
  assert.equal(seniorityLabel('mid'), 'Mid-level');
  assert.equal(seniorityLabel('lead'), 'Lead');
  assert.equal(seniorityLabel(''), '');
});
