# Versión 1.0: notas y lista de verificación

**Estado: preparada, sin publicar.** Publicarla significa fusionar a `main` y hacer `git push`, lo que despliega en producción, y
etiquetar `v1.0.0`; esos pasos los decide el equipo (sección 4). Este documento reúne lo que incluye, las pruebas que lo respaldan, cómo se
publica y cómo se revierte. La lista completa de cambios está en [../CHANGELOG.md](../CHANGELOG.md).

## 1. Qué incluye

HireLink 1.0 conecta personas candidatas y empresas con una IA que explica cada recomendación. La IA sugiere y las personas deciden.
Desde la etiqueta `v0.9-rc` (24 de septiembre de 2026) se agregó:

| Área | Qué cambió |
|---|---|
| Rendimiento | pdf.js solo se descarga al subir un CV (la ruta del perfil pasó de 94 kB a 14 kB), el worker sale del propio sitio, Firebase Auth ya no carga el iframe de Google, se quitó Storage y Sentry ya no incluye trazas |
| Dependencias | Next 14.2.35 a 15.5.28, firebase-admin 12 a 14.5, Sentry 11.8, pdf.js 6.4.299; Node 22 |
| Accesibilidad | Contraste en tema claro y oscuro, landmarks, «Saltar al contenido», encabezados, etiquetas, foco devuelto en diálogos y paneles |
| Celular | Menú en panel con barra superior, filas apiladas, landing sin desbordamiento |
| Primer ingreso | Guía de primeros pasos para candidatos y reclutadores |
| Calidad | 40 puntos de mejora de la revisión con datos realistas, 10 hallazgos internos, pruebas unitarias, de navegador y de accesibilidad |
| Entornos | Staging separado (`hirelink-staging`), datos de ejemplo con volumen, scripts que se niegan a escribir en producción |
| IA | Los puntajes sin cambios se reutilizan, el cupo agotado se explica en pantalla y hay un modelo de respaldo |
| Documentación | Arquitectura, guías de desarrollo y de uso, checklist de seguridad y privacidad, backlog, demostración y defensa |

## 2. Pruebas que lo respaldan (17 de octubre de 2026)

| Prueba | Resultado |
|---|---|
| `npx tsc --noEmit --noUnusedLocals` y `npm run build:staging` | Sin errores (Next 15.5.28) |
| `npm run test:unit` | 26/26 |
| `security-tests/sec-test.mjs` (reglas de Firestore) | 61/61 |
| `security-tests/api-test.mjs` (API, límites y carga con 100 usuarios) | 67/67 |
| `security-tests/flow-test.mjs` (flujos con las reglas endurecidas) | 23/23 |
| `qa-tests/accesibilidad.mjs` (teclado, celular y primeros pasos) | 57/57 |
| `qa-tests/cv-pdf.mjs` (pdf.js, con la IA simulada) | 7/7 |
| axe-core WCAG 2.2 AA, 13 pantallas, escritorio y celular, tema claro y oscuro | 0 violaciones |
| Lighthouse en celular, mediana de tres mediciones | 81 y 82 en las cuatro páginas con sesión más importantes (antes 65 a 67); accesibilidad 100 |
| `npm audit` | 84 avisos, 0 críticos y 20 altos (antes 96, 2 y 30) |
| `GET /api/health` en producción (versión anterior) | 200 con `adminInit.ok: true` |

Lo que **no** se probó y hay que decirlo: lectores de pantalla, dispositivos móviles físicos, el inicio de sesión con Google y el envío real de
correos (apagado). Se probó la versión 15 de Next en modo producción local pero **no** en un despliegue de Vercel, porque los despliegues
de prueba todavía no tienen sus variables.

## 3. Requisitos de despliegue

- **Node 22:** `package.json` lo exige (`engines.node`). Hay que confirmar en Vercel (Settings, General, Node.js Version) que el proyecto usa 22.x.
- **Variables de entorno:** no hay nuevas. Siguen siendo las de Firebase (cliente y Admin), `GROQ_API_KEY` y las opcionales (`GROQ_MODEL_ID`,
  Sentry y Resend). `GET /api/health` mostró que la clave de Groq en Vercel tiene un espacio al final; el código la recorta, pero conviene volver a pegarla.
- **Reglas de Firestore:** desde `v0.9-rc` hay tres validaciones nuevas del perfil del candidato (hasta 20 experiencias, hasta 15 estudios y valores
  permitidos de seniority objetivo). Se publican aparte (consola de Firebase o Firebase CLI); un `git push` no las cambia. Solo agregan restricciones de tamaño y de valores.

## 4. Cómo se publica

```bash
npx tsc --noEmit --noUnusedLocals
npm run build:staging
npm run test:unit
```

Después, con la aprobación del equipo:

| Paso | Comando o acción | Criterio |
|---|---|---|
| 1 | Publicar `firestore.rules` y comparar la pestaña *Rules* con el archivo | Idénticas |
| 2 | `git checkout main`, `git merge semana5` | Sin conflictos |
| 3 | `git push origin main` (**despliega en producción**) | Vercel termina sin errores |
| 4 | `GET /api/health` y `?deep=1`; entrar con los tres roles; subir un CV | `adminInit.ok` verdadero y los tres paneles cargan |
| 5 | `git tag -a v1.0.0 -m "HireLink 1.0"` y `git push origin v1.0.0` | La etiqueta existe en GitHub |
| 6 | Crear la versión en GitHub con el texto de este documento | Publicada |

## 5. Cómo se revierte

1. En Vercel, abrir *Deployments*, elegir el despliegue anterior y **Promote to Production** (es inmediato y no toca el código).
2. Si el problema está en las reglas, volver a publicar la versión anterior de `firestore.rules`.
3. Corregir en una rama, repetir las pruebas y volver a publicar.

## 6. Límites conocidos de la versión

Están en [CHECKLIST_SEGURIDAD_PRIVACIDAD.md](CHECKLIST_SEGURIDAD_PRIVACIDAD.md) y [BACKLOG_V2.md](BACKLOG_V2.md). Los principales: los reclutadores ven el perfil y
el texto del CV de todas las personas candidatas, no hay aviso de privacidad permanente ni botón para eliminar la cuenta, no se verifica a las empresas,
no hay política de seguridad de contenido, la clave de la IA se comparte entre entornos y quedan 20 avisos altos de dependencias sin corrección menor.
Los resultados del piloto con personas reales se agregan a este documento cuando existan.
