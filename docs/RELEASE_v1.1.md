# Versión 1.1: notas y orden de publicación

**Estado: preparada en la rama `release/1.1.0`, sin publicar.** Reúne el arreglo del JSON incompleto de la IA y las
correcciones de la revisión por áreas del 24 de octubre de 2026. La lista completa de cambios está en
[../CHANGELOG.md](../CHANGELOG.md). Antes de empezar, la versión 1.0.0 sigue siendo la que corre en producción.

## 1. Qué cambia para las personas

| Quién | Qué cambia |
|---|---|
| Reclutadora | Una cuenta nueva ve el aviso «Tu cuenta espera aprobación»: puede completar su empresa, pero no publica ni ve candidatas hasta que un administrador la apruebe. Las notas y la shortlist se guardan aparte. Ya no puede marcar «Retirado»; rechazar pide confirmación; el calendario abre en la próxima entrevista |
| Candidata | Sus notas privadas ya no las puede leer. «Eliminar mi cuenta» en Configuración. Si la IA no pudo calcular sus recomendaciones se le explica |
| Administradora | Gestión Usuarios: aprobar o revocar reclutadoras (con filtro de pendientes), suspender de verdad, cambiar rol u organización, eliminar cuentas con sus datos |
| Todas | El correo con un espacio al final se acepta; el botón «Google» queda apagado; si la IA agota el cupo del modelo principal pasa sola al de respaldo |

## 2. Pruebas que la respaldan (26 y 27 de octubre de 2026, contra `hirelink-staging`)

| Prueba | Resultado |
|---|---|
| `npx tsc --noEmit` y `npm run build:staging` | Sin errores (advertencia conocida de `@opentelemetry/exporter-jaeger`) |
| `npm run test:unit` | 46/46 |
| `security-tests/sec-test.mjs` (reglas de Firestore) | 110/110 |
| `security-tests/api-test.mjs` (API, cabeceras, límites y carga con 100 usuarios, servidor compilado local) | 96/96 |
| `security-tests/flow-test.mjs` (flujos con las reglas nuevas) | 29/29 |
| `qa-tests/funcional-1.mjs` (registro, empresas, vacantes, perfiles con CV) | 72/72 en la corrida con IA real; 70/71 en la repetición, donde el único fallo fue el análisis de un CV por cupo agotado |
| `qa-tests/funcional-2.mjs` (postulaciones, estados, entrevistas, matches, filtros, avisos, administración, cuenta) | 131/131 en F6 a F8b y F10 a F13 sobre la compilación final, y F5 (postulaciones) también en verde; F9 y F9b (IA real) pasaron en la corrida anterior, salvo una recomendación guardada sin razones, que se corrigió |
| `qa-tests/defectos.mjs` | 23 sondas, 0 defectos |
| `qa-tests/accesibilidad.mjs` y `qa-tests/cv-pdf.mjs` | 58/58 y 8/8 |
| Servidor de desarrollo con la política de contenido | Carga y se hidrata sin violaciones |

Qué quedó sin repetir con la compilación final: las fases con IA real (F3, F4 y F9), porque el cupo diario del modelo de
respaldo (200 000 tokens) se agotó con las corridas. La clasificación de errores, el modelo de respaldo y la limpieza de las
razones están cubiertos por pruebas unitarias con un modelo simulado. No se probó en producción, con personas reales ni en
celulares físicos.

**Aviso para el piloto y la defensa:** la clave de Groq es la misma en staging y en producción, así que correr pruebas con
IA gasta el cupo del modelo de respaldo de producción. No se deben correr esos días (backlog, punto 7).

## 3. Orden de publicación (importa)

Las reglas nuevas son más estrictas que el código de la 1.0. Si se publican **antes** que el código, la aplicación vieja
dejaría a las reclutadoras sin acceso y no habría pantalla para aprobarlas. Por eso el orden es este:

| # | Paso | Quién | Cómo |
|---|---|---|---|
| 0 | Respaldo de los datos de producción (solo lectura) | Usted | `node scripts/respaldar-datos.mjs --env .env.local` |
| 1 | Unir `release/1.1.0` a `main` y subir; Vercel despliega | Claude, con su «sí» | `git switch main`, `git merge release/1.1.0`, `git push` |
| 2 | Comprobar que la aplicación responde | Usted o Claude | `https://hire-link-dun.vercel.app/api/health` debe mostrar `"adminInit":{"ok":true}` |
| 3 | Publicar las reglas nuevas | Usted | `node scripts/publicar-reglas.mjs --env .env.local --apply --allow-production` (o pegarlas en la pestaña Rules de la consola) |
| 4 | Aprobar a las reclutadoras que ya existen (si no, no verían candidatas) | Usted | desde Gestión Usuarios, o `node scripts/aprobar-reclutadoras.mjs --env .env.local --all --apply --allow-production` |
| 5 | Mover las notas y la shortlist al lugar nuevo | Usted | `node scripts/migrar-notas.mjs --env .env.local --apply --allow-production` (antes, sin `--apply`, para ver cuántas son) |
| 6 | Comprobar | Usted | Entrar como administradora, como reclutadora aprobada y como candidata; `node scripts/publicar-reglas.mjs --env .env.local` debe decir que las reglas son iguales. Con la consola del navegador abierta (F12, pestaña *Console*), recorrer inicio de sesión, panel y perfil: no debe aparecer ningún mensaje que diga «Content Security Policy» |

Entre el paso 1 y el 3 pasan unos minutos: durante ese rato una reclutadora que guarde una nota verá un error y la
shortlist no se guardará. Conviene hacerlo cuando no haya sesiones del piloto.

Variables nuevas en Vercel, todas opcionales: `GROQ_FALLBACK_MODEL_ID` (por defecto `openai/gpt-oss-20b`),
`NEXT_PUBLIC_GOOGLE_LOGIN` (déjela vacía para mantener apagado el botón de Google) y `CSP_REPORT_ONLY` (déjela vacía; ver
la sección 4).

## 4. Cómo se revierte

1. En Vercel, **Deployments** y «Instant Rollback» al despliegue de la 1.0.0 (commit `302e211`).
2. Reglas: `git show v1.0.0:firestore.rules > firestore.rules.anterior` y publicarlas con
   `node scripts/publicar-reglas.mjs --env .env.local --file firestore.rules.anterior --apply --allow-production`.
3. Los datos no hay que deshacerlos: `recruiterApproved` es un campo que la 1.0 ignora, y las notas en `applicantNotes`
   son un documento aparte que la 1.0 no lee (si se vuelve a la 1.0, las notas nuevas dejan de verse hasta volver a la 1.1).

Si lo único que falla es la **política de contenido** (la consola del navegador muestra «Refused to … Content Security
Policy» y algo no carga), no hace falta volver a la 1.0: en Vercel, *Settings*, *Environment Variables*, cree
`CSP_REPORT_ONLY` con el valor `true` y vuelva a desplegar. La política pasa a solo avisar y deja de bloquear. Después se
agrega el origen que falta en `next.config.mjs` y se quita la variable.

## 5. Límites conocidos

- La candidata todavía no decide quién ve su perfil, y la aprobación de una reclutadora no comprueba que la empresa exista
  (backlog 3 y 4).
- No hay un tope diario global de la IA, solo el modelo de respaldo; si se agotan los dos, la IA no responde hasta que se
  libere el cupo (backlog 25).
- Los eventos de vacantes y empresas en la auditoría los dispara el navegador y pueden omitirse (backlog 27).
- El Manual de usuario (Word y PDF) todavía no menciona el paso de aprobación de la reclutadora ni «Eliminar mi cuenta».
