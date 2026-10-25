# Checklist final de seguridad y privacidad

Revisión de cierre de la versión 1.0, hecha el 17 de octubre de 2026 sobre el código de la rama `semana5` (Next.js 15.5.28,
firebase-admin 14.5.0). Cada punto dice qué se verificó, con qué prueba o archivo, y si está hecho (✅), parcial (🟡) o
pendiente (❌). Lo pendiente no se oculta: pasa a [BACKLOG_V2.md](BACKLOG_V2.md) o queda como riesgo aceptado con su motivo.

## 1. Resultados de las pruebas (repetidas después de actualizar las dependencias)

| Batería | Qué prueba | Resultado |
|---|---|---|
| `security-tests/sec-test.mjs` | Reglas de Firestore: escalada de privilegios, aislamiento entre empresas, cuentas suspendidas, integridad y tamaños | **61/61** |
| `security-tests/api-test.mjs` | Endpoints `/api/*` (sesión, roles, empresa ajena, entrada inválida, límites de uso, cabeceras) y carga de 100 usuarios | **67/67** |
| `security-tests/flow-test.mjs` | Los flujos normales siguen funcionando con las reglas endurecidas | **23/23** |
| `npm run test:unit` | Motor de recomendaciones, política de reintentos de la IA, formato y versión del worker de pdf.js | **26/26** |
| `qa-tests/accesibilidad.mjs` | Teclado, menú del celular, foco en diálogos, HTML estático y guía de primeros pasos con navegador real | **57/57** |
| axe-core (WCAG 2.2 AA) | 13 pantallas en escritorio y celular, tema claro y oscuro | **0 violaciones** |

Las tres baterías de seguridad se ejecutaron contra `hirelink-staging` y se niegan a correr contra producción.

## 2. Seguridad

### 2.1 Acceso y autorización

| Control | Estado | Evidencia |
|---|---|---|
| Reglas de Firestore con rol, propiedad y aislamiento entre empresas | ✅ | `firestore.rules`, `sec-test.mjs` (61 pruebas de ataque y permiso) |
| Nadie puede darse el rol de administrador al registrarse | ✅ | Regla de `users/create`; pruebas S01 y S04 |
| Una cuenta suspendida no puede escribir ni reactivarse sola | ✅ | `isActive()` en las reglas; pruebas S06b, S07, S08 y S33b. Excepción: una cuenta de administrador sí puede actualizar su propio estado (backlog punto 23) |
| Una cuenta suspendida, o con el rol cambiado, no puede leer datos | ❌ | Las reglas de lectura no usan `isActive()` y `isRecruiterForOrg` no mira el rol: suspender o degradar a una reclutadora no corta lo que ya podía leer; la pantalla sí muestra «Tu cuenta está suspendida» (backlog punto 23) |
| El reclutador solo ve y gestiona su empresa | ✅ | `isRecruiterForOrg`, pruebas de empresa ajena |
| Los candidatos no leen borradores de vacantes | ✅ | Regla de `jobs`; pruebas S25 y S26 |
| Tamaños máximos de perfiles, vacantes y empresas | ✅ | `validCandidate`, `validJob`, `validOrg`; pruebas S38 y S39 (documentos de 500 KB) |
| Recomendaciones, avisos, auditoría y límites de uso solo los escribe el servidor | ✅ | Reglas en `false` para clientes |
| Páginas protegidas por rol en el cliente | ✅ | `account-guard.tsx`; la pantalla no se dibuja hasta conocer el rol |
| Las reglas publicadas son las del repositorio | 🟡 | Se comparan a mano con la pestaña *Rules* de la consola de Firebase; hay que repetirlo antes de la defensa |

### 2.2 Endpoints

| Control | Estado | Evidencia |
|---|---|---|
| Todos los `/api/*` exigen sesión, cuenta activa y el rol correcto | ✅ | `requireUser` en `src/lib/server/guard.ts`, `api-test.mjs` |
| Límite de uso por persona y por acción | ✅ | `enforceRateLimit`; ráfaga de 100 llamadas: 15 atendidas, 85 con 429, 0 errores 5xx |
| Las funciones de IA no son Server Actions públicas | ✅ | Prueba A27 |
| Las respuestas de la API no se guardan en caché | ✅ | Cabecera `Cache-Control: no-store` (prueba H05) |
| La clave de IA nunca llega al navegador | ✅ | Los flujos de Genkit solo se llaman desde el servidor |
| El detalle de `/api/health` es público | 🟡 | Muestra si cada variable existe (nunca su valor), la forma de las claves (si la privada empieza y termina como corresponde; si la de Groq empieza con `gsk_` o trae espacios) y el motivo del error si Firebase Admin falla. Cada visita hace una lectura en Firestore y no tiene límite. Protegerlo está en el backlog (punto 6) |

### 2.3 Navegador y cabeceras

| Control | Estado | Evidencia |
|---|---|---|
| HSTS, `X-Frame-Options: DENY`, `nosniff`, política de referencia y de permisos | ✅ | `next.config.mjs`; pruebas H01 a H04 (la política de referencia y la de permisos se configuran en el mismo archivo, sin prueba propia) |
| No se anuncia el servidor (`X-Powered-By`) | ✅ | `poweredByHeader: false` |
| Content-Security-Policy | ❌ | Backlog (punto 6): se activará primero en modo solo reporte |
| Sin `dangerouslySetInnerHTML` con contenido de personas | ✅ | Solo se usa en `ui/chart.tsx` con CSS fijo; las descripciones se dibujan con un Markdown propio (`src/lib/markdown.tsx`) |
| Solo enlaces `http` o `https` en datos escritos por personas | ✅ | `isHttpUrl` en `src/lib/format.ts` |
| Redirección tras iniciar sesión limitada a rutas propias | ✅ | `safeNextPath` en `src/lib/auth-flags.ts` |
| pdf.js sin ejecución de código de PDFs maliciosos (CVE-2024-4367) | ✅ | pdf.js 6.4.299; el worker sale del propio sitio y su versión se comprueba con una prueba unitaria |

### 2.4 Secretos y entornos

| Control | Estado | Evidencia |
|---|---|---|
| `.env*` y cuentas de servicio fuera de Git | ✅ | `.gitignore` (`.env*`, `service-account*.json`) |
| Producción y staging son proyectos distintos | ✅ | `hirelink-fd1fe` y `hirelink-staging`, [ENTORNOS.md](ENTORNOS.md) |
| Las pruebas y los scripts se niegan a escribir en producción | ✅ | `--allow-production` obligatorio; `qa-tests/lib.mjs` aborta |
| Clave de Groq distinta para staging y producción | ❌ | Hoy es la misma y comparten el cupo diario (backlog punto 7) |
| Variables Preview en Vercel | ✅ | Hecho el 19 de octubre de 2026: nueve variables de staging solo con ámbito Preview ([ENTORNOS.md](ENTORNOS.md)) |

### 2.5 Dependencias

| | Antes (16 oct) | Después (17 oct) |
|---|---|---|
| Avisos de `npm audit` | 96 | **84** |
| Críticos | 2 | **0** |
| Altos | 30 | **20** |
| Moderados | 64 | 64 |

Qué se hizo: `next` 14.2.35 a 15.5.28, `firebase-admin` a 14.5.0, `pdfjs-dist` a 6.4.299, `@sentry/nextjs` a 11.8.0 y
`npm audit fix` para los parches seguros. Se exige Node 22 (`engines`).

Qué queda y por qué no se corrigió: los 20 avisos altos están en la cadena del cliente de Firebase (`undici` y
`@grpc/grpc-js`), en Genkit y OpenTelemetry (trazas del servidor) y en herramientas de compilación (`tailwindcss`,
`postcss`, `braces`). Ninguno tiene corrección que no exija cambiar de versión mayor de un paquete central
(`firebase`, `genkit`, `tailwindcss` 4 o `next` 16). Se documentan como riesgo conocido y están en el punto 21 del
backlog. El aviso restante de `next` es moderado y viene de `postcss`, que se usa al compilar.

### 2.6 Observabilidad y auditoría

| Control | Estado | Evidencia |
|---|---|---|
| Errores del cliente y del servidor a Sentry (solo errores, sin trazas de rendimiento) | ✅ | `sentry.*.config.ts`; activo en producción desde el 8 de octubre |
| Registro de auditoría de acciones sensibles, visible solo para administradores | ✅ | Colección `auditLogs`, pantalla *Auditoría* |
| El registro de auditoría no se puede escribir desde el navegador | 🟡 | Reglas en `false`; escribe el servidor, y el actor y las acciones permitidas salen del token y del rol (prueba del lote de reglas). Pero el navegador lo dispara después de la operación (puede omitirse) y quien llama declara el objetivo y el detalle (backlog punto 27) |

## 3. Privacidad

### 3.1 Qué datos se guardan y dónde

| Dato | Dónde | Quién lo ve |
|---|---|---|
| Nombre, correo, rol y estado de la cuenta | Firebase Authentication y `users` | La persona y los administradores |
| Perfil profesional (titular, ubicación, habilidades, experiencia, educación) | `candidates` | La persona, **cualquier reclutador registrado** y los administradores |
| Texto del CV (hasta 9 000 caracteres) y su resumen | `candidates` | Igual que el perfil |
| El archivo PDF del CV | **No se guarda** | Se lee en el navegador |
| Postulaciones y su estado | `jobs/.../applications` y copia en `users/.../applications` | La persona, la empresa de la vacante y los administradores |
| Notas privadas del reclutador sobre un candidato | Postulación | La empresa y los administradores. La pantalla de la candidata no las muestra, pero las reglas todavía le permiten leer su propia postulación, donde se guardan (backlog punto 22) |
| Recomendaciones de la IA (puntaje y razones) | `recommendations` | La persona, la empresa de la vacante y los administradores |
| Avisos y preferencias de notificación | `users/.../notifications` y `settings` | Solo la persona |
| Acciones de auditoría | `auditLogs` | Solo los administradores |
| Preferencias de la interfaz (tema, guía de primeros pasos, último rol) | `localStorage` y `sessionStorage` del navegador | Solo ese navegador |

### 3.2 Terceros que reciben datos

| Tercero | Qué recibe | Para qué | Estado |
|---|---|---|---|
| Google Firebase | Cuenta, perfiles y postulaciones | Autenticación y base de datos | ✅ en uso |
| Groq (modelo `gpt-oss-120b`, con `gpt-oss-20b` de respaldo) | Texto del CV, titular, habilidades y años (no se envían el nombre ni el correo como campos, aunque el texto del CV puede contenerlos), y título y descripción de la vacante | Analizar CVs, calcular compatibilidad y redactar descripciones | ✅ en uso |
| Vercel | Las solicitudes HTTP a la aplicación | Alojamiento | ✅ en uso |
| Sentry | Errores con su traza | Detectar fallos | ✅ en uso (el SDK no envía datos personales por defecto) |
| Resend | Correo y texto del aviso | Enviar correos | ⚪ apagado hasta configurar `RESEND_API_KEY` |
| Servicios de analítica, publicidad o avatares externos | Nada | No se usan | ✅ |

### 3.3 Principios y derechos

| Punto | Estado | Detalle |
|---|---|---|
| Minimización | ✅ | No se guarda el PDF; los avatares son iniciales y no llaman a servicios externos; no hay analítica |
| Transparencia sobre la IA | ✅ | Cada porcentaje trae razones y la IA no decide: el match queda en espera hasta que la empresa y el candidato actúan |
| Aviso de privacidad y consentimiento | 🟡 | Existe para el piloto ([AVISO_PRIVACIDAD_PILOTO.md](piloto/AVISO_PRIVACIDAD_PILOTO.md)). Falta uno permanente en el registro (backlog punto 1) |
| Acceso y rectificación | ✅ | La persona edita su perfil y su cuenta cuando quiere |
| Cancelación (borrar la cuenta) | 🟡 | Hoy se pide a un administrador. Falta el botón con borrado en cascada (backlog punto 2) |
| Control de quién ve el perfil | ❌ | Hoy cualquier reclutador registrado lo ve (riesgo R1; backlog punto 3) |
| Verificación de empresas | ❌ | Cualquiera puede registrarse como reclutador (backlog punto 4) |
| Política de conservación de datos | ❌ | No hay borrado automático; se definirá con el aviso de privacidad |
| Datos de pruebas y demostración | ✅ | Todo es ficticio (`@example.com`) y las pruebas se niegan a tocar producción |
| Personas menores de edad | 🟡 | El piloto es solo para mayores de edad; la plataforma no lo verifica |

## 4. Riesgos aceptados para la versión 1.0

| Riesgo | Por qué se acepta | Mitigación |
|---|---|---|
| R1: los reclutadores ven el correo y el texto del CV de todas las personas candidatas | Es el comportamiento del producto en la versión 1.0 | Aviso en el piloto; control de visibilidad en el backlog |
| R3: quien entra con Google no elige su rol | Se evita pidiendo registrarse con correo | El administrador puede cambiar el rol |
| R6: sin Content-Security-Policy | Una política mal puesta rompe la aplicación | Primero en modo solo reporte (backlog) |
| R8: la clave de Groq se comparte entre entornos | Costo cero | No correr pruebas con IA los días de piloto o de defensa; el modelo de respaldo tiene cupo propio |
| 20 avisos altos de `npm audit` sin corrección menor | Exigen versiones mayores de paquetes centrales | Documentados y planificados para la versión 2 |

## 5. Qué repetir antes de la defensa

1. `npx tsc --noEmit`, `npm run build:staging` y `npm run test:unit`.
2. Las tres baterías de `security-tests/` contra staging.
3. Comparar la pestaña *Rules* de la consola de Firebase con `firestore.rules` para confirmar que lo publicado es lo del repositorio.
4. `GET /api/health` y `GET /api/health?deep=1` en producción.
5. `npm audit` y anotar la diferencia con esta tabla.
