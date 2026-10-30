# Documentación de la API | HireLink

Referencia de los endpoints del servidor (`src/app/api/**/route.ts`, Route Handlers de Next.js que corren como funciones sin
servidor en Vercel). Esta versión sustituye a la primera (Server Actions de Genkit con Gemini y archivos en Storage), que ya
no existe: hoy la IA usa Groq con Genkit y el PDF del CV nunca se sube.

## 1. Cómo se usa

- Todas las rutas son `POST` con cuerpo JSON, salvo `GET /api/health`. El navegador las llama con
  `callAuthedApi` (`src/lib/api-client.ts`), que agrega la cabecera `Authorization: Bearer <ID token de Firebase>`.
- `requireUser(request, roles?)` (`src/lib/server/guard.ts`) verifica el token, que la cuenta exista y no esté suspendida y
  el rol. Las rutas que actúan en nombre de una empresa usan además `canManageOrg`: la reclutadora debe ser de esa empresa y
  estar **aprobada** por un administrador.
- `enforceRateLimit(db, uid, clave, máximo, ventana)` limita el uso por persona y por acción (ventana de una hora). Al
  superarlo responde `429`.
- Las respuestas de la API llevan `Cache-Control: no-store`. Los errores inesperados se reportan a Sentry; los `401`, `403`
  y `429` no.

| Código | Cuándo |
|---|---|
| 400 | Parámetros inválidos |
| 401 | Sin sesión o token inválido |
| 403 | Rol o empresa sin permiso, cuenta suspendida o reclutadora sin aprobar |
| 404 | La vacante, postulación o entrevista no existe |
| 409 | El estado actual no permite la operación |
| 413 | El texto enviado es demasiado largo |
| 429 | Límite de uso por persona |
| 502 | La IA devolvió una respuesta incompleta después de reintentar |
| 503 | La IA no tiene cupo o está muy ocupada (con un mensaje claro) |

## 2. Endpoints

| Endpoint | Quién | Límite por hora | Cuerpo | Respuesta |
|---|---|---|---|---|
| `POST /api/ai/extract-cv` | Candidata | 10 | `cvText` (30 a 8 000 caracteres) | Perfil: `headline`, `location`, `yearsOfExperience`, `skills[]`, `experience[]`, `education[]`, `summary` |
| `POST /api/ai/generate-description` | Reclutadora o administradora | 20 | `title`, `seniority`, `searchTags[]` | `descriptionMd` |
| `POST /api/recommendations/generate` | Candidata | 10 | (vacío) | `processed`, `cached`, `skipped`, `failed`, `aiLimit`, `results[]` |
| `POST /api/recommendations/generate-for-job` | Reclutadora aprobada de la empresa o administradora | 15 | `jobId` | `processed`, `cached`, `skipped`, `failed`, `aiLimit` |
| `POST /api/matches/respond` | Candidata (solo rechazar) o empresa de la vacante | 120 | `recId`, `action` | `ok`, `status` (`accepted`, `rejected_by_recruiter` o `rejected_by_candidate`) |
| `POST /api/applications/notify-new` | Candidata | 60 | `jobId` | `ok`, `notified` (idempotente: `duplicate`) |
| `POST /api/applications/notify-status` | Reclutadora aprobada de la empresa o administradora | 300 | `jobId`, `candidateUid`, `newStatus`, `interviewAt?`, `interviewType?`, `timeZone?` | `ok` |
| `POST /api/interviews/cancel` | Reclutadora aprobada de la empresa o administradora | 120 | `interviewId`, `timeZone` | `ok` |
| `POST /api/jobs/delete` | Reclutadora aprobada de la empresa o administradora | 30 | `jobId` | `ok` (borra en cascada postulaciones, recomendaciones, entrevistas y notas) |
| `POST /api/admin/users` | Administradora | 120 | `uid`, `action` (`approve_recruiter`, `revoke_recruiter`, `suspend`, `reactivate`, `set_role`, `set_organization`, `delete`), `role?`, `organizationRef?` | `ok` y el nuevo estado; registra la acción en la auditoría desde el servidor |
| `POST /api/account/delete` | Cualquier persona con sesión, sobre su propia cuenta | 5 | `confirm: "ELIMINAR"` | `ok`, `removed` |
| `POST /api/audit` | Reclutadora o administradora | 120 | `action`, `targetType`, `targetId`, `details?` | `ok`; solo acepta eventos de vacantes y empresas, y una reclutadora no puede registrar eventos de otra empresa |
| `GET /api/health` | Pública | sin límite por persona | `?deep=1` prueba también la clave de la IA | Estado de las variables (sí o no, nunca sus valores) e inicialización de Firebase Admin; la lectura de Firestore se guarda 30 s en memoria |

## 3. Cómo se calcula la compatibilidad (`/api/recommendations/*`)

El detalle del procedimiento, con el esquema de entrada y salida, la huella de caché y los experimentos de validación, está en
[ARQUITECTURA.md](ARQUITECTURA.md) y en [evidencias/ia/README.md](evidencias/ia/README.md). En resumen, para cada par
candidata y vacante el modelo recibe el titular, las habilidades con nivel y años, el resumen y un extracto de 1 800
caracteres del CV, y la vacante (título, nivel, etiquetas y descripción recortada a 2 500 caracteres), y devuelve un puntaje de
0 a 1 y hasta 5 razones. Cada llamada evalúa 2 pares a la vez y deja de iniciar evaluaciones nuevas a los 30 s (Vercel corta a
los 60 s).

## 4. Acceso directo a Firestore

El navegador también lee y escribe Firestore sin pasar por estos endpoints, siempre bajo las reglas de [`firestore.rules`](../firestore.rules)
(rol, propiedad, aislamiento entre empresas, cuentas suspendidas y tamaños máximos). Colecciones y permisos: sección 2 de
[CONTEXTO_PROYECTO.md](CONTEXTO_PROYECTO.md) y [CHECKLIST_SEGURIDAD_PRIVACIDAD.md](CHECKLIST_SEGURIDAD_PRIVACIDAD.md).
