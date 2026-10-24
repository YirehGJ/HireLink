# Registro de cambios

Todos los cambios importantes de HireLink, de lo más reciente a lo más antiguo. Las versiones siguen la etiqueta de Git:
`v1.0.0` (commit `302e211`, 19 de octubre de 2026) es la última publicada; antes, `v0.9-rc` (commit `94c6762`,
24 de septiembre de 2026). Cómo se publicó y cómo se revierte: [docs/RELEASE_v1.0.md](docs/RELEASE_v1.0.md).

## [1.0.0] 19 de octubre de 2026

### Añadido
- **Guía de primeros pasos** en el inicio del candidato y en las vacantes del reclutador: avance real, se puede cerrar y
  desaparece al completar los pasos obligatorios.
- **Menú del celular**: barra superior con botón de menú, logo y campana de avisos; el menú se abre como panel, atrapa el
  foco, se cierra con Esc o al navegar y devuelve el foco al botón.
- **Enlace «Saltar al contenido principal»** en todas las páginas, un único `<main>` por página y navegación con
  nombre (`Menú principal`).
- **Pruebas de accesibilidad con navegador** (`qa-tests/accesibilidad.mjs`, 57 comprobaciones) y mediciones reproducibles de
  Lighthouse y axe-core (`qa-tests/medicion/`).
- **Piloto**: guion de tareas, formulario de feedback, aviso de privacidad, bitácora y proceso de triaje
  (`docs/piloto/`).
- **Documentación de cierre**: arquitectura, guía para desarrolladores, guía de uso, checklist de seguridad y privacidad,
  backlog de la versión 2, guion de la demostración final y preparación de la defensa.
- Entorno de **staging** (`hirelink-staging`), `npm run dev:staging`, datos de ejemplo con volumen (31 cuentas, 210
  documentos) y limpieza de datos huérfanos.
- Pruebas: unitarias (26), regresión funcional con navegador y sondas de defectos (`qa-tests/`).

### Cambiado
- **Next.js 14.2.35 a 15.5.28**, `firebase-admin` 12 a 14.5.0, `@sentry/nextjs` a 11.8.0 y `pdfjs-dist` a 6.4.299. Se exige
  Node 22 (`engines`).
- **Rendimiento**: el código de pdf.js solo se descarga al subir un CV (la página del perfil bajó de 94 kB a 14 kB), el
  worker de pdf.js sale del propio sitio, el inicio de sesión ya no carga el iframe de Google al abrir la página, se quitó
  Firebase Storage (no se usaba) y Sentry ya no incluye el código de trazas. Lighthouse en celular en las páginas con
  sesión: de 65 a 67 puntos a 81 y 82 (mediana de tres mediciones).
- Los formularios de inicio de sesión y de registro vienen en el HTML inicial (antes dependían de `useSearchParams`).
- Contraste de color: el texto atenuado del tema oscuro usaba el gris del tema claro (3.8:1); se definieron colores de texto
  para enlaces y errores en ambos temas.
- Encabezados con orden correcto (`CardTitle` es un `h2`, el título de la página es el único `h1`).
- En celular, las filas de postulantes y de postulaciones se apilan en lugar de esconder las acciones a la derecha.
- Los botones de cierre de diálogos y paneles miden 32 px y están en español; los enlaces y la casilla del inicio de
  sesión miden al menos 24 px.

### Corregido
- Pantalla de perfil sin guardar tras analizar un CV, calendario de entrevistas del reclutador, borrado de vacantes en
  cascada, recuperación de contraseña real, hora correcta en los avisos, guard de sesión y de rol, cupo diario de la IA
  (40 puntos de mejora del informe extra de la Semana 4).
- El menú lateral ocupaba 256 px de una pantalla de 375 px en celular, y el panel del menú no tenía fondo (faltaban las
  variables de color del menú lateral): se veía la página detrás.
- Al cerrar un diálogo con Esc el foco se perdía en `<body>`: ahora vuelve al botón que lo abrió.
- Esc cerraba primero un tooltip invisible del menú y había que pulsarlo dos veces.
- `/register?role=recruiter` no dejaba elegido el tipo de cuenta.
- La landing se desbordaba horizontalmente en pantallas de 375 px.
- Toda la API de servidor respondía 500 en Vercel con `firebase-admin` 14.5: `jwks-rsa` 4 carga `jose` 6 con `require()` y el Node de Vercel no
  lo admite (en Node 24, local, sí). Se fijó `jwks-rsa` 3.2.2 en `overrides`. Lo detectó el primer despliegue *Preview* de Vercel antes de
  publicar; en local se reproduce con `NODE_OPTIONS=--no-experimental-require-module`.

### Seguridad
- Avisos de `npm audit`: de 96 (2 críticos, 30 altos) a 84 (0 críticos, 20 altos). El detalle de lo que queda y por qué está en
  [docs/CHECKLIST_SEGURIDAD_PRIVACIDAD.md](docs/CHECKLIST_SEGURIDAD_PRIVACIDAD.md).
- Baterías de `security-tests/` repetidas tras las actualizaciones: reglas 61/61, API y carga 67/67, flujos 23/23.
- Las pruebas y los scripts se niegan a correr contra producción sin `--allow-production`.

## [0.9.0-rc] 24 de septiembre de 2026

Línea base del cierre: Firebase (Auth y Firestore), roles de candidato, reclutador y administrador, vacantes, perfil con
CV, postulaciones, entrevistas, notificaciones en tiempo real, recomendaciones con IA (Groq), organizaciones y
herramientas de administración, reglas de seguridad endurecidas y cabeceras HTTP. Después de esa etiqueta y antes de la
1.0 se cerraron:

- **S19, S20 y S24** (24 de septiembre): vista previa de las sugerencias de la IA con experiencia y educación,
  decisión de no guardar el PDF y correo opcional con Resend.
- **S25 y S26** (1 de octubre): seguimiento de errores con Sentry, filtro por fecha de publicación y por seniority
  objetivo.
- **Estabilización de producción** (7 y 8 de octubre): endpoint `/api/health`, límite de 52 s en los endpoints de
  recomendaciones, ajuste al límite por minuto de Groq y Sentry activo en producción.
