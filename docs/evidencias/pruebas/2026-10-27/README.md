# Registros de las pruebas del 26 y 27 de octubre de 2026

Salida completa de las baterías ejecutadas sobre la versión 1.1 (rama `release/1.1.0`, commit `e24dab8`) contra el entorno de
pruebas (proyecto Firebase `hirelink-staging`, datos ficticios). Ninguna prueba toca producción: los scripts de `security-tests/` se
niegan a correr contra ella. Los comandos para repetirlas están en [docs/EVIDENCIAS.md](../../../EVIDENCIAS.md).

| Archivo | Batería | Resultado |
|---|---|---|
| `01-unitarias.txt` | `npm run test:unit` | 46/46 |
| `02-reglas-firestore.txt` | `security-tests/sec-test.mjs` | 110/110 |
| `03-api-y-carga.txt` | `security-tests/api-test.mjs`, incluye 100 usuarios simultáneos | 96/96 |
| `04-flujos.txt` | `security-tests/flow-test.mjs` | 29/29 |
| `05-navegador-parte-1.txt` | `qa-tests/funcional-1.mjs` (registro, empresas, vacantes y perfiles con CV analizados por la IA) | 72/72 |
| `05b-navegador-parte-1-repeticion.txt` | la misma batería, repetida sobre la compilación final | 70/71 |
| `06-navegador-parte-2.txt` | `qa-tests/funcional-2.mjs` (sin la fase de IA) | 131/131 |
| `07-sondas-de-defectos.txt` | `qa-tests/defectos.mjs` | 23/23 |
| `08-accesibilidad.txt` | `qa-tests/accesibilidad.mjs` | 58/58 |
| `09-lectura-de-pdf.txt` | `qa-tests/cv-pdf.mjs` | 8/8 |
| `10-compilacion.txt` | `npm run build:staging` | compilación correcta |

**Sobre la parte 1 del navegador.** Se ejecutó dos veces. La primera (26 de octubre, 23:22) pasó 72/72. La repetición (27 de
octubre, 00:24), ya con la última corrección de las razones de la IA, pasó 70 de 71: un CV no obtuvo respuesta de la IA en 180 s porque
se había agotado el cupo diario del modelo de respaldo en el plan gratuito (es un límite conocido, ver la sección III-J del informe).
No se repitió después para no consumir más cupo, que se comparte con la aplicación en producción.

**Lo que estos registros no cubren.** Producción, celulares reales, el modelo principal de la IA (las corridas con IA usaron el modelo de
respaldo `gpt-oss-20b`), Lighthouse y axe-core en la versión 1.1 (las cifras citadas en el informe son de la 1.0) y la ejecución de la
verificación automática de GitHub con Node 22.
