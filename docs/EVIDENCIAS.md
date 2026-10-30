# Evidencias de la versión 1.1

Índice de las evidencias que cita el informe del proyecto modular (`EntregaModular_v2`): dónde está cada una, cómo repetirla y
qué no demuestra. Todo se ejecuta contra el entorno de pruebas (proyecto Firebase `hirelink-staging`, datos ficticios; ver
[ENTORNOS.md](ENTORNOS.md)). Los scripts de `security-tests/` se niegan a correr contra producción y los de `scripts/evaluacion/`
se niegan a correr si el proyecto es el de producción.

## 1. Pruebas automáticas

Registros completos en [`evidencias/pruebas/2026-10-27/`](evidencias/pruebas/2026-10-27/README.md).

| Batería | Resultado | Qué verifica | Comando |
|---|---|---|---|
| Unitarias | 46/46 | Motor de compatibilidad, caché por huella, reintentos, modelo de respaldo, formularios y razones | `npm run test:unit` |
| Reglas de Firestore | 110/110 | Escalada de privilegios, aislamiento entre empresas, cuentas suspendidas, notas privadas, aprobación, entrevistas, tamaños y correo del perfil | `node security-tests/sec-test.mjs --env .env.staging` |
| API y carga | 96/96 | Sesión, roles, empresa ajena, entradas inválidas, límites de uso, cabeceras y política de contenido; 100 usuarios simultáneos | `node security-tests/api-test.mjs http://localhost:3100 --env .env.staging` |
| Flujos | 29/29 | Registro, empresa, vacante, postulación, estados y entrevistas con las reglas estrictas | `node security-tests/flow-test.mjs --env .env.staging` |
| Navegador, parte 1 | 72/72 (repetición: 70/71) | Registro de 15 cuentas, empresas, vacantes y perfiles con CV analizados por la IA | `node qa-tests/funcional-1.mjs corrida` |
| Navegador, parte 2 | 131/131 | Postulaciones, estados, entrevistas, matches, filtros, avisos, administración y cuenta (sin la fase de IA) | `node qa-tests/funcional-2.mjs corrida` |
| Sondas de defectos | 23/23 | Veintitrés defectos corregidos no reaparecen | `node qa-tests/defectos.mjs corrida` |
| Accesibilidad y celular | 58/58 | Teclado, menú del celular, foco en diálogos y guía de inicio | `node qa-tests/accesibilidad.mjs corrida` |
| Lectura de PDF | 8/8 | pdf.js 6 lee tres CV y solo se descarga al subir un archivo | `node qa-tests/cv-pdf.mjs corrida` |

Los requisitos (servidor de staging en `http://localhost:3100`, `puppeteer-core`, CV de `qa-tests/crear-cvs.py`) están en
[`qa-tests/README.md`](../qa-tests/README.md) y [`security-tests/README.md`](../security-tests/README.md). La suma de las baterías
de seguridad (reglas, API y flujos) es de 235 pruebas.

## 2. Validación de la IA

Datos, scripts, resultados, métricas y límites en [`evidencias/ia/README.md`](evidencias/ia/README.md). Resumen de lo medido con
`gpt-oss-20b` (el modelo de respaldo): 10 CV en PDF y 50 pares de perfil y vacante.

| Medida | Resultado |
|---|---|
| Habilidades halladas en los CV | 100 % (precisión 98 %, cota inferior) |
| Perfil diseñado para la vacante en primer lugar | 5 de 5 vacantes (la línea base de etiquetas también) |
| Puntaje medio: ideal / afín / resto | 0.90 / 0.26 / 0.07 |
| nDCG@5, modelo frente a línea base | 0.93 frente a 0.85 |
| Sinónimos (ReactJS, JS ES6, Sass, GitHub) | 0.88 con el modelo; 0.50 con la línea base |
| Relleno de habilidades sin experiencia | 0.67 con el modelo (de 0.55 a 0.85); 1.00 con la línea base |
| Comparaciones de sesgo que superan el ruido | 3 de 10, sin un sentido único (prueba exploratoria) |

El modelo recomienda; **la decisión es siempre de una persona**. El puntaje es una compatibilidad estimada con los requisitos
escritos, no una probabilidad de contratación.

## 3. Rendimiento

`node scripts/evaluacion/latencias.mjs`: lectura de 20 vacantes publicadas con las reglas de seguridad aplicadas, 30 repeticiones,
desde el equipo del desarrollador (mediana 159 ms, percentil 95 de 275 ms, 93 % de las lecturas por debajo de 250 ms). Con 100
visitas simultáneas las páginas respondieron con una mediana de 109 a 150 ms; con 100 usuarios llamando a la API autenticada, 952 ms
de mediana (registro: [`03-api-y-carga.txt`](evidencias/pruebas/2026-10-27/03-api-y-carga.txt)).

## 4. Seguridad y privacidad

[`CHECKLIST_SEGURIDAD_PRIVACIDAD.md`](CHECKLIST_SEGURIDAD_PRIVACIDAD.md): qué se verificó, con qué prueba, y los límites conocidos
declarados (el correo no se verifica al registrarse; una reclutadora a la que se revoca la aprobación conserva la lectura de las
postulaciones de su empresa; la política de contenido conserva `unsafe-inline` en los scripts; avisos de dependencias revisados uno
por uno). La API está documentada en [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md).

## 5. Lo que falta

- El estudio con personas usuarias (piloto del 3 al 6 de noviembre de 2026): ahorro de tiempo y percepción de equidad.
- La validación de la IA con el modelo principal (`gpt-oss-120b`) y con más perfiles y vacantes.
- Una auditoría formal de sesgos.
- Lighthouse y axe-core en la versión 1.1 (las cifras del informe son de la 1.0).
