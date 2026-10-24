# Contexto del proyecto HireLink

Documento de contexto para quien vaya a trabajar en el proyecto (persona o asistente de IA).
Léelo completo antes de tocar código: resume qué es HireLink, cómo está construido, qué se ha
hecho, qué problemas aparecieron, qué decisiones se tomaron y qué falta. Última actualización:
**18 de octubre de 2026**.

> Si eres un asistente de IA: este archivo es la fuente de contexto. No contiene secretos y no
> debes pedirlos ni inventarlos. Cuando algo no esté aquí, léelo del código o de `docs/` antes de
> afirmarlo. No describas pruebas que no se ejecutaron.

---

## 1. Qué es HireLink

Plataforma web de reclutamiento con **IA explicable**. Conecta candidatos y reclutadores: un
modelo de lenguaje calcula la compatibilidad entre un perfil y una vacante y **explica el porqué**
con razones legibles, en vez de dar un número sin justificación.

Es un proyecto académico (Seminario de Integración: Desarrollo, Centro Universitario UNE) que
también funciona como producto en producción. Título de la tesis: *HireLink, Inteligencia
Artificial para Conectar, Comprender y Vincular Talento con Oportunidades Laborales*.

| Dato | Valor |
|---|---|
| Producción | https://hire-link-dun.vercel.app |
| Repositorio | https://github.com/YirehGJ/HireLink (rama `main`) |
| Equipo | Angel Yireh García Jara, Juan Evelio Culín Grajeda, Luis André Gutiérrez Zúñiga, J. Alfredo Mercado Aguirre |
| Proyectos de Firebase | `hirelink-fd1fe` (producción), `hirelink-staging` (pruebas) |
| Costo | **Cero**. Todo está en planes gratuitos y debe seguir así |
| Plan de cierre | 21 sep a 30 nov 2026, en `docs/CRONOGRAMA_FINAL.md` |

### Roles

- **Candidato:** sube su CV en PDF (el texto se extrae en el navegador y el PDF nunca se sube), la
  IA sugiere titular, ubicación, años de experiencia, habilidades, experiencia y educación; el
  candidato revisa una vista previa y decide aplicar o descartar. Recibe vacantes recomendadas con
  porcentaje y razones, explora y filtra vacantes (texto, seniority, modalidad, fecha), se
  postula y sigue sus postulaciones y entrevistas.
- **Reclutador:** crea y gestiona vacantes (la IA puede redactar la descripción), ve candidatos
  postulados ordenados por compatibilidad, hace shortlist y notas, acepta o rechaza matches,
  agenda entrevistas, cambia el estado de postulaciones y explora toda la base de candidatos
  (habilidad, disponibilidad, seniority objetivo).
- **Administrador:** panel con métricas, gestión de usuarios y organizaciones, cambio de rol,
  suspensión de cuentas, modo "ver como" de solo lectura y registro de auditoría con KPIs.

---

## 2. Arquitectura y stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15.5 (App Router, carpeta `src/`), React 18.3, TypeScript, Tailwind CSS, shadcn/ui; Node 22 |
| Datos y autenticación | Firebase Authentication y Firestore (tiempo real); Firebase Admin en los Route Handlers |
| IA | Genkit con el conector OpenAI-compatible hacia Groq, modelo `openai/gpt-oss-120b` por defecto (`src/ai/model.ts`, `src/ai/genkit.ts`); se puede cambiar con `GROQ_MODEL_ID` |
| Despliegue | Vercel, CI/CD automático desde `main` |
| Errores | Sentry (`@sentry/nextjs`), activo en producción |
| Correo | Resend, **apagado** por defecto (`docs/EMAIL_SETUP.md`) |

Principio: el cliente lee y escribe Firestore directamente, protegido por **reglas**
(`firestore.rules`); la lógica privilegiada y toda la IA viven en **Route Handlers** autenticados
bajo `src/app/api/`.

### Mapa del código

```
src/
  app/                    Rutas (App Router)
    login, register, forgot-password
    dashboard/            Inicio, explore (vacantes), jobs, jobs/new, jobs/[id], candidates,
                          applications, profile, settings, users/[id]
    dashboard/admin/      overview, users, organizations, jobs, audit
    api/                  ai/extract-cv, ai/generate-description, recommendations/generate,
                          recommendations/generate-for-job, matches/respond, jobs/delete,
                          interviews/cancel, applications/notify-new, applications/notify-status,
                          audit, health
    not-found.tsx         404 en español (también en dashboard/not-found.tsx y dashboard/error.tsx)
    global-error.tsx      Pantalla de error + reporte a Sentry
  ai/model.ts             Modelo de Groq (GROQ_MODEL_ID) y etiqueta del motor (ENGINE_VERSION)
  ai/genkit.ts            Cliente Genkit/Groq (la clave se limpia con .trim())
  ai/flows/               extract-cv-data, match-candidate-job, generate-job-description
  firebase/               Config cliente, admin.ts (Admin SDK), servicios de Firestore por entidad
  lib/types.ts            Tipos del dominio
  lib/constants.ts        MATCH_THRESHOLD = 0.4
  lib/format.ts           Textos compartidos: seniority, años, búsqueda sin acentos, etiquetas, URLs http(s)
  lib/markdown.tsx        Markdown seguro (sin HTML en crudo) y vista previa en texto plano
  lib/api-client.ts       callAuthedApi, ApiError y mensaje cuando la IA no tiene cupo
  lib/auth-flags.ts       Cierre de sesión intencional y ruta de regreso tras iniciar sesión
  lib/server/             guard.ts (auth, roles, rate limit, errores), matching.ts, ai-runner.ts,
                          concurrency.ts, notify.ts, datetime.ts (zona horaria), email/
  components/user-avatar.tsx   Avatar con iniciales (sin servicios externos)
  instrumentation.ts      Inicialización de Sentry en el servidor (debe estar en src/)
firestore.rules           Reglas de seguridad
scripts/                  seed.mjs, seed-data.mjs, seed-data-volumen.mjs, dev-staging.mjs,
                          limpiar-huerfanos.mjs (simulación por defecto; respaldo antes de borrar)
security-tests/           sec-test, api-test, flow-test (con --env; se niegan a correr contra producción)
qa-tests/                 unitarias (sin red ni tokens), funcionales con navegador y sondas de defectos
docs/                     Guías y decisiones (ver sección 9)
```

### Modelo de datos (Firestore)

| Colección | Contenido |
|---|---|
| `users/{uid}` | Cuenta: `email`, `fullName`, `role` (admin, recruiter, candidate), `status` (active, suspended), `organizationRef` |
| `users/{uid}/notifications`, `users/{uid}/applications/{jobId}` | Avisos del usuario y espejo de sus postulaciones |
| `candidates/{uid}` | Perfil: `headline`, `location`, `yearsOfExperience`, `available`, `targetSeniority`, `skills`, `cvSummary`, `cvText`, `experience`, `education` |
| `organizations/{orgId}` | Empresa: nombre, descripción, sitio, logo |
| `jobs/{jobId}` | Vacante: `title`, `descriptionMd`, `location`, `remoteAllowed`, `contractType`, `seniority`, `status` (draft, published, closed), `searchTags`, `createdAt` |
| `jobs/{jobId}/applications/{candidateUid}` | Postulación; el id del documento es el uid del candidato. Estados: applied, screening, assessment, interview, offer, hired, rejected, withdrawn |
| `recommendations/{uid}_{jobId}` | Match: `score` (0 a 1), `reasons`, `status` (pending, accepted, rejected_by_recruiter, rejected_by_candidate), `engineVersion` |
| `interviews/{id}` | Entrevistas (phone, video, onsite) |
| `auditLogs/{id}` | Acciones relevantes del sistema |
| `rateLimits/{uid}_{accion}` | Contadores de uso, cerrados a los clientes |

`targetSeniority` admite `'' | intern | junior | mid | senior | lead` y está validado en las reglas.

---

## 3. Cómo funciona la IA

1. **Análisis de CV** (`/api/ai/extract-cv`, candidato): recibe el texto del CV, devuelve el
   perfil estructurado. Solo el candidato lo usa.
2. **Compatibilidad** (`src/lib/server/matching.ts`): cada par candidato y vacante produce un
   puntaje de 0 a 1 y hasta 5 razones. La primera vez se guarda con `status: pending` y, si el
   puntaje supera `MATCH_THRESHOLD` (0.4), se avisa al candidato y a los reclutadores de la
   organización. Al recalcular no se pisa un estado ya decidido.
   - **Huella (`inputHash`)**: cada recomendación guarda un hash de lo que vio el modelo (perfil,
     CV, vacante y `ENGINE_VERSION`). Si no cambió, `generate` y `generate-for-job` reutilizan el
     puntaje sin llamar a la IA (y sin gastar tokens ni tiempo); solo se evalúan los pares nuevos o
     los que cambiaron. Las recomendaciones anteriores a la huella se recalculan una vez.
   - **Prioridad (`overlapScore`)**: como cada llamada alcanza a evaluar pocos pares, se evalúa
     primero lo que no tiene puntaje y, dentro de eso, lo que más habilidades de la vacante tiene
     en común con el perfil.
   - Si la vacante se elimina mientras la IA trabaja, no se guarda la recomendación.
3. **Descripción de vacante** (`/api/ai/generate-description`, reclutador).

### Límites reales de la IA gratuita (importante)

- Groq gratis, modelo `openai/gpt-oss-120b`: **8 000 tokens por minuto** y **200 000 tokens por
  día** (el proveedor lo informa en sus errores 429). Cada modelo tiene su propio cupo.
- **La clave de Groq es la misma en staging y en producción**: comparten el cupo. Las pruebas
  largas con IA agotaron el cupo diario el 15 de octubre; se recupera de forma continua (ventana
  de 24 horas).
- Consumo medido (modelo de respaldo, mismo texto que la aplicación): un par candidato y vacante
  cerca de 1 800 tokens, un análisis de CV cerca de 2 450 y una descripción de vacante cerca de
  1 200; la mayor parte es razonamiento interno del modelo. Sin la huella, unos 12 guardados de
  perfil bastaban para agotar el día.
- Cuando el cupo diario se agota, `runAi` responde de inmediato con un 503 y el mensaje «La IA
  alcanzó su límite de uso gratuito por hoy» (sin reintentos y sin reportarlo a Sentry), y las
  pantallas lo muestran. Plan B: definir `GROQ_MODEL_ID=openai/gpt-oss-20b` (tiene su propio
  cupo) y volver a desplegar. Las pruebas largas en staging se corren con ese modelo.
- Vercel corta las funciones a **60 s**.
- Por eso los endpoints de recomendaciones (`generate`, `generate-for-job`): evalúan **2 en
  paralelo** (`mapWithConcurrency`), priorizan lo **sin puntaje**, dejan de iniciar evaluaciones
  nuevas a los **30 s** (`TIME_BUDGET_MS`), responden antes de los **52 s** (`HARD_LIMIT_MS`, con
  `Promise.race`), recortan el CV a 1 800 caracteres y el cliente OpenAI usa `maxRetries: 1` y
  `timeout: 25 000`.
- Cada llamada evalúa de 5 a 9 pares; lo que no alcance se completa en la siguiente. La solución
  de fondo sería un plan de pago de Groq.
- Una clave con salto de línea o espacio produce "Connection error"; el código hace `.trim()`.

---

## 4. Seguridad

- **Reglas de Firestore:** validación de rol, propiedad, aislamiento entre empresas, cuentas
  suspendidas sin escritura y límites de tamaño por documento.
- **Endpoints:** `requireUser(request, roles?)` verifica el ID token, que la cuenta exista y no
  esté suspendida, y el rol. `enforceRateLimit(db, uid, clave, max, ventanaSeg)` limita el uso y
  responde 429. `errorResponse()` convierte errores en respuestas y **solo reporta a Sentry los
  inesperados** (los 401, 403 y 429 no), esperando el envío con `Sentry.flush(2000)`.
- **Cabeceras HTTP de seguridad** en `next.config.mjs`. pdf.js 6.4.299 (la vulnerabilidad CVE-2024-4367 se
  corrigió desde la 4.2.67), cargado solo al subir un CV y con su worker servido desde `public/`.
- **Baterías automatizadas** (`security-tests/`, cuentas desechables): se ejecutan contra staging
  con `--env .env.staging` y se niegan a correr contra producción. Última ejecución, el 17 de
  octubre de 2026 con Next 15.5.28 y firebase-admin 14.5.0: reglas 61/61, API y carga 67/67, flujos 23/23.
- **Dependencias:** `npm audit` pasó de 96 avisos (2 críticos, 30 altos) a 84 (0 críticos, 20 altos); lo que queda y por qué
  está en `docs/CHECKLIST_SEGURIDAD_PRIVACIDAD.md`. El cliente `firebase` sigue en 10.14.1: la 13.0.0 compila y pasa las
  pruebas unitarias, pero suma unos 68 kB de JavaScript por ruta y solo quita un aviso alto, así que se descartó.
- Se corrigieron 12 vulnerabilidades en la ronda inicial (lista en `security-tests/README.md`).

---

## 5. Entornos

| Entorno | Dónde | Proyecto Firebase | Variables |
|---|---|---|---|
| Desarrollo | `npm run dev:staging` en `localhost:3100` | `hirelink-staging` | `.env.staging` (local, ignorado por Git) |
| Staging | Despliegues Preview de Vercel | `hirelink-staging` | Variables de Vercel con ámbito **Preview** (cargadas el 19 de octubre; el dominio de la rama está autorizado en Authentication) |
| Producción | Vercel, rama `main` | `hirelink-fd1fe` | Variables de Vercel con ámbito **Production** |

Variables (solo nombres; los valores no se comparten): `NEXT_PUBLIC_FB_API_KEY`,
`NEXT_PUBLIC_FB_AUTH_DOMAIN`, `NEXT_PUBLIC_FB_PROJECT_ID`, `NEXT_PUBLIC_FB_STORAGE_BUCKET`,
`NEXT_PUBLIC_FB_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FB_APP_ID`, `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `GROQ_API_KEY`; opcionales `GROQ_MODEL_ID`,
`RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`.
Plantilla en `.env.example`.

Reglas de oro: las claves de Firebase de producción no se copian a staging (la clave de Groq sí
es la misma y comparte el cupo de IA); los cambios de `firestore.rules` se publican primero en
staging; `.env*` y `service-account*.json` nunca entran a Git; `/api/health` (y `?deep=1` para
probar Groq) diagnostica un despliegue sin exponer valores.

Para probar la compilación de producción contra staging: `npm run build:staging` y
`npm run start:staging` (puerto 3100; con `TZ=UTC` se reproduce Vercel). Para no gastar el cupo
de IA de producción, define antes `GROQ_MODEL_ID=openai/gpt-oss-20b`.

### Datos de ejemplo (`scripts/seed.mjs`)

```bash
node scripts/seed.mjs --env .env.staging                    # simulación, no escribe
node scripts/seed.mjs --env .env.staging --apply            # carga
node scripts/seed.mjs --env .env.staging --reset --apply    # borra solo lo sembrado
```

Crea 10 empresas, 31 cuentas (1 admin, 10 reclutadores, 20 candidatos), 22 vacantes (18
publicadas, 2 borradores y 2 cerradas), 34 postulaciones en los 8 estados, 36 recomendaciones,
13 entrevistas, 18 avisos y 14 registros de auditoría (210 documentos). Los datos base están en
`seed-data.mjs` y los de volumen en `seed-data-volumen.mjs`. Protecciones: simula por defecto, se
niega a correr contra `hirelink-fd1fe` salvo `--allow-production` (código 2), valida contra las
reglas (código 3), marca todo con `seed: true`, no modifica cuentas existentes y es repetible sin
duplicar. Las cuentas son `@example.com` y están en `docs/CUENTAS_DEMO.md`. Existen en staging;
el script no se ha aplicado a producción.

Las pruebas funcionales de `qa-tests/` añaden en staging 15 cuentas más (correos
`@example.com` de personas ficticias), con sus empresas, vacantes, perfiles con CV,
postulaciones y entrevistas; `funcional-1.mjs` las elimina y las vuelve a crear en cada corrida.

---

## 6. Qué se hizo, en orden

| Semana | Estado | Resumen |
|---|---|---|
| Anteriores (S1 a S24) | Hecho | Funcionalidad base de los tres roles, IA, reglas endurecidas, pruebas de seguridad, CV con vista previa, entrevistas, notificaciones, auditoría |
| 1 (21 al 27 sep) | Cumplida el 7 oct | Producción estabilizada: variables corregidas, clave de IA saneada, recomendaciones ajustadas a los límites, `/api/health` |
| 2 (28 sep al 4 oct) | Cumplida | Decisión sobre Storage de CV, vista previa de experiencia y educación, plantilla de correo |
| 3 (5 al 11 oct) | Cumplida | Sentry en cliente y API, filtro por fecha, seniority objetivo del candidato y su filtro, decisión de búsqueda |
| 4 (12 al 18 oct) | Cumplida (el Preview de Vercel quedó listo el 19 oct) | Script `seed` con volumen, proyecto de staging con reglas y datos, `dev:staging`, cuentas demo documentadas |
| 4, extra | Hecho (15 oct) | Revisión funcional de extremo a extremo con datos realistas: 40 puntos de mejora corregidos, pruebas nuevas (`qa-tests/`) y un informe extra en la carpeta de entregas (ver sección 7) |
| 5 (19 al 25 oct) | Hecha el 17 oct | pdf.js solo al subir un CV (perfil de 94 a 14 kB), Next 15.5.28, firebase-admin 14.5, avisos de dependencias 96 a 84, Lighthouse en celular de 65-67 a 81-82; imports sin uso a cero |
| 6 (26 oct al 1 nov) | Hecha el 17 oct | Accesibilidad (axe-core sin violaciones en dos temas), menú del celular, guía de primeros pasos, foco devuelto en diálogos; `qa-tests/accesibilidad.mjs` (57 comprobaciones) y `qa-tests/medicion/` |
| 7 (2 al 8 nov) | Preparada | Piloto: materiales en `docs/piloto/` (plan, guion, formulario SUS, aviso, bitácora); **las sesiones con personas se hacen del 3 al 6 de noviembre y sus resultados no existen todavía** |
| 8 (9 al 15 nov) | Preparada | Proceso de corrección (`docs/piloto/TRIAGE_Y_CORRECCION.md`) y línea base de las baterías; sin hallazgos del piloto aún |
| 9 (16 al 22 nov) | Hecha menos el video | `ARQUITECTURA.md`, `GUIA_DEVS.md`, `GUIA_USO.md`, `CHECKLIST_SEGURIDAD_PRIVACIDAD.md`, `BACKLOG_V2.md`, `GUION_DEMO_FINAL.md`; falta el video de la demostración |
| 10 (23 al 29 nov) | Parcial | Versión 1.0.0 **publicada el 19 de octubre** (commit `302e211`, etiqueta `v1.0.0`; `CHANGELOG.md`, `docs/RELEASE_v1.0.md`) y guía de defensa (`docs/DEFENSA.md`); faltan publicar las reglas, la página de *Releases*, los ensayos y los resultados del piloto; 30 nov de margen |

---

## 7. Problemas encontrados y cómo se resolvieron

| Problema | Causa | Solución |
|---|---|---|
| Fallaban análisis de CV, notificaciones y matches en producción | Faltaba `FIREBASE_PROJECT_ID` en Vercel | Se agregó la variable |
| Firebase del cliente incompleto | Variable `NEXT_PUBLIC_FB_APP_I` en lugar de `..._APP_ID` | Se creó la correcta y se eliminó la errónea |
| "Connection error" con la IA | Clave de Groq con salto de línea | Se repegó la clave y el código aplica `.trim()` |
| 504 al calcular recomendaciones | 8 000 tokens por minuto y 60 s de Vercel | Concurrencia 2, presupuesto de 30 s, límite duro de 52 s, extracto de CV corto |
| Sentry no recibía eventos del servidor | `instrumentation.ts` en la raíz; Next.js solo lo carga desde `src/` | Se movió a `src/instrumentation.ts` y se hace `flush` antes de responder |
| La cuenta de servicio de staging no estaba ignorada | Patrón de `.gitignore` insuficiente | Se agregaron `service-account*.json` y `*firebase-adminsdk*.json`; nunca estuvo en el historial |
| «Guardar Perfil» no hacía nada tras analizar un CV (7 de 10 CV de prueba) | El modelo devuelve años con decimales (4.8) y el campo numérico del navegador bloquea el envío sin avisar | `sanitizeCvData` en `/api/ai/extract-cv` (enteros, rangos y longitudes) y formulario con mensajes |
| El calendario de entrevistas del reclutador salía vacío | La consulta no fijaba `organizationRef`, así que las reglas la rechazaban; la pantalla ocultaba el error | Consulta con `jobRef` y `organizationRef`, mensaje de error y controles en `security-tests/` |
| Al eliminar una vacante quedaban postulaciones, recomendaciones y entrevistas | Firestore no borra subcolecciones en cascada | `POST /api/jobs/delete` (Admin SDK) y `scripts/limpiar-huerfanos.mjs` para lo ya huérfano |
| Los avisos de entrevista mostraban la hora en UTC | Vercel corre en UTC y se formateaba sin zona horaria | El navegador envía su zona; `src/lib/server/datetime.ts` la valida (por defecto Ciudad de México) |
| Páginas del dashboard con carga infinita sin sesión y pantallas de otro rol visibles | `account-guard.tsx` dejaba pasar mientras no conocía el rol y no redirigía | Redirección a `/login?next=`, espera del rol y rutas por rol |
| «Recuperar contraseña» no enviaba nada | El formulario simulaba el envío | `sendPasswordResetEmail` real, en español y con mensaje neutro |
| La IA dejó de responder («tokens per day») | 200 000 tokens al día para toda la cuenta; staging y producción comparten clave y cada guardado de perfil reevaluaba todo | Huella `inputHash` (se reutilizan los puntajes), 503 claro sin reintentos ni Sentry y `GROQ_MODEL_ID` como plan B |

El detalle completo (40 hallazgos, pruebas antes y después, riesgos que requieren decisión del
equipo) está en el «Informe extra: hallazgos no contemplados y pruebas», en la carpeta de entregas
del proyecto (fuera del repositorio).

---

## 8. Decisiones vigentes

- **Búsqueda en el cliente**, no en Algolia: volumen de piloto y costo cero. Migración descrita en
  `docs/DECISION_SEARCH.md`.
- **No se sube el PDF del CV**; se extrae el texto en el navegador (`docs/DECISION_STORAGE_CV.md`).
- **Costo cero**: cualquier cambio que implique pago se evita o se documenta como riesgo.
- **Sentry** reporta solo errores inesperados y queda inactivo sin variables.
- **Un solo proyecto de staging** para desarrollo y pruebas.
- **Las pruebas con navegador y con IA corren solo contra staging** y con el modelo de respaldo
  (`GROQ_MODEL_ID=openai/gpt-oss-20b`) para no agotar el cupo de IA que comparte producción.
- **Borrados en cascada en el servidor** (Admin SDK): vacantes (`/api/jobs/delete`); cancelar una
  entrevista avisa al candidato (`/api/interviews/cancel`).
- **Identificadores deterministas** (`recommendations/{uid}_{jobId}`, postulación con el uid del
  candidato) para evitar duplicados.
- **No se agregan funciones nuevas** durante el cierre: se cierra lo prometido, se estabiliza y se
  documenta.

---

## 9. Dónde mirar

| Tema | Archivo |
|---|---|
| Plan de cierre y estado por semana | `docs/CRONOGRAMA_FINAL.md` |
| Entornos y creación de staging | `docs/ENTORNOS.md` |
| Cuentas y recorrido de demo | `docs/CUENTAS_DEMO.md`, `docs/GUION_DEMO_SEMANA_2.md` |
| Sentry, correo | `docs/SENTRY_SETUP.md`, `docs/EMAIL_SETUP.md` |
| Decisiones | `docs/DECISION_SEARCH.md`, `docs/DECISION_STORAGE_CV.md` |
| Diagramas de la tesis | `docs/DIAGRAMAS_MERMAID.md` |
| Pruebas de seguridad | `security-tests/README.md` |
| Pruebas unitarias, funcionales con navegador, accesibilidad, sondas y mediciones (Lighthouse, axe-core) | `qa-tests/README.md` |
| Arquitectura, guía para desarrolladores y guía de uso | `docs/ARQUITECTURA.md`, `docs/GUIA_DEVS.md`, `docs/GUIA_USO.md` |
| Seguridad y privacidad final, backlog de la versión 2 | `docs/CHECKLIST_SEGURIDAD_PRIVACIDAD.md`, `docs/BACKLOG_V2.md` |
| Piloto con personas reales | `docs/piloto/README.md` |
| Demostración final, defensa y versión 1.0 | `docs/GUION_DEMO_FINAL.md`, `docs/DEFENSA.md`, `docs/RELEASE_v1.0.md`, `CHANGELOG.md` |
| Cupo de la IA y modelo de respaldo | `docs/ENTORNOS.md` (sección «Cupo de la IA») |

Aviso: `docs/API_DOCUMENTATION.md` está **desactualizado** (menciona Gemini y Server Actions);
la realidad son Route Handlers autenticados y Groq. No lo uses como fuente sin contrastarlo con
`src/app/api/`.

---

## 10. Pendientes

| Pendiente | Detalle | Prioridad |
|---|---|---|
| Publicar `firestore.rules` en producción | La validación de `targetSeniority` está en el repo y en staging, no en `hirelink-fd1fe` | Alta |
| Limpiar datos huérfanos de producción | `scripts/limpiar-huerfanos.mjs` (simulación primero; con `--apply` hace respaldo). La revisión de solo lectura encontró 13 postulaciones de vacantes eliminadas y 1 sin copia. Requiere autorización del equipo | Alta |
| Decisiones de producto y privacidad | R1 a R5 y R8 del informe extra: visibilidad de los perfiles para cualquier reclutador, aviso de privacidad y eliminar cuenta, rol al registrarse con Google, retirar postulación, salario y contrato, clave de Groq separada para staging | Alta |
| Repetir las fases con IA con el modelo de producción | La regresión final usó `gpt-oss-20b` porque el cupo de `gpt-oss-120b` se agotó; repetir F3, F4, F8, F9 y F9b cuando se libere | Media |
| Terminar la publicación de la 1.0 | El código está en producción y etiquetado (19 oct). Falta publicar `firestore.rules` y crear la versión en la página de *Releases* de GitHub (`docs/RELEASE_v1.0.md`, sección 4) | Alta |
| Piloto | Realizar las sesiones, llenar la bitácora y el formulario, y completar los marcadores **[completar]** de `docs/DEFENSA.md` | Alta |
| Lector de pantalla y celulares reales | No se han probado; las pruebas de accesibilidad son automáticas y con el celular emulado a 375 px | Media |
| Video de la demostración | Grabarlo con la versión 1.0 desplegada | Media |
| Tesis | Actualizar tabla de entornos (7.7.1) y plan (8.3) con staging creado y Semana 4 cumplida | Media |
| Sentry | Probar error del navegador, alertas por correo, mapas de código | Baja |
| Resend | Configurar la clave para activar correos | Baja |
| Emulator Suite | Probar reglas con emuladores locales | Baja |

---

## 11. Convenciones al trabajar

- Documentos de tesis y entregas: sin guiones largos, cada figura y tabla citada en el texto, y
  nada de pruebas inventadas; lo no medido se declara como pendiente.
- Antes de afirmar que algo funciona en producción, consultar `/api/health` y probar el flujo en
  la aplicación publicada.
- Cambios que toquen reglas, endpoints o la IA: repetir las baterías de `security-tests/`, correr
  `npm run test:unit` y volver a medir tiempos de las recomendaciones.
- Antes de ejecutar pruebas que llamen a la IA, revisa el cupo (ver `docs/ENTORNOS.md`) y usa el
  modelo de respaldo; una corrida completa gasta buena parte de los 200 000 tokens diarios.
- Mensajes de commit y código siguen el estilo del repositorio; no subir `.env*` ni cuentas de
  servicio.
