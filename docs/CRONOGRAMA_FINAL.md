# HireLink — Estado real y cronograma de cierre (21 sep → 30 nov 2026)

Base: "Cronograma 2025" (S01–S13) y "Cronograma 2026" (S14–S30) de Notion, contrastados con el código
del repositorio. La columna **Estado** del Notion está vacía en todas las filas y las fechas originales
(dic 2025 – mar 2026) ya no aplican, por eso se re-planifica desde hoy hasta el 30 de noviembre.

Leyenda: ✅ hecho y verificado · 🟡 parcial · ❌ no hecho · ➖ cambió por decisión de diseño

---

## 1. Estado real por semana

### Cronograma 2025 (S01–S13)

| Sem | Título | Estado | Qué hay realmente |
|---|---|---|---|
| S01 | Kickoff + setup | ✅ | Firebase, Auth por email, colecciones base |
| S02 | Diseño UI básico | ✅ | Landing, layout, paleta morada, tema claro/oscuro |
| S03 | Flujo de Auth | ✅ | Registro/login, sesión persistente, rutas protegidas, cambio de contraseña, logout real |
| S04 | CRUD vacantes | ✅ | Crear/listar/editar/cerrar/eliminar con reglas por rol |
| S05 | Perfil candidato + CV | ➖ | Perfil ✅. El PDF **no se guarda** en Storage (decisión: solo lo lee la IA; Storage exige plan Blaze) |
| S06 | Búsqueda y filtros | ✅ | Filtros por texto, seniority, modalidad y estado (en cliente, sin índices) |
| S07 | Matching sencillo | ➖ | Se hizo **con IA** (Groq) en vez de reglas; guarda en `recommendations` |
| S08 | Panel reclutador + shortlist | ✅ | Postulantes ordenados por match, shortlist, notas privadas, detalle del candidato |
| S09 | Notificaciones in-app | ✅ | Campana con contador en tiempo real; eventos de postulación, estado, entrevista y match |
| S10 | Entrevistas | ✅ | Agenda con fecha/hora/tipo, calendario y aviso al candidato |
| S11 | Reglas v1 + emuladores | 🟡 | Reglas endurecidas y 59 pruebas automáticas, pero contra el proyecto real, no con Emulator Suite |
| S12 | QA + accesibilidad + responsive | 🟡 | QA funcional y de seguridad ✅. **Sin medir** Lighthouse, accesibilidad ni revisión móvil |
| S13 | Release + demo | 🟡 | Cuentas de prueba y demo posible. Faltan seed script, guía de uso y video |

### Cronograma 2026 (S14–S30)

| Sem | Título | Estado | Qué hay / qué falta |
|---|---|---|---|
| S14 | Jobs en Firestore | ✅ | Sin datos mock |
| S15 | CRUD jobs + admin jobs | ✅ | Filtros por estado/seniority/modalidad; admin global |
| S16 | Perfil de candidato | ✅ | Guarda y recarga; solo el dueño edita |
| S17 | Postulaciones | ✅ | Aplicar, "Mis postulaciones", lista por vacante, estados editables |
| S18 | Reglas y guards | ✅ | Reglas endurecidas (12 vulnerabilidades corregidas), guards por rol, 59/59 pruebas |
| S19 | CV upload + extracción | ✅ | El texto se extrae en el navegador y se guarda (`cvText`); decisión de no subir el archivo, documentada en [DECISION_STORAGE_CV.md](DECISION_STORAGE_CV.md) |
| S20 | Asistente de CV con IA | ✅ | Vista previa de skills, experiencia y educación antes de aplicar sugerencias; el candidato decide "Aplicar" o "Descartar" |
| S21 | Recomendaciones | ✅ | Match con IA (perfil + CV), "candidatos recomendados" por vacante y "vacantes recomendadas" al candidato |
| S22 | Organizaciones / multi-tenant | ✅ | Alta/edición desde admin, asignación de reclutadores, aislamiento probado |
| S23 | Herramientas admin | ✅ | Cambio de rol, suspender (con bloqueo real), métricas reales, "ver como" en solo lectura |
| S24 | Notificaciones | ✅ | Tiempo real + correo real vía Resend (apagado hasta poner `RESEND_API_KEY`, ver [EMAIL_SETUP.md](EMAIL_SETUP.md)) |
| S25 | Auditoría y observabilidad | 🟡 | `auditLogs` y pantalla de admin ✅. Error tracking (Sentry) ❌ |
| S26 | Búsqueda avanzada | 🟡 | Vacantes y candidatos con filtros ✅. Faltan filtro por fecha, "seniority objetivo" y documentar la decisión cliente vs Algolia |
| S27 | Performance y DX | ❌ | Sin trabajo dedicado. La página de perfil pesa 90 kB y hay 100 vulnerabilidades de dependencias |
| S28 | Onboarding y A11y | 🟡 | Elección de rol al registrarse y aviso para crear empresa ✅. Tours, accesibilidad y revisión móvil ❌ |
| S29 | Pre-lanzamiento / pilotos | ❌ | Sin seed script, sin entornos dev/staging/prod, sin piloto |
| S30 | Lanzamiento 0.9 | 🟡 | Panel de métricas ✅, checklist de seguridad ✅ (`security-tests/`). Faltan diagrama de arquitectura, guía para devs y backlog v2 |

### Hecho fuera del cronograma original

- Ciclo de vida del match con IA: **en espera → el reclutador acepta/rechaza → el candidato puede rechazar cuando quiera**.
- Migración de IA a Groq con reintentos, cola por instancia y límites de uso.
- Auditoría de seguridad: 12 vulnerabilidades corregidas, cabeceras de seguridad, endpoints autenticados y con límite de uso.
- Prueba de carga: 100 usuarios distintos simultáneos, 100/100 correctas.

### Plan de demo (Notion) — ¿se puede hacer hoy?

Los 11 pasos son ejecutables hoy con las cuentas de prueba: crear vacante, subir CV y ver sugerencias de IA,
recomendaciones, aplicar, shortlist y nota, cambio de estado con notificación, entrevista, métricas de admin y auditoría.
Un paso depende del dato: para que aparezca un match la IA debe dar ≥ 40 %.

---

## 2. Cronograma realista: 21 sep → 30 nov (10 semanas)

Criterio: **no añadir funciones nuevas**. Cerrar lo pendiente que el propio cronograma promete, dejar el
producto estable, documentado y probado con usuarios, y reservar tiempo para la tesis.

| Semana | Fechas | Objetivo | Entregables | Responsable sugerido |
|---|---|---|---|---|
| 1 | 21–27 sep | **Estabilizar producción** | Confirmar despliegue en Vercel con las 4 variables; probar los 3 roles en la URL pública; revisar cuotas de Firebase (Spark/Blaze) y Groq; congelar `main` como línea base v0.9-rc | Backend |
| 2 | 28 sep–4 oct | **Cerrar S19/S20/S24** | Decisión escrita sobre Storage (recomendado: no subir el PDF y documentarlo); vista previa de experiencia/educación en el asistente de CV; plantilla de correo (o dejarlo documentado como v2) | Backend + Frontend |
| 3 | 5–11 oct | **Cerrar S25/S26** | Sentry (error tracking) en cliente y API; filtro por fecha y por "seniority objetivo"; documento "búsqueda en cliente vs servicio externo" | Backend + Frontend |
| 4 | 12–18 oct | **Datos y entornos (S29 parte 1)** | Script `seed` con datos de ejemplo realistas; entornos dev/staging/prod (proyecto Firebase de staging + variables); cuentas demo documentadas | Backend + Docs/QA |
| 5 | 19–25 oct | **Performance y calidad (S27)** | Medir con Lighthouse; code splitting de la página de perfil (pdf.js); actualizar dependencias (`next`, `pdfjs-dist`, `firebase`) y repetir `security-tests/`; limpiar imports | Frontend + Backend |
| 6 | 26 oct–1 nov | **Accesibilidad y móvil (S12/S28)** | Contraste, foco y teclado; revisión mobile-first de las vistas clave; tours/hints del primer ingreso; meta Lighthouse ≥ 80 | Frontend + Producto |
| 7 | 2–8 nov | **Piloto (S29 parte 2)** | 2–5 reclutadores y ~10 candidatos reales; guion de tareas; formulario de feedback; bitácora de errores en Notion | Producto + Docs/QA |
| 8 | 9–15 nov | **Corrección del piloto** | Triage y arreglo de bugs por prioridad; re-ejecutar las 3 baterías de `security-tests/`; segunda ronda corta con 2–3 usuarios | Todo el equipo |
| 9 | 16–22 nov | **Documentación y demo (S13/S30)** | Diagrama de arquitectura; guía para nuevos devs y de uso; checklist de seguridad y privacidad final; video de demo; backlog v2 (correo, Storage, Algolia, facturación) | Docs/QA + Producto |
| 10 | 23–29 nov | **Cierre y buffer** | Release **v1.0**; ensayo de la defensa con el plan de demo; hotfixes; entrega final. **30 nov: buffer** | Todo el equipo |

### Hitos

| Fecha | Hito |
|---|---|
| 27 sep | Producción verificada (v0.9-rc) |
| 18 oct | Datos de ejemplo y 3 entornos listos |
| 1 nov | Producto pulido: Lighthouse ≥ 80, accesibilidad y móvil revisados |
| 8 nov | Piloto realizado |
| 22 nov | Documentación y video completos |
| 29 nov | Release v1.0 + ensayo de defensa |

### Riesgos y mitigación

| Riesgo | Efecto | Mitigación |
|---|---|---|
| No conseguir usuarios para el piloto | Sin validación real | Invitar desde la semana 4; usar compañeros y docentes como reclutadores |
| Cuota gratuita de Firebase o de Groq | La app deja de leer/recomendar en la demo | Alertas de uso; pasar a Blaze con tope de presupuesto; tener datos de respaldo |
| Actualizar `next` rompa algo | Retraso en semana 5 | Hacerlo en una rama; repetir las 3 baterías de pruebas antes de fusionar |
| Poco tiempo para la tesis | Documento incompleto | Semanas 9–10 dedicadas a documentación; empezar el capítulo técnico en la semana 5 |
| Vulnerabilidades restantes en dependencias | Hallazgo en la defensa | Documentarlas como riesgo conocido con plan de actualización |

### Definición de "terminado" para el 30 de noviembre

- Producción en Vercel estable, con los 3 roles funcionando.
- Las 3 baterías de `security-tests/` en verde.
- Lighthouse ≥ 80 en las páginas clave y accesibilidad básica revisada.
- Piloto documentado con feedback atendido.
- Documentación (arquitectura, flujos, guía de uso) y video de demo.
